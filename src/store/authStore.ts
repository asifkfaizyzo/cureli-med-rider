// src/store/authStore.ts

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
  logout: () => void;
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
            // Dynamic import bypasses axios circular import loops on startup
            const { authApi } = require("../features/auth/api/auth.api");
            const updatedRider = await authApi.getMe();
            set({
              rider: updatedRider,
              status: "authenticated",
            });
          } catch (error) {
            // Clear storage if token validation fails completely
            set({
              rider: null,
              accessToken: null,
              refreshToken: null,
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

      logout: () => {
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
    },
  ),
);
