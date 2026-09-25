// src/utils/deliveryStatus.ts (do not remove this comment)

import type { ActiveDelivery, DeliveryStatus } from "../types/delivery";

// Statuses where the rider has been assigned but not yet accepted —
// IncomingOrderOverlay owns this state, NOT the navigation lock.
const UNLOCKED_STATUSES: DeliveryStatus[] = ["PENDING_ASSIGNMENT", "RIDER_NOTIFIED"];

// Statuses where the delivery is finished/closed out — should never
// actually appear in `activeDelivery` (the backend's getActiveDelivery
// query already excludes these), but guarded here defensively so a stale
// or unexpected payload can never accidentally lock the rider forever.
const TERMINAL_STATUSES: DeliveryStatus[] = ["DELIVERED", "FAILED", "CANCELLED"];

/**
 * Single source of truth for whether the rider should be locked into the
 * full-screen ActiveDeliveryScreen (tabs unmounted, navigation impossible).
 */
export function isDeliveryLocked(delivery: ActiveDelivery | null): boolean {
  if (!delivery) return false;
  if (UNLOCKED_STATUSES.includes(delivery.status)) return false;
  if (TERMINAL_STATUSES.includes(delivery.status)) return false;
  return true;
}

export type DeliveryLeg = "PHARMACY" | "CUSTOMER";

/**
 * Which leg of the trip the rider is currently on. Used by Phase 2+ to
 * decide whether to show pharmacy or customer details/markers.
 */
export function getDeliveryLeg(delivery: ActiveDelivery): DeliveryLeg {
  if (delivery.status === "ACCEPTED" || delivery.status === "ARRIVED_AT_PHARMACY") {
    return "PHARMACY";
  }
  return "CUSTOMER";
}