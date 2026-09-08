// app/(auth)/phone.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../src/features/auth/api/auth.api";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

export default function PhoneScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

  const cleanInput = (text: string) => {
    let cleaned = text.replace(/\D/g, "");
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith("0") && cleaned.length > 10) {
      cleaned = cleaned.substring(1);
    }
    return cleaned.slice(0, 10);
  };

  async function handleContinue() {
    if (!isValid) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.checkPhone(phone);

      if (result.exists) {
        // Existing rider → go to login screen (which has password/OTP tabs)
        router.push({ pathname: "/(auth)/login", params: { phone } });
      } else {
        // New rider → send OTP and go to verification
        try {
          await authApi.sendOtp(phone);
          router.push({ pathname: "/(auth)/otp", params: { phone } });
        } catch (otpErr: any) {
          setError(
            otpErr?.response?.data?.message ??
              otpErr?.message ??
              "Failed to send verification OTP.",
          );
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.wordmark, { color: colors.text.primary }]}>
              cureli
            </Text>
            <Text style={[styles.tagline, { color: colors.text.faint }]}>
              Delivery Partner
            </Text>
          </View>

          {/* Premium Registration Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.input,
                borderColor: colors.border.input,
              },
            ]}
          >
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Create your account
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Enter your mobile number to check your status and get started.
            </Text>

            {/* Input Row */}
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor: error
                    ? colors.status.error
                    : colors.border.input,
                },
              ]}
            >
              <View
                style={[
                  styles.prefixContainer,
                  {
                    backgroundColor: isDark
                      ? colors.background.elevated
                      : "#f1f5f9",
                    borderRightColor: colors.border.input,
                  },
                ]}
              >
                <Text style={styles.prefixFlag}>🇮🇳</Text>
                <Text
                  style={[styles.prefixText, { color: colors.text.secondary }]}
                >
                  +91
                </Text>
              </View>

              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="98765 43210"
                placeholderTextColor={colors.text.faint}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(t) => {
                  setPhone(cleanInput(t));
                  setError(null);
                }}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                editable={!loading}
              />
            </View>

            {error && (
              <View style={styles.errorRow}>
                <MaterialIcons
                  name="error-outline"
                  size={14}
                  color={colors.status.error}
                />
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  {error}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isValid
                    ? isDark
                      ? colors.brand.accent
                      : colors.brand.primary
                    : colors.border.input,
                },
                (!isValid || loading) && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#ffffff"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* REDIRECTION BACK TO LOGIN */}
          <View style={styles.loginLinkContainer}>
            <Text style={[styles.loginLinkText, { color: colors.text.muted }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={[styles.loginLink, { color: colors.brand.accent }]}>
                Log in
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.termsFooter, { color: colors.text.faint }]}>
            By continuing, you agree to Cureli's{"\n"}
            Terms of Service and Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 24,
  },
  header: { alignItems: "center", gap: 4 },
  wordmark: {
    fontSize: 36,
    fontFamily: FontFamily.amulyaBold,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    height: 56,
    marginTop: 4,
    overflow: "hidden",
  },
  prefixContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: "100%",
    borderRightWidth: 1.5,
  },
  prefixFlag: { fontSize: 18 },
  prefixText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 1,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  errorText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  button: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  loginLink: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  termsFooter: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 12,
  },
});
