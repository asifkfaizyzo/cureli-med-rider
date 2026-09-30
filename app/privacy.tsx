// app/privacy.tsx (do not remove this comment)
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/theme/ThemeContext";
import { FontFamily } from "../src/theme/typography";

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: colors.border.subtle }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Privacy Policy
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: colors.text.muted }]}>
          Last Updated: October 2026
        </Text>

        <Text style={[styles.heading, { color: colors.text.primary }]}>
          1. Overview and Core Data Values
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          Your confidentiality is critical to us. Because the Cureli platform
          facilitates urgent medical deliveries, we collect background
          positioning metrics, verification snapshots, device telemetry, and
          registration records to protect our operations and prevent service
          disruptions.
        </Text>

        <Text style={[styles.heading, { color: colors.text.primary }]}>
          2. Critical Geo-tracking Operations
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          To update pharmacies and customers during active deliveries, Cureli
          processes continuous latitude and longitude signals. This monitoring
          runs even if the app is placed in background sleep modes, provided
          your toggle status is set to "Online".
        </Text>

        <Text style={[styles.heading, { color: colors.text.primary }]}>
          3. Personal Identification & Document Storing
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          For regulatory and drug enforcement tracking compliance, documentation
          files (such as Aadhar, DL, PAN, vehicle registration and self-taken
          photos) are verified and cached securely inside encrypted database
          clouds. We do not sell or leak identity assets to third-party
          marketing brokers.
        </Text>

        <Text style={[styles.heading, { color: colors.text.primary }]}>
          4. Policy Adjustments and Support
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          Cureli retains full rights to modify these clauses to align with local
          regulatory frameworks. For personal data audit logs, deletion
          requests, or support updates, send details to info@curelihealth.com.
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
