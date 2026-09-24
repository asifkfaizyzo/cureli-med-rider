//src\hooks\useAvailabilityToggle.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { homeApi } from "../features/home/api/home.api";
import { useRiderOperationalStore } from "../store/riderOperationalStore";
import { useAuthStore } from "../store/authStore";
import { getCurrentLocation } from "../services/locationService";

/**
 * React Query mutation hook for toggling availability.
 * Handles online/offline transitions with proper location data.
 */
export function useAvailabilityToggle() {
  const queryClient = useQueryClient();
  const { setOnline, setToggling, setActiveDelivery } =
    useRiderOperationalStore();
  const updateRider = useAuthStore((state) => state.updateRider);

  return useMutation({
    mutationFn: async (targetOnline: boolean) => {
      setToggling(true);

      if (targetOnline) {
        // Going online — get current location first
        const location = await getCurrentLocation();
        if (!location) {
          throw new Error("Unable to get current location. Please enable GPS.");
        }
        return homeApi.toggleAvailability(true, location.lat, location.lng);
      } else {
        // Going offline — no location needed
        return homeApi.toggleAvailability(false);
      }
    },

    onSuccess: (data) => {
      setOnline(data.is_online);
      if (data.active_delivery_id) {
        setActiveDelivery(data.active_delivery_id);
      }
      updateRider({ is_online: data.is_online });
      
      // Invalidate dashboard on status change
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },

    onError: (error: any) => {
      console.error("[AvailabilityToggle] Error:", error.response?.data || error.message);
    },

    onSettled: () => {
      setToggling(false);
    },
  });
}