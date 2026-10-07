// src/services/notificationChannelSetup.ts
//
// Creates Android notification channels on app startup.
//
// Android 8+ requires notification channels. Each channel has its own
// sound, vibration, importance, and DND bypass settings. Once created,
// channel settings cannot be changed programmatically (user must go to
// Settings → Apps → Cureli Rider → Notifications).
//
// Channels:
//   1. "incoming_delivery" — MAX importance, alarm sound, DND bypass,
//      full-screen intent, sticky. Used for new delivery requests.
//   2. "delivery_updates" — HIGH importance, default sound. Used for
//      order ready, delivery cancelled, status changes.
//   3. "cureli-rider-online-service" — LOW importance, no sound.
//      Used for the persistent foreground service notification.
//
// Called from app/_layout.tsx on mount (after auth check).

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let channelsCreated = false;

/**
 * Create all Android notification channels.
 * Safe to call multiple times — only runs once per app lifecycle.
 * No-op on iOS.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  if (channelsCreated) return;

  try {
    // ── Channel 1: Incoming Delivery Requests (CRITICAL) ────────────────
    // This is the channel that makes the phone ring like a phone call
    // even when locked, on silent, or in Do Not Disturb mode.
    await Notifications.setNotificationChannelAsync("incoming_delivery", {
      name: "Incoming Delivery Requests",
      description: "Critical alerts for new delivery assignments. Cannot be silenced.",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500, 200, 500],
      sound: "incoming_order.mp3",
      enableVibrate: true,
      enableLights: true,
      lightColor: "#FF0000",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      showBadge: true,
    });

    // ── Channel 2: Delivery Updates ─────────────────────────────────────
    // Standard high-priority notifications for delivery status changes.
    await Notifications.setNotificationChannelAsync("delivery_updates", {
      name: "Delivery Updates",
      description: "Order ready, delivery cancelled, and status changes.",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 100, 250],
      sound: "default",
      enableVibrate: true,
      enableLights: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: true,
    });

    // ── Channel 3: Online Service (Foreground Service) ──────────────────
    // Low-priority, silent. Used by the location tracking foreground service.
    await Notifications.setNotificationChannelAsync(
      "cureli-rider-online-service",
      {
        name: "Background Service",
        description: "Keeps the app running for location tracking.",
        importance: Notifications.AndroidImportance.LOW,
        enableVibrate: false,
        enableLights: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.SECRET,
        bypassDnd: false,
        showBadge: false,
      },
    );

    channelsCreated = true;
    console.log("[ChannelSetup] All notification channels created");
  } catch (err) {
    console.error("[ChannelSetup] Failed to create channels:", err);
  }
}