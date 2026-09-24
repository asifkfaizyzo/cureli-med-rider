// src/features/auth/utils/authNavigation.ts (do not remove this comment)
import type { Href } from "expo-router";
import type { RiderProfile, OnboardingStep } from "../../../types/auth";

/**
 * Maps each onboarding step to its corresponding route.
 *
 * Typed as `Record<OnboardingStep, Href>` (not `string`) so that if a route
 * string here doesn't match an actual file in app/, TypeScript fails the
 * build instead of silently producing an "unmatched route" screen at
 * runtime — which is exactly what happened with the old
 * "/(app)/(tabs)/home" typo (there is no home.tsx; the tab is index.tsx).
 *
 * Exported so other entry points (e.g. app/index.tsx) can reuse this exact
 * mapping instead of hand-maintaining a second copy that can drift/typo.
 */
export const STEP_TO_ROUTE: Record<OnboardingStep, Href> = {
  PERSONAL_DETAILS: "/(onboarding)/personal-details",
  LOCATION: "/(onboarding)/location",
  VEHICLE_DETAILS: "/(onboarding)/vehicle-details",
  RC_UPLOAD: "/(onboarding)/doc-vehicle-rc",
  DL_UPLOAD: "/(onboarding)/doc-driving-license",
  AADHAAR_UPLOAD: "/(onboarding)/doc-aadhar",
  PAN_UPLOAD: "/(onboarding)/doc-pan",
  LIVE_PHOTO: "/(onboarding)/doc-live-photo",
  COMPLETED: "/(onboarding)/status",
};

const HOME_ROUTE: Href = "/(app)/(tabs)";
const BANK_DETAILS_ROUTE: Href = "/(onboarding)/bank-details";
const TERMS_ROUTE: Href = "/(onboarding)/terms";
const STATUS_ROUTE: Href = "/(onboarding)/status";
const LOGIN_ROUTE: Href = "/(auth)/login";
const PERSONAL_DETAILS_ROUTE: Href = "/(onboarding)/personal-details";

/**
 * Looks up the route for a given onboarding step, falling back to the
 * first step if the value is somehow missing/unrecognized.
 */
export function getOnboardingStepRoute(step: OnboardingStep): Href {
  return STEP_TO_ROUTE[step] || PERSONAL_DETAILS_ROUTE;
}

/**
 * Evaluates the rider's profile state and returns the exact route.
 *
 * Priority:
 *   1. TEAM riders → home (bypass onboarding)
 *   2. ACTIVE → check bank/terms → home
 *   3. PENDING_REVIEW → status page
 *   4. REJECTED → earliest rejected step (resubmission mode)
 *   5. SUSPENDED/BLOCKED → login
 *   6. DRAFT → current onboarding_step
 *
 * NOTE: this is used right after login/OTP-verify. app/index.tsx (the cold
 * app-launch redirect) currently encodes a few different rules (checks
 * `submitted_for_review` for PENDING_REVIEW, uses `terms_accepted_at`
 * instead of `has_accepted_terms`, has no TEAM bypass, no bank-details
 * check). That divergence was NOT changed here — flagged separately for
 * product/logic review rather than silently merged.
 */
export function getRouteForRider(rider: RiderProfile): Href {
  // 1. Team riders bypass onboarding entirely
  if (rider.rider_type === "TEAM") {
    return HOME_ROUTE;
  }

  // 2. Route based on compliance status
  switch (rider.status) {
    case "ACTIVE":
      if (!rider.has_bank_details) {
        return BANK_DETAILS_ROUTE;
      }
      if (!rider.has_accepted_terms) {
        return TERMS_ROUTE;
      }
      return HOME_ROUTE;

    case "PENDING_REVIEW":
      return STATUS_ROUTE;

    case "REJECTED":
      // Resubmission mode: route to the earliest rejected step
      // The backend sets onboarding_step to the first rejected doc's step
      return getOnboardingStepRoute(rider.onboarding_step);

    case "SUSPENDED":
    case "BLOCKED":
      return LOGIN_ROUTE;

    case "DRAFT":
    default:
      // Route based on onboarding_step field (source of truth)
      return getOnboardingStepRoute(rider.onboarding_step);
  }
}