// src/services/notificationHandler.ts (do not remove this comment)

import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useDeliveryStore } from "../store/deliveryStore";

// ── Foreground Handler ────────────────────────────────────────────────────────
export function configureForegroundNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      let sseConnected = false;
      try {
        const { isSSEConnected } = await import("./sseManager");
        sseConnected = isSSEConnected();
      } catch {}

      if (sseConnected) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
}

// ── Notification Response Listener (Tap Handling) ─────────────────────────────
export function setupNotificationResponseListener(): () => void {
  const handleResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as Record<string, any>;
    if (!data) return;

    if (data.action === "dismiss") {
      Notifications.dismissAllNotificationsAsync().catch(() => {});
      return;
    }

    if (data.screen === "incoming_delivery" || data.delivery_id) {
      try {
        // 1. Force instant delivery state resync
        useDeliveryStore.getState().requestResync();

        // 2. Navigate to root/home
        router.navigate("/(app)/(tabs)/home");
      } catch (err) {
        console.warn("[NotificationHandler] Navigation failed:", err);
      }
      return;
    }

    if (data.screen === "active_delivery" || data.screen === "home") {
      try {
        useDeliveryStore.getState().requestResync();
        router.navigate("/(app)/(tabs)/home");
      } catch {}
    }
  };

  // 1. Listen for taps while app is running in background
  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

  // 2. Check if the app was cold-started by tapping a notification when completely killed
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      handleResponse(response);
    }
  });

  return () => subscription.remove();
}

// ── Background Notification Received Listener ─────────────────────────────────
export function setupBackgroundNotificationListener(): () => void {
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const data = notification.request.content.data as Record<string, any>;
      if (!data) return;

      if (data.action === "dismiss") {
        Notifications.dismissAllNotificationsAsync().catch(() => {});
      }
    },
  );

  return () => subscription.remove();
}

// ── Dismiss Helper ────────────────────────────────────────────────────────────
export async function dismissAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {}
}