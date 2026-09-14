import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../src/features/auth/api/auth.api";
import { getRouteForRider } from "../../src/features/auth/utils/authNavigation";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

export default function SetPasswordScreen() {
  const { setAuth, tempToken } = useAuthStore();
  const { colors, isDark } = useTheme();

  // Inputs & Validation
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Focus States for Inputs
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
    useState(false);

  // Password Requirement Handlers
  const hasMinLength = password.length >= 8;
  const hasLetterAndNumber = /[A-Za-z]/.test(password) && /\d/.test(password);

  function validate(): string | null {
    if (!password) return "Enter a password";
    if (!hasMinLength) return "Password must be at least 8 characters";
    if (!hasLetterAndNumber) return "Must contain both a letter and a number";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!tempToken) return "Session expired. Please verify OTP again.";
    return null;
  }

  async function handleSubmit() {
    Keyboard.dismiss();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.setPassword(tempToken!, password);
      setAuth(result.rider, result.accessToken, result.refreshToken);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleNavigateToOnboarding() {
    const rider = useAuthStore.getState().rider;
    if (rider) {
      const target = getRouteForRider(rider);
      router.replace(target as any);
    } else {
      router.replace("/(onboarding)/personal-details");
    }
  }

  const canSubmit =
    hasMinLength &&
    hasLetterAndNumber &&
    password === confirmPassword &&
    !!tempToken;

  // ── Success State Layout ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <SuccessStateView
        colors={colors}
        isDark={isDark}
        onComplete={handleNavigateToOnboarding}
      />
    );
  }

  // ── Form State Layout ─────────────────────────────────────────────
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={16}
              color={colors.text.secondary}
            />
            <Text style={[styles.backText, { color: colors.text.secondary }]}>
              Back
            </Text>
          </TouchableOpacity>

          {/* Header Block */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name="security"
                size={32}
                color={colors.brand.accent}
              />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>
              Secure Your Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Choose a strong password to guard your earnings and profile info.
            </Text>
          </View>

          {/* Inputs Section */}
          <View style={styles.formSection}>
            {/* Input: New Password */}
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor: error
                    ? colors.status.error
                    : isPasswordFocused
                      ? colors.border.inputFocused
                      : colors.border.input,
                },
              ]}
            >
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={
                  isPasswordFocused ? colors.brand.accent : colors.text.faint
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                placeholder="New password (min 8 chars)"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                editable={!loading}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.eyeButton}
              >
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color={colors.text.faint}
                />
              </TouchableOpacity>
            </View>

            {/* Validation checklist */}
            <View style={styles.hintsContainer}>
              <View style={styles.hintItem}>
                <MaterialIcons
                  name={
                    hasMinLength ? "check-circle" : "radio-button-unchecked"
                  }
                  size={16}
                  color={
                    hasMinLength ? colors.status.success : colors.text.faint
                  }
                />
                <Text
                  style={[
                    styles.hintText,
                    {
                      color: hasMinLength
                        ? colors.text.primary
                        : colors.text.muted,
                    },
                  ]}
                >
                  At least 8 characters
                </Text>
              </View>

              <View style={styles.hintItem}>
                <MaterialIcons
                  name={
                    hasLetterAndNumber
                      ? "check-circle"
                      : "radio-button-unchecked"
                  }
                  size={16}
                  color={
                    hasLetterAndNumber
                      ? colors.status.success
                      : colors.text.faint
                  }
                />
                <Text
                  style={[
                    styles.hintText,
                    {
                      color: hasLetterAndNumber
                        ? colors.text.primary
                        : colors.text.muted,
                    },
                  ]}
                >
                  Contains a letter and a number
                </Text>
              </View>
            </View>

            {/* Input: Confirm Password */}
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor:
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? colors.status.error
                      : isConfirmPasswordFocused
                        ? colors.border.inputFocused
                        : colors.border.input,
                },
              ]}
            >
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={
                  isConfirmPasswordFocused
                    ? colors.brand.accent
                    : colors.text.faint
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError(null);
                }}
                placeholder="Confirm password"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!loading}
                onFocus={() => setIsConfirmPasswordFocused(true)}
                onBlur={() => setIsConfirmPasswordFocused(false)}
              />
            </View>

            {/* Live match warning */}
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <View style={styles.errorRow}>
                <MaterialIcons
                  name="error-outline"
                  size={14}
                  color={colors.status.error}
                />
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  Passwords don't match
                </Text>
              </View>
            )}

            {/* Error notifications */}
            {error && !confirmPassword && (
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

            {/* Confirm Actions */}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isDark
                    ? colors.brand.accent
                    : colors.brand.primary,
                },
                (loading || !canSubmit) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || !canSubmit}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Set Password</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#ffffff"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Animated Success Sub-component ──────────────────────────────────
function SuccessStateView({
  colors,
  isDark,
  onComplete,
}: {
  colors: any;
  isDark: boolean;
  onComplete: () => void;
}) {
  // Looping halo pulse
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.65);

  useEffect(() => {
    ringScale.value = withRepeat(
      withTiming(1.45, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [ringScale, ringOpacity]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.successContainer}>
        {/* Animated Pop-in Icon + Ambient Glow Ring */}
        <View style={styles.successIconCenterContainer}>
          <Animated.View
            style={[
              styles.successPulseRing,
              { backgroundColor: colors.status.successBg },
              animatedRingStyle,
            ]}
          />

          <Animated.View
            entering={ZoomIn.duration(650).springify().damping(10).mass(0.8)}
            style={[
              styles.successIconWrapper,
              { backgroundColor: colors.status.successBg },
            ]}
          >
            <MaterialIcons
              name="check-circle"
              size={64}
              color={colors.status.success}
            />
          </Animated.View>
        </View>

        {/* Staggered Heading */}
        <Animated.Text
          entering={FadeInUp.delay(250).duration(500).springify().damping(12)}
          style={[styles.successTitle, { color: colors.text.primary }]}
        >
          Password Set Successfully!
        </Animated.Text>

        {/* Staggered Description */}
        <Animated.Text
          entering={FadeInUp.delay(380).duration(500).springify().damping(12)}
          style={[styles.successSubtitle, { color: colors.text.muted }]}
        >
          Your secure account credentials have been established. Let's get
          started on completing your profile to begin deliveries.
        </Animated.Text>

        {/* Staggered Floating Button */}
        <Animated.View
          entering={FadeInDown.delay(520).duration(500).springify().damping(12)}
          style={styles.successButtonWrapper}
        >
          <TouchableOpacity
            style={[
              styles.button,
              styles.successButton,
              {
                backgroundColor: isDark
                  ? colors.brand.accent
                  : colors.brand.primary,
              },
            ]}
            onPress={onComplete}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Complete Onboarding</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    const message = axiosErr.response?.data?.message;
    if (message) return message;
  }
  return "Failed to set password. Please try again.";
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
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 12,
  },
  backText: { fontSize: 15, fontFamily: FontFamily.semiBold },
  header: {
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 32,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  formSection: { gap: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  eyeButton: { paddingRight: 14, paddingVertical: 12 },
  hintsContainer: {
    gap: 8,
    paddingHorizontal: 4,
    marginTop: -4,
    marginBottom: 4,
  },
  hintItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  errorText: { fontSize: 13, fontFamily: FontFamily.medium },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  // ── Success State Styles ──────────────────────────────────────────
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  successIconCenterContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
    width: 110,
    height: 110,
  },
  successPulseRing: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  successIconWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    lineHeight: 30,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  successButtonWrapper: {
    width: "100%",
  },
  successButton: {
    width: "100%",
    marginTop: 12,
  },
});