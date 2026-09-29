// src/hooks/useSSEConnection.ts (do not remove this comment)
import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "../store/authStore";
import {
  connectSSE,
  disconnectSSE,
  onSSEEvent,
} from "../services/sseManager";

/**
 * Custom hook to manage SSE connection lifecycle.
 * Connects when authenticated, disconnects on logout.
 * Handles app background/foreground transitions.
 */
export function useSSEConnection() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "authenticated") {
      // Connect SSE when authenticated
      connectSSE();

      // Listen for app state changes
            const subscription = AppState.addEventListener(
        "change",
        async (nextAppState: AppStateStatus) => {
          if (nextAppState === "active") {
            // Reconnect when app comes to foreground
            connectSSE();

            // Re-sync online status from server — fixes stale MMKV toggle
            // after the server offlines the rider (e.g., stale GPS cron)
            try {
              const { api } = await import("../services/api");
              const res = await api.get<{
                success: boolean;
                data: { is_online: boolean };
              }>("/rider/presence/status");
              const serverOnline = res.data?.data?.is_online ?? false;
              const { useRiderOperationalStore } = await import(
                "../store/riderOperationalStore"
              );
              const localOnline =
                useRiderOperationalStore.getState().isOnline;
              if (localOnline !== serverOnline) {
                useRiderOperationalStore
                  .getState()
                  .syncFromProfile(serverOnline);
              }
            } catch {
              // Non-critical — if the sync fails, the toggle stays as-is.
              // The next successful sync will correct it.
            }
          } else if (nextAppState === "background") {
            // Disconnect when app goes to background (Phase 1)
            disconnectSSE();
          }
        },
      );

      return () => {
        subscription.remove();
        disconnectSSE();
      };
    } else {
      // Disconnect when logged out
      disconnectSSE();
    }
  }, [status]);

  // Example: Listen for connected event
  useEffect(() => {
    const unsubscribe = onSSEEvent("connected", (data) => {
      console.log("[SSE] Rider connected:", data);
    });

    return unsubscribe;
  }, []);
}