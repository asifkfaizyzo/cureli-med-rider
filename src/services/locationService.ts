// src/services/locationService.ts (do not remove this comment)
//
// Location service backed by an Android Foreground Service.
// Creates an immediate persistent notification with MAX priority channel.

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AppState, AppStateStatus } from "react-native";
import { useRiderOperationalStore } from "../store/riderOperationalStore";
import { LOCATION_TASK_NAME } from "./locationTask";

const LOCATION_INTERVAL_MS = 10_000; // 10 seconds
const LOCATION_DISTANCE_M = 10; // 10 meters
const ONLINE_CHANNEL_ID = "cureli-rider-online-service";

let appStateListener: ReturnType<typeof AppState.addEventListener> | null = null;
let isStartingService = false;

// ── Notification Channel Setup ───────────────────────────────

/**
 * Creates a MAX-priority Android Notification Channel.
 * Guarantees immediate, persistent status bar presence.
 */
async function setupNotificationChannel(): Promise<void> {
  try {
    await Notifications.setNotificationChannelAsync(ONLINE_CHANNEL_ID, {
      name: "Rider Online Status",
      importance: Notifications.AndroidImportance.MAX, // Highest importance on Android
      enableVibrate: false,
      sound: null,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  } catch (error) {
    console.warn("[LocationService] Could not set notification channel:", error);
  }
}

// ── Notification Permission Guard ────────────────────────────

async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("[LocationService] Notification permission error:", error);
    return false;
  }
}

// ── Permission Handling ──────────────────────────────────────

export async function requestLocationPermission(): Promise<"granted" | "denied"> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    useRiderOperationalStore
      .getState()
      .setLocationPermission(status === "granted" ? "granted" : "denied");
    return status === "granted" ? "granted" : "denied";
  } catch (error) {
    console.error("[LocationService] Permission error:", error);
    useRiderOperationalStore.getState().setLocationPermission("denied");
    return "denied";
  }
}

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

// ── Location Tracking (Foreground Service) ───────────────────

export async function startLocationTracking(): Promise<boolean> {
  if (isStartingService) return true;

  // 1. If already active, DO NOT stop/restart it (avoids destroying sticky notification)
  const isRunning = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME,
  );
  if (isRunning) {
    return true;
  }

  // Guard against Android 12+ background start restrictions
  if (AppState.currentState !== "active") {
    return false;
  }

  isStartingService = true;

  try {
    // 2. Setup channel & permissions
    await setupNotificationChannel();
    await requestNotificationPermission();

    let permissionStatus = await checkLocationPermission();
    if (permissionStatus !== "granted") {
      permissionStatus = await requestLocationPermission();
      if (permissionStatus !== "granted") {
        console.warn("[LocationService] Foreground permission denied");
        return false;
      }
    }

    let bgPermission = await checkBackgroundPermission();
    if (bgPermission !== "granted") {
      await requestBackgroundPermission();
    }

    const gpsEnabled = await checkGPSEnabled();
    if (!gpsEnabled) {
      console.warn("[LocationService] GPS is disabled on device");
      return false;
    }

    // 3. Launch the Android Foreground Service
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: LOCATION_INTERVAL_MS,
      distanceInterval: LOCATION_DISTANCE_M,

      foregroundService: {
        notificationTitle: "Cureli Delivery Partner",
        notificationBody: "You are Online • Ready to receive orders",
        notificationColor: "#090025",
        killServiceOnDestroy: false,
      },

      showsBackgroundLocationIndicator: true,
      deferredUpdatesInterval: undefined,
      deferredUpdatesDistance: undefined,
    });

    console.log("[LocationService] Foreground service started (sticky & persistent)");

    if (!appStateListener) {
      appStateListener = AppState.addEventListener(
        "change",
        handleAppStateChange,
      );
    }

    return true;
  } catch (error: any) {
    console.error("[LocationService] Failed to start foreground service:", error.message);
    return false;
  } finally {
    isStartingService = false;
  }
}

export async function stopLocationTracking(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME,
    );
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("[LocationService] Foreground service stopped");
    }
  } catch (error) {
    console.error("[LocationService] Error stopping tracking:", error);
  }

  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
  }
}

// ── App State Handling ───────────────────────────────────────

function handleAppStateChange(nextAppState: AppStateStatus): void {
  const store = useRiderOperationalStore.getState();

  if (nextAppState === "active" && store.isOnline) {
    Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).then(
      (isRunning) => {
        if (!isRunning) {
          startLocationTracking();
        }
      },
    );
  }
}

export async function getCurrentLocation(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
} | null> {
  try {
    let permissionStatus = await checkLocationPermission();
    if (permissionStatus !== "granted") {
      permissionStatus = await requestLocationPermission();
      if (permissionStatus !== "granted") {
        console.warn("[LocationService] Location permissions not granted.");
        return null;
      }
    }

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

export async function isLocationTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch {
    return false;
  }
}