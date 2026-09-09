import { MMKV } from "react-native-mmkv";
import { createJSONStorage } from "zustand/middleware";

// ── Single MMKV instance for the entire app ──────────────────
const mmkv = new MMKV({ id: "cureli-rider-app" });

// ── Zustand persistence adapter ──────────────────────────────
export const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
}));

// ── Intro screen tracking ────────────────────────────────────
export const introStorage = {
  hasSeenIntro: (): boolean => mmkv.getBoolean("has_seen_intro") ?? false,
  markSeen: (): void => mmkv.set("has_seen_intro", true),
};

// ── Theme preference ─────────────────────────────────────────
export const themeStorage = {
  get: (): "light" | "dark" => {
    const val = mmkv.getString("app.theme_preference");
    if (val === "light" || val === "dark") return val;
    return "dark"; // default to dark
  },
  set: (pref: "light" | "dark"): void => {
    mmkv.set("app.theme_preference", pref);
  },
};

// ── Generic helpers (for any future use) ─────────────────────
export const appStorage = {
  getString: (key: string): string | null => mmkv.getString(key) ?? null,
  setString: (key: string, value: string): void => mmkv.set(key, value),
  getBoolean: (key: string): boolean => mmkv.getBoolean(key) ?? false,
  setBoolean: (key: string, value: boolean): void => mmkv.set(key, value),
  delete: (key: string): void => mmkv.delete(key),
  clearAll: (): void => mmkv.clearAll(),
};

export default mmkv;