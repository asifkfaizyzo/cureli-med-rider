// app/(auth)/login.tsx (do not remove this comment)
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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../src/features/auth/api/auth.api";
import {
  AuthFooter,
  AuthHeader,
  AuthTabs,
  WelcomeBlock,
} from "../../src/features/auth/components/AuthComponents";
import {
  OtpField,
  PasswordField,
  PhoneField,
} from "../../src/features/auth/components/AuthInputs";
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
  const { phone: paramPhone, tab: paramTab } = useLocalSearchParams<{
    phone: string;
    tab: string;
  }>();

  const [activeTab, setActiveTab] = useState<TabType>(
    paramTab === "otp" ? "otp" : "password",
  );
  const [phone, setPhone] = useState(paramPhone ?? "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const otpInputRef = useRef<any>(null);

  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const otpSentRef = useRef(otpSent);
  otpSentRef.current = otpSent;

  const cleanedPhone = phone.replace(/\D/g, "").trim();
  const canSubmitPassword = cleanedPhone.length === 10 && password.length >= 8;
  const canSendOtp = cleanedPhone.length === 10;
  const isDisabled = loading || redirecting;

  const cleanInput = (text: string) => {
    let cleaned = text.replace(/\D/g, "");
    if (cleaned.startsWith("91") && cleaned.length > 10)
      cleaned = cleaned.substring(2);
    else if (cleaned.startsWith("0") && cleaned.length > 10)
      cleaned = cleaned.substring(1);
    return cleaned.slice(0, 10);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function switchTab(tab: TabType) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
    setError(null);
    if (tab === "password") setOtp("");
  }

  function redirectToRegistration(message: string) {
    setError(message);
    setRedirecting(true);
    setTimeout(() => {
      router.push({
        pathname: "/(auth)/phone",
        params: { phone: cleanedPhone },
      });
    }, 1500);
  }

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (loadingRef.current) return;
      setError(null);
      setLoading(true);

      try {
        const result = await authApi.verifyOtp(cleanedPhone, code, "login");
        if (result.is_new && result.temp_token) {
          setTempToken(result.temp_token);
          setTimeout(() => router.replace("/(auth)/set-password"), 150);
        } else if (result.accessToken && result.rider) {
          setAuth(result.rider, result.accessToken, result.refreshToken!);
          const target = getRouteForRider(result.rider);
          setTimeout(() => router.replace(target), 150);
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

  async function handlePasswordLogin() {
    Keyboard.dismiss();
    setError(null);

    if (cleanedPhone.length < 10)
      return setError("Enter a valid 10-digit mobile number");
    if (!password || password.length < 8)
      return setError("Password must be at least 8 characters");

    setLoading(true);
    try {
      const result = await authApi.login(cleanedPhone, password);
      setAuth(result.rider, result.accessToken, result.refreshToken);
      const target = getRouteForRider(result.rider);
      setTimeout(() => router.replace(target), 150);
    } catch (err: unknown) {
      const { message, code } = extractError(err);
      if (code === "NOT_FOUND")
        return redirectToRegistration("No account found. Redirecting...");
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
      setError(
        code === "INVALID_PASSWORD"
          ? "Incorrect password. Please try again."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function triggerSendOtp() {
    if (cleanedPhone.length < 10)
      return setError("Enter a valid 10-digit mobile number");
    if (!/^[6-9]/.test(cleanedPhone))
      return setError("Enter a valid Indian mobile number");

    setLoading(true);
    setError(null);
    try {
      const result = await authApi.sendOtp(cleanedPhone, "login");
      setOtpSent(true);
      setResendCooldown(result.timeout || RESEND_COOLDOWN);
      setTimeout(() => otpInputRef.current?.focus(), 250);
    } catch (err: unknown) {
      const { code } = extractError(err);
      if (code === "NOT_FOUND")
        return redirectToRegistration("No account found. Redirecting...");
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || !cleanedPhone || resending) return;
    setResending(true);
    setError(null);
    setOtp("");

    try {
      const result = await authApi.sendOtp(cleanedPhone, "login");
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
        <AuthHeader />

        <View style={styles.formSection}>
          
          <WelcomeBlock
            activeTab={activeTab}
            otpSent={otpSent}
            cleanedPhone={cleanedPhone}
          />
          <AuthTabs
            activeTab={activeTab}
            switchTab={switchTab}
            disabled={isDisabled}
          />

          <PhoneField
            phone={phone}
            onChange={(t: string) => {
              setPhone(cleanInput(t));
              setError(null);
            }}
            error={!!error}
            disabled={isDisabled}
            otpSent={otpSent}
            onEdit={handleResetOtpState}
          />

          {activeTab === "password" && (
            <PasswordField
              password={password}
              onChange={(t: string) => {
                setPassword(t);
                setError(null);
              }}
              error={!!error}
              disabled={isDisabled}
              onSubmit={handlePasswordLogin}
              cleanedPhone={cleanedPhone}
            />
          )}

          {activeTab === "otp" && otpSent && (
            <OtpField
              ref={otpInputRef}
              otp={otp}
              onChange={(t: string) => {
                setOtp(t.replace(/\D/g, "").slice(0, OTP_LENGTH));
                setError(null);
              }}
              error={!!error}
              disabled={isDisabled}
              loading={loading}
              resendCooldown={resendCooldown}
              resending={resending}
              onResend={handleResendOtp}
              length={OTP_LENGTH}
            />
          )}

          {error && (
            <View style={styles.errorRow}>
              <MaterialIcons
                name={redirecting ? "info-outline" : "error-outline"}
                size={14}
                color={redirecting ? colors.brand.accent : colors.status.error}
              />
              <Text
                style={[
                  styles.errorText,
                  {
                    color: redirecting
                      ? colors.brand.accent
                      : colors.status.error,
                  },
                ]}
              >
                {error}
              </Text>
            </View>
          )}

          {activeTab === "password" ? (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isDark
                    ? colors.brand.accent
                    : colors.brand.primary,
                },
                (!canSubmitPassword || isDisabled) && styles.buttonDisabled,
              ]}
              onPress={handlePasswordLogin}
              disabled={!canSubmitPassword || isDisabled}
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
                  (!canSendOtp || isDisabled) && styles.buttonDisabled,
                ]}
                onPress={triggerSendOtp}
                disabled={!canSendOtp || isDisabled}
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

          <AuthFooter />
        </View>
        <View style={{ height: 280 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── UTILS ──
function extractError(err: unknown): { message: string; code?: string } {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as any;
    return {
      message: axiosErr.response?.data?.message ?? "Something went wrong.",
      code: axiosErr.response?.data?.data?.code,
    };
  }
  return { message: "Something went wrong. Please try again." };
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as any;
    if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
  }
  return "Something went wrong. Please try again.";
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  formSection: { paddingHorizontal: 24, gap: 14 },
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
});