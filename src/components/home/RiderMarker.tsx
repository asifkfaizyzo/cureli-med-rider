// src/components/home/RiderMarker.tsx (do not remove this comment)
import { useEffect, useRef, useState, RefObject } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Marker, Circle } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

const DOT_SIZE = 34;
const RING_BORDER = 6;
export const RIDER_ICON_SIZE = DOT_SIZE + RING_BORDER;

const PULSE_DURATION = 1600;
const PULSE_STAGGER = 800;
const PULSE_MIN_RADIUS = 12; // meters
const PULSE_MAX_RADIUS = 45; // meters

function usePulseProgress(delayMs: number) {
  const anim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const listenerId = anim.addListener(({ value }) => setProgress(value));

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: PULSE_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );

    const startTimer = setTimeout(() => loop.start(), delayMs);

    return () => {
      clearTimeout(startTimer);
      loop.stop();
      anim.removeListener(listenerId);
    };
  }, [anim, delayMs]);

  return progress;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Hidden bitmap "source" — the actual visual design of the rider icon.
 *
 * IMPORTANT: this must be rendered as a sibling OUTSIDE <MapView>, never
 * as a child of it. react-native-maps' MapView on Android only knows how
 * to mount recognized "feature" children (Marker/Circle/Polyline/etc.) via
 * its native addFeature() method. A plain View passed as a MapView child
 * is not a valid feature type and crashes native mounting with:
 *   "IllegalStateException: The specified child already has a parent"
 * (that's the exact crash you hit). Keeping this view outside the map
 * avoids that entirely — it's just a normal, invisible, off-screen view
 * used only as a template for react-native-view-shot to capture.
 */
export function RiderMarkerBitmapSource({
  viewRef,
}: {
  viewRef: RefObject<View | null>;
}) {
  const { colors } = useTheme();

  return (
    <View
      ref={viewRef}
      collapsable={false}
      style={styles.hiddenCapture}
      pointerEvents="none"
    >
      <View
        style={[
          styles.ring,
          {
            borderColor: colors.background.card,
            backgroundColor: colors.brand.primary,
          },
        ]}
      >
        <Ionicons name="bicycle" size={16} color="#ffffff" />
      </View>
    </View>
  );
}

interface RiderMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  iconUri: string | null;
}

/**
 * The actual map content — only ever renders valid MapView feature types
 * (Circle, Marker). Safe to use directly as a child of <MapView>.
 */
export function RiderMarker({ coordinate, iconUri }: RiderMarkerProps) {
  const { colors } = useTheme();

  const progressA = usePulseProgress(0);
  const progressB = usePulseProgress(PULSE_STAGGER);

  const radiusA = PULSE_MIN_RADIUS + (PULSE_MAX_RADIUS - PULSE_MIN_RADIUS) * progressA;
  const radiusB = PULSE_MIN_RADIUS + (PULSE_MAX_RADIUS - PULSE_MIN_RADIUS) * progressB;
  const opacityA = Math.max(0, 0.35 * (1 - progressA));
  const opacityB = Math.max(0, 0.35 * (1 - progressB));

  return (
    <>
      <Circle
        center={coordinate}
        radius={radiusA}
        fillColor={hexToRgba(colors.brand.primary, opacityA)}
        strokeWidth={0}
        zIndex={1}
      />
      <Circle
        center={coordinate}
        radius={radiusB}
        fillColor={hexToRgba(colors.brand.primary, opacityB)}
        strokeWidth={0}
        zIndex={1}
      />

      {iconUri && (
        <Marker
          coordinate={coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          image={{ uri: iconUri }}
          tracksViewChanges={false}
          zIndex={2}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hiddenCapture: {
    position: "absolute",
    top: -9999,
    left: -9999,
    width: RIDER_ICON_SIZE,
    height: RIDER_ICON_SIZE,
  },
  ring: {
    width: RIDER_ICON_SIZE,
    height: RIDER_ICON_SIZE,
    borderRadius: RIDER_ICON_SIZE / 2,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});