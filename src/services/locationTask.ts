// src/services/locationTask.ts (do not remove this comment)
//
// Background location task for the Android Foreground Service.
// This file MUST be imported at the top of app/_layout.tsx (before React)
// so TaskManager.defineTask() runs before any component starts tracking.
//
// The foreground service notification is configured in locationService.ts
// via startLocationUpdatesAsync({ foregroundService: { ... } }).

import * as TaskManager from "expo-task-manager";
import { api } from "./api";
import { useRiderOperationalStore } from "../store/riderOperationalStore";

// ── Exported constant used by locationService.ts ──────────────
export const LOCATION_TASK_NAME = "cureli-location-tracking";

// ── Upload throttle (module-level, survives across task calls) ─
let lastUploadAt = 0;
const UPLOAD_THROTTLE_MS = 5_000;

// ── Task Definition ───────────────────────────────────────────
// This runs every time the OS delivers a location update while
// the foreground service is active (every ~10s / 10m).

TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.error("[LocationTask] OS error:", error.message);
      return;
    }

    if (!data) return;

    const { locations } = data as { locations: any[] };
    if (!locations || locations.length === 0) return;

    // Always use the most recent fix in the batch
    const latest = locations[locations.length - 1];
    const { latitude, longitude, accuracy } = latest.coords;
    const timestamp = latest.timestamp;

    // 1. Update Zustand store (UI reads from this)
    const store = useRiderOperationalStore.getState();
    store.updateLocation({
      lat: latitude,
      lng: longitude,
      accuracy: accuracy ?? 0,
      timestamp,
    });

    // 2. Upload to backend (throttled, only while online)
    if (!store.isOnline) return;

    const now = Date.now();
    if (now - lastUploadAt < UPLOAD_THROTTLE_MS) return;

    try {
      await api.post("/rider/location", {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy ?? 0,
      });
      lastUploadAt = now;
      store.setLastUploadTime(now);
    } catch (err: any) {
      if (err.response?.status === 429) {
        // Rate limited — back off silently
      } else if (err.response?.status === 422) {
        console.warn("[LocationTask] Server rejected location");
      } else {
        console.warn("[LocationTask] Upload failed:", err.message);
      }
    }
  },
);