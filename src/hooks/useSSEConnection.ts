// src/hooks/useSSEConnection.ts (do not remove this comment)
import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useDialog } from "../components/Dialog/DialogProvider";
import { connectSSE, disconnectSSE, onSSEEvent } from "../services/sseManager";
import { useAuthStore } from "../store/authStore";
import { useDeliveryStore } from "../store/deliveryStore"; // ── ADD THIS IMPORT

export function useSSEConnection() {
  const status = useAuthStore((state) => state.status);
  const dialog = useDialog();

  useEffect(() => {
    if (status === "authenticated") {
      connectSSE();

      const subscription = AppState.addEventListener(
        "change",
        async (nextAppState: AppStateStatus) => {
          if (nextAppState === "active") {
            // 1. Reconnect SSE stream
            connectSSE();

            // 2. Sync push token if rotated
            try {
              const { syncPushTokenIfNeeded } = await import("../services/pushService");
              syncPushTokenIfNeeded();
            } catch {}

            // 3. ── ★ CRITICAL: Always resync active delivery on app foreground ★ ──
            // This guarantees the incoming order overlay pops up immediately
            // when returning from background or locked screen!
            try {
              useDeliveryStore.getState().requestResync();
            } catch (err) {
              console.warn("[SSE] Failed to request delivery resync on foreground:", err);
            }

            // 4. Re-sync online status from server
            try {
              const { api } = await import("../services/api");
              const res = await api.get<{
                success: boolean;
                data: { is_online: boolean };
              }>("/rider/status");

              const serverOnline = res.data?.data?.is_online ?? false;

              const { useRiderOperationalStore } =
                await import("../store/riderOperationalStore");
              const localOnline = useRiderOperationalStore.getState().isOnline;

              if (localOnline !== serverOnline) {
                useRiderOperationalStore
                  .getState()
                  .syncFromProfile(serverOnline);

                const { useAuthStore: authStoreInstance } =
                  await import("../store/authStore");
                authStoreInstance
                  .getState()
                  .updateRider({ is_online: serverOnline });

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
            disconnectSSE();
          }
        },
      );

      return () => {
        subscription.remove();
        disconnectSSE();
      };
    } else {
      disconnectSSE();
    }
  }, [status, dialog]);

  useEffect(() => {
    const unsubscribe = onSSEEvent("connected", (data) => {
      console.log("[SSE] Rider connected:", data);
    });

    return unsubscribe;
  }, []);
}