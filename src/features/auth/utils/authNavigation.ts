// src/features/auth/utils/authNavigation.ts

import type { RiderProfile, DocumentGroup } from '../../../types/auth';

/**
 * Checks the rider's documents array to determine which document is missing
 */
export function getNextDocumentRoute(rider: RiderProfile): string {
  const docs = rider.documents || [];

  const getDocStatus = (group: DocumentGroup) => {
    return docs.find((d) => d.group === group);
  };

  // 1. Driving License (Requires Front & Back)
  const dl = getDocStatus("DRIVING_LICENSE");
  if (!dl || dl.status === "NOT_UPLOADED" || !dl.has_front || !dl.has_back) {
    return "/(onboarding)/doc-driving-license";
  }

  // 2. Vehicle RC (Single Sided)
  const rc = getDocStatus("VEHICLE_RC");
  if (!rc || rc.status === "NOT_UPLOADED" || !rc.has_front) {
    return "/(onboarding)/doc-vehicle-rc";
  }

  // 3. Aadhaar (Requires Front & Back)
  const ad = getDocStatus("AADHAAR");
  if (!ad || ad.status === "NOT_UPLOADED" || !ad.has_front || !ad.has_back) {
    return "/(onboarding)/doc-aadhar";
  }

  // 4. PAN Card (Single Sided)
  const pan = getDocStatus("PAN");
  if (!pan || pan.status === "NOT_UPLOADED" || !pan.has_front) {
    return "/(onboarding)/doc-pan";
  }

  // 5. Live Photo (Single Sided)
  const selfie = getDocStatus("PROFILE_PHOTO");
  if (!selfie || selfie.status === "NOT_UPLOADED" || !selfie.has_front) {
    return "/(onboarding)/doc-live-photo";
  }

  // All documents uploaded successfully -> Go to review screen
  return "/(onboarding)/submit-review";
}

/**
 * Evaluates the rider's profile state and returns the correct path they should be routed to.
 */
export function getRouteForRider(rider: RiderProfile): string {
  // 1. Team riders bypass onboarding entirely
  if (rider.rider_type === 'TEAM') {
    return '/(app)/home';
  }

  // 2. Route based on compliance status
  switch (rider.status) {
    case 'ACTIVE':
      if (!rider.has_bank_details) {
        return '/(onboarding)/bank-details';
      }
      if (!rider.has_accepted_terms) {
        return '/(onboarding)/terms';
      }
      return '/(app)/home';

    case 'PENDING_REVIEW':
    case 'REJECTED':
      return '/(onboarding)/status';

    case 'SUSPENDED':
    case 'BLOCKED':
      return '/(auth)/login';

    case 'DRAFT':
    default:
      // Route based on missing profile steps
      if (!rider.has_personal_details) {
        return '/(onboarding)/personal-details';
      }
      if (!rider.has_location) {
        return '/(onboarding)/location';
      }
      if (!rider.has_vehicle_details) {
        return '/(onboarding)/vehicle-details';
      }
      
      // Deep check individual uploaded documents
      return getNextDocumentRoute(rider);
  }
}