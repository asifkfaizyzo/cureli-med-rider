// src/hooks/useDeliveryEvents.ts (do not remove this comment)

import { useEffect } from "react";
import { deliveryApi } from "../features/delivery/api/delivery.api";
import { onSSEEvent } from "../services/sseManager";
import { useAuthStore } from "../store/authStore";
import { useDeliveryStore } from "../store/deliveryStore";
import type { IncomingBatchAlert, IncomingOrderAlert } from "../types/delivery";

export function useDeliveryEvents() {
  const status = useAuthStore((s) => s.status);
  const setIncomingAlert = useDeliveryStore((s) => s.setIncomingAlert);
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);
  const setOrderStatus = useDeliveryStore((s) => s.setOrderStatus);
  const clearActiveDelivery = useDeliveryStore((s) => s.clearActiveDelivery);
  const setIncomingBatch = useDeliveryStore((s) => s.setIncomingBatch);
  const setActiveBatches = useDeliveryStore((s) => s.setActiveBatches);
  const removeOrderFromBatch = useDeliveryStore((s) => s.removeOrderFromBatch);
  const setSyncSuccess = useDeliveryStore((s) => s.setSyncSuccess);
  const setSyncError = useDeliveryStore((s) => s.setSyncError);
  const resyncNonce = useDeliveryStore((s) => s.resyncNonce);

  // Reset hydration flag whenever leaving authenticated state
  useEffect(() => {
    if (status !== "authenticated") {
      useDeliveryStore.setState({ hasSyncedDelivery: false, syncError: null });
    }
  }, [status]);

  // Sync active delivery on mount / reconnect / manual retry
  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    // Fetch both instant + batch deliveries
    Promise.all([
      deliveryApi.getActiveDelivery(),
      deliveryApi
        .getActiveDeliveries()
        .catch(() => ({ instant: null, batches: [] })),
    ])
      .then(([instantDelivery, allDeliveries]) => {
        if (cancelled) return;

        // ── Instant delivery ──
        const delivery = instantDelivery || allDeliveries.instant;
        if (delivery) {
          if (delivery.status === "RIDER_NOTIFIED") {
            setIncomingAlert({
              delivery_id: delivery.delivery_id,
              order_id: delivery.order_id,
              order_number: delivery.order_number,
              shop_name: delivery.pharmacy.shop_name || "Pharmacy",
              branch_name: delivery.pharmacy.branch_name,
              pharmacy_address: delivery.pharmacy.address || undefined,
              pickup_lat: delivery.pharmacy.latitude,
              pickup_lng: delivery.pharmacy.longitude,
              estimated_distance_km: null,
              rider_type: delivery.rider_type,
              earnings: delivery.earnings || null,
              timestamp:
                delivery.timestamps.assigned_at || new Date().toISOString(),
            });
          } else {
            setActiveDelivery(delivery);
          }
        }

        // ── Same Day batches ──
        if (allDeliveries.batches.length > 0) {
          // Batches already in activeBatches are accepted — never
          // re-classify them as pending even if a stale RIDER_NOTIFIED
          // order lingers (e.g. pre-fix data or race condition).
          const currentActiveIds = new Set(
            useDeliveryStore
              .getState()
              .activeBatches.map((b) => b.batch_group_id),
          );

          const pendingBatches = allDeliveries.batches.filter(
            (b) =>
              !currentActiveIds.has(b.batch_group_id) &&
              b.orders.some((o) => o.status === "RIDER_NOTIFIED"),
          );
          const activeBatches = allDeliveries.batches.filter(
            (b) =>
              currentActiveIds.has(b.batch_group_id) ||
              !b.orders.some((o) => o.status === "RIDER_NOTIFIED"),
          );

          if (pendingBatches.length > 0 && !delivery) {
            // Show first pending batch as incoming alert
            const batch = pendingBatches[0];
            setIncomingBatch({
              batch_group_id: batch.batch_group_id,
              order_count: batch.order_count,
              pharmacy_name: batch.orders[0]?.pharmacy?.shop_name || "Pharmacy",
              deliveries: batch.orders.map((o) => ({
                delivery_id: o.delivery_id,
                order_id: o.order_id,
              })),
              timestamp: new Date().toISOString(),
            });
          }

          if (activeBatches.length > 0) {
            setActiveBatches(activeBatches);
          }
        }

        setSyncSuccess();
      })
      .catch((err: any) => {
        if (cancelled) return;
        setSyncError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to check active delivery status",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [
    status,
    resyncNonce,
    setIncomingAlert,
    setActiveDelivery,
    setIncomingBatch,
    setActiveBatches,
    setSyncSuccess,
    setSyncError,
  ]);

  // Subscribe to SSE Delivery Events
  useEffect(() => {
    if (status !== "authenticated") return;

    const unsubAssigned = onSSEEvent(
      "delivery_assigned",
      (data: IncomingOrderAlert) => {
        const currentActive = useDeliveryStore.getState().activeDelivery;
        if (!currentActive) {
          setIncomingAlert(data);
        }
      },
    );

    const unsubReady = onSSEEvent("order_ready_for_pickup", () => {
      setOrderStatus("READY_FOR_PICKUP");
    });

    const unsubCancelled = onSSEEvent(
      "delivery_cancelled",
      (data: { delivery_id?: string; order_id?: string }) => {
        // Check if this cancellation is for a batch order
        const state = useDeliveryStore.getState();
        const isBatchOrder = state.activeBatches.some((b) =>
          b.orders.some(
            (o) =>
              o.delivery_id === data.delivery_id ||
              o.order_id === data.order_id,
          ),
        );

        if (isBatchOrder && data.delivery_id) {
          // Remove single order from batch, don't clear everything
          state.removeOrderFromBatch(data.delivery_id);

          // Check if any batches are now empty
          const updatedState = useDeliveryStore.getState();
          updatedState.activeBatches.forEach((b) => {
            if (b.orders.length === 0) {
              state.removeBatch(b.batch_group_id);
            }
          });
        } else {
          // Instant delivery cancellation
          clearActiveDelivery();
        }
      },
    );

    // ── Same Day Batch SSE Events ──────────────────────────────
    const unsubBatchAssigned = onSSEEvent(
      "batch_assigned",
      (data: IncomingBatchAlert) => {
        const state = useDeliveryStore.getState();
        // Only show if rider doesn't already have an incoming alert
        if (!state.incomingAlert && !state.incomingBatch) {
          setIncomingBatch(data);
        }
      },
    );

    const unsubOrderAdded = onSSEEvent(
      "order_added_to_batch",
      (data: {
        batch_group_id: string;
        delivery_id: string;
        order_id: string;
      }) => {
        // Trigger a resync to get the updated batch data
        useDeliveryStore.getState().requestResync();
      },
    );

    const unsubOrderRemoved = onSSEEvent(
      "order_removed_from_batch",
      (data: { delivery_id: string; order_id: string }) => {
        removeOrderFromBatch(data.delivery_id);
      },
    );

    // ── Per-order status updates within a batch ──────────────
    // When a delivery_update comes for an order that's part of a
    // batch, trigger a resync to get the latest batch state.
    const unsubDeliveryUpdate = onSSEEvent(
      "delivery_update",
      (data: { order_id?: string; delivery_status?: string }) => {
        const state = useDeliveryStore.getState();
        const isBatchOrder = state.activeBatches.some((b) =>
          b.orders.some((o) => o.order_id === data.order_id),
        );
        if (isBatchOrder) {
          state.requestResync();
        }
      },
    );

    // ── Order status changes (e.g., customer cancels mid-batch) ──
    const unsubOrderStatusChanged = onSSEEvent(
      "order_status_changed",
      (data: { order_id?: string; new_status?: string }) => {
        if (data.new_status !== "CANCELLED") return;
        const state = useDeliveryStore.getState();
        const isBatchOrder = state.activeBatches.some((b) =>
          b.orders.some((o) => o.order_id === data.order_id),
        );
        if (isBatchOrder) {
          // Customer cancelled an order within the batch — resync
          state.requestResync();
        }
      },
    );

    return () => {
      unsubAssigned();
      unsubReady();
      unsubCancelled();
      unsubBatchAssigned();
      unsubOrderAdded();
      unsubOrderRemoved();
      unsubDeliveryUpdate();
      unsubOrderStatusChanged();
    };
  }, [
    status,
    setIncomingAlert,
    setOrderStatus,
    clearActiveDelivery,
    setIncomingBatch,
    removeOrderFromBatch,
  ]);
}
