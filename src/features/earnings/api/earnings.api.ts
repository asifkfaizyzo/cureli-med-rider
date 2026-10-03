// src/features/earnings/api/earnings.api.ts (do not remove this comment)

import { api } from "../../../services/api";
import type {
  EarningsOverview,
  WeeklyEarningsData,
  OrderEarningsResponse,
  PayoutHistoryResponse,
} from "../../../types/earnings";

export const earningsApi = {
  async getOverview(): Promise<EarningsOverview> {
    const res = await api.get<{ success: boolean; data: EarningsOverview }>(
      "/rider/earnings/overview",
    );
    return res.data.data;
  },

  async getWeekly(weekStart: string): Promise<WeeklyEarningsData> {
    const res = await api.get<{ success: boolean; data: WeeklyEarningsData }>(
      "/rider/earnings/weekly",
      { params: { week_start: weekStart } },
    );
    return res.data.data;
  },

  async getOrders(params: {
    from?: string;
    to?: string;
    day?: string;
    page?: number;
    limit?: number;
  }): Promise<OrderEarningsResponse> {
    const res = await api.get<{ success: boolean; data: OrderEarningsResponse }>(
      "/rider/earnings/orders",
      { params },
    );
    return res.data.data;
  },

  async getPayouts(params: {
    page?: number;
    limit?: number;
  }): Promise<PayoutHistoryResponse> {
    const res = await api.get<{ success: boolean; data: PayoutHistoryResponse }>(
      "/rider/earnings/payouts",
      { params },
    );
    return res.data.data;
  },
};