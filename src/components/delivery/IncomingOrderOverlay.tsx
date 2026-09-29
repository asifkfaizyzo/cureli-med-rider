// src/components/delivery/IncomingOrderOverlay.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { deliveryApi } from "../../features/delivery/api/delivery.api";
import { useDeliveryStore } from "../../store/deliveryStore";
import { useTheme } from "../../theme/ThemeContext";
import { useDialog } from "../Dialog/DialogProvider";

const THUMB_SIZE = 54;

/**
 * Format elapsed seconds into "Xm Ys" display string.
 */
function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export const IncomingOrderOverlay: React.FC = () => {
  const { colors } = useTheme();
  const dialog = useDialog();
  const incomingAlert = useDeliveryStore((s) => s.incomingAlert);
  const clearAlert = useDeliveryStore((s) => s.clearAlert);
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);

  // ── Elapsed timer (informational only — no auto-action) ──────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [, setTrackWidth] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const maxSlideRef = useRef(0);

  // ── Energetic breathing pulse animation for the "NEW ORDER" banner ──
  useEffect(() => {
    if (!incomingAlert) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [incomingAlert, pulseAnim]);

  // ── Elapsed timer: counts UP from 0 (no auto-decline) ────────────────
  useEffect(() => {
    if (!incomingAlert) return;

    setElapsedSeconds(0);
    slideX.setValue(0);

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingAlert]);

  // ── Accept handler ────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!incomingAlert || isAccepting) return;
    setIsAccepting(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      const active = await deliveryApi.acceptDelivery(incomingAlert.delivery_id);
      setActiveDelivery(active);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Could not accept this order. Please try again.";
      await dialog.alert({
        title: "Accept Failed",
        message,
        destructive: true,
        icon: "error-outline",
      });
    } finally {
      setIsAccepting(false);
      slideX.setValue(0);
    }
  };

  // ── Decline handler ───────────────────────────────────────────────────
  const handleDecline = async (reason = "Rider declined") => {
    if (!incomingAlert || isDeclining) return;

    // Confirm before declining with DialogProvider
    const confirmed = await dialog.confirm({
      title: "Decline Order?",
      message: "Are you sure you want to decline this delivery?",
      confirmLabel: "Decline",
      cancelLabel: "Cancel",
      destructive: true,
      icon: "warning",
    });

    if (!confirmed) return;

    setIsDeclining(true);
    try {
      await deliveryApi.declineDelivery(incomingAlert.delivery_id, reason);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to decline. Please try again.";
      await dialog.alert({
        title: "Decline Failed",
        message,
        destructive: true,
        icon: "error-outline",
      });
    } finally {
      clearAlert();
      setIsDeclining(false);
      slideX.setValue(0);
    }
  };

  // ── Keep refs pointing to the LATEST handlers ─────────────────────────
  const handleAcceptRef = useRef(handleAccept);
  const handleDeclineRef = useRef(handleDecline);
  const isBusyRef = useRef(false);

  useEffect(() => {
    handleAcceptRef.current = handleAccept;
    handleDeclineRef.current = handleDecline;
    isBusyRef.current = isAccepting || isDeclining;
  });

  // ── Pan Responder for Slide to Accept ─────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isBusyRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !isBusyRef.current && Math.abs(gestureState.dx) > 2,
      onPanResponderMove: (_, gestureState) => {
        const max = maxSlideRef.current;
        if (max <= 0) return;
        const clampedX = Math.max(0, Math.min(gestureState.dx, max));
        slideX.setValue(clampedX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const max = maxSlideRef.current;
        if (max > 0 && gestureState.dx >= max * 0.72) {
          Animated.timing(slideX, {
            toValue: max,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            handleAcceptRef.current();
          });
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 12,
          }).start();
        }
      },
    }),
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTrackWidth(width);
    maxSlideRef.current = Math.max(0, width - THUMB_SIZE - 8);
  };

  if (!incomingAlert) return null;

  const shopDisplayName =
    incomingAlert.shop_name || incomingAlert.pharmacy_name || "Pharmacy";
  const branchDisplayName = incomingAlert.branch_name;

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View style={[styles.backdrop, { backgroundColor: colors.overlay.dark }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {/* Top Bar: Live Timer & Red Deny button */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.timerBadge,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={13}
                color={colors.text.secondary}
              />
              <Text
                style={[styles.timerText, { color: colors.text.secondary }]}
              >
                {formatElapsed(elapsedSeconds)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleDecline("Rider declined")}
              disabled={isDeclining || isAccepting}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.denyButton}
              activeOpacity={0.7}
            >
              {isDeclining ? (
                <ActivityIndicator size="small" color={colors.status.error} />
              ) : (
                <View style={styles.denyContent}>
                  <Text style={[styles.denyText, { color: colors.status.error }]}>Deny</Text>
                  <Ionicons name="close" size={16} color={colors.status.error} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* MAIN HERO ACTION HEADER (Pulsing dynamically) */}
          <Animated.View style={[styles.heroContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={[styles.heroTitle, { color: colors.brand.mid }]}>
              NEW ORDER
            </Text>
          </Animated.View>

          {/* Order ID detail */}
          <Text style={[styles.orderNumber, { color: colors.text.muted }]}>
            #{incomingAlert.order_number}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

          {/* Equal hierarchy: Shop + Distance side by side */}
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Ionicons name="storefront-outline" size={16} color={colors.text.muted} />
              <Text style={[styles.infoLabel, { color: colors.text.muted }]}>PICKUP</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]} numberOfLines={1}>
                {shopDisplayName}
              </Text>
              {branchDisplayName ? (
                <Text style={[styles.infoSub, { color: colors.text.secondary }]} numberOfLines={1}>
                  {branchDisplayName}
                </Text>
              ) : null}
            </View>

            <View style={[styles.infoDivider, { backgroundColor: colors.border.subtle }]} />

            <View style={styles.infoCol}>
              <Ionicons name="navigate-outline" size={16} color={colors.text.muted} />
              <Text style={[styles.infoLabel, { color: colors.text.muted }]}>DISTANCE</Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]} numberOfLines={1}>
                {incomingAlert.estimated_distance_km != null
                  ? `${incomingAlert.estimated_distance_km} km`
                  : "Nearby"}
              </Text>
              <Text style={[styles.infoSub, { color: colors.text.secondary }]} numberOfLines={1}>
                to pickup
              </Text>
            </View>
          </View>

          {/* Full Pharmacy Address */}
          {incomingAlert.pharmacy_address ? (
            <Text
              style={[styles.pharmacyAddress, { color: colors.text.muted }]}
              numberOfLines={2}
            >
              {incomingAlert.pharmacy_address}
            </Text>
          ) : null}

          {/* ── Slide-to-Accept Slider ── */}
          <View style={styles.actionContainer}>
            <View
              onLayout={onTrackLayout}
              style={[
                styles.slideTrack,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <Animated.Text
                style={[
                  styles.slideTrackText,
                  {
                    color: colors.brand.primary,
                    opacity: slideX.interpolate({
                      inputRange: [0, Math.max(1, maxSlideRef.current * 0.6)],
                      outputRange: [1, 0],
                      extrapolate: "clamp",
                    }),
                  },
                ]}
              >
                {isAccepting ? "Accepting..." : "Slide to Accept »»»"}
              </Animated.Text>

              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.slideThumb,
                  {
                    backgroundColor: colors.brand.primary,
                    borderColor: colors.brand.primaryThumbBorder,
                    transform: [{ translateX: slideX }],
                  },
                ]}
              >
                {isAccepting ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.brand.primaryText}
                  />
                ) : (
                  <Ionicons
                    name="arrow-forward"
                    size={22}
                    color={colors.brand.primaryText}
                  />
                )}
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  denyButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  denyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  denyText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  heroContainer: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },
  orderNumber: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "stretch",
    marginBottom: 8,
  },
  infoCol: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  infoDivider: {
    width: 1,
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 2,
  },
  infoSub: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  pharmacyAddress: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 14,
    lineHeight: 16,
  },
  actionContainer: {
    width: "100%",
    alignItems: "center",
  },
  slideTrack: {
    width: "100%",
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    padding: 4,
    justifyContent: "center",
    position: "relative",
  },
  slideTrackText: {
    position: "absolute",
    alignSelf: "center",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  slideThumb: {
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