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

        {/* Section 1 */}
        <Text style={[styles.heading, { color: colors.text.primary }]}>
          1. Scope & Ecosystem Overview
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          Cureli ("we," "our," or "us") is dedicated to protecting your privacy.
          This policy applies strictly to the{" "}
          <Text style={[styles.bold, { color: colors.text.primary }]}>
            Cureli Rider Mobile Application (com.cureli.rider)
          </Text>{" "}
          and details how we handle sensitive personal, location, and document
          data.
        </Text>

        {/* Section 2 - PROMINENT LOCATION DISCLOSURE (Google Mandated) */}
        <View
          style={[
            styles.highlightBox,
            {
              backgroundColor: colors.background.tint,
              borderLeftColor: colors.brand.primary,
            },
          ]}
        >
          <Text
            style={[styles.highlightHeading, { color: colors.brand.primary }]}
          >
            2. Prominent Location Disclosure & Usage
          </Text>
          <Text style={[styles.body, { color: colors.text.secondary }]}>
            <Text style={[styles.bold, { color: colors.text.primary }]}>
              Cureli Rider collects, processes, and transmits precise location
              data (GPS coordinates)
            </Text>{" "}
            to enable live medicine order assignment, delivery route navigation,
            and real-time ETA tracking for partner pharmacies and customers{" "}
            <Text
              style={[styles.boldHighlight, { color: colors.brand.primary }]}
            >
              even when the app is closed or not in use (running in the
              background).
            </Text>
          </Text>
          <Text
            style={[
              styles.body,
              { color: colors.text.secondary, marginTop: 8 },
            ]}
          >
            This background tracking is initiated only when you manually switch
            your toggle status to "Online" on the dashboard and is deactivated
            immediately when you toggle "Offline" or log out.
          </Text>
        </View>

        {/* Section 3 */}
        <Text style={[styles.heading, { color: colors.text.primary }]}>
          3. Identification & KYC Documents
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          To verify identity, establish professional driving clearance, and
          comply with drug logistics enforcement regulations in India, we
          collect and store:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bulletPoint, { color: colors.text.secondary }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text.primary }]}>
              KYC Records:
            </Text>{" "}
            Aadhaar Card, PAN Card, Driving License, and Vehicle Registration
            Certificate (RC).
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text.secondary }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text.primary }]}>
              Live Photographs:
            </Text>{" "}
            Selfie uploads taken during registration for visual authentication
            and fraud prevention.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text.secondary }]}>
            •{" "}
            <Text style={[styles.bold, { color: colors.text.primary }]}>
              Financial Payout Info:
            </Text>{" "}
            Bank account numbers, IFSC codes, and UPI details to process and
            deposit your delivery earnings.
          </Text>
        </View>

        {/* Section 4 */}
        <Text style={[styles.heading, { color: colors.text.primary }]}>
          4. Secure Data Handling & Encryption
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          We transmit all personal and location coordinates securely over HTTPS
          utilizing modern TLS encryption. Your document uploads and financial
          details are kept isolated in secure database clouds with strict,
          role-based access permissions. We do not sell or lease your identity
          assets to third-party marketing brokers.
        </Text>

        {/* Section 5 */}
        <Text style={[styles.heading, { color: colors.text.primary }]}>
          5. Account & Personal Data Deletion
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          You retain full rights to inspect, update, or request the permanent
          deletion of your account and personal history. To trigger an active
          data deletion request, you can visit our contact portal at{" "}
          <Text style={[styles.bold, { color: colors.brand.primary }]}>
            https://curelihealth.com/contact
          </Text>{" "}
          or email us directly at{" "}
          <Text style={[styles.bold, { color: colors.brand.primary }]}>
            info@curelihealth.com
          </Text>
          . Upon verification, your profile, document archives, and live
          photographs will be purged from our servers within 30 days.
        </Text>

        {/* Section 6 */}
        <Text style={[styles.heading, { color: colors.text.primary }]}>
          6. Contact Us
        </Text>
        <Text style={[styles.body, { color: colors.text.secondary }]}>
          Cureli Healthcare India{"\n"}
          Email: info@curelihealth.com{"\n"}
          Phone: +91 7356020940{"\n"}
          Address: Bangalore, Karnataka, India
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
    marginBottom: 4,
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
  highlightBox: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
    gap: 8,
  },
  highlightHeading: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  bold: {
    fontFamily: FontFamily.bold,
  },
  boldHighlight: {
    fontFamily: FontFamily.bold,
  },
  bulletList: {
    gap: 8,
    paddingLeft: 4,
    marginVertical: 4,
  },
  bulletPoint: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
});
