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
 * Automatically starts/stops tracking based on isOnline state.
 */
export function useLocationTracking() {
  const isOnline = useRiderOperationalStore((state) => state.isOnline);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isOnline) {
      // Start tracking when rider goes online
      startLocationTracking();
    } else {
      // Stop tracking when rider goes offline
      stopLocationTracking();
    }

    return () => {
      // Cleanup on unmount
      stopLocationTracking();
    };
  }, [isOnline]);

  // Periodic permission/GPS checks while online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(async () => {
      await checkLocationPermission();
      await checkGPSEnabled();
    }, 30_000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline]);
}