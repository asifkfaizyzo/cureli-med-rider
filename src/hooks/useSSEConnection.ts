// src/hooks/useSSEConnection.ts (do not remove this comment)
import { useEffect } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useDialog } from "../components/Dialog/DialogProvider";
import { connectSSE, disconnectSSE, onSSEEvent } from "../services/sseManager";
import { useAuthStore } from "../store/authStore";
import { useDeliveryStore } from "../store/deliveryStore";
import { checkDrawOverPermission, requestDrawOverPermission } from "../services/notificationHandler";

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
            try {
              useDeliveryStore.getState().requestResync();
            } catch (err) {
              console.warn("[SSE] Failed to request delivery resync on foreground:", err);
            }

            // 4. ── ★ SAFETY GATE: Check draw-over permission on foreground ★ ──
            let hasOverlayPermission = true;
            if (Platform.OS === "android") {
              hasOverlayPermission = await checkDrawOverPermission();
            }

            // 5. Re-sync online status from server
            try {
              const { api } = await import("../services/api");
              const res = await api.get<{
                success: boolean;
                data: { is_online: boolean };
              }>("/rider/status");

              const serverOnline = res.data?.data?.is_online ?? false;
              const { useRiderOperationalStore } = await import("../store/riderOperationalStore");
              const localOnline = useRiderOperationalStore.getState().isOnline;

              // If online but missing critical overlay permission -> FORCE OFFLINE
              if (!hasOverlayPermission && (serverOnline || localOnline)) {
                console.warn("[SSE] Enforcing overlay permission offline gate");
                
                // Call API to switch offline
                await api.post("/rider/status", { is_online: false }).catch(() => {});
                
                useRiderOperationalStore.getState().syncFromProfile(false);
                useAuthStore.getState().updateRider({ is_online: false });

                await dialog.alert({
                  title: "Action Required",
                  message: "Cureli Rider requires the 'Display over other apps' permission to alert you of new incoming delivery requests. Please grant this permission to go online.",
                  icon: "warning",
                });
                
                // Prompt setting selection immediately
                await requestDrawOverPermission();
                return;
              }

              if (localOnline !== serverOnline) {
                useRiderOperationalStore.getState().syncFromProfile(serverOnline);
                useAuthStore.getState().updateRider({ is_online: serverOnline });

                if (localOnline && !serverOnline) {
                  dialog.alert({
                    title: "Status Updated",
                    message: "You were marked offline due to inactivity or lack of GPS signal.",
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