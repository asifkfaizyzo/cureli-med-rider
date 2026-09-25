// src/store/authStore.ts (do not remove this comment)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mmkvStorage } from "../lib/mmkvStorage";
import type { RiderProfile } from "../types/auth";

interface AuthState {
  rider: RiderProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  tempToken: string | null;
  status: "unknown" | "checking" | "authenticated" | "unauthenticated";

  initialize: () => Promise<void>;
  setAuth: (
    rider: RiderProfile,
    accessToken: string,
    refreshToken: string,
  ) => void;
  setTempToken: (token: string | null) => void;
  updateRider: (partial: Partial<RiderProfile>) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      rider: null,
      accessToken: null,
      refreshToken: null,
      tempToken: null,
      status: "unknown",

      initialize: async () => {
        set({ status: "checking" });
        const { accessToken, refreshToken, rider } = get();

        if (accessToken && refreshToken && rider) {
          try {
            const { authApi } = require("../features/auth/api/auth.api");
            const updatedRider = await authApi.getMe();
            set({
              rider: updatedRider,
              status: "authenticated",
            });
          } catch {
            set({
              rider: null,
              accessToken: null,
              refreshToken: null,
              tempToken: null,
              status: "unauthenticated",
            });
          }
        } else {
          set({ status: "unauthenticated" });
        }
      },

      setAuth: (rider, accessToken, refreshToken) =>
        set({
          rider,
          accessToken,
          refreshToken,
          tempToken: null,
          status: "authenticated",
        }),

      setTempToken: (tempToken) => set({ tempToken }),

      updateRider: (partial) =>
        set((state) => ({
          rider: state.rider ? { ...state.rider, ...partial } : null,
        })),

      setAccessToken: (token) => set({ accessToken: token }),

      clearAuth: () =>
        set({
          rider: null,
          accessToken: null,
          refreshToken: null,
          tempToken: null,
          status: "unauthenticated",
        }),

      logout: async () => {
        // 1. Stop foreground service + dismiss persistent notification
        try {
          const { stopLocationTracking } = require("../services/locationService");
          await stopLocationTracking();
        } catch {
          // Ignore — location service may not be running
        }

        // 2. Reset operational state (isOnline, location, delivery, etc.)
        try {
          const { useRiderOperationalStore } = require("../store/riderOperationalStore");
          useRiderOperationalStore.getState().reset();
        } catch {
          // Ignore — store should always exist, but be safe
        }

        // 3. Call backend logout (revokes JWT + sets rider offline + closes sessions)
        try {
          const { authApi } = require("../features/auth/api/auth.api");
          await authApi.logout();
        } catch {
          // Ignore — clear local state regardless
        }

        // 4. Clear auth state
        set({
          rider: null,
          accessToken: null,
          refreshToken: null,
          tempToken: null,
          status: "unauthenticated",
        });
      },
    }),
    {
      name: "rider-auth-store",
      storage: mmkvStorage,
      partialize: (state) => ({
        rider: state.rider,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tempToken: state.tempToken,
      }),
    },
  ),
);