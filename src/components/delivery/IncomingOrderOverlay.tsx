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

const TIMEOUT_SECONDS = 45;
const THUMB_SIZE = 54;
const LOW_TIME_THRESHOLD = 10;

export const IncomingOrderOverlay: React.FC = () => {
  const { colors } = useTheme();
  const alert = useDeliveryStore((s) => s.incomingAlert);
  const clearAlert = useDeliveryStore((s) => s.clearAlert);
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);

  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [, setTrackWidth] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const maxSlideRef = useRef(0);

  // Pulse animation for bicycle icon
  useEffect(() => {
    if (!alert) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [alert, pulseAnim]);

  const handleAccept = async () => {
    if (!alert || isAccepting) return;
    setIsAccepting(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      const active = await deliveryApi.acceptDelivery(alert.delivery_id);
      setActiveDelivery(active);
    } catch {
      clearAlert();
    } finally {
      setIsAccepting(false);
      slideX.setValue(0);
    }
  };

  const handleDecline = async (reason = "Rider declined") => {
    if (!alert || isDeclining) return;
    setIsDeclining(true);

    try {
      await deliveryApi.declineDelivery(alert.delivery_id, reason);
    } catch {
    } finally {
      clearAlert();
      setIsDeclining(false);
      slideX.setValue(0);
    }
  };

  // ── Keep refs pointing to the LATEST handlers ──
  // Fixes the bug where PanResponder (created once via useRef) was
  // permanently holding onto the first render's stale `alert`/handlers,
  // so sliding to accept silently did nothing after the first mount.
  const handleAcceptRef = useRef(handleAccept);
  const handleDeclineRef = useRef(handleDecline);
  const isBusyRef = useRef(false);

  useEffect(() => {
    handleAcceptRef.current = handleAccept;
    handleDeclineRef.current = handleDecline;
    isBusyRef.current = isAccepting || isDeclining;
  });

  // 45s countdown timer
  useEffect(() => {
    if (!alert) return;

    setTimeLeft(TIMEOUT_SECONDS);
    slideX.setValue(0);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDeclineRef.current("TIMEOUT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alert]);

  // Pan Responder for Slide to Accept
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
          // Snap to end & trigger accept
          Animated.timing(slideX, {
            toValue: max,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            handleAcceptRef.current();
          });
        } else {
          // Snap back
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

  if (!alert) return null;

  const progressPercent = (timeLeft / TIMEOUT_SECONDS) * 100;
  const isUrgent = timeLeft <= LOW_TIME_THRESHOLD;
  const shopDisplayName = alert.shop_name || alert.pharmacy_name || "Pharmacy";
  const branchDisplayName = alert.branch_name;

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
          {/* Header Progress Bar */}
          <View
            style={[
              styles.progressBarBackground,
              { backgroundColor: colors.border.subtle },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: isUrgent
                    ? colors.status.error
                    : colors.brand.primary,
                },
              ]}
            />
          </View>

          {/* Top Bar: Tag & Timer */}
          <View style={styles.topRow}>
            <View style={[styles.tag, { backgroundColor: colors.brand.light }]}>
              <Ionicons name="flash" size={13} color={colors.brand.primary} />
              <Text style={[styles.tagText, { color: colors.brand.primary }]}>
                NEW ORDER ASSIGNED
              </Text>
            </View>

            <View
              style={[
                styles.timerBadge,
                {
                  backgroundColor: isUrgent
                    ? colors.status.errorBg
                    : colors.background.tint,
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={13}
                color={isUrgent ? colors.status.error : colors.text.secondary}
              />
              <Text
                style={[
                  styles.timerText,
                  {
                    color: isUrgent
                      ? colors.status.error
                      : colors.text.secondary,
                  },
                ]}
              >
                {timeLeft}s
              </Text>
            </View>
          </View>

          {/* Animated Icon Badge */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: colors.brand.light,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View
              style={[
                styles.iconWrapperInner,
                { backgroundColor: colors.brand.soft },
              ]}
            >
              <Ionicons name="bicycle" size={34} color={colors.brand.primary} />
            </View>
          </Animated.View>

          {/* Order Number */}
          <Text style={[styles.orderNumber, { color: colors.text.muted }]}>
            ORDER #{alert.order_number}
          </Text>

          {/* Pharmacy Brand & Branch Hierarchy */}
          <View style={styles.pharmacyContainer}>
            <Text
              style={[styles.shopName, { color: colors.text.primary }]}
              numberOfLines={2}
            >
              {shopDisplayName}
            </Text>

            {branchDisplayName ? (
              <View
                style={[
                  styles.branchBadge,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <Ionicons
                  name="storefront-outline"
                  size={12}
                  color={colors.brand.primary}
                />
                <Text
                  style={[styles.branchName, { color: colors.brand.primary }]}
                  numberOfLines={1}
                >
                  {branchDisplayName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Full Pharmacy Address */}
          {alert.pharmacy_address ? (
            <Text
              style={[styles.pharmacyAddress, { color: colors.text.muted }]}
              numberOfLines={2}
            >
              {alert.pharmacy_address}
            </Text>
          ) : null}

          {/* Distance Indicator Pill */}
          <View
            style={[
              styles.distancePill,
              { backgroundColor: colors.brand.light },
            ]}
          >
            <Ionicons name="navigate" size={14} color={colors.brand.primary} />
            <Text
              style={[styles.distanceText, { color: colors.brand.primary }]}
            >
              {alert.estimated_distance_km != null
                ? `${alert.estimated_distance_km} km to pickup`
                : "Nearby pickup point"}
            </Text>
          </View>

          {/* ── Slide-to-Accept Slider & Decline Bar ── */}
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

            <TouchableOpacity
              onPress={() => handleDecline("Rider declined")}
              disabled={isDeclining || isAccepting}
              style={styles.declineButton}
              activeOpacity={0.7}
            >
              {isDeclining ? (
                <ActivityIndicator size="small" color={colors.status.error} />
              ) : (
                <Text
                  style={[styles.declineText, { color: colors.status.error }]}
                >
                  Decline this order
                </Text>
              )}
            </TouchableOpacity>
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
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  progressBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  progressBarFill: {
    height: "100%",
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
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
  iconWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  iconWrapperInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  pharmacyContainer: {
    alignItems: "center",
    marginTop: 6,
    width: "100%",
    paddingHorizontal: 12,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  branchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  branchName: {
    fontSize: 12,
    fontWeight: "700",
  },
  pharmacyAddress: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 14,
    lineHeight: 16,
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 20,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "800",
  },
  actionContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
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
  declineButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  declineText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
