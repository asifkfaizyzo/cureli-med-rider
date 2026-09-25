// src/components/delivery/TopStatusBar.tsx (do not remove this comment)

import React from "react";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import type { DeliveryLeg } from "../../utils/deliveryStatus";

interface TopStatusBarProps {
  orderNumber: string;
  leg: DeliveryLeg;
}

// SOS/Help are STUBS ONLY — confirmed in-scope for now. No rider incident/
// support module exists in the backend yet (only auth/dashboard/delivery/
// onboarding/presence/shops/sse under modules/rider/*). Real backend-wired
// SOS is an explicitly separate future project.
const SUPPORT_PHONE = "18001234567";

export function TopStatusBar({ orderNumber, leg }: TopStatusBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handleHelp = () => {
    Alert.alert("Need Help?", "Contact rider support for assistance with this delivery.", [
      { text: "Cancel", style: "cancel" },
      { text: "Call Support", onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE}`) },
    ]);
  };

  const handleSOS = () => {
    Alert.alert(
      "Emergency SOS",
      "This will alert Cureli support immediately. Only use in a genuine emergency.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Emergency Line",
          style: "destructive",
          onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE}`),
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 10,
          backgroundColor: colors.background.card,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.legBadge, { backgroundColor: colors.brand.light }]}>
          <Ionicons
            name={leg === "PHARMACY" ? "medkit" : "home"}
            size={13}
            color={colors.brand.primary}
          />
          <Text style={[styles.legText, { color: colors.brand.primary }]}>
            {leg === "PHARMACY" ? "PICKUP" : "DROP-OFF"}
          </Text>
        </View>
        <Text style={[styles.orderNumber, { color: colors.text.muted }]}>#{orderNumber}</Text>
      </View>

      <View style={styles.right}>
        <TouchableOpacity
          style={[
            styles.helpButton,
            { backgroundColor: colors.background.tint, borderColor: colors.border.subtle },
          ]}
          onPress={handleHelp}
          activeOpacity={0.8}
          accessibilityLabel="Help"
        >
          <Ionicons name="headset-outline" size={16} color={colors.brand.primary} />
          <Text style={[styles.helpText, { color: colors.brand.primary }]}>Help</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sosButton,
            { backgroundColor: colors.status.errorBg, borderColor: colors.status.errorBorder },
          ]}
          onPress={handleSOS}
          activeOpacity={0.85}
          accessibilityLabel="Emergency SOS"
        >
          <Text style={[styles.sosText, { color: colors.status.error }]}>SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
    elevation: 3,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  legBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  legText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  orderNumber: { fontSize: 12, fontWeight: "700" },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  helpText: { fontSize: 12, fontWeight: "800" },
  sosButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  sosText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
});