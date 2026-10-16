// src/store/deliveryStore.ts (do not remove this comment)

import { create } from "zustand";
import type {
  IncomingOrderAlert,
  ActiveDelivery,
  SameDayBatch,
  SameDayBatchOrder,
  IncomingBatchAlert,
} from "../types/delivery";
import { useRiderOperationalStore } from "./riderOperationalStore";
import { soundService } from "../services/soundService";

interface DeliveryState {
  incomingAlert: IncomingOrderAlert | null;
  activeDelivery: ActiveDelivery | null;
  isLoading: boolean;

  // ── Same Day Batch state ────────────────────────────────────────────
  incomingBatch: IncomingBatchAlert | null;
  activeBatches: SameDayBatch[];

  // ── Hydration state ─────────────────────────────────────────────────
  hasSyncedDelivery: boolean;
  syncError: string | null;
  resyncNonce: number;

  setIncomingAlert: (alert: IncomingOrderAlert | null) => void;
  setActiveDelivery: (delivery: ActiveDelivery | null) => void;
  setOrderStatus: (orderStatus: ActiveDelivery["order_status"]) => void;
  clearAlert: () => void;
  clearActiveDelivery: () => void;

  // ── Batch actions ───────────────────────────────────────────────────
  setIncomingBatch: (alert: IncomingBatchAlert | null) => void;
  clearIncomingBatch: () => void;
  setActiveBatches: (batches: SameDayBatch[]) => void;
  addOrderToBatch: (batchGroupId: string, order: SameDayBatch["orders"][0]) => void;
  removeOrderFromBatch: (deliveryId: string) => void;
  removeBatch: (batchGroupId: string) => void;
  updateOrderInBatch: (deliveryId: string, updates: Partial<SameDayBatchOrder>) => void;

  setSyncSuccess: () => void;
  setSyncError: (message: string) => void;
  requestResync: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  incomingAlert: null,
  activeDelivery: null,
  isLoading: false,

  incomingBatch: null,
  activeBatches: [],

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

  // ── Batch actions ─────────────────────────────────────────────────
  setIncomingBatch: (alert) => {
    if (alert) {
      soundService.startIncomingOrderAlert();
    } else {
      soundService.stopIncomingOrderAlert();
    }
    set({ incomingBatch: alert });
  },

  clearIncomingBatch: () => {
    soundService.stopIncomingOrderAlert();
    set({ incomingBatch: null });
  },

  setActiveBatches: (batches) => {
    soundService.stopIncomingOrderAlert();
    set({ activeBatches: batches, incomingBatch: null });
  },

  addOrderToBatch: (batchGroupId, order) =>
    set((state) => ({
      activeBatches: state.activeBatches.map((b) =>
        b.batch_group_id === batchGroupId
          ? { ...b, order_count: b.order_count + 1, orders: [...b.orders, order] }
          : b,
      ),
    })),

  removeOrderFromBatch: (deliveryId) =>
    set((state) => ({
      activeBatches: state.activeBatches
        .map((b) => ({
          ...b,
          orders: b.orders.filter((o) => o.delivery_id !== deliveryId),
          order_count: b.orders.length - 1,
        }))
        .filter((b) => b.orders.length > 0),
    })),

  removeBatch: (batchGroupId) =>
    set((state) => ({
      activeBatches: state.activeBatches.filter(
        (b) => b.batch_group_id !== batchGroupId,
      ),
    })),

  updateOrderInBatch: (deliveryId, updates) =>
    set((state) => ({
      activeBatches: state.activeBatches.map((b) => ({
        ...b,
        orders: b.orders.map((o) =>
          o.delivery_id === deliveryId ? { ...o, ...updates } : o,
        ),
      })),
    })),

  setSyncSuccess: () => set({ hasSyncedDelivery: true, syncError: null }),

  setSyncError: (message) => set({ hasSyncedDelivery: false, syncError: message }),

  requestResync: () =>
    set((state) => ({ resyncNonce: state.resyncNonce + 1, syncError: null })),
}));