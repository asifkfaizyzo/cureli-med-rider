import type { RiderProfile, OnboardingStep } from "../../../types/auth";

/**
 * Maps each onboarding step to its corresponding route.
 */
const STEP_TO_ROUTE: Record<OnboardingStep, string> = {
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
 */
export function getRouteForRider(rider: RiderProfile): string {
  // 1. Team riders bypass onboarding entirely
  if (rider.rider_type === "TEAM") {
    return "/(app)/(tabs)/home";
  }

  // 2. Route based on compliance status
  switch (rider.status) {
    case "ACTIVE":
      if (!rider.has_bank_details) {
        return "/(onboarding)/bank-details";
      }
      if (!rider.has_accepted_terms) {
        return "/(onboarding)/terms";
      }
      return "/(app)/(tabs)/home";

    case "PENDING_REVIEW":
      return "/(onboarding)/status";

    case "REJECTED":
      // Resubmission mode: route to the earliest rejected step
      // The backend sets onboarding_step to the first rejected doc's step
      return STEP_TO_ROUTE[rider.onboarding_step] || "/(onboarding)/status";

    case "SUSPENDED":
    case "BLOCKED":
      return "/(auth)/login";

    case "DRAFT":
    default:
      // Route based on onboarding_step field (source of truth)
      return (
        STEP_TO_ROUTE[rider.onboarding_step] ||
        "/(onboarding)/personal-details"
      );
  }
}