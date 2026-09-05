// ── Enums ─────────────────────────────────────────────────────

export type RiderType = 'INDEPENDENT' | 'TEAM';

export type RiderStatus =
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'BLOCKED'
  | 'REJECTED';

export type DocumentGroup =
  | 'DRIVING_LICENSE'
  | 'VEHICLE_RC'
  | 'AADHAAR'
  | 'PAN'
  | 'PROFILE_PHOTO';

export type DocumentStatus =
  | 'NOT_UPLOADED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

// ── Models ────────────────────────────────────────────────────

export interface RiderDocument {
  group: DocumentGroup;
  label: string;
  hasBack: boolean;
  status: DocumentStatus;
  rejection_reason: string | null;
  has_front: boolean;
  has_back: boolean | null;
  uploaded_at: string | null;
  resubmission_count?: number;
}

export interface RiderZone {
  zone_id: string;
  name: string;
  city: string;
  state: string;
}

export interface RiderProfile {
  rider_id: string;
  phone: string;
  rider_type: RiderType;
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  sex: string | null;
  profile_photo_key: string | null;
  status: RiderStatus;
  suspension_reason: string | null;
  current_city: string | null;
  residential_address: string | null;
  preferred_lat: number | null;
  preferred_lng: number | null;
  preferred_address: string | null;
  is_online: boolean;
  rating: number;
  total_ratings: number;
  total_deliveries: number;
  vehicle_type: string | null;
  vehicle_number: string | null;
  vehicle_make_model: string | null;
  bank_holder_name: string | null;
  bank_ifsc: string | null;
  bank_account_last4: string | null;
  bank_verified: boolean;
  terms_accepted_at: string | null;
  referral_code: string | null;
  created_at: string;
  last_seen_at: string | null;
  documents: RiderDocument[];
  has_personal_details: boolean;
  has_location: boolean;
  has_vehicle_details: boolean;
  has_bank_details: boolean;
  has_all_documents: boolean;
  has_accepted_terms: boolean;
}

// ── Auth Responses ────────────────────────────────────────────

export interface CheckPhoneResponse {
  exists: boolean;
  has_password: boolean;
  rider_type: RiderType | null;
  status: RiderStatus | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface VerifyOtpResponse {
  is_new?: boolean;
  temp_token?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  rider?: RiderProfile;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  rider: RiderProfile;
}

export interface SetPasswordResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  rider: RiderProfile;
}

// ── Onboarding Status ─────────────────────────────────────────

export interface OnboardingSteps {
  personal_details: boolean;
  location: boolean;
  vehicle_details: boolean;
  bank_details: boolean;
  terms_accepted: boolean;
}

export interface OnboardingStatus {
  rider_type: RiderType;
  status: RiderStatus;
  is_complete: boolean;
  next_step: string | null;
  steps: OnboardingSteps;
  documents: RiderDocument[];
  all_docs_uploaded: boolean;
  all_docs_approved: boolean;
  any_doc_rejected: boolean;
}