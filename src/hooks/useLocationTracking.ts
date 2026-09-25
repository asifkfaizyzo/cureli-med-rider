// src/hooks/useLocationTracking.ts (do not remove this comment)
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useRiderOperationalStore } from "../store/riderOperationalStore";
import {
  startLocationTracking,
  stopLocationTracking,
  checkLocationPermission,
  checkGPSEnabled,
} from "../services/locationService";

/**
 * Custom hook to manage location tracking lifecycle.
 * Automatically starts/stops the foreground service based on isOnline state.
 *
 * IMPORTANT: This hook should be placed in a component that stays mounted
 * for the entire authenticated session (e.g., app/(app)/_layout.tsx),
 * NOT in a tab screen that unmounts when switching tabs.
 */
export function useLocationTracking() {
  const isOnline = useRiderOperationalStore((state) => state.isOnline);
  const appState = useRef(AppState.currentState);

  // Start/stop foreground service based on online state
  useEffect(() => {
    if (isOnline) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    // NOTE: We intentionally do NOT call stopLocationTracking() on unmount.
    // The foreground service should persist across screen navigations.
    // Cleanup only happens when:
    //   1. Rider goes offline (isOnline → false)
    //   2. Rider logs out (authStore.logout() calls stopLocationTracking explicitly)
    //   3. App is swiped away (killServiceOnDestroy: true)
  }, [isOnline]);

  // Periodic permission/GPS checks while online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(async () => {
      await checkLocationPermission();
      await checkGPSEnabled();
    }, 30_000);

    return () => clearInterval(interval);
  }, [isOnline]);
}