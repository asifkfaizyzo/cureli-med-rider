// src/components/delivery/CustomerLegPanel.tsx (do not remove this comment)

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useDeliveryStore } from "../../store/deliveryStore";
import { deliveryApi } from "../../features/delivery/api/delivery.api";
import { useProximity } from "../../hooks/useProximity";
import { GeofencedSlideToConfirm } from "./GeofencedSlideToConfirm";
import { InlineOtpInput } from "./InlineOtpInput";
import type { ActiveDelivery } from "../../types/delivery";

const ARRIVAL_RADIUS_METERS = 30;

interface CustomerLegPanelProps {
  delivery: ActiveDelivery;
}

/**
 * Real customer-leg flow (Phase 4), mirroring PharmacyLegPanel's shape:
 *
 *  1. PICKED_UP / EN_ROUTE -> GPS-gated "Reached Customer" slider (30m
 *     radius, client-side only per current scope). EN_ROUTE is fired
 *     silently in the background by useAutoEnRoute — this panel treats
 *     both statuses identically, no UI distinction needed.
 *  2. ARRIVED_AT_CUSTOMER  -> inline 4-digit delivery OTP + "Complete
 *     Delivery" slider, gated on OTP being fully entered.
 *
 * On success of step 2, clearActiveDelivery() fires, which flips
 * isDeliveryLocked() to false in app/(app)/_layout.tsx — the rider is
 * returned to the (tabs) navigator automatically.
 */
