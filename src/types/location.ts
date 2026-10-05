// src/types/location.ts (do not remove this comment)

import type { RiderType } from "./auth";
import type { PayoutStatus } from "./earnings";

// ── Dashboard Types ──────────────────────────────────────────

export interface DashboardStats {
  rider_type: RiderType;

  // ── Common (both INDEPENDENT and TEAM) ────────────────────
  today: TodayStats;
  yesterday: YesterdayStats;
  orders: OrderActionStats;
  week: WeekStats;
  rating: RatingInfo;

  // ── INDEPENDENT only ──────────────────────────────────────
  earnings?: EarningsSection;
  payout?: PayoutSection;
  surge?: SurgeInfo;
  active_incentives?: ActiveIncentive[];

  // ── TEAM only ─────────────────────────────────────────────
  team?: TeamSection;
}

export interface TodayStats {
  deliveries_completed: number;
  online_hours: number;
  tips: number;
}

export interface YesterdayStats {
  deliveries_completed: number;
  online_hours: number;
  earnings?: number;                   // INDEPENDENT only
  deliveries_delta_pct: number | null; // null = "New activity today" (was 0 yesterday)
  online_hours_delta_pct: number | null;
  earnings_delta_pct?: number | null;  // INDEPENDENT only
}

export interface OrderActionStats {
  accepted: number;
  denied: number;        // REJECTED + TIMEOUT from DeliveryAssignmentLog
  cancelled: number;     // Delivery CANCELLED after acceptance
  acceptance_rate: number; // 0-100
  completion_rate: number; // 0-100
}

export interface WeekStats {
  deliveries_completed: number;
  online_hours: number;
  days_online: number;   // Distinct shift dates with >= 1 delivery
  tips: number;
}

export interface RatingInfo {
  stars: number;
  total_ratings: number;
}

// ── INDEPENDENT: Earnings ────────────────────────────────────

export interface EarningsSection {
  today: TodayEarnings;
  week: WeekEarnings;
}

export interface TodayEarnings {
  total: number;
  base_fee: number;          // pickup_fee + drop_fee
  surge_fee: number;
  floor_topup_fee: number;
  tips: number;
  incentive_earnings: number; // From RiderEarningLedger
  per_order_avg: number;
}

export interface WeekEarnings {
  total: number;
  per_order_avg: number;
  delta_pct_vs_last_week: number | null;
}

// ── INDEPENDENT: Payout ──────────────────────────────────────

export interface PayoutSection {
  current_week: CurrentWeekPayout;
  last_payout: LastPayout | null;
}

export interface CurrentWeekPayout {
  week_start: string;       // YYYY-MM-DD
  week_end: string;         // YYYY-MM-DD
  accumulated_amount: number;
}

export interface LastPayout {
  week_start: string;
  week_end: string;
  gross_amount: number;
  net_amount: number;
  status: PayoutStatus;
  processed_at: string | null;
  utr_reference: string | null;
}

// ── INDEPENDENT: Surge ───────────────────────────────────────

export interface SurgeInfo {
  is_active: boolean;
  rule_name: string | null;
  calc_type: "MULTIPLIER" | "FLAT_ADDITION" | null;
  value: number | null;
  expires_at: string | null;
}

// ── INDEPENDENT: Incentives ──────────────────────────────────

export interface ActiveIncentive {
  schedule_id: string;
  template_id: string;
  title: string;
  description: string | null;
  period: "DAILY" | "WEEKLY" | "CUSTOM_PERIOD";
  metric_type: "ORDER_COUNT" | "BASE_EARNINGS";
  current_progress: number;
  is_featured: boolean;
  custom_tag: string | null;
  tiers: IncentiveTier[];
  gating: IncentiveGating;
  ends_at: string;          // ISO timestamp
}

export interface IncentiveTier {
  level: number;
  target: number;
  reward: number;
  achieved: boolean;
}

export interface IncentiveGating {
  online_hours_met: boolean;
  denial_count_ok: boolean;
  cancellation_count_ok: boolean;
  acceptance_rate_ok: boolean;
  completion_rate_ok: boolean;
  is_eligible: boolean;
  warnings: string[];       // Human-readable warning messages
}

// ── TEAM: Monthly ────────────────────────────────────────────

export interface TeamSection {
  month: TeamMonthlyStats;
}

export interface TeamMonthlyStats {
  deliveries_completed: number;
  online_hours: number;
  tips: number;
}

// ── Legacy Aliases (removed in Phase 3 component updates) ────
// These prevent build errors between Phase 2 and Phase 3.
// Delete after all components are migrated.

/** @deprecated Use TodayStats | WeekStats instead */
export type PeriodStats = TodayStats & {
  earnings: number;
  surge_earnings: number;
};

// ── Nearby Shops (unchanged) ─────────────────────────────────

export interface NearbyShop {
  branch_id: string;
  shop_name: string;
  branch_name: string;
  lat: number;
  lng: number;
  address: string;
  is_open: boolean;
  status_message?: string;
  is_live: boolean;
  distance_km: number;
  logo_url?: string | null;
}

export interface NearbyShopsResponse {
  shops: NearbyShop[];
  count: number;
}

// ── Location Permission (unchanged) ──────────────────────────

export type LocationPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined"
  | "disabled";

export type GPSStatus = "available" | "disabled" | "checking";

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}