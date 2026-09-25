// src/hooks/useProximity.ts (do not remove this comment)

import { useEffect, useMemo, useState } from "react";
import { useRiderOperationalStore } from "../store/riderOperationalStore";
import { getDistanceMeters } from "../utils/geo";

interface ProximityResult {
  distanceMeters: number | null;
  isWithinRange: boolean;
}

/**
 * Tracks the rider's live distance from a target coordinate and whether
 * they're within a given radius. Not yet consumed anywhere (Phase 2) —
 * this is the primitive Phase 3/4's GPS-gated arrival sliders will use.
 *
 * Uses hysteresis to avoid flicker right at the threshold boundary: once
 * "within range" becomes true, it only flips back to false after the
 * rider moves `thresholdMeters + hysteresisMeters` away, not the instant
 * they cross back over the exact threshold.
 */
export function useProximity(
  targetLat: number | null | undefined,
  targetLng: number | null | undefined,
  thresholdMeters: number,
  hysteresisMeters: number = 10,
): ProximityResult {
  const currentLocation = useRiderOperationalStore((s) => s.currentLocation);
  const [isWithinRange, setIsWithinRange] = useState(false);

  const distanceMeters = useMemo(() => {
    if (!currentLocation || targetLat == null || targetLng == null) return null;
    return getDistanceMeters(currentLocation.lat, currentLocation.lng, targetLat, targetLng);
  }, [currentLocation, targetLat, targetLng]);

  useEffect(() => {
    if (distanceMeters == null) return;

    setIsWithinRange((prevWithinRange) => {
      if (prevWithinRange) {
        return distanceMeters <= thresholdMeters + hysteresisMeters;
      }
      return distanceMeters <= thresholdMeters;
    });
  }, [distanceMeters, thresholdMeters, hysteresisMeters]);

  return { distanceMeters, isWithinRange };
}