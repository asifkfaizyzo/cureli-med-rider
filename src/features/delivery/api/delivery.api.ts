// src/features/delivery/api/delivery.api.ts (do not remove this comment)

import { api } from "../../../services/api";
import type {
  ActiveDelivery,
  DeliveryHistoryListResponse,
  DeliveryHistoryFilters,
  DeliveryHistoryDetail,
} from "../../../types/delivery";

export const deliveryApi = {
  async getActiveDelivery(): Promise<ActiveDelivery | null> {
    const res = await api.get<{ success: boolean; data: ActiveDelivery | null }>(
      "/rider/delivery/active",
    );
    return res.data?.data || null;
  },

  async acceptDelivery(deliveryId: string): Promise<ActiveDelivery> {
    const res = await api.post<{ success: boolean; data: ActiveDelivery }>(
      `/rider/delivery/${deliveryId}/accept`,
    );
    return res.data.data;
  },

  async declineDelivery(
    deliveryId: string,
    reason: string,
    note?: string,
  ): Promise<void> {
    await api.post(`/rider/delivery/${deliveryId}/decline`, { reason, note });
  },

  async updateStatus(
    deliveryId: string,
    status: "ARRIVED_AT_PHARMACY" | "PICKED_UP" | "EN_ROUTE" | "ARRIVED_AT_CUSTOMER",
    pickupOtp?: string,
  ): Promise<ActiveDelivery> {
    const res = await api.post<{ success: boolean; data: ActiveDelivery }>(
      `/rider/delivery/${deliveryId}/status`,
      { status, pickup_otp: pickupOtp },
    );
    return res.data.data;
  },

  async completeDelivery(
    deliveryId: string,
    deliveryOtp: string,
  ): Promise<{ delivery_id: string; status: string }> {
    const res = await api.post<{
      success: boolean;
      data: { delivery_id: string; status: string };
    }>(`/rider/delivery/${deliveryId}/complete`, {
      delivery_otp: deliveryOtp,
    });
    return res.data.data;
  },

  // ── Delivery History ────────────────────────────────────────────────
  async getDeliveryHistory(
    filters: DeliveryHistoryFilters = {},
  ): Promise<DeliveryHistoryListResponse> {
    const params: Record<string, string | number> = {
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
    if (filters.status && filters.status.length > 0) {
      params.status = filters.status.join(",");
    }
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;

    const res = await api.get<{
      success: boolean;
      data: DeliveryHistoryListResponse;
    }>("/rider/delivery/history", { params });
    return res.data.data;
  },

  async getDeliveryHistoryDetail(
    deliveryId: string,
  ): Promise<DeliveryHistoryDetail> {
    const res = await api.get<{
      success: boolean;
      data: DeliveryHistoryDetail;
    }>(`/rider/delivery/history/${deliveryId}`);
    return res.data.data;
  },
};