// src/hooks/useAutoEnRoute.ts (do not remove this comment)

import { useEffect, useRef } from "react";
import { useDeliveryStore } from "../store/deliveryStore";
import { useRiderOperationalStore } from "../store/riderOperationalStore";
import { deliveryApi } from "../features/delivery/api/delivery.api";
import { getDistanceMeters } from "../utils/geo";
import type { ActiveDelivery } from "../types/delivery";

const EN_ROUTE_TRIGGER_METERS = 50;
const MAX_ATTEMPTS = 2; // initial attempt + exactly one retry

/**
 * Silently promotes PICKED_UP -> EN_ROUTE once the rider has moved more
 * than 50m from the pharmacy. This is a pure background side effect:
 *
 *  - No UI depends on the distinction — CustomerLegPanel treats PICKED_UP
 *    and EN_ROUTE identically (both render the "en route to customer"
 *    arrival slider).
 *  - Non-blocking: if the API call fails (bad network), we retry exactly
 *    once on the next location tick, then give up permanently for this
 *    delivery. The rider is NEVER blocked by this — the backend accepts
 *    ARRIVED_AT_CUSTOMER from both PICKED_UP and EN_ROUTE, so a rider can
 *    complete the whole delivery even if this call never succeeds.
 *
 * Safe to call unconditionally regardless of which leg is currently
 * active — it only does anything while status === "PICKED_UP".
 */
export function useAutoEnRoute(delivery: ActiveDelivery | null) {
  const currentLocation = useRiderOperationalStore((s) => s.currentLocation);
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);

  const attemptsRef = useRef(0);
  const trackedDeliveryIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  // Reset attempt tracking whenever the active delivery changes, so a
  // fresh delivery always gets its own full attempt budget.
  useEffect(() => {
    if (delivery?.delivery_id !== trackedDeliveryIdRef.current) {
      attemptsRef.current = 0;
      trackedDeliveryIdRef.current = delivery?.delivery_id ?? null;
    }
  }, [delivery?.delivery_id]);

  useEffect(() => {
    if (!delivery) return;
    if (delivery.status !== "PICKED_UP") return; // no-op once promoted, or during pharmacy leg
    if (inFlightRef.current) return;
    if (attemptsRef.current >= MAX_ATTEMPTS) return;
    if (!currentLocation) return;

    const pickupLat = delivery.pharmacy.latitude;
    const pickupLng = delivery.pharmacy.longitude;
    if (pickupLat == null || pickupLng == null) return;

    const distance = getDistanceMeters(
      currentLocation.lat,
      currentLocation.lng,
      pickupLat,
      pickupLng,
    );

    if (distance < EN_ROUTE_TRIGGER_METERS) return;

    inFlightRef.current = true;
    attemptsRef.current += 1;

    deliveryApi
      .updateStatus(delivery.delivery_id, "EN_ROUTE")
      .then((updated) => {
        setActiveDelivery(updated);
      })
      .catch((err) => {
        console.warn("[useAutoEnRoute] Failed to auto-promote to EN_ROUTE:", err);
        // Silent by design — one retry remains via attemptsRef, then this
        // delivery permanently gives up on the promotion (harmless).
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [delivery, currentLocation, setActiveDelivery]);
}