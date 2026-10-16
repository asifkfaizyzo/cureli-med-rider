// src/hooks/useBatchAutoEnRoute.ts (do not remove this comment)
//
// Auto-transitions batch orders from PICKED_UP → EN_ROUTE after a
// short delay, mirroring the instant delivery useAutoEnRoute behavior.
//
// For batch deliveries the rider may pick up multiple orders before
// heading out, so we only auto-transition orders that have been in
// PICKED_UP state for at least 30 seconds (giving the rider time to
// pick up the next order at the same pharmacy).

import { useEffect, useRef } from "react";
import { useDeliveryStore } from "../store/deliveryStore";
import { deliveryApi } from "../features/delivery/api/delivery.api";

const AUTO_EN_ROUTE_DELAY_MS = 30_000;

export function useBatchAutoEnRoute() {
  const activeBatches = useDeliveryStore((s) => s.activeBatches);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const allOrders = activeBatches.flatMap((b) => b.orders);
    const pickedUpOrders = allOrders.filter((o) => o.status === "PICKED_UP");
    const pickedUpIds = new Set(pickedUpOrders.map((o) => o.delivery_id));

    // Clear timers for orders no longer in PICKED_UP
    timersRef.current.forEach((timer, deliveryId) => {
      if (!pickedUpIds.has(deliveryId)) {
        clearTimeout(timer);
        timersRef.current.delete(deliveryId);
      }
    });

    // Start timers for newly PICKED_UP orders
    pickedUpOrders.forEach((order) => {
      if (timersRef.current.has(order.delivery_id)) return;

      const timer = setTimeout(async () => {
        timersRef.current.delete(order.delivery_id);
        try {
          await deliveryApi.updateStatus(order.delivery_id, "EN_ROUTE");
          const all = await deliveryApi.getActiveDeliveries();
          useDeliveryStore.getState().setActiveBatches(all.batches);
        } catch (err) {
          console.error(
            `[BatchAutoEnRoute] Failed for ${order.delivery_id}:`,
            err,
          );
        }
      }, AUTO_EN_ROUTE_DELAY_MS);

      timersRef.current.set(order.delivery_id, timer);
    });

    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [activeBatches]);
}