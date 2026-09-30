// app/terms.tsx (do not remove this comment)
import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/theme/ThemeContext";
import { FontFamily } from "../src/theme/typography";

export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.text.muted }]}>Last Updated: October 2026</Text>

        <Text style={[styles.heading, { color: colors.text.primary }]}>1. Overview and Scope</Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          Welcome to the Cureli Rider Application. This platform acts as a bridge connecting independent logistics providers (Riders) with registered pharmacies and health partners. By accessing our services, you agree to comply with our overall delivery standards and structural ecosystem rules.
        </Text>

        <Text style={[styles.heading, { color: colors.text.primary }]}>2. Operational Delivery Standards</Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          All rider partners are bound to execute assigned medical orders promptly and in accordance with hygienic standards. Temperature-sensitive vaccines or fragile packages must be stored inside secure compartments to verify product integrity at the final destination point.
        </Text>

        <Text style={[styles.heading, { color: colors.text.primary }]}>3. Geo-Location & GPS Protocols</Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          To coordinate real-time delivery handoffs, your background location tracking is active when marked "Online" inside the application. This ensures correct routing computation and assists the automated dispatch server in determining optimized assignment tasks.
        </Text>

        <Text style={[styles.heading, { color: colors.text.primary }]}>4. Fees, Deductions, and Payout Structures</Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          Payout sums are computed dynamically utilizing base rates, regional demand premiums, and weekly goal achievements. Cureli reserves the absolute right to audit trip logs and deduct balances in cases of verified route manipulation, customer identity validation omissions, or order package tampering.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  placeholder: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
  },
  heading: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    marginTop: 8,
  },
  body: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
});