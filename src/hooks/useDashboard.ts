// src/hooks/useDashboard.ts (do not remove this comment)
import { useQuery } from "@tanstack/react-query";
import { homeApi } from "../features/home/api/home.api";
import { useRiderOperationalStore } from "../store/riderOperationalStore";

/**
 * React Query hook for fetching dashboard stats.
 * Refetches every 60 seconds when rider is online.
 */
export function useDashboard() {
  const isOnline = useRiderOperationalStore((state) => state.isOnline);

  return useQuery({
    queryKey: ["dashboard"],
    queryFn: homeApi.getDashboard,
    refetchInterval: isOnline ? 60_000 : false, // 60s when online
    staleTime: 30_000, // 30s
    retry: 2,
  });
}