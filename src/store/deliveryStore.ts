// src/store/deliveryStore.ts (do not remove this comment)

import { create } from "zustand";
import type { IncomingOrderAlert, ActiveDelivery } from "../types/delivery";
import { useRiderOperationalStore } from "./riderOperationalStore";
import { soundService } from "../services/soundService";

interface DeliveryState {
  incomingAlert: IncomingOrderAlert | null;
  activeDelivery: ActiveDelivery | null;
  isLoading: boolean;

  // ── Hydration state ─────────────────────────────────────────────────
  // Tracks whether the initial "does this rider have an active delivery"
  // fetch (fired once per authenticated session by useDeliveryEvents) has
  // completed. app/(app)/_layout.tsx blocks rendering behind a fail-closed
  // gate until this is true, so we never flash the tabs UI for a rider
  // who should actually be locked into ActiveDeliveryScreen.
  hasSyncedDelivery: boolean;
  syncError: string | null;
  resyncNonce: number;

  setIncomingAlert: (alert: IncomingOrderAlert | null) => void;
  setActiveDelivery: (delivery: ActiveDelivery | null) => void;
  setOrderStatus: (orderStatus: ActiveDelivery["order_status"]) => void;
  clearAlert: () => void;
  clearActiveDelivery: () => void;

  setSyncSuccess: () => void;
  setSyncError: (message: string) => void;
  requestResync: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  incomingAlert: null,
  activeDelivery: null,
  isLoading: false,

  hasSyncedDelivery: false,
  syncError: null,
  resyncNonce: 0,

  setIncomingAlert: (alert) => {
    if (alert) {
      soundService.startIncomingOrderAlert();
    } else {
      soundService.stopIncomingOrderAlert();
    }
    set({ incomingAlert: alert });
  },

  setActiveDelivery: (delivery) => {
    soundService.stopIncomingOrderAlert();
    useRiderOperationalStore.getState().setActiveDelivery(delivery?.delivery_id || null);
    set({ activeDelivery: delivery, incomingAlert: null });
  },

  setOrderStatus: (orderStatus) => {
    set((state) => {
      if (!state.activeDelivery) return state;
      return {
        activeDelivery: {
          ...state.activeDelivery,
          order_status: orderStatus,
        },
      };
    });
  },

  clearAlert: () => {
    soundService.stopIncomingOrderAlert();
    set({ incomingAlert: null });
  },

  clearActiveDelivery: () => {
    soundService.stopIncomingOrderAlert();
    useRiderOperationalStore.getState().setActiveDelivery(null);
    set({ activeDelivery: null, incomingAlert: null });
  },

  setSyncSuccess: () => set({ hasSyncedDelivery: true, syncError: null }),

  setSyncError: (message) => set({ hasSyncedDelivery: false, syncError: message }),

  requestResync: () =>
    set((state) => ({ resyncNonce: state.resyncNonce + 1, syncError: null })),
}));