// src/features/delivery/api/delivery.api.ts (do not remove this comment)

import { api } from "../../../services/api";
import type { ActiveDelivery } from "../../../types/delivery";

export const deliveryApi = {
  /**
   * Fetch current ongoing delivery task.
   */
  async getActiveDelivery(): Promise<ActiveDelivery | null> {
    const res = await api.get<{ success: boolean; data: ActiveDelivery | null }>(
      "/rider/delivery/active",
    );
    return res.data?.data || null;
  },

  /**
   * Accept an assigned delivery.
   */
  async acceptDelivery(deliveryId: string): Promise<ActiveDelivery> {
    const res = await api.post<{ success: boolean; data: ActiveDelivery }>(
      `/rider/delivery/${deliveryId}/accept`,
    );
    return res.data.data;
  },

  /**
   * Decline an assigned delivery.
   */
  async declineDelivery(
    deliveryId: string,
    reason: string,
    note?: string,
  ): Promise<void> {
    await api.post(`/rider/delivery/${deliveryId}/decline`, { reason, note });
  },

  /**
   * Update milestone (ARRIVED_AT_PHARMACY, PICKED_UP, EN_ROUTE, ARRIVED_AT_CUSTOMER).
   */
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

  /**
   * Complete delivery with customer OTP.
   */
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
};