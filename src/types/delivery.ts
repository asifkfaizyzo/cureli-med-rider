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