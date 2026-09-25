// src/components/delivery/ActiveDeliveryView.tsx (do not remove this comment)

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useDeliveryStore } from "../../store/deliveryStore";
import { deliveryApi } from "../../features/delivery/api/delivery.api";
import { OtpModal } from "./OtpModal";
import { Ionicons } from "@expo/vector-icons";

/**
 * ── PHASE 3 NOTE ─────────────────────────────────────────────────────
 * Since PharmacyLegPanel now owns the entire pharmacy leg, this
 * component only ever renders during the customer leg (PICKED_UP /
 * EN_ROUTE / ARRIVED_AT_CUSTOMER) — see ActiveDeliveryScreen.tsx's leg
 * branch. It's still a Phase 1/2-style placeholder: Phase 4 will
 * replace it with CustomerLegPanel, built on the same
 * GeofencedSlideToConfirm + InlineOtpInput primitives as
 * PharmacyLegPanel, for consistency and to add the customer-side 30m
 * arrival gate.
 * ─────────────────────────────────────────────────────────────────────
 */
export const ActiveDeliveryView: React.FC = () => {
  const { colors } = useTheme();
  const delivery = useDeliveryStore((s) => s.activeDelivery);
  const setActiveDelivery = useDeliveryStore((s) => s.setActiveDelivery);
  const clearActiveDelivery = useDeliveryStore((s) => s.clearActiveDelivery);

  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  if (!delivery || !delivery.customer) return null;

  const targetLat = delivery.customer.latitude;
  const targetLng = delivery.customer.longitude;
  const contactPhone = delivery.customer.phone;

  const openNavigation = () => {
    if (targetLat && targetLng) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`);
    } else {
      Alert.alert("GPS Missing", "Location coordinates unavailable for this step.");
    }
  };

  const callContact = () => {
    if (contactPhone) Linking.openURL(`tel:${contactPhone}`);
  };

  const handleArrivedAtCustomer = async () => {
    setLoading(true);
    try {
      const updated = await deliveryApi.updateStatus(delivery.delivery_id, "ARRIVED_AT_CUSTOMER");
      setActiveDelivery(updated);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDelivery = async (otp: string) => {
    await deliveryApi.completeDelivery(delivery.delivery_id, otp);
    clearActiveDelivery();
    Alert.alert("Order Delivered!", "Delivery completed successfully.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoSection}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {delivery.customer.name || "Customer"}
        </Text>

        <Text style={[styles.address, { color: colors.text.muted }]}>
          {[delivery.customer.address_line_1, delivery.customer.landmark, delivery.customer.city]
            .filter(Boolean)
            .join(", ")}
        </Text>
      </View>

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

      <View style={styles.actionContainer}>
        {["PICKED_UP", "EN_ROUTE"].includes(delivery.status) && (
          <TouchableOpacity
            onPress={handleArrivedAtCustomer}
            disabled={loading}
            style={[styles.mainActionBtn, { backgroundColor: colors.brand.primary }]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.mainActionText}>Arrived at Customer Doorstep</Text>
            )}
          </TouchableOpacity>
        )}

        {delivery.status === "ARRIVED_AT_CUSTOMER" && (
          <TouchableOpacity
            onPress={() => setShowOtpModal(true)}
            style={[styles.mainActionBtn, { backgroundColor: colors.status.success }]}
          >
            <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" />
            <Text style={styles.mainActionText}>Verify Customer OTP & Complete</Text>
          </TouchableOpacity>
        )}
      </View>

      <OtpModal
        visible={showOtpModal}
        title="Customer Delivery Verification"
        subtitle="Ask the customer for the 4-digit Delivery PIN to complete delivery."
        onConfirm={handleCompleteDelivery}
        onClose={() => setShowOtpModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between" },
  infoSection: { marginTop: 4 },
  title: { fontSize: 16, fontWeight: "800" },
  address: { fontSize: 12, marginTop: 2, lineHeight: 16 },
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
  actionContainer: { marginTop: 4 },
  mainActionBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  mainActionText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
});