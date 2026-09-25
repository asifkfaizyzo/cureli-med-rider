// src/hooks/useDeliveryEvents.ts (do not remove this comment)

import { useEffect } from "react";
import { onSSEEvent } from "../services/sseManager";
import { useDeliveryStore } from "../store/deliveryStore";
import { deliveryApi } from "../features/delivery/api/delivery.api";
import { useAuthStore } from "../store/authStore";
import type { IncomingOrderAlert } from "../types/delivery";

export function useDeliveryEvents() {
  const status = useAuthStore((s) => s.status);
  const setIncomingAlert = useDeliveryStore((s) => s.setIncomingAlert);
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);
  const setOrderStatus = useDeliveryStore((s) => s.setOrderStatus);
  const clearActiveDelivery = useDeliveryStore((s) => s.clearActiveDelivery);
  const setSyncSuccess = useDeliveryStore((s) => s.setSyncSuccess);
  const setSyncError = useDeliveryStore((s) => s.setSyncError);
  const resyncNonce = useDeliveryStore((s) => s.resyncNonce);

  // Reset hydration flag whenever we leave the authenticated state (logout),
  // so the NEXT login re-runs the fail-closed gate instead of trusting a
  // stale "already synced" flag from a previous rider's session.
  useEffect(() => {
    if (status !== "authenticated") {
      useDeliveryStore.setState({ hasSyncedDelivery: false, syncError: null });
    }
  }, [status]);

  // Sync active delivery on mount / reconnect / manual retry.
  // Fail-CLOSED: hasSyncedDelivery only becomes true on success. On failure
  // we surface syncError and leave hasSyncedDelivery false, so the app-level
  // hydration gate stays up with a retry option rather than assuming "no
  // active delivery" and letting the rider navigate freely.
  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    deliveryApi
      .getActiveDelivery()
      .then((delivery) => {
        if (cancelled) return;

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
              timestamp: delivery.timestamps.assigned_at || new Date().toISOString(),
            });
          } else {
            setActiveDelivery(delivery);
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
  }, [status, resyncNonce, setIncomingAlert, setActiveDelivery, setSyncSuccess, setSyncError]);

  // Subscribe to SSE Delivery Events
  useEffect(() => {
    if (status !== "authenticated") return;

    const unsubAssigned = onSSEEvent("delivery_assigned", (data: IncomingOrderAlert) => {
      const currentActive = useDeliveryStore.getState().activeDelivery;
      if (!currentActive) {
        setIncomingAlert(data);
      }
    });

    const unsubReady = onSSEEvent("order_ready_for_pickup", () => {
      setOrderStatus("READY_FOR_PICKUP");
    });

    const unsubCancelled = onSSEEvent("delivery_cancelled", () => {
      clearActiveDelivery();
    });

    return () => {
      unsubAssigned();
      unsubReady();
      unsubCancelled();
    };
  }, [status, setIncomingAlert, setOrderStatus, clearActiveDelivery]);
}