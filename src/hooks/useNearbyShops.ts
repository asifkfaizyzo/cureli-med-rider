import { useQuery } from "@tanstack/react-query";
import { homeApi } from "../features/home/api/home.api";
import { useRiderOperationalStore } from "../store/riderOperationalStore";

/**
 * React Query hook for fetching nearby shops.
 * Refetches when location changes significantly (>500m).
 */
export function useNearbyShops() {
  const currentLocation = useRiderOperationalStore(
    (state) => state.currentLocation,
  );
  const isOnline = useRiderOperationalStore((state) => state.isOnline);

  // Round to 3 decimal places (~111m precision) to avoid excessive refetches
  const lat = currentLocation
    ? Math.round(currentLocation.lat * 1000) / 1000
    : null;
  const lng = currentLocation
    ? Math.round(currentLocation.lng * 1000) / 1000
    : null;

  return useQuery({
    queryKey: ["nearby-shops", lat, lng],
    queryFn: () => homeApi.getNearbyShops(lat!, lng!, 10),
    enabled: isOnline && lat !== null && lng !== null,
    staleTime: 2 * 60_000, // 2 minutes
    retry: 2,
  });
}