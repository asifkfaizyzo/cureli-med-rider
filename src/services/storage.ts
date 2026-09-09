/**
 * @deprecated This file is kept ONLY for backward compatibility.
 * All storage now lives in src/lib/mmkvStorage.ts.
 *
 * ThemeContext.tsx imports StorageService from here.
 * Once ThemeContext is updated, this file can be deleted.
 */
import { themeStorage, appStorage } from "../lib/mmkvStorage";

export const StorageService = {
  getThemePreference: (): "light" | "dark" => themeStorage.get(),
  setThemePreference: (pref: "light" | "dark"): void => themeStorage.set(pref),
  getString: (key: string): string | null => appStorage.getString(key),
  setString: (key: string, value: string): void => appStorage.setString(key, value),
  clearAll: (): void => appStorage.clearAll(),

  // Auth methods — no longer used (Zustand persist handles tokens)
  getAccessToken: (): string | null => null,
  setAccessToken: (_token: string): void => {},
  getRefreshToken: (): string | null => null,
  setRefreshToken: (_token: string): void => {},
  clearAuth: (): void => {},
};