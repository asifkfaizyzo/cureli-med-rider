// src/hooks/useAvailabilityToggle.ts (do not remove this comment)
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import { homeApi } from "../features/home/api/home.api";
import { useRiderOperationalStore } from "../store/riderOperationalStore";
import { useAuthStore } from "../store/authStore";
import { getCurrentLocation } from "../services/locationService";
import { useDialog } from "../components/Dialog/DialogProvider";
import { checkDrawOverPermission, requestDrawOverPermission } from "../services/notificationHandler";

/**
 * React Query mutation hook for toggling availability.
 * Handles online/offline transitions with direct settings navigation.
 */
export function useAvailabilityToggle() {
  const queryClient = useQueryClient();
  const dialog = useDialog();
  const { setOnline, setToggling, setActiveDelivery } =
    useRiderOperationalStore();
  const updateRider = useAuthStore((state) => state.updateRider);

  return useMutation({
    mutationFn: async (targetOnline: boolean) => {
      setToggling(true);

      if (targetOnline) {
        // ── Draw Over Apps Safety Gate ───────────────────────────────────────
        if (Platform.OS === "android") {
          const hasOverlayPermission = await checkDrawOverPermission();
          if (!hasOverlayPermission) {
            const confirmed = await dialog.confirm({
              title: "Permission Required",
              message:
                "To receive incoming order alerts while using Google Maps or when your phone is locked, please allow Cureli to 'Display over other apps'.",
              confirmLabel: "Open Settings",
              cancelLabel: "Not Now",
              icon: "warning",
            });

            if (confirmed) {
              await requestDrawOverPermission();
            }

            throw new Error("Permission system_alert_window missing");
          }
        }

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
      if (error?.message === "Permission system_alert_window missing") {
        setToggling(false);
        return;
      }

      console.error("[AvailabilityToggle] Error:", error?.response?.data || error?.message);

      const code = error?.response?.data?.code || error?.code;
      const message = error?.response?.data?.message || error?.message;

      if (code === "ACTIVE_DELIVERY") {
        dialog.alert({
          title: "Status Locked",
          message: message || "You cannot go offline while you have an active delivery.",
          icon: "lock-outline",
        });
      } else {
        dialog.alert({
          title: "Connection Error",
          message: message || "Could not reach server. Please check your network and try again.",
          icon: "cloud-off",
          destructive: true,
        });
      }
    },

    onSettled: () => {
      setToggling(false);
    },
  });
}