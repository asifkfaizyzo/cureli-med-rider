// src/components/dev/DevLocationOverride.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useDeliveryStore } from "../../store/deliveryStore";
import { useRiderOperationalStore } from "../../store/riderOperationalStore";
import { offsetCoordinate } from "../../utils/geo";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Real GPS updates every 10s (see LOCATION_INTERVAL_MS in
// locationService.ts) while online. We re-apply the pinned fake
// coordinate faster than that cadence so it "wins" over real GPS
// without needing to touch the background location task at all.
const OVERRIDE_REAPPLY_MS = 3000;

/**
 * DEV-ONLY floating panel for testing GeofencedSlideToConfirm/useProximity
 * without physically traveling. Collapsible into a tiny badge so it doesn't
 * obscure the screen during normal testing.
 */
export function DevLocationOverride() {
  if (!__DEV__) return null;

  const activeDelivery = useDeliveryStore((s) => s.activeDelivery);
  const updateLocation = useRiderOperationalStore((s) => s.updateLocation);

  const [isExpanded, setIsExpanded] = useState(false);
  const [pinnedLabel, setPinnedLabel] = useState<string | null>(null);
  const pinnedRef = useRef<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

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

  // ── 1. Collapsed State (Tiny Floating Pill) ─────────────────────────
  if (!isExpanded) {
    return (
      <View style={styles.collapsedWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.collapsedBadge,
            pinnedLabel ? styles.pinnedBadge : null,
          ]}
          onPress={toggleExpand}
          activeOpacity={0.8}
        >
          <Ionicons
            name={pinnedLabel ? "pin" : "navigate"}
            size={14}
            color={pinnedLabel ? "#FBBF24" : "#10B981"}
          />
          <Text style={styles.collapsedText} numberOfLines={1}>
            {pinnedLabel ? pinnedLabel : "GPS: Live"}
          </Text>
          <Ionicons name="chevron-down" size={13} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── 2. Expanded State (Full Control Panel) ───────────────────────────
  return (
    <View style={styles.expandedWrapper} pointerEvents="box-none">
      <View style={styles.panel}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={toggleExpand}
            activeOpacity={0.7}
          >
            <Ionicons
              name={pinnedLabel ? "pin" : "navigate"}
              size={15}
              color={pinnedLabel ? "#FBBF24" : "#10B981"}
            />
            <Text style={styles.title}>
              DEV GPS {pinnedLabel ? `📍 ${pinnedLabel}` : "(Live)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleExpand}
            style={styles.minimizeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Pharmacy Controls */}
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

        {/* Customer Controls */}
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

        {/* Resume Real GPS */}
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
  collapsedWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 230,
    left: 16,
    zIndex: 999999,
  },
  collapsedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 24, 27, 0.92)",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#3F3F46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  pinnedBadge: {
    borderColor: "#FBBF24",
    backgroundColor: "rgba(30, 25, 15, 0.95)",
  },
  collapsedText: {
    color: "#F3F4F6",
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 130,
  },

  expandedWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? 106 : 240,
    left: 12,
    right: 12,
    zIndex: 999999,
  },
  panel: {
    backgroundColor: "rgba(18, 18, 20, 0.95)",
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#3F3F46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  minimizeBtn: {
    padding: 4,
    backgroundColor: "#27272A",
    borderRadius: 6,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: "#6A20CD",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    backgroundColor: "#333338",
    opacity: 0.6,
  },
  resumeBtn: {
    backgroundColor: "#27272A",
    marginTop: 2,
  },
  btnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});