export function CustomerLegPanel({ delivery }: CustomerLegPanelProps) {
  const { colors } = useTheme();
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);
  const clearActiveDelivery = useDeliveryStore((s) => s.clearActiveDelivery);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);

  const customer = delivery.customer;

  // useProximity must be called unconditionally (Rules of Hooks) — safe
  // even if customer is null, since useProximity accepts null/undefined
  // coordinates and simply reports isWithinRange: false.
  const { distanceMeters, isWithinRange } = useProximity(
    customer?.latitude,
    customer?.longitude,
    ARRIVAL_RADIUS_METERS,
  );

  // Defensive guard — the backend only populates `customer` once the
  // delivery is post-pickup, and this panel only ever renders in that
  // window (see getDeliveryLeg), but we don't want a crash if that
  // assumption is ever violated by a backend/schema change.
  if (!customer) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text.muted }}>
          Customer details are unavailable for this step.
        </Text>
      </View>
    );
  }

  const targetLat = customer.latitude;
  const targetLng = customer.longitude;
  const contactPhone = customer.phone;
  const hasTargetCoords = targetLat != null && targetLng != null;

  const isEnRouteLeg = delivery.status === "PICKED_UP" || delivery.status === "EN_ROUTE";
  const hasArrived = delivery.status === "ARRIVED_AT_CUSTOMER";

  const openNavigation = () => {
    if (hasTargetCoords) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`,
      );
    } else {
      Alert.alert("GPS Missing", "Location coordinates unavailable for this step.");
    }
  };

  const callContact = () => {
    if (contactPhone) Linking.openURL(`tel:${contactPhone}`);
  };

  const handleConfirmArrival = async () => {
    try {
      const updated = await deliveryApi.updateStatus(delivery.delivery_id, "ARRIVED_AT_CUSTOMER");
      setActiveDelivery(updated);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleCompleteDelivery = async () => {
    if (otp.length !== 4) return;
    try {
      await deliveryApi.completeDelivery(delivery.delivery_id, otp);
      setOtp("");
      setOtpError(false);
      clearActiveDelivery();
      Alert.alert("Order Delivered!", "Delivery completed successfully. Great job!");
    } catch (err: any) {
      setOtpError(true);
      setOtp("");
      Alert.alert(
        "Invalid PIN",
        err?.response?.data?.message ||
          "The delivery PIN you entered is incorrect. Please check with the customer and try again.",
      );
    }
  };

  const distanceLabel =
    distanceMeters != null
      ? distanceMeters < 1000
        ? `${Math.round(distanceMeters)}m away`
        : `${(distanceMeters / 1000).toFixed(1)}km away`
      : null;

  const arrivalDisabledHint = !hasTargetCoords
    ? "Customer location unavailable"
    : distanceMeters == null
    ? "Waiting for GPS signal..."
    : `Get closer — ${distanceLabel}`;

  const addressLine = [customer.address_line_1, customer.address_line_2, customer.landmark, customer.city]
    .filter(Boolean)
    .join(", ");

  const isCod = delivery.payment_method === "COD";

  return (
    <View style={styles.container}>
      {/* Customer Info */}
      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
            {customer.name || "Customer"}
          </Text>

          {distanceLabel && !hasArrived && (
            <View style={[styles.distancePill, { backgroundColor: colors.brand.light }]}>
              <Ionicons name="navigate" size={11} color={colors.brand.primary} />
              <Text style={[styles.distanceText, { color: colors.brand.primary }]}>
                {distanceLabel}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.address, { color: colors.text.muted }]} numberOfLines={2}>
          {addressLine || "Address unavailable"}
        </Text>

        {/* Order summary — payment method surfaced prominently since COD
            requires the rider to actually collect cash on handover. */}
        <View style={[styles.summaryPill, { backgroundColor: colors.background.tint }]}>
          <Ionicons name="receipt-outline" size={13} color={colors.text.secondary} />
          <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
            {delivery.item_count} item{delivery.item_count === 1 ? "" : "s"} · ₹
            {delivery.total_amount.toFixed(0)}
          </Text>
          <View
            style={[
              styles.paymentBadge,
              { backgroundColor: isCod ? colors.status.warningBg : colors.status.successBg },
            ]}
          >
            <Text
              style={[
                styles.paymentBadgeText,
                { color: isCod ? colors.status.warning : colors.status.success },
              ]}
            >
              {isCod ? "COLLECT CASH" : delivery.payment_method}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickButtons}>
        <TouchableOpacity
          onPress={openNavigation}
          style={[styles.quickBtn, { backgroundColor: colors.background.tint }]}
        >
          <Ionicons name="navigate" size={16} color={colors.brand.primary} />
          <Text style={[styles.quickBtnText, { color: colors.brand.primary }]}>Navigate</Text>
        </TouchableOpacity>

        {contactPhone && (
          <TouchableOpacity
            onPress={callContact}
            style={[styles.quickBtn, { backgroundColor: colors.background.tint }]}
          >
            <Ionicons name="call" size={16} color={colors.brand.primary} />
            <Text style={[styles.quickBtnText, { color: colors.brand.primary }]}>Call</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Area */}
      <View style={styles.actionArea}>
        {isEnRouteLeg && (
          <GeofencedSlideToConfirm
            label="Reached Customer location"
            busyLabel="Confirming arrival..."
            disabled={!isWithinRange}
            disabledHint={arrivalDisabledHint}
            onConfirm={handleConfirmArrival}
            icon="checkmark"
          />
        )}

        {hasArrived && (
          <View style={styles.pickupSection}>
            <Text style={[styles.otpLabel, { color: colors.text.secondary }]}>
              Enter the 4-digit Delivery PIN from the customer
            </Text>

            <InlineOtpInput
              value={otp}
              onChange={(v) => {
                setOtp(v);
                setOtpError(false);
              }}
              error={otpError}
            />

            <View style={{ height: 14 }} />

            <GeofencedSlideToConfirm
              label="Slide to complete delivery"
              busyLabel="Verifying PIN..."
              disabled={otp.length !== 4}
              disabledHint="Enter the 4-digit PIN above"
              onConfirm={handleCompleteDelivery}
              color={colors.status.success}
              icon="checkmark-done"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between" },
  infoSection: { marginTop: 4 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { flex: 1, fontSize: 16, fontWeight: "800" },
  address: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: { fontSize: 11, fontWeight: "800" },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  summaryText: { fontSize: 12, fontWeight: "700" },
  paymentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  paymentBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  quickButtons: { flexDirection: "row", gap: 8, marginVertical: 12 },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  quickBtnText: { fontSize: 12, fontWeight: "700" },
  actionArea: { marginTop: 4 },
  pickupSection: { width: "100%" },
  otpLabel: { fontSize: 12, fontWeight: "700", textAlign: "center", marginBottom: 12 },
});