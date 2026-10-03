// src/hooks/useEarnings.ts (do not remove this comment)

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { earningsApi } from "../features/earnings/api/earnings.api";
import type {
  EarningsOverview,
  WeeklyEarningsData,
  OrderEarningsResponse,
  PayoutHistoryResponse,
} from "../types/earnings";

export function useEarningsOverview() {
  return useQuery<EarningsOverview, Error>({
    queryKey: ["earnings", "overview"],
    queryFn: earningsApi.getOverview,
    staleTime: 60_000,
  });
}

export function useWeeklyEarnings(weekStart: string) {
  return useQuery<WeeklyEarningsData, Error>({
    queryKey: ["earnings", "weekly", weekStart],
    queryFn: () => earningsApi.getWeekly(weekStart),
    enabled: !!weekStart,
    staleTime: 30_000,
  });
}

export function useOrderEarnings(filters: {
  from?: string;
  to?: string;
  day?: string;
  page: number;
  limit: number;
}) {
  return useQuery<OrderEarningsResponse, Error>({
    queryKey: ["earnings", "orders", filters],
    queryFn: () => earningsApi.getOrders(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function usePayoutHistory(filters: { page: number; limit: number }) {
  return useQuery<PayoutHistoryResponse, Error>({
    queryKey: ["earnings", "payouts", filters],
    queryFn: () => earningsApi.getPayouts(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}