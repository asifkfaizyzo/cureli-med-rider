// src/components/home/ShopMarker.tsx (do not remove this comment)
import { RefObject, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

export const SHOP_PIN_SIZE = 34;
export const SHOP_PIN_SELECTED_SIZE = 40;

export type ShopMarkerVariant = "open" | "selected" | "closed";

/**
 * Off-screen bitmap source for Shop markers.
 * Rendered outside <MapView> as a sibling (just like RiderMarkerBitmapSource)
 * to avoid Android native addFeature crashes.
 */
export function ShopMarkerBitmapSource({
  viewRef,
  variant,
}: {
  viewRef: RefObject<View | null>;
  variant: ShopMarkerVariant;
}) {
  const { colors, isDark } = useTheme();

  const isSelected = variant === "selected";
  const isOpen = variant === "open" || isSelected;

  const size = isSelected ? SHOP_PIN_SELECTED_SIZE : SHOP_PIN_SIZE;
  const iconSize = isSelected ? 20 : 16;

  const pinColor = isSelected
    ? colors?.brand?.secondary || "#0C97B8"
    : isOpen
    ? colors?.brand?.primary || "#6A20CD"
    : isDark
    ? "#4B5563"
    : "#9CA3AF";

  return (
    <View
      ref={viewRef}
      collapsable={false}
      style={[
        styles.hiddenCapture,
        {
          width: size,
          height: size,
        },
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.pin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: pinColor,
            borderColor: colors?.background?.card || "#FFFFFF",
            borderWidth: isSelected ? 3.5 : 2.5,
          },
        ]}
      >
        <Ionicons name="medkit" size={iconSize} color="#FFFFFF" />
      </View>
    </View>
  );
}

interface ShopMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  shopName: string;
  isOpen: boolean;
  isSelected?: boolean;
  iconUri?: string | null;
  onPress?: () => void;
}

export function ShopMarker({
  coordinate,
  isOpen,
  isSelected = false,
  iconUri,
  onPress,
}: ShopMarkerProps) {
  const { colors, isDark } = useTheme();
  const [trackChanges, setTrackChanges] = useState(true);

  useEffect(() => {
    setTrackChanges(true);
    const t = setTimeout(() => setTrackChanges(false), 350);
    return () => clearTimeout(t);
  }, [isSelected, isOpen]);

  // If the pre-rendered bitmap URI is ready, use it directly (immune to clipping)
  if (iconUri) {
    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        image={{ uri: iconUri }}
        tracksViewChanges={false}
        onPress={onPress}
        zIndex={isSelected ? 10 : 3}
      />
    );
  }

  // Fallback direct view (without elevation to prevent hardware canvas clipping)
  const size = isSelected ? SHOP_PIN_SELECTED_SIZE : SHOP_PIN_SIZE;
  const iconSize = isSelected ? 20 : 16;

  const pinColor = isSelected
    ? colors?.brand?.secondary || "#0C97B8"
    : isOpen
    ? colors?.brand?.primary || "#6A20CD"
    : isDark
    ? "#4B5563"
    : "#9CA3AF";

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={trackChanges}
      onPress={onPress}
      zIndex={isSelected ? 10 : 3}
    >
      <View
        style={[
          styles.pin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: pinColor,
            borderColor: colors?.background?.card || "#FFFFFF",
            borderWidth: isSelected ? 3.5 : 2.5,
          },
        ]}
      >
        <Ionicons name="medkit" size={iconSize} color="#FFFFFF" />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  hiddenCapture: {
    position: "absolute",
    top: -9999,
    left: -9999,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    alignItems: "center",
    justifyContent: "center",
  },
});