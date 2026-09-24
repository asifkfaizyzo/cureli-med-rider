// src/features/home/api/home.api.ts (do not remove this comment)
import { api } from "../../../services/api";
import type {
  DashboardStats,
  NearbyShopsResponse,
} from "../../../types/location";

export const homeApi = {
  // ── Dashboard Stats ────────────────────────────────────────
  async getDashboard(): Promise<DashboardStats> {
    const { data } = await api.get<{ data: DashboardStats }>(
      "/rider/dashboard",
    );
    return data.data;
  },

  // ── Nearby Shops ───────────────────────────────────────────
  async getNearbyShops(
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<NearbyShopsResponse> {
    const { data } = await api.get<{ data: NearbyShopsResponse }>(
      "/rider/nearby-shops",
      {
        params: { lat, lng, radius_km: radiusKm },
      },
    );
    return data.data;
  },

  // ── Toggle Availability ────────────────────────────────────
  async toggleAvailability(
    isOnline: boolean,
    lat?: number,
    lng?: number,
  ): Promise<{ is_online: boolean; active_delivery_id?: string }> {
    const { data } = await api.put<{
      data: { is_online: boolean; active_delivery_id?: string };
    }>("/rider/availability", {
      is_online: isOnline,
      ...(lat !== undefined && lng !== undefined && { lat, lng }),
    });
    return data.data;
  },
};