// src/types/earnings.ts (do not remove this comment)

export interface EarningsOverview {
  all_time: {
    total_earnings: number;
    total_deliveries: number;
    total_tips: number;
  };
  current_week: {
    week_start: string; // YYYY-MM-DD
    week_end: string;   // YYYY-MM-DD
    total_earnings: number;
    total_deliveries: number;
    per_order_avg: number;
    delta_pct_vs_last_week: number | null; // null if last week was 0
  };
  payout: {
    current_week_accumulated: number;
    last_payout: {
      week_start: string;
      week_end: string;
      gross_amount: number;
      status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
      processed_at: string | null;
    } | null;
  };
}

export interface DailyEarningBar {
  date: string; // YYYY-MM-DD
  day_name: string; // Mon, Tue, etc.
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

export interface PayoutHistoryItem {
  payout_id: string;
  week_start: string;
  week_end: string;
  gross_amount: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  payment_method: string;
  processed_at: string | null;
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