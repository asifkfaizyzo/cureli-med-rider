// src/types/earnings.ts (do not remove this comment)

export interface WeeklyEarningsBreakdown {
  base_fee: number;
  surge_fee: number;
  floor_topup_fee: number;
  tips: number;
  incentive_earnings: number;
  total: number;
}

export interface EarningsOverview {
  all_time: {
    total_earnings: number;
    total_deliveries: number;
    total_tips: number;
  };
  current_week: {
    week_start: string;
    week_end: string;
    total_earnings: number;
    total_deliveries: number;
    per_order_avg: number;
    delta_pct_vs_last_week: number | null;
  };
  current_week_breakdown: WeeklyEarningsBreakdown;
  payout: {
    current_week_accumulated: number;
    last_payout: {
      week_start: string;
      week_end: string;
      gross_amount: number;
      net_amount: number;
      status: PayoutStatus;
      processed_at: string | null;
      utr_reference: string | null;
    } | null;
  };
}

export interface DailyEarningBar {
  date: string;
  day_name: string;
  earnings: number;
  deliveries: number;
}

export interface WeeklyEarningsData {
  week_start: string;
  week_end: string;
  days: DailyEarningBar[];
  total_earnings: number;
  total_deliveries: number;
  best_day: {
    date: string;
    earnings: number;
  } | null;
  per_order_avg: number;
  has_older_data: boolean;
}

export interface OrderEarningsItem {
  delivery_id: string;
  order_number: string;
  pharmacy_name: string | null;
  delivered_at: string;
  total_distance_km: number;
  earnings: {
    pickup_fee: number;
    drop_fee: number;
    surge_fee: number;
    floor_topup_fee: number;
    tip_amount: number;
    total_earning: number;
  };
}

export interface OrderEarningsResponse {
  orders: OrderEarningsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Payout Types ─────────────────────────────────────────────

/** Rider-visible payout statuses (DRAFT is CAdmin-only, never sent to app) */
export type PayoutStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface PayoutDeduction {
  label: string;
  amount: number;
  note?: string | null;
}

export interface PayoutDailyBreakdown {
  date: string;
  day_name: string;
  deliveries: number;
  base: number;
  surge: number;
  floor_topup: number;
  tips: number;
  incentive: number;
  total: number;
}

export interface PayoutAttendanceDaily {
  date: string;
  day_name: string;
  online_hours: number;
  orders: number;
}

export interface PayoutAttendanceSummary {
  days_active: number;
  total_hours: number;
  total_orders: number;
  daily?: PayoutAttendanceDaily[];
}

export interface PayoutBreakdownSnapshot {
  // INDEPENDENT fields
  total_deliveries?: number;
  base_fee?: number;
  surge_fee?: number;
  floor_topup_fee?: number;
  tips?: number;
  incentive_earnings?: number;
  gross_total?: number;
  net_total?: number;
  daily?: PayoutDailyBreakdown[];

  // TEAM fields
  type?: "TEAM_SALARY";
  manual_amount?: number;
  attendance?: PayoutAttendanceSummary; // Added attendance details

  // Shared
  deductions?: PayoutDeduction[];
}

export interface BankSnapshot {
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
}

export interface PayoutHistoryItem {
  payout_id: string;
  week_start: string;
  week_end: string;
  gross_amount: number;
  net_amount: number;
  status: PayoutStatus;
  payment_method: string;
  processed_at: string | null;
  utr_reference: string | null;
  deductions: PayoutDeduction[];
  breakdown_snapshot: PayoutBreakdownSnapshot | null;
  bank_snapshot?: BankSnapshot | null;
}

export interface PayoutHistoryResponse {
  payouts: PayoutHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}