// app/(onboarding)/terms.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";

export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe Stack-Aware Back Navigation
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(onboarding)/bank-details");
    }
  };

  async function handleAccept() {
    if (!accepted) return;
    setError(null);
    setLoading(true);

    try {
      const result = await onboardingApi.acceptTerms();
      updateRider({
        terms_accepted_at: result.terms_accepted_at,
        has_accepted_terms: true,
      });

      router.replace("/(onboarding)/welcome");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to record terms acceptance.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background.page }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={loading}
          hitSlop={12}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={colors.text.muted}
          />
          <Text style={[styles.backText, { color: colors.text.muted }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Partner Agreement
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          Please read and accept our Code of Conduct and Delivery Terms.
        </Text>
      </View>

      {/* Scrollable Terms Content */}
      <View
        style={[styles.scrollContainer, { borderColor: colors.border.default }]}
      >
        <ScrollView
          style={styles.termsScroll}
          contentContainerStyle={styles.termsContent}
        >
          <Text style={[styles.heading, { color: colors.text.primary }]}>
            1. Deliveries & Service Standards
          </Text>
          <Text style={[styles.body, { color: colors.text.secondary }]}>
            As an active delivery partner of Cureli, you agree to execute
            deliveries of critical pharmaceutical and general wellness items
            promptly, safely, and professionally. Any temperature-sensitive or
            fragile products must be handled following standard protocols
            provided by our platform.
          </Text>

          <Text style={[styles.heading, { color: colors.text.primary }]}>
            2. Customer Interactions & Verification
          </Text>
          <Text style={[styles.body, { color: colors.text.secondary }]}>
            You will act in an ethical, courteous manner with all pharmacy staff
            and end customers. You must verify customer identity whenever
            required, especially for prescription-gated orders. Retaining a
            professional and clean presentation is required.
          </Text>

          <Text style={[styles.heading, { color: colors.text.primary }]}>
            3. Safety & Compliance Regulations
          </Text>
          <Text style={[styles.body, { color: colors.text.secondary }]}>
            You must possess a valid driving license, insurance, and
            roadworthiness certification (RC) for your vehicle at all times
            while acting as a partner. You agree to follow all national, local
            traffic safety rules, and never operate while under any substance
            influence.
          </Text>

          <Text style={[styles.heading, { color: colors.text.primary }]}>
            4. Payouts & Adjustments
          </Text>
          <Text style={[styles.body, { color: colors.text.secondary }]}>
            Payout cycles are processed on a weekly frequency as defined by
            standard platform policy. Payouts are calculated based on your
            travel coordinates, base rates, dynamic multipliers, and incentive
            goals. Manual adjustments, if any, will be processed by CAdmin after
            audits.
          </Text>
        </ScrollView>
      </View>

      {/* Checkbox row */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAccepted(!accepted)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: accepted
                ? colors.brand.primary
                : colors.border.default,
              backgroundColor: accepted ? colors.brand.primary : "transparent",
            },
          ]}
        >
          {accepted && <Text style={styles.checkText}>✓</Text>}
        </View>
        <Text style={[styles.checkboxLabel, { color: colors.text.secondary }]}>
          I have read and agree to Cureli's Code of Conduct and Delivery Partner
          Terms.
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: colors.status.error }]}>
          {error}
        </Text>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: accepted
              ? colors.brand.primary
              : colors.border.default,
          },
        ]}
        onPress={handleAccept}
        disabled={!accepted || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Accept & Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    paddingTop: 54,
  },
  header: {
    gap: 6,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  scrollContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
  },
  termsScroll: {
    flex: 1,
  },
  termsContent: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
