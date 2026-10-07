// src/components/delivery/DeliverySuccessModal.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import type { ActiveDelivery } from "../../types/delivery";

interface DeliverySuccessModalProps {
  visible: boolean;
  delivery: ActiveDelivery | null;
  onDone: () => void;
}

export const DeliverySuccessModal: React.FC<DeliverySuccessModalProps> = ({
  visible,
  delivery,
  onDone,
}) => {
  const { colors, isDark } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Celebratory Haptic Feedback
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible || !delivery) return null;

  const earnings = delivery.earnings;
  const isIndependent = delivery.rider_type === "INDEPENDENT" || earnings != null;
  const totalEarned = earnings?.total_earning ?? 0;
  const basePay = earnings?.base_earning ?? 0;
  const surge = earnings?.surge_fee ?? 0;
  const tip = earnings?.tip_amount ?? 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay.dark }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.subtle,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Success Badge */}
          <View style={styles.successIconWrapper}>
            <View style={[styles.successIconOuter, { backgroundColor: "#10B98120" }]}>
              <View style={[styles.successIconInner, { backgroundColor: "#10B981" }]}>
                <Ionicons name="checkmark" size={32} color="#ffffff" />
              </View>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Delivered Successfully!
          </Text>
          <Text style={[styles.orderNumber, { color: colors.text.muted }]}>
            Order #{delivery.order_number}
          </Text>

          {/* ── HERO EARNINGS CARD (for Independent Riders) ──────────────── */}
          {isIndependent && (
            <View
              style={[
                styles.earningHeroCard,
                {
                  backgroundColor: isDark ? "#064E3B25" : "#ECFDF5",
                  borderColor: isDark ? "#05966940" : "#A7F3D0",
                },
              ]}
            >
              <Text style={[styles.earningHeroLabel, { color: "#059669" }]}>
                TOTAL EARNED
              </Text>
              <Text style={[styles.earningHeroAmount, { color: "#059669" }]}>
                ₹{totalEarned.toFixed(2)}
              </Text>

              {/* Breakdown Rows */}
              <View style={styles.breakdownContainer}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.text.secondary }]}>
                    Base Delivery Pay
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.text.primary }]}>
                    ₹{basePay.toFixed(2)}
                  </Text>
                </View>

                {surge > 0 && (
                  <View style={styles.breakdownRow}>
                    <View style={styles.chipRow}>
                      <Ionicons name="flash" size={13} color={colors.brand.primary} />
                      <Text style={[styles.breakdownLabel, { color: colors.brand.primary }]}>
                        Surge Bonus
                      </Text>
                    </View>
                    <Text style={[styles.breakdownValue, { color: colors.brand.primary }]}>
                      +₹{surge.toFixed(2)}
                    </Text>
                  </View>
                )}

                {tip > 0 && (
                  <View style={styles.breakdownRow}>
                    <View style={styles.chipRow}>
                      <Ionicons name="heart" size={13} color="#10B981" />
                      <Text style={[styles.breakdownLabel, { color: "#10B981" }]}>
                        Customer Tip
                      </Text>
                    </View>
                    <Text style={[styles.breakdownValue, { color: "#10B981" }]}>
                      +₹{tip.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Route & Customer Snapshot Info */}
          <View
            style={[
              styles.infoPillRow,
              { backgroundColor: colors.background.tint, borderColor: colors.border.subtle },
            ]}
          >
            <View style={styles.infoCol}>
              <Ionicons name="storefront-outline" size={14} color={colors.text.muted} />
              <Text style={[styles.infoColText, { color: colors.text.secondary }]} numberOfLines={1}>
                {delivery.pharmacy.shop_name || "Pharmacy"}
              </Text>
            </View>

            <View style={[styles.infoColDivider, { backgroundColor: colors.border.subtle }]} />

            <View style={styles.infoCol}>
              <Ionicons name="person-outline" size={14} color={colors.text.muted} />
              <Text style={[styles.infoColText, { color: colors.text.secondary }]} numberOfLines={1}>
                {delivery.customer?.name || "Customer"}
              </Text>
            </View>

            <View style={[styles.infoColDivider, { backgroundColor: colors.border.subtle }]} />

            <View style={styles.infoCol}>
              <Ionicons name="cube-outline" size={14} color={colors.text.muted} />
              <Text style={[styles.infoColText, { color: colors.text.secondary }]}>
                {delivery.item_count} items
              </Text>
            </View>
          </View>

          {/* Finish & Continue Button */}
          <TouchableOpacity
            onPress={onDone}
            activeOpacity={0.85}
            style={[styles.doneButton, { backgroundColor: colors.brand.primary }]}
          >
            <Text style={[styles.doneButtonText, { color: colors.brand.primaryText }]}>
              Ready for Next Order
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.brand.primaryText} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
  },
  successIconWrapper: {
    marginBottom: 12,
  },
  successIconOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  successIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 16,
  },
  earningHeroCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  earningHeroLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  earningHeroAmount: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
    marginVertical: 4,
  },
  breakdownContainer: {
    width: "100%",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    gap: 6,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  infoPillRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  infoCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  infoColDivider: {
    width: 1,
    height: 14,
  },
  infoColText: {
    fontSize: 11,
    fontWeight: "700",
  },
  doneButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});