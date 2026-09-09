import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../src/features/auth/api/auth.api";
import { getRouteForRider } from "../../src/features/auth/utils/authNavigation";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

type TabType = "password" | "otp";
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function LoginScreen() {
  const { setAuth, setTempToken } = useAuthStore();
  const { colors, isDark } = useTheme();
  const { phone: paramPhone } = useLocalSearchParams<{ phone: string }>();

  // Tabs state (Password is default)
  const [activeTab, setActiveTab] = useState<TabType>("password");

  // Common fields
  const [phone, setPhone] = useState(paramPhone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password fields
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP fields
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Refs to avoid stale closures in effects
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const otpSentRef = useRef(otpSent);
  otpSentRef.current = otpSent;

  const cleanedPhone = phone.replace(/\D/g, "").trim();
  const canSubmitPassword = cleanedPhone.length === 10 && password.length >= 8;
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

  // Cooldown countdown timer — FIXED: uses functional update, no stale state
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

  // Handle Tab Switch smoothly
  function switchTab(tab: TabType) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
    setError(null);
    if (tab === "password") {
      setOtp("");
    }
  }

  // Action: Verify OTP — wrapped in useCallback to stabilize reference
  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (loadingRef.current) return;
      setError(null);
      setLoading(true);

      try {
        const result = await authApi.verifyOtp(cleanedPhone, code);

        if (result.is_new && result.temp_token) {
          setTempToken(result.temp_token);
          setTimeout(() => {
            router.replace("/(auth)/set-password");
          }, 150);
        } else if (result.accessToken && result.rider) {
          setAuth(result.rider, result.accessToken, result.refreshToken!);
          const target = getRouteForRider(result.rider);
          setTimeout(() => {
            router.replace(target as any);
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
    [cleanedPhone, setAuth, setTempToken],
  );

  // Auto-verify OTP when full length is entered — FIXED: uses refs for stale values
  useEffect(() => {
    if (
      otp.length === OTP_LENGTH &&
      !loadingRef.current &&
      activeTabRef.current === "otp" &&
      otpSentRef.current
    ) {
      Keyboard.dismiss();
      handleVerifyOtp(otp);
    }
  }, [otp, handleVerifyOtp]);

  // Action: Password Login
  async function handlePasswordLogin() {
    Keyboard.dismiss();
    setError(null);

    if (cleanedPhone.length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.login(cleanedPhone, password);
      setAuth(result.rider, result.accessToken, result.refreshToken);

      const target = getRouteForRider(result.rider);
      setTimeout(() => {
        router.replace(target as any);
      }, 150);
    } catch (err: unknown) {
      const { message, code } = extractError(err);

      if (code === "NO_PASSWORD") {
        setError(
          "No password set for this account. Redirecting you to OTP login...",
        );
        setTimeout(async () => {
          switchTab("otp");
          await triggerSendOtp();
        }, 1500);
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Action: Trigger Send OTP
  async function triggerSendOtp() {
    if (cleanedPhone.length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    if (!/^[6-9]/.test(cleanedPhone)) {
      setError("Enter a valid Indian mobile number");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await authApi.sendOtp(cleanedPhone);
      setOtpSent(true);
      setResendCooldown(result.timeout || RESEND_COOLDOWN);
      setTimeout(() => otpInputRef.current?.focus(), 250);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Action: Resend OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || !cleanedPhone || resending) return;
    setResending(true);
    setError(null);
    setOtp("");

    try {
      const result = await authApi.sendOtp(cleanedPhone);
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
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.topSection}>
          <Text style={[styles.brandName, { color: colors.text.primary }]}>
            cureli
          </Text>
          <Text style={[styles.tagline, { color: colors.text.faint }]}>
            Delivery Partner
          </Text>
        </View>

        <View style={styles.formSection}>
          {/* Custom Tabs */}
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: colors.background.input },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "password" && {
                  backgroundColor: isDark
                    ? colors.background.elevated
                    : colors.background.card,
                },
              ]}
              onPress={() => switchTab("password")}
              disabled={loading}
            >
              <MaterialIcons
                name="lock"
                size={16}
                color={
                  activeTab === "password"
                    ? colors.brand.accent
                    : colors.text.muted
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "password"
                        ? colors.text.primary
                        : colors.text.muted,
                  },
                ]}
              >
                Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "otp" && {
                  backgroundColor: isDark
                    ? colors.background.elevated
                    : colors.background.card,
                },
              ]}
              onPress={() => switchTab("otp")}
              disabled={loading}
            >
              <MaterialIcons
                name="sms"
                size={16}
                color={
                  activeTab === "otp" ? colors.brand.accent : colors.text.muted
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "otp"
                        ? colors.text.primary
                        : colors.text.muted,
                  },
                ]}
              >
                OTP Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heading Section */}
          <View style={styles.welcomeBlock}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {activeTab === "password" ? "Welcome back" : "Quick sign in"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              {activeTab === "password"
                ? "Sign in using your password credentials"
                : otpSent
                  ? `Enter verification code sent to +91 ${cleanedPhone}`
                  : "Sign in instantly via high-speed SMS verification"}
            </Text>
          </View>

          {/* Phone input field */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.background.input,
                borderColor: error ? colors.status.error : colors.border.input,
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

          {/* PASSWORD FIELD (Only in Password Tab) */}
          {activeTab === "password" && (
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
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={colors.text.faint}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handlePasswordLogin}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color={colors.text.faint}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* OTP COMPONENT (Only in OTP Tab, when SMS is sent) */}
          {activeTab === "otp" && otpSent && (
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
              <Text style={[styles.errorText, { color: colors.status.error }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          {activeTab === "password" ? (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isDark
                    ? colors.brand.accent
                    : colors.brand.primary,
                },
                (!canSubmitPassword || loading) && styles.buttonDisabled,
              ]}
              onPress={handlePasswordLogin}
              disabled={!canSubmitPassword || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Log in</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#ffffff"
                  />
                </>
              )}
            </TouchableOpacity>
          ) : (
            !otpSent && (
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
                onPress={triggerSendOtp}
                disabled={!canSendOtp || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send OTP Verification</Text>
                    <MaterialIcons name="sms" size={18} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>
            )
          )}

          {/* SIGN UP REDIRECTION */}
          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, { color: colors.text.muted }]}>
              New Cureli Rider?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/phone")}>
              <Text style={[styles.signUpLink, { color: colors.brand.accent }]}>
                Create an account
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.termsText, { color: colors.text.faint }]}>
            By continuing, you agree to our{" "}
            <Text style={[styles.termsLink, { color: colors.brand.accent }]}>
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text style={[styles.termsLink, { color: colors.brand.accent }]}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        <View style={styles.keyboardSpacer} />
      </ScrollView>
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
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  topSection: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 24,
    gap: 4,
  },
  brandName: {
    fontSize: 32,
    fontFamily: FontFamily.amulyaBold,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  formSection: { paddingHorizontal: 24, gap: 14 },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  welcomeBlock: { gap: 6, marginBottom: 4 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, lineHeight: 30 },
  subtitle: { fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 20 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  pencilButton: {
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  inputRow: {
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
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  eyeButton: { paddingRight: 14, paddingVertical: 8 },
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
  buttonText: { color: "#ffffff", fontSize: 16, fontFamily: FontFamily.bold },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  signUpText: { fontSize: 14, fontFamily: FontFamily.regular },
  signUpLink: { fontSize: 14, fontFamily: FontFamily.bold },
  termsText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  termsLink: { fontFamily: FontFamily.semiBold },
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
  keyboardSpacer: { height: 280 },
});
