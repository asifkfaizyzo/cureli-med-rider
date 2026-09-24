// app/(auth)/forgot-password.tsx (do not remove this comment)
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../src/features/auth/api/auth.api";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const { phone: paramPhone } = useLocalSearchParams<{ phone: string }>();

  const [phone, setPhone] = useState(paramPhone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const otpInputRef = useRef<TextInput>(null);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const cleanedPhone = phone.replace(/\D/g, "").trim();
  const canSendOtp = cleanedPhone.length === 10;

  const cleanInput = (text: string) => {
    let cleaned = text.replace(/\D/g, "");
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith("0") && cleaned.length > 10) {
      cleaned = cleaned.substring(1);
    }
    return cleaned.slice(0, 10);
  };

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Send OTP for reset
  async function handleSendResetOtp() {
    Keyboard.dismiss();
    setError(null);

    if (cleanedPhone.length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    if (!/^[6-9]/.test(cleanedPhone)) {
      setError("Enter a valid Indian mobile number");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.sendOtp(cleanedPhone, "reset");
      setOtpSent(true);
      setResendCooldown(result.timeout || RESEND_COOLDOWN);
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err: unknown) {
      const { message, code } = extractError(err);
      if (code === "NOT_FOUND") {
        setError(
          "No account found with this number. Please register first.",
        );
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP for reset
  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (loadingRef.current) return;
      setError(null);
      setLoading(true);

      try {
        const result = await authApi.verifyOtp(cleanedPhone, code, "reset");

        if (result.reset_token) {
          setTimeout(() => {
            router.replace({
              pathname: "/(auth)/reset-password",
              params: {
                token: result.reset_token!,
                phone: cleanedPhone,
              },
            });
          }, 150);
        }
      } catch (err: unknown) {
        setOtp("");
        setError(extractErrorMessage(err));
        setTimeout(() => otpInputRef.current?.focus(), 100);
      } finally {
        setLoading(false);
      }
    },
    [cleanedPhone],
  );

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !loadingRef.current && otpSent) {
      Keyboard.dismiss();
      handleVerifyOtp(otp);
    }
  }, [otp, handleVerifyOtp, otpSent]);

  // Resend OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || !cleanedPhone || resending) return;
    setResending(true);
    setError(null);
    setOtp("");

    try {
      const result = await authApi.sendOtp(cleanedPhone, "reset");
      setResendCooldown(result.timeout || RESEND_COOLDOWN);
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  function handleResetOtpState() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOtpSent(false);
    setOtp("");
    setError(null);
  }

  function renderOtpBoxes() {
    return (
      <View style={styles.otpBoxRow}>
        {Array.from({ length: OTP_LENGTH }).map((_, index) => {
          const char = otp[index] ?? "";
          const isCurrent = index === otp.length && !loading;
          const isFilled = index < otp.length;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.otpBox,
                {
                  backgroundColor: colors.background.input,
                  borderColor: colors.border.input,
                },
                isFilled && {
                  borderColor: colors.brand.accent,
                  backgroundColor: colors.background.tint,
                },
                isCurrent && {
                  borderColor: colors.brand.accent,
                  borderWidth: 2,
                  backgroundColor: colors.background.card,
                },
                error
                  ? {
                      borderColor: colors.status.error,
                      backgroundColor: colors.status.errorBg,
                    }
                  : null,
              ]}
              onPress={() => otpInputRef.current?.focus()}
              activeOpacity={1}
            >
              <Text style={[styles.otpChar, { color: colors.text.primary }]}>
                {char}
              </Text>
              {isCurrent && (
                <View
                  style={[
                    styles.cursor,
                    { backgroundColor: colors.brand.accent },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
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
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={colors.text.muted}
            />
            <Text style={[styles.backText, { color: colors.text.muted }]}>
              Back to Login
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name="lock-reset"
                size={28}
                color={colors.brand.accent}
              />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>
              {otpSent ? "Verify your identity" : "Forgot your password?"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              {otpSent
                ? `Enter the 6-digit code sent to +91 ${cleanedPhone}`
                : "No worries! Enter your mobile number and we'll send you a verification code to reset your password."}
            </Text>
          </View>

          <View style={styles.formSection}>
            {/* Phone Input */}
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.background.input,
                  borderColor: error
                    ? colors.status.error
                    : colors.border.input,
                  opacity: otpSent ? 0.6 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.prefix,
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
                value={phone}
                onChangeText={(text) => {
                  setPhone(cleanInput(text));
                  if (error) setError(null);
                }}
                placeholder="98765 43210"
                placeholderTextColor={colors.text.faint}
                keyboardType="number-pad"
                maxLength={10}
                editable={!loading && !otpSent}
                returnKeyType="done"
              />
              {otpSent && (
                <TouchableOpacity
                  onPress={handleResetOtpState}
                  style={styles.pencilButton}
                  hitSlop={8}
                  disabled={loading}
                >
                  <MaterialIcons
                    name="edit"
                    size={18}
                    color={colors.brand.accent}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* OTP Section */}
            {otpSent && (
              <View style={styles.otpSectionContainer}>
                <TextInput
                  ref={otpInputRef}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/\D/g, "").slice(0, OTP_LENGTH));
                    if (error) setError(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  caretHidden
                  style={styles.hiddenInput}
                  editable={!loading}
                />
                {renderOtpBoxes()}

                <View style={styles.resendInlineRow}>
                  <Text
                    style={[
                      styles.resendInlineText,
                      { color: colors.text.muted },
                    ]}
                  >
                    Didn't receive the OTP?
                  </Text>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resendCooldown > 0 || resending || loading}
                  >
                    {resending ? (
                      <ActivityIndicator
                        color={colors.brand.accent}
                        size="small"
                      />
                    ) : resendCooldown > 0 ? (
                      <Text
                        style={[
                          styles.resendCooldownText,
                          { color: colors.text.faint },
                        ]}
                      >
                        Resend in {resendCooldown}s
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.resendActiveText,
                          { color: colors.brand.accent },
                        ]}
                      >
                        Resend SMS
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Error */}
            {error ? (
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
            ) : null}

            {/* Send OTP Button (before OTP is sent) */}
            {!otpSent && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: isDark
                      ? colors.brand.accent
                      : colors.brand.primary,
                  },
                  (!canSendOtp || loading) && styles.buttonDisabled,
                ]}
                onPress={handleSendResetOtp}
                disabled={!canSendOtp || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send Reset Code</Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={18}
                      color="#ffffff"
                    />
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Login with OTP instead */}
            {!otpSent && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  router.replace({
                    pathname: "/(auth)/login",
                    params: { tab: "otp", phone: cleanedPhone },
                  })
                }
                disabled={loading}
              >
                <MaterialIcons
                  name="login"
                  size={16}
                  color={colors.brand.accent}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.brand.accent },
                  ]}
                >
                  Login with OTP instead
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function extractError(err: unknown): { message: string; code?: string } {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as {
      response?: {
        data?: { message?: string; data?: { code?: string } };
        status?: number;
      };
    };
    return {
      message: axiosErr.response?.data?.message ?? "Something went wrong.",
      code: axiosErr.response?.data?.data?.code,
    };
  }
  return { message: "Something went wrong. Please try again." };
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
  }
  return "Something went wrong. Please try again.";
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  backText: { fontSize: 14, fontFamily: FontFamily.medium },
  header: {
    alignItems: "center",
    gap: 10,
    paddingTop: 24,
    paddingBottom: 28,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  formSection: { gap: 14 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  prefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1.5,
  },
  prefixFlag: { fontSize: 18 },
  prefixText: { fontSize: 16, fontFamily: FontFamily.semiBold },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  pencilButton: {
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  otpSectionContainer: {
    alignItems: "center",
    width: "100%",
    gap: 16,
    marginTop: 6,
  },
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  otpBoxRow: { flexDirection: "row", gap: 8, alignSelf: "center" },
  otpBox: {
    width: 44,
    height: 54,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  otpChar: { fontSize: 20, fontFamily: FontFamily.bold },
  cursor: {
    position: "absolute",
    bottom: 10,
    width: 2,
    height: 20,
    borderRadius: 1,
  },
  resendInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
  },
  resendInlineText: { fontSize: 13, fontFamily: FontFamily.regular },
  resendCooldownText: { fontSize: 13, fontFamily: FontFamily.semiBold },
  resendActiveText: { fontSize: 13, fontFamily: FontFamily.bold },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  errorText: { fontSize: 13, fontFamily: FontFamily.medium, flex: 1 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
});