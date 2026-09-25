// src/components/delivery/PharmacyLegPanel.tsx (do not remove this comment)

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

interface PharmacyLegPanelProps {
  delivery: ActiveDelivery;
}

/**
 * Real pharmacy-leg flow (Phase 3), replacing the placeholder for the
 * ACCEPTED / ARRIVED_AT_PHARMACY portion of ActiveDeliveryView.
 *
 * Flow:
 *  1. ACCEPTED        -> GPS-gated "Reached Pharmacy" slider (30m radius,
 *                         client-side only per current scope).
 *  2. ARRIVED_AT_PHARMACY + order not READY_FOR_PICKUP
 *                      -> waiting pill (unchanged from before).
 *  3. ARRIVED_AT_PHARMACY + READY_FOR_PICKUP
 *                      -> inline 4-digit OTP + "Confirm Pickup" slider,
 *                         gated on OTP being fully entered (not GPS —
 *                         rider is already confirmed at the pharmacy).
 *
 * On success of step 3, the parent's `delivery` prop updates to PICKED_UP
 * via setActiveDelivery(), which flips getDeliveryLeg() to CUSTOMER and
 * ActiveDeliveryScreen swaps this panel out automatically.
 */
export function PharmacyLegPanel({ delivery }: PharmacyLegPanelProps) {
  const { colors } = useTheme();
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);

  const targetLat = delivery.pharmacy.latitude;
  const targetLng = delivery.pharmacy.longitude;
  const contactPhone = delivery.pharmacy.contact_number;
  const hasTargetCoords = targetLat != null && targetLng != null;

  const { distanceMeters, isWithinRange } = useProximity(
    targetLat,
    targetLng,
    ARRIVAL_RADIUS_METERS,
  );

  const isShopReady = delivery.order_status === "READY_FOR_PICKUP";
  const isAwaitingArrival = delivery.status === "ACCEPTED";
  const isAtPharmacy = delivery.status === "ARRIVED_AT_PHARMACY";

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
      const updated = await deliveryApi.updateStatus(
        delivery.delivery_id,
        "ARRIVED_AT_PHARMACY",
      );
      setActiveDelivery(updated);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleConfirmPickup = async () => {
    if (otp.length !== 4) return;
    try {
      const updated = await deliveryApi.updateStatus(delivery.delivery_id, "PICKED_UP", otp);
      setActiveDelivery(updated);
      setOtp("");
      setOtpError(false);
    } catch (err: any) {
      setOtpError(true);
      setOtp("");
      Alert.alert(
        "Invalid PIN",
        err?.response?.data?.message ||
          "The pickup PIN you entered is incorrect. Please check with the pharmacy and try again.",
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
    ? "Pharmacy location unavailable"
    : distanceMeters == null
    ? "Waiting for GPS signal..."
    : `Get closer — ${distanceLabel}`;

  return (
    <View style={styles.container}>
      {/* Pharmacy Info */}
      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {delivery.pharmacy.shop_name || delivery.pharmacy.branch_name || "Pharmacy"}
          </Text>

          {distanceLabel && !isAtPharmacy && (
            <View style={[styles.distancePill, { backgroundColor: colors.brand.light }]}>
              <Ionicons name="navigate" size={11} color={colors.brand.primary} />
              <Text style={[styles.distanceText, { color: colors.brand.primary }]}>
                {distanceLabel}
              </Text>
            </View>
          )}
        </View>

        {delivery.pharmacy.branch_name && delivery.pharmacy.shop_name ? (
          <Text
            style={[styles.branchName, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {delivery.pharmacy.branch_name}
          </Text>
        ) : null}

        <Text
          style={[styles.address, { color: colors.text.muted }]}
          numberOfLines={2}
        >
          {delivery.pharmacy.address || "Address unavailable"}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickButtons}>
        <TouchableOpacity
          onPress={openNavigation}
          style={[styles.quickBtn, { backgroundColor: colors.background.tint }]}
        >
          <Ionicons name="navigate" size={16} color={colors.brand.primary} />
          <Text style={[styles.quickBtnText, { color: colors.brand.primary }]}>
            Navigate
          </Text>
        </TouchableOpacity>

        {contactPhone && (
          <TouchableOpacity
            onPress={callContact}
            style={[styles.quickBtn, { backgroundColor: colors.background.tint }]}
          >
            <Ionicons name="call" size={16} color={colors.brand.primary} />
            <Text style={[styles.quickBtnText, { color: colors.brand.primary }]}>
              Call
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Area */}
      <View style={styles.actionArea}>
        {isAwaitingArrival && (
          <GeofencedSlideToConfirm
            label="Reached Pharmacy Location"
            busyLabel="Confirming arrival..."
            disabled={!isWithinRange}
            disabledHint={arrivalDisabledHint}
            onConfirm={handleConfirmArrival}
            icon="checkmark"
          />
        )}

        {isAtPharmacy && !isShopReady && (
          <View style={[styles.waitingPill, { backgroundColor: colors.status.warningBg }]}>
            <Ionicons name="time" size={16} color={colors.status.warning} />
            <Text style={[styles.waitingText, { color: colors.status.warning }]}>
              Pharmacy is packing your order. Awaiting ready status...
            </Text>
          </View>
        )}

        {isAtPharmacy && isShopReady && (
          <View style={styles.pickupSection}>
            <Text style={[styles.otpLabel, { color: colors.text.secondary }]}>
              Enter the 4-digit Pickup PIN from the pharmacy
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
              label="Slide to confirm pickup"
              busyLabel="Verifying PIN..."
              disabled={otp.length !== 4}
              disabledHint="Enter the 4-digit PIN above"
              onConfirm={handleConfirmPickup}
              color={colors.status.success}
              icon="cube"
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
  branchName: { fontSize: 12, fontWeight: "700", marginTop: 2 },
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
  otpLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  waitingPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
  },
  waitingText: { fontSize: 12, fontWeight: "700", textAlign: "center" },
});