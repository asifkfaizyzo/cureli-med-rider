// src/types/delivery.ts (do not remove this comment)

export type DeliveryStatus =
  | "PENDING_ASSIGNMENT"
  | "RIDER_NOTIFIED"
  | "ACCEPTED"
  | "ARRIVED_AT_PHARMACY"
  | "PICKED_UP"
  | "EN_ROUTE"
  | "ARRIVED_AT_CUSTOMER"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type MarketplaceOrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

// ── NEW: Shared earnings summary interface ──────────────────────────
export interface OrderEarningsSummary {
  base_earning: number;      // pickup_fee + drop_fee + floor_topup_fee
  pickup_fee: number;
  drop_fee: number;
  surge_fee: number;
  floor_topup_fee: number;
  tip_amount: number;
  total_earning: number;     // base_earning + surge_fee + tip_amount
}

export interface IncomingOrderAlert {
  delivery_id: string;
  order_id: string;
  order_number: string;
  shop_name?: string;
  branch_name?: string;
  pharmacy_name?: string;
  pharmacy_address?: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  estimated_distance_km: number | null;
  drop_distance_km?: number | null;         // ── NEW
  total_distance_km?: number | null;        // ── NEW
  rider_type?: "INDEPENDENT" | "TEAM";      // ── NEW
  earnings?: OrderEarningsSummary | null;   // ── NEW
  timestamp: string;
}

export interface DeliveryOrderItem {
  item_id: string;
  medicine_name_snapshot: string;
  pack_size_snapshot?: string | null;
  quantity: number;
}

export interface ActiveDeliveryPharmacy {
  shop_name?: string;
  branch_name?: string;
  contact_number?: string;
  address?: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ActiveDeliveryCustomer {
  name?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string | null;
  landmark?: string | null;
  city?: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ActiveDelivery {
  delivery_id: string;
  order_id: string;
  order_number: string;
  status: DeliveryStatus;
  order_status: MarketplaceOrderStatus;
  total_amount: number;
  payment_method: string;
  item_count: number;
  items: DeliveryOrderItem[];
  rider_type?: "INDEPENDENT" | "TEAM";      // ── NEW
  earnings?: OrderEarningsSummary;          // ── NEW
  pharmacy: ActiveDeliveryPharmacy;
  customer: ActiveDeliveryCustomer | null;
  timestamps: {
    assigned_at: string | null;
    accepted_at: string | null;
    arrived_at_pharmacy_at: string | null;
    picked_up_at: string | null;
    arrived_at_customer_at: string | null;
    delivered_at: string | null;
  };
}

export type HistoryStatusFilter = "DELIVERED" | "FAILED" | "CANCELLED";

export interface DeliveryHistoryItem {
  delivery_id: string;
  order_id: string;
  order_number: string;
  status: DeliveryStatus;
  pharmacy_name: string | null;
  branch_name: string | null;
  customer_name: string | null;
  total_amount: number;
  payment_method: string;
  item_count: number;
  total_rider_earning: number;
  tip_amount: number;
  total_distance_km: number;
  failure_reason: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  created_at: string;
}

export interface DeliveryHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DeliveryHistoryListResponse {
  deliveries: DeliveryHistoryItem[];
  pagination: DeliveryHistoryPagination;
}

export interface DeliveryHistoryFilters {
  page?: number;
  limit?: number;
  status?: HistoryStatusFilter[];
  from_date?: string;
  to_date?: string;
}

export interface DeliveryHistoryDetailItem {
  item_id: string;
  medicine_name: string;
  brand: string | null;
  pack_size: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface DeliveryHistoryDetail {
  delivery_id: string;
  order_id: string;
  order_number: string;
  status: DeliveryStatus;
  payment_method: string;
  order_total: number;
  pharmacy: {
    shop_name: string | null;
    branch_name: string | null;
    contact_number: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  customer: {
    name: string | null;
    phone: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    landmark: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  items: DeliveryHistoryDetailItem[];
  earnings: {
    pickup_fee: number;
    drop_fee: number;
    surge_fee: number;
    floor_topup_fee: number;
    tip_amount: number;
    total_earning: number;
  };
  distances: {
    pickup_km: number;
    drop_km: number;
    total_km: number;
  };
  timestamps: {
    assigned_at: string | null;
    accepted_at: string | null;
    arrived_at_pharmacy_at: string | null;
    picked_up_at: string | null;
    arrived_at_customer_at: string | null;
    delivered_at: string | null;
    failed_at: string | null;
  };
  failure_reason: string | null;
  failure_note: string | null;
  rating: { stars: number; created_at: string } | null;
  created_at: string;
}