// src/services/pushService.ts (do not remove this comment)
//
// Manages the Expo Push Token lifecycle for the rider app.
//
// Responsibilities:
//   1. Request notification permissions from the OS
//   2. Get the Expo Push Token for this device
//   3. Register the token with the backend (POST /rider/auth/push-token)
//   4. Clear the token on logout
//   5. Detect token rotation and re-register
//
// Called from:
//   - authStore.setAuth() → register after login
//   - authStore.logout()  → unregister before clearing state
//   - useSSEConnection.ts → re-register on foreground if token changed

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { appStorage } from "../lib/mmkvStorage";
import { api } from "./api";

const PUSH_TOKEN_STORAGE_KEY = "cureli_rider_push_token";

/**
 * Request notification permissions and get the Expo Push Token.
 * Returns null if permissions are denied or platform is unsupported.
 */
async function getExpoPushToken(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowDisplayInCarPlay: false,
        allowCriticalAlerts: true,
        allowAnnouncements: false,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[PushService] Notification permissions denied");
    return null;
  }

  // Android requires a notification channel to be set before getting token
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("incoming_delivery", {
      name: "Incoming Delivery Requests",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      sound: "incoming_order.mp3",
      enableVibrate: true,
      enableLights: true,
      lightColor: "#FF0000",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("delivery_updates", {
      name: "Delivery Updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      sound: "default",
      enableVibrate: true,
      enableLights: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: true,
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "ae3f3780-a476-4663-8544-4ce6015fd02d",
    });
    return tokenData.data;
  } catch (err) {
    console.error("[PushService] Failed to get Expo push token:", err);
    return null;
  }
}

/**
 * Register the device's push token with the backend.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;

    // Check stored token via appStorage
    const storedToken = appStorage.getString(PUSH_TOKEN_STORAGE_KEY);

    if (storedToken === token) {
      console.log("[PushService] Token unchanged, skipping registration");
      return;
    }

    // Register with backend
    await api.post("/rider/auth/push-token", {
      push_token: token,
      push_token_type: "expo",
    });

    // Store locally
    appStorage.setString(PUSH_TOKEN_STORAGE_KEY, token);

    console.log("[PushService] Push token registered successfully");
  } catch (err: any) {
    console.warn(
      "[PushService] Failed to register push token:",
      err?.response?.data?.message || err?.message,
    );
  }
}

/**
 * Clear the push token from the backend and local storage.
 * Called on logout.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const storedToken = appStorage.getString(PUSH_TOKEN_STORAGE_KEY);

    if (storedToken) {
      // Clear from backend
      await api.post("/rider/auth/push-token", {
        push_token: null,
      });
    }

    // Clear local storage
    appStorage.delete(PUSH_TOKEN_STORAGE_KEY);

    console.log("[PushService] Push token unregistered");
  } catch (err: any) {
    console.warn(
      "[PushService] Failed to unregister push token:",
      err?.message,
    );
  }
}

/**
 * Check if the push token has rotated and re-register if needed.
 * Called on app foreground.
 */
export async function syncPushTokenIfNeeded(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;

    const storedToken = appStorage.getString(PUSH_TOKEN_STORAGE_KEY);

    if (storedToken !== token) {
      console.log("[PushService] Token rotated, re-registering...");
      await registerForPushNotifications();
    }
  } catch {
    // Silent
  }
}