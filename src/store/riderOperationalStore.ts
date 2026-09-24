// src/store/riderOperationalStore.ts (do not remove this comment)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mmkvStorage } from "../lib/mmkvStorage";
import type { LocationCoordinates } from "../types/location";

interface RiderOperationalState {
  // Online/Offline state
  isOnline: boolean;
  isToggling: boolean;

  // Current location
  currentLocation: LocationCoordinates | null;
  lastLocationUploadAt: number | null;

  // Active delivery (future use)
  activeDeliveryId: string | null;

  // GPS permission state
  locationPermission: "granted" | "denied" | "undetermined";
  gpsEnabled: boolean;

  // Actions
  setOnline: (online: boolean) => void;
  setToggling: (toggling: boolean) => void;
  updateLocation: (location: LocationCoordinates) => void;
  setLastUploadTime: (timestamp: number) => void;
  setActiveDelivery: (id: string | null) => void;
  setLocationPermission: (
    status: "granted" | "denied" | "undetermined",
  ) => void;
  setGpsEnabled: (enabled: boolean) => void;
  syncFromProfile: (isOnline: boolean) => void;
  reset: () => void;
}

const initialState = {
  isOnline: false,
  isToggling: false,
  currentLocation: null,
  lastLocationUploadAt: null,
  activeDeliveryId: null,
  locationPermission: "undetermined" as const,
  gpsEnabled: true,
};

export const useRiderOperationalStore = create<RiderOperationalState>()(
  persist(
    (set) => ({
      ...initialState,

      setOnline: (online) => set({ isOnline: online }),
      setToggling: (toggling) => set({ isToggling: toggling }),

      updateLocation: (location) =>
        set({ currentLocation: location }),

      setLastUploadTime: (timestamp) =>
        set({ lastLocationUploadAt: timestamp }),

      setActiveDelivery: (id) => set({ activeDeliveryId: id }),

      setLocationPermission: (status) =>
        set({ locationPermission: status }),

      setGpsEnabled: (enabled) => set({ gpsEnabled: enabled }),

      syncFromProfile: (isOnline) => set({ isOnline }),

      reset: () => set(initialState),
    }),
    {
      name: "rider-operational-store",
      storage: mmkvStorage,
      // Only persist isOnline — location is ephemeral
      partialize: (state) => ({
        isOnline: state.isOnline,
      }),
    },
  ),
);