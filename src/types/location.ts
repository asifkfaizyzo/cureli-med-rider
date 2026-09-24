export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface DashboardStats {
  today: PeriodStats;
  week: PeriodStats;
  active_incentive: ActiveIncentive | null;
}

export interface PeriodStats {
  earnings: number;
  deliveries_completed: number;
  tips: number;
  surge_earnings: number;
  online_hours: number;
}

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
}

export interface IncentiveTier {
  level: number;
  target: number;
  reward: number;
  achieved: boolean;
}

export interface NearbyShop {
  branch_id: string;
  shop_name: string;
  branch_name: string;
  lat: number;
  lng: number;
  address: string;
  is_open: boolean;
  is_live: boolean;
  distance_km: number;
}

export interface NearbyShopsResponse {
  shops: NearbyShop[];
  count: number;
}

export type LocationPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined"
  | "disabled";

export type GPSStatus = "available" | "disabled" | "checking";