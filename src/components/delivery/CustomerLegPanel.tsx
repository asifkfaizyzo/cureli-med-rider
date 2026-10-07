// src/components/delivery/CustomerLegPanel.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { deliveryApi } from "../../features/delivery/api/delivery.api";
import { useProximity } from "../../hooks/useProximity";
import { useDeliveryStore } from "../../store/deliveryStore";
import { useTheme } from "../../theme/ThemeContext";
import type { ActiveDelivery } from "../../types/delivery";
import { useDialog } from "../Dialog/DialogProvider";
import { DeliverySuccessModal } from "./DeliverySuccessModal";
import { GeofencedSlideToConfirm } from "./GeofencedSlideToConfirm";
import { InlineOtpInput } from "./InlineOtpInput";

const ARRIVAL_RADIUS_METERS = 30;

interface CustomerLegPanelProps {
  delivery: ActiveDelivery;
}

export function CustomerLegPanel({ delivery }: CustomerLegPanelProps) {
  const { colors } = useTheme();
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);
  const clearActiveDelivery = useDeliveryStore((s) => s.clearActiveDelivery);
  const dialog = useDialog();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [completedDeliverySnapshot, setCompletedDeliverySnapshot] =
    useState<ActiveDelivery | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const customer = delivery.customer;

  const { distanceMeters, isWithinRange } = useProximity(
    customer?.latitude,
    customer?.longitude,
    ARRIVAL_RADIUS_METERS,
  );

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

  const isEnRouteLeg =
    delivery.status === "PICKED_UP" || delivery.status === "EN_ROUTE";
  const hasArrived = delivery.status === "ARRIVED_AT_CUSTOMER";

  const openNavigation = () => {
    if (hasTargetCoords) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`,
      );
    } else {
      dialog.alert({
        title: "GPS Missing",
        message: "Location coordinates unavailable for this step.",
        icon: "location-off",
      });
    }
  };

  const callContact = () => {
    if (contactPhone) Linking.openURL(`tel:${contactPhone}`);
  };

  const handleConfirmArrival = async () => {
    try {
      const updated = await deliveryApi.updateStatus(
        delivery.delivery_id,
        "ARRIVED_AT_CUSTOMER",
      );
      setActiveDelivery(updated);
    } catch (err: any) {
      dialog.alert({
        title: "Error",
        message: err?.response?.data?.message || "Failed to update status",
        icon: "error-outline",
      });
    }
  };

  const handleCompleteDelivery = async () => {
    if (otp.length !== 4) return;
    try {
      await deliveryApi.completeDelivery(delivery.delivery_id, otp);
      setOtp("");
      setOtpError(false);

      // Snapshot delivery state and open success modal
      setCompletedDeliverySnapshot(delivery);
      setShowSuccessModal(true);
    } catch (err: any) {
      setOtpError(true);
      setOtp("");
      dialog.alert({
        title: "Invalid PIN",
        message:
          err?.response?.data?.message ||
          "The delivery PIN you entered is incorrect. Please check with the customer and try again.",
        icon: "cancel",
        destructive: true,
      });
    }
  };

  const handleModalDone = () => {
    setShowSuccessModal(false);
    setCompletedDeliverySnapshot(null);
    clearActiveDelivery(); // Returns rider back to Home / Tabs
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

  const addressLine = [
    customer.address_line_1,
    customer.address_line_2,
    customer.landmark,
    customer.city,
  ]
    .filter(Boolean)
    .join(", ");

  const isCod = delivery.payment_method === "COD";
  const customerDisplayName = customer.name || "Customer";

  return (
    <View style={styles.container}>
      {/* Customer Header Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleBlock}>
            <View style={styles.personRow}>
              <Ionicons
                name="person-circle"
                size={20}
                color={colors.brand.primary}
                style={styles.personIcon}
              />
              <Text
                style={[styles.title, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {customerDisplayName}
              </Text>
            </View>

            <View
              style={[
                styles.paymentBadge,
                {
                  backgroundColor: isCod
                    ? colors.status.warningBg
                    : colors.status.successBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentBadgeText,
                  {
                    color: isCod
                      ? colors.status.warning
                      : colors.status.success,
                  },
                ]}
              >
                {isCod ? "COLLECT CASH" : delivery.payment_method}
              </Text>
            </View>
          </View>

          {distanceLabel && !hasArrived && (
            <View
              style={[
                styles.distancePill,
                { backgroundColor: colors.brand.light },
              ]}
            >
              <Ionicons
                name="navigate-circle"
                size={13}
                color={colors.brand.primary}
              />
              <Text
                style={[styles.distanceText, { color: colors.brand.primary }]}
              >
                {distanceLabel}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.address, { color: colors.text.muted }]}
          numberOfLines={2}
        >
          {addressLine || "Address unavailable"}
        </Text>

        <View
          style={[
            styles.summaryPill,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <Ionicons
            name="receipt-outline"
            size={13}
            color={colors.text.secondary}
          />
          <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
            {delivery.item_count} item{delivery.item_count === 1 ? "" : "s"} · ₹
            {delivery.total_amount.toFixed(0)}
          </Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={openNavigation}
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: colors.brand.light }]}
          >
            <Ionicons name="map" size={16} color={colors.brand.primary} />
            <Text
              style={[styles.actionBtnText, { color: colors.brand.primary }]}
            >
              Navigate Maps
            </Text>
          </TouchableOpacity>

          {contactPhone && (
            <TouchableOpacity
              onPress={callContact}
              activeOpacity={0.7}
              style={[
                styles.actionBtn,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons name="call" size={16} color={colors.text.primary} />
              <Text
                style={[styles.actionBtnText, { color: colors.text.primary }]}
              >
                Call Customer
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dynamic Progress/Action Area */}
      <View style={styles.actionArea}>
        {isEnRouteLeg && (
          <View style={styles.interactiveActionBlock}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.text.muted}
              />
              <Text
                style={[
                  styles.sectionHeaderText,
                  { color: colors.text.secondary },
                ]}
              >
                STEP 1: CONFIRM ARRIVAL
              </Text>
            </View>
            <GeofencedSlideToConfirm
              label="Reached Customer Location"
              busyLabel="Confirming arrival..."
              disabled={!isWithinRange}
              disabledHint={arrivalDisabledHint}
              onConfirm={handleConfirmArrival}
              icon="checkmark-circle"
            />
          </View>
        )}

        {hasArrived && (
          <View
            style={[
              styles.pickupCard,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <View style={styles.pickupHeader}>
              <View
                style={[
                  styles.secureBadge,
                  { backgroundColor: colors.status.successBg },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={colors.status.success}
                />
                <Text
                  style={[
                    styles.secureBadgeText,
                    { color: colors.status.success },
                  ]}
                >
                  ARRIVED AT CUSTOMER
                </Text>
              </View>
            </View>

            <Text style={[styles.otpLabel, { color: colors.text.secondary }]}>
              Ask the customer for the 4-digit Delivery PIN:
            </Text>

            <View style={styles.otpWrapper}>
              <InlineOtpInput
                value={otp}
                onChange={(v) => {
                  setOtp(v);
                  setOtpError(false);
                }}
                error={otpError}
              />
            </View>

            <View style={styles.pickupSliderSpacer} />

            <GeofencedSlideToConfirm
              label="Slide to complete delivery"
              busyLabel="Verifying PIN..."
              disabled={otp.length !== 4}
              disabledHint="Enter the PIN above"
              onConfirm={handleCompleteDelivery}
              color={colors.status.success}
              icon="checkmark-done"
            />
          </View>
        )}
      </View>

      {/* Delivery Success Modal */}
      <DeliverySuccessModal
        visible={showSuccessModal}
        delivery={completedDeliverySnapshot}
        onDone={handleModalDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  personIcon: {
    marginTop: -1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  paymentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "800",
  },
  address: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
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
  summaryText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.03)",
    paddingTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
  actionArea: {
    marginTop: 4,
  },
  interactiveActionBlock: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
    marginBottom: 2,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  pickupCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pickupHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 18,
  },
  otpWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  pickupSliderSpacer: {
    height: 16,
  },
});
