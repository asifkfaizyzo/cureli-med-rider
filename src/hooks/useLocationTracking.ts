import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useRiderOperationalStore } from "../store/riderOperationalStore";
import { useAuthStore } from "../store/authStore";
import { homeApi } from "../features/home/api/home.api";
import { useDialog } from "../components/Dialog/DialogProvider";
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
 * If background location permission is declined, the rider is automatically
 * rolled back to Offline on both the local store and the backend.
 */
export function useLocationTracking() {
  const isOnline = useRiderOperationalStore((state) => state.isOnline);
  const setOnline = useRiderOperationalStore((state) => state.setOnline);
  const updateRider = useAuthStore((state) => state.updateRider);
  const dialog = useDialog();
  const appState = useRef(AppState.currentState);

  // Start/stop foreground service based on online state
  useEffect(() => {
    if (isOnline) {
      startLocationTracking().then((success) => {
        if (!success) {
          // ── Rollback: Rider declined background location ──────
          // 1. Flip local store back to offline
          setOnline(false);
          updateRider({ is_online: false });

          // 2. Sync backend to offline
          homeApi.toggleAvailability(false).catch((err) => {
            console.error(
              "[LocationTracking] Failed to sync offline rollback:",
              err,
            );
          });

          // 3. Inform the rider
          dialog.alert({
            title: "Location Required",
            message:
              "Background location access is required to receive and track deliveries while navigating. You have been set to Offline. Toggle Online again and grant permission to start receiving orders.",
            icon: "location-off",
          });
        }
      });
    } else {
      stopLocationTracking();
    }
  }, [isOnline, setOnline, updateRider, dialog]);

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