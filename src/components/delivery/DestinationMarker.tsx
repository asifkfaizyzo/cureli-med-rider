// src/components/delivery/DestinationMarker.tsx (do not remove this comment)

import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import type { DeliveryLeg } from "../../utils/deliveryStatus";

interface DestinationMarkerProps {
  coordinate: { latitude: number; longitude: number };
  type: DeliveryLeg;
}

/**
 * Generic pin for the current leg's target (pharmacy or customer).
 *
 * NOTE on tracksViewChanges: starts `true` and flips to `false` shortly
 * after mount/type-change. On Android, tracksViewChanges={false} takes an
 * IMMEDIATE snapshot of this marker's children and freezes it as a
 * bitmap — if that happens before the Ionicons glyph has painted a
 * frame, the marker renders blank forever (this is the exact bug that
 * was happening here). RiderMarker.tsx avoids this entirely by
 * pre-rasterizing its icon off-screen via react-native-view-shot; this
 * component uses the lighter-weight "track briefly, then freeze"
 * workaround instead, since it's a single, infrequently-updated marker.
 */
export function DestinationMarker({ coordinate, type }: DestinationMarkerProps) {
  const { colors } = useTheme();
  const isPharmacy = type === "PHARMACY";
  const color = isPharmacy ? colors.brand.primary : colors.status.success;

  const [tracksChanges, setTracksChanges] = useState(true);

  useEffect(() => {
    setTracksChanges(true);
    const timer = setTimeout(() => setTracksChanges(false), 600);
    return () => clearTimeout(timer);
  }, [type]);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksChanges}
      zIndex={2}
    >
      <View style={styles.container}>
        <View style={[styles.pin, { backgroundColor: color }]}>
          <Ionicons name={isPharmacy ? "medkit" : "home"} size={16} color="#ffffff" />
        </View>
        <View style={[styles.pointer, { borderTopColor: color }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});