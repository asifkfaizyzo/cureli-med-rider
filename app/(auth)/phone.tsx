// app/(auth)/phone.tsx — Variation 1: Clean Centered
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../src/features/auth/api/auth.api";
import { PhoneField } from "../../src/features/auth/components/AuthInputs";
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
    if (cleaned.startsWith("91") && cleaned.length > 10)
      cleaned = cleaned.substring(2);
    else if (cleaned.startsWith("0") && cleaned.length > 10)
      cleaned = cleaned.substring(1);
    return cleaned.slice(0, 10);
  };

  async function handleContinue() {
    if (!isValid) return;
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.checkPhone(phone);
      if (result.exists) {
        router.push({ pathname: "/(auth)/login", params: { phone } });
      } else {
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo + Cureli on SAME line */}
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/images/cureli_rider_logo.png")}
              style={styles.logo}
            />
            <View>
              <Text style={[styles.brandName, { color: colors.text.logo }]}>
                Cureli
              </Text>
              <Text
                style={[styles.brandSubtitle, { color: colors.text.muted }]}
              >
                Delivery Partner
              </Text>
            </View>
          </View>

          {/* Title block */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Create your account
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Enter your mobile number to get started as a Cureli delivery
            partner.
          </Text>

          {/* Phone */}
          <View style={styles.form}>
            <PhoneField
              phone={phone}
              onChange={(t: string) => {
                setPhone(cleanInput(t));
                setError(null);
              }}
              error={!!error}
              disabled={loading}
              otpSent={false}
            />

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
                    : colors.border.default,
                },
                (!isValid || loading) && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: colors.text.muted }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                hitSlop={8}
              >
                <Text
                  style={[styles.loginLink, { color: colors.brand.accent }]}
                >
                  Log in
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.terms, { color: colors.text.faint }]}>
              By continuing, you agree to our{" "}
              <Text
                style={{ color: colors.brand.accent }}
                onPress={() => router.push("/terms")}
              >
                Terms
              </Text>{" "}
              and{" "}
              <Text
                style={{ color: colors.brand.accent }}
                onPress={() => router.push("/privacy")}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 36,
  },
  logo: { width: 78, height: 78, resizeMode: "contain" },
  brandName: {
    fontSize: 50,
    paddingTop: 8,
    paddingBottom: 8,
    fontFamily: FontFamily.amulyaBold,
    lineHeight: 30,
  },
  brandSubtitle: {
    fontSize: 9,
    paddingLeft: 6,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  form: { gap: 14, width: "100%" },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  errorText: { fontSize: 13, fontFamily: FontFamily.medium, flexShrink: 1 },
  button: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 1 },
  buttonText: { color: "#fff", fontSize: 16, fontFamily: FontFamily.bold },
  footer: { marginTop: 36, alignItems: "center", gap: 16 },
  loginRow: { flexDirection: "row", alignItems: "center" },
  loginText: { fontSize: 14, fontFamily: FontFamily.regular },
  loginLink: { fontSize: 14, fontFamily: FontFamily.bold },
  terms: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 18,
  },
});
