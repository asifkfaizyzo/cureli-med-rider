// src/hooks/useSSEConnection.ts (do not remove this comment)
import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useDialog } from "../components/Dialog/DialogProvider";
import { connectSSE, disconnectSSE, onSSEEvent } from "../services/sseManager";
import { useAuthStore } from "../store/authStore";

/**
 * Custom hook to manage SSE connection lifecycle.
 * Connects when authenticated, disconnects on logout.
 * Handles app background/foreground transitions.
 */
export function useSSEConnection() {
  const status = useAuthStore((state) => state.status);
  const dialog = useDialog();

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

              const { useRiderOperationalStore } =
                await import("../store/riderOperationalStore");
              const localOnline = useRiderOperationalStore.getState().isOnline;

              if (localOnline !== serverOnline) {
                // Harmonize operational store
                useRiderOperationalStore
                  .getState()
                  .syncFromProfile(serverOnline);

                // Harmonize authStore profile object
                const { useAuthStore: authStoreInstance } =
                  await import("../store/authStore");
                authStoreInstance
                  .getState()
                  .updateRider({ is_online: serverOnline });

                // Surface alert if rider was auto-offlined silently by background stale engine
                if (localOnline && !serverOnline) {
                  dialog.alert({
                    title: "Status Updated",
                    message:
                      "You were marked offline due to inactivity or lack of GPS signal.",
                    icon: "cloud-off",
                  });
                }
              }
            } catch (err) {
              console.error(
                "[SSE] Failed to reconcile background-to-foreground status:",
                err,
              );
            }
          } else if (nextAppState === "background") {
            // Disconnect when app goes to background
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
  }, [status, dialog]);

  // Listen for connected event
  useEffect(() => {
    const unsubscribe = onSSEEvent("connected", (data) => {
      console.log("[SSE] Rider connected:", data);
    });

    return unsubscribe;
  }, []);
}
