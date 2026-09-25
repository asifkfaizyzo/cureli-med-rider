// src/components/delivery/GeofencedSlideToConfirm.tsx (do not remove this comment)

import React, { useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

const THUMB_SIZE = 54;

interface GeofencedSlideToConfirmProps {
  label: string;
  busyLabel?: string;
  disabled?: boolean;
  disabledHint?: string;
  onConfirm: () => Promise<void> | void;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Reusable slide-to-confirm control. Not yet consumed anywhere (Phase 2)
 * — this is the primitive Phase 3/4's PharmacyLegPanel/CustomerLegPanel
 * will use for "Reached Pharmacy/Customer" (gated by `disabled` from
 * useProximity) and "Picked Up/Delivered" (gated by OTP validity).
 *
 * IMPORTANT — bug fix baked in by design: IncomingOrderOverlay's original
 * slider created its PanResponder once via useRef, so its closures
 * permanently captured the FIRST render's props/state, silently breaking
 * accept-on-slide after mount. Here, `disabled`/`onConfirm`/busy state are
 * mirrored into refs on every render, and the PanResponder's handlers only
 * ever read from those refs — so it always sees current values.
 */
export function GeofencedSlideToConfirm({
  label,
  busyLabel = "Please wait...",
  disabled = false,
  disabledHint,
  onConfirm,
  color,
  icon = "arrow-forward",
}: GeofencedSlideToConfirmProps) {
  const { colors } = useTheme();
  const accent = color || colors.brand.primary;

  const [isBusy, setIsBusy] = useState(false);
  const slideX = useRef(new Animated.Value(0)).current;
  const maxSlideRef = useRef(0);

  const disabledRef = useRef(disabled);
  const isBusyRef = useRef(isBusy);
  const onConfirmRef = useRef(onConfirm);

  disabledRef.current = disabled;
  isBusyRef.current = isBusy;
  onConfirmRef.current = onConfirm;

  const runConfirm = async () => {
    if (isBusyRef.current) return;
    setIsBusy(true);
    try {
      await onConfirmRef.current();
    } catch (err) {
      // Swallow here — callers are responsible for surfacing user-facing
      // error messages (e.g. Alert) from within their own onConfirm.
      // We only need to guarantee the slider resets either way.
      console.warn("[GeofencedSlideToConfirm] onConfirm rejected:", err);
    } finally {
      setIsBusy(false);
      slideX.setValue(0);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && !isBusyRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !disabledRef.current && !isBusyRef.current && Math.abs(g.dx) > 2,
      onPanResponderMove: (_, g) => {
        const max = maxSlideRef.current;
        if (max <= 0) return;
        slideX.setValue(Math.max(0, Math.min(g.dx, max)));
      },
      onPanResponderRelease: (_, g) => {
        const max = maxSlideRef.current;
        if (max > 0 && g.dx >= max * 0.72) {
          Animated.timing(slideX, { toValue: max, duration: 150, useNativeDriver: true }).start(() => {
            runConfirm();
          });
        } else {
          Animated.spring(slideX, { toValue: 0, useNativeDriver: true, bounciness: 12 }).start();
        }
      },
    }),
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    maxSlideRef.current = Math.max(0, e.nativeEvent.layout.width - THUMB_SIZE - 8);
  };

  const showDisabledHint = disabled && !!disabledHint;

  return (
    <View
      onLayout={onTrackLayout}
      style={[
        styles.track,
        {
          backgroundColor: colors.background.tint,
          borderColor: colors.border.subtle,
          opacity: disabled ? 0.7 : 1,
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.trackText,
          {
            color: disabled ? colors.text.muted : accent,
            opacity: slideX.interpolate({
              inputRange: [0, Math.max(1, maxSlideRef.current * 0.6)],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
          },
        ]}
        numberOfLines={1}
      >
        {isBusy ? busyLabel : showDisabledHint ? disabledHint : label}
      </Animated.Text>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            backgroundColor: disabled ? colors.text.disabled : accent,
            borderColor: colors.brand.primaryThumbBorder,
            transform: [{ translateX: slideX }],
          },
        ]}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons name={disabled ? "lock-closed" : icon} size={20} color="#ffffff" />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    padding: 4,
    justifyContent: "center",
  },
  trackText: {
    position: "absolute",
    alignSelf: "center",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
    paddingHorizontal: 60,
    textAlign: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});