// src/components/delivery/PharmacyLegPanel.tsx (do not remove this comment)

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
import { GeofencedSlideToConfirm } from "./GeofencedSlideToConfirm";
import { InlineOtpInput } from "./InlineOtpInput";

const ARRIVAL_RADIUS_METERS = 30;

interface PharmacyLegPanelProps {
  delivery: ActiveDelivery;
}

/**
 * Real pharmacy-leg flow (Phase 3), replacing the placeholder for the
 * ACCEPTED / ARRIVED_AT_PHARMACY portion of ActiveDeliveryView.
 */
export function PharmacyLegPanel({ delivery }: PharmacyLegPanelProps) {
  const { colors } = useTheme();
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);
  const dialog = useDialog();

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
        "ARRIVED_AT_PHARMACY",
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

  const handleConfirmPickup = async () => {
    if (otp.length !== 4) return;
    try {
      const updated = await deliveryApi.updateStatus(
        delivery.delivery_id,
        "PICKED_UP",
        otp,
      );
      setActiveDelivery(updated);
      setOtp("");
      setOtpError(false);
    } catch (err: any) {
      setOtpError(true);
      setOtp("");
      dialog.alert({
        title: "Invalid PIN",
        message:
          err?.response?.data?.message ||
          "The pickup PIN you entered is incorrect. Please check with the pharmacy and try again.",
        icon: "cancel",
        destructive: true,
      });
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

  const shopDisplayName = delivery.pharmacy.shop_name || "Pharmacy";
  const branchDisplayName = delivery.pharmacy.branch_name;

  return (
    <View style={styles.container}>
      {/* Pharmacy Header Card */}
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
            <View style={styles.shopRow}>
              <Ionicons
                name="storefront"
                size={20}
                color={colors.brand.primary}
                style={styles.shopIcon}
              />
              <Text
                style={[styles.title, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {shopDisplayName}
              </Text>
            </View>

            {branchDisplayName ? (
              <View
                style={[
                  styles.branchBadge,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <Text
                  style={[styles.branchText, { color: colors.text.secondary }]}
                >
                  {branchDisplayName}
                </Text>
              </View>
            ) : null}
          </View>

          {distanceLabel && !isAtPharmacy && (
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
          {delivery.pharmacy.address || "Address unavailable"}
        </Text>

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
                Call Pharmacy
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dynamic Progress/Action Area */}
      <View style={styles.actionArea}>
        {isAwaitingArrival && (
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
              label="Reached Pharmacy Location"
              busyLabel="Confirming arrival..."
              disabled={!isWithinRange}
              disabledHint={arrivalDisabledHint}
              onConfirm={handleConfirmArrival}
              icon="checkmark-circle"
            />
          </View>
        )}

        {isAtPharmacy && !isShopReady && (
          <View
            style={[
              styles.waitingCard,
              {
                backgroundColor: colors.status.warningBg,
                borderColor: colors.status.warning,
              },
            ]}
          >
            <View style={styles.waitingHeader}>
              <Ionicons
                name="hourglass-outline"
                size={20}
                color={colors.status.warning}
                style={styles.spinIcon}
              />
              <Text
                style={[styles.waitingTitle, { color: colors.status.warning }]}
              >
                Preparing Order
              </Text>
            </View>
            <Text
              style={[styles.waitingText, { color: colors.text.secondary }]}
            >
              The pharmacist is packing your items. We will update you here as
              soon as they are ready for pickup.
            </Text>
          </View>
        )}

        {isAtPharmacy && isShopReady && (
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
                  READY FOR PICKUP
                </Text>
              </View>
            </View>

            <Text style={[styles.otpLabel, { color: colors.text.secondary }]}>
              Ask the pharmacist for the 4-digit verification PIN:
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
              label="Slide to confirm pickup"
              busyLabel="Verifying PIN..."
              disabled={otp.length !== 4}
              disabledHint="Enter the PIN above"
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
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shopIcon: {
    marginTop: -1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  branchBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  branchText: {
    fontSize: 11,
    fontWeight: "700",
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
  waitingCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  waitingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  spinIcon: {
    alignSelf: "center",
  },
  waitingTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  waitingText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 10,
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
