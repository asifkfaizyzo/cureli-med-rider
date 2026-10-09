// src/services/notificationHandler.ts (do not remove this comment)

import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Linking, NativeModules, Platform } from "react-native";
import { useDeliveryStore } from "../store/deliveryStore";

const { FullScreenDeliveryModule } = NativeModules;

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
        useDeliveryStore.getState().requestResync();
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

  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

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

      if (data.screen === "incoming_delivery" || data.delivery_id || data.action === "dismiss") {
        try {
          useDeliveryStore.getState().requestResync();
        } catch (err) {
          console.warn("[NotificationHandler] Failed to trigger background resync:", err);
        }
      }

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

// ── Overlay / "Draw Over Other Apps" Permissions (Android Only) ───────────────

/**
 * Checks if "Draw Over Other Apps" (SYSTEM_ALERT_WINDOW) permission is granted.
 */
export async function checkDrawOverPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  if (!FullScreenDeliveryModule?.checkOverlayPermission) {
    return true; // Don't block dev if native module isn't mounted yet
  }
  try {
    return await FullScreenDeliveryModule.checkOverlayPermission();
  } catch (err) {
    console.error("[NotificationHandler] Failed to check overlay permission:", err);
    return true;
  }
}

/**
 * Direct navigation to Settings → Display over other apps → Cureli Rider.
 */
export async function requestDrawOverPermission(): Promise<void> {
  if (Platform.OS !== "android") return;
  
  if (FullScreenDeliveryModule?.requestOverlayPermission) {
    try {
      await FullScreenDeliveryModule.requestOverlayPermission();
      return;
    } catch (err) {
      console.warn("[NotificationHandler] Native requestOverlayPermission failed, using fallback:", err);
    }
  }

  // Fallback: Open application details settings
  try {
    await Linking.openSettings();
  } catch (err) {
    console.error("[NotificationHandler] Failed to open settings:", err);
  }
}