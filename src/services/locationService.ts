// src/services/locationService.ts

import * as Location from "expo-location";
import { AppState, AppStateStatus } from "react-native";
import { useRiderOperationalStore } from "../store/riderOperationalStore";
import { api } from "./api";

// ── Constants ────────────────────────────────────────────────
const LOCATION_INTERVAL_MS = 10_000; // 10 seconds
const LOCATION_DISTANCE_M = 10; // 10 meters
const UPLOAD_THROTTLE_MS = 5_000; // 5 seconds minimum between uploads
const UPLOAD_RETRY_DELAY_MS = 15_000; // 15 seconds retry on network failure

// ── State ────────────────────────────────────────────────────
let locationSubscription: Location.LocationSubscription | null = null;
let appStateListener: any = null;
let isTracking = false;

// ── Permission Handling ──────────────────────────────────────

/**
 * Requests Foreground (Precise) Location permission.
 */
export async function requestLocationPermission(): Promise<"granted" | "denied"> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    useRiderOperationalStore
      .getState()
      .setLocationPermission(
        status === "granted" ? "granted" : "denied"
      );

    return status === "granted" ? "granted" : "denied";
  } catch (error) {
    console.error("[LocationService] Permission error:", error);
    useRiderOperationalStore.getState().setLocationPermission("denied");
    return "denied";
  }
}

/**
 * Requests Background Location permission.
 * NOTE: On Android, foreground permission MUST be granted first.
 */
export async function requestBackgroundPermission(): Promise<"granted" | "denied"> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === "granted" ? "granted" : "denied";
  } catch (error) {
    console.error("[LocationService] Background permission error:", error);
    return "denied";
  }
}

export async function checkLocationPermission(): Promise<"granted" | "denied" | "undetermined"> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch (error) {
    console.error("[LocationService] Permission check error:", error);
    return "undetermined";
  }
}

export async function checkBackgroundPermission(): Promise<"granted" | "denied" | "undetermined"> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch (error) {
    console.error("[LocationService] Background check error:", error);
    return "undetermined";
  }
}

export async function checkGPSEnabled(): Promise<boolean> {
  try {
    const provider = await Location.getProviderStatusAsync();
    const enabled = provider.locationServicesEnabled;
    
    useRiderOperationalStore.getState().setGpsEnabled(enabled);
    return enabled;
  } catch (error) {
    console.error("[LocationService] GPS check error:", error);
    return false;
  }
}

// ── Location Upload ──────────────────────────────────────────

async function uploadLocation(
  lat: number,
  lng: number,
  accuracy: number,
): Promise<void> {
  const store = useRiderOperationalStore.getState();

  const now = Date.now();
  if (
    store.lastLocationUploadAt &&
    now - store.lastLocationUploadAt < UPLOAD_THROTTLE_MS
  ) {
    return;
  }

  try {
    await api.post("/rider/location", {
      lat,
      lng,
      accuracy,
    });

    store.setLastUploadTime(now);
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.warn("[LocationService] Rate limited, backing off");
    } else if (error.response?.status === 422) {
      console.warn("[LocationService] Server rejected location:", error.response.data.message);
    } else {
      console.error("[LocationService] Upload failed:", error.message);
    }
  }
}

// ── Location Tracking ────────────────────────────────────────

export async function startLocationTracking(): Promise<boolean> {
  if (isTracking) {
    console.log("[LocationService] Already tracking");
    return true;
  }

  // 1. Check & Request Foreground Permission
  let permissionStatus = await checkLocationPermission();
  if (permissionStatus !== "granted") {
    permissionStatus = await requestLocationPermission();
    if (permissionStatus !== "granted") {
      console.warn("[LocationService] Foreground Permission denied by user");
      return false;
    }
  }

  // 2. Check & Request Background Permission (so tracking works when minimized)
  let bgPermission = await checkBackgroundPermission();
  if (bgPermission !== "granted") {
    bgPermission = await requestBackgroundPermission();
    if (bgPermission !== "granted") {
      console.warn("[LocationService] Background Location permission denied");
      // Don't hard fail if background is denied, but warn user
    }
  }

  // 3. Check GPS enabled
  const gpsEnabled = await checkGPSEnabled();
  if (!gpsEnabled) {
    console.warn("[LocationService] GPS is disabled on device");
    return false;
  }

  // 4. Start watching location
  try {
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_INTERVAL_MS,
        distanceInterval: LOCATION_DISTANCE_M,
      },
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const store = useRiderOperationalStore.getState();

        store.updateLocation({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy ?? 0,
          timestamp: position.timestamp,
        });

        if (store.isOnline) {
          uploadLocation(latitude, longitude, accuracy ?? 0);
        }
      },
    );

    isTracking = true;
    console.log("[LocationService] Started tracking");

    appStateListener = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return true;
  } catch (error) {
    console.error("[LocationService] Failed to start tracking:", error);
    return false;
  }
}

export function stopLocationTracking(): void {
  if (!isTracking) return;

  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
  }

  isTracking = false;
  console.log("[LocationService] Stopped tracking");
}

// ── App State Handling (Foreground/Background Fallbacks) ──────

function handleAppStateChange(nextAppState: AppStateStatus): void {
  const store = useRiderOperationalStore.getState();
  
  if (nextAppState === "background" || nextAppState === "inactive") {
    // If background permission is NOT granted, stop tracking to avoid OS kill.
    checkBackgroundPermission().then((status) => {
      if (status !== "granted") {
        console.log("[LocationService] Background permission absent, pausing tracking");
        stopLocationTracking();
      } else {
        console.log("[LocationService] Background permission active, keeping tracking alive");
      }
    });
  } else if (nextAppState === "active") {
    if (store.isOnline && !isTracking) {
      console.log("[LocationService] App foregrounded, restarting tracking");
      startLocationTracking();
    }
  }
}

// ── Utility Functions ────────────────────────────────────────

/**
 * Gets the current location. Requests permission and prompts GPS to enable if needed.
 */
export async function getCurrentLocation(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
} | null> {
  try {
    // 1. Check and request permission if undetermined
    let permissionStatus = await checkLocationPermission();
    if (permissionStatus !== "granted") {
      permissionStatus = await requestLocationPermission();
      if (permissionStatus !== "granted") {
        console.warn("[LocationService] Location permissions not granted.");
        return null;
      }
    }

    // 2. Check if physical device location toggles are enabled
    const gpsEnabled = await checkGPSEnabled();
    if (!gpsEnabled) {
      console.warn("[LocationService] GPS is off.");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: location.coords.accuracy ?? 0,
    };
  } catch (error) {
    console.error("[LocationService] Failed to get current location:", error);
    return null;
  }
}

export function isLocationTrackingActive(): boolean {
  return isTracking;
}