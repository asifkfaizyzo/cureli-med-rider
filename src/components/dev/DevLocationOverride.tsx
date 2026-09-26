// src/components/dev/DevLocationOverride.tsx (do not remove this comment)

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDeliveryStore } from "../../store/deliveryStore";
import { useRiderOperationalStore } from "../../store/riderOperationalStore";
import { offsetCoordinate } from "../../utils/geo";

// Real GPS updates every 10s (see LOCATION_INTERVAL_MS in
// locationService.ts) while online. We re-apply the pinned fake
// coordinate faster than that cadence so it "wins" over real GPS
// without needing to touch the background location task at all.
const OVERRIDE_REAPPLY_MS = 3000;

/**
 * DEV-ONLY floating panel (same convention as GlobalThemeToggle in
 * app/_layout.tsx) for testing GeofencedSlideToConfirm/useProximity
 * without physically traveling. Reads the REAL active delivery's
 * pharmacy/customer coordinates, so buttons always target wherever
 * you're actually testing against.
 *
 * Does NOT replace needing an actual assigned delivery in the system —
 * you still need one accepted (via a real/seeded backend order) before
 * pharmacy/customer coordinates exist to jump to.
 */
export function DevLocationOverride() {
  if (!__DEV__) return null;

  const activeDelivery = useDeliveryStore((s) => s.activeDelivery);
  const updateLocation = useRiderOperationalStore((s) => s.updateLocation);

  const [pinnedLabel, setPinnedLabel] = useState<string | null>(null);
  const pinnedRef = useRef<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const pin = (lat: number, lng: number, label: string) => {
    pinnedRef.current = { lat, lng };
    setPinnedLabel(label);
    updateLocation({ lat, lng, accuracy: 5, timestamp: Date.now() });

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (pinnedRef.current) {
        updateLocation({
          lat: pinnedRef.current.lat,
          lng: pinnedRef.current.lng,
          accuracy: 5,
          timestamp: Date.now(),
        });
      }
    }, OVERRIDE_REAPPLY_MS);
  };

  const resume = () => {
    pinnedRef.current = null;
    setPinnedLabel(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pLat = activeDelivery?.pharmacy.latitude;
  const pLng = activeDelivery?.pharmacy.longitude;
  const cLat = activeDelivery?.customer?.latitude;
  const cLng = activeDelivery?.customer?.longitude;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.panel}>
        <Text style={styles.title}>
          DEV GPS {pinnedLabel ? `📍 ${pinnedLabel}` : "(live)"}
        </Text>

        <View style={styles.row}>
          <TouchableOpacity
            disabled={pLat == null}
            style={[styles.btn, pLat == null && styles.btnDisabled]}
            onPress={() => pin(pLat!, pLng!, "At Pharmacy")}
          >
            <Text style={styles.btnText}>At Pharmacy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={pLat == null}
            style={[styles.btn, pLat == null && styles.btnDisabled]}
            onPress={() => {
              const p = offsetCoordinate(pLat!, pLng!, 45, 90);
              pin(p.latitude, p.longitude, "45m from Pharmacy");
            }}
          >
            <Text style={styles.btnText}>45m Away</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            disabled={cLat == null}
            style={[styles.btn, cLat == null && styles.btnDisabled]}
            onPress={() => pin(cLat!, cLng!, "At Customer")}
          >
            <Text style={styles.btnText}>At Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={cLat == null}
            style={[styles.btn, cLat == null && styles.btnDisabled]}
            onPress={() => {
              const p = offsetCoordinate(cLat!, cLng!, 45, 90);
              pin(p.latitude, p.longitude, "45m from Customer");
            }}
          >
            <Text style={styles.btnText}>45m Away</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.resumeBtn]}
          onPress={resume}
        >
          <Text style={styles.btnText}>▶ Resume Real GPS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 200,
    left: 12,
    right: 12,
    zIndex: 999999,
  },
  panel: {
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  title: { color: "#fff", fontSize: 11, fontWeight: "800", marginBottom: 2 },
  row: { flexDirection: "row", gap: 6 },
  btn: {
    flex: 1,
    backgroundColor: "#6A20CD",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#555" },
  resumeBtn: { backgroundColor: "#444" },
  btnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
