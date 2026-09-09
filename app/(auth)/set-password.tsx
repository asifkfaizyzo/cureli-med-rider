import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { authApi } from "../../src/features/auth/api/auth.api";
import { getRouteForRider } from "../../src/features/auth/utils/authNavigation";
import { FontFamily } from "../../src/theme/typography";

export default function SetPasswordScreen() {
  const { setAuth, tempToken } = useAuthStore();
  const { colors, isDark } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  function validate(): string | null {
    if (!password) return "Enter a password";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
      return "Must contain a letter and a number";
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
      // getRouteForRider now uses onboarding_step field
      // New riders will have step = PERSONAL_DETAILS, status = DRAFT
      // → returns "/(onboarding)/personal-details"
      const target = getRouteForRider(rider);
      router.replace(target as any);
    } else {
      router.replace("/(onboarding)/personal-details");
    }
  }

  const canSubmit =
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword &&
    !!tempToken;

  // ── Success State ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.successContainer}>
          <View
            style={[
              styles.successIconWrapper,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <MaterialIcons
              name="check-circle"
              size={64}
              color={colors.status.success}
            />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            Account Created!
          </Text>

          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Your password has been set successfully. Let's complete your profile
            to get you started as a delivery partner.
          </Text>

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
            onPress={handleNavigateToOnboarding}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Complete Profile</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form State ─────────────────────────────────────────────
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
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons name="lock" size={28} color={colors.brand.accent} />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>
              Create your password
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Choose a strong password with at least 8 characters.
            </Text>
          </View>

          <View style={styles.formSection}>
            {/* Password */}
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
                placeholder="New password (min 8 chars)"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="next"
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

            {/* Validation hints */}
            <View style={styles.hints}>
              <Text
                style={[
                  styles.hint,
                  {
                    color:
                      password.length >= 8
                        ? colors.status.success
                        : colors.text.faint,
                  },
                ]}
              >
                {password.length >= 8 ? "✓" : "○"} At least 8 characters
              </Text>
              <Text
                style={[
                  styles.hint,
                  {
                    color:
                      /[A-Za-z]/.test(password) && /\d/.test(password)
                        ? colors.status.success
                        : colors.text.faint,
                  },
                ]}
              >
                {/[A-Za-z]/.test(password) && /\d/.test(password) ? "✓" : "○"}{" "}
                Letter and number
              </Text>
            </View>

            {/* Confirm */}
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor:
                    confirmPassword.length > 0 && password !== confirmPassword
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
              />
            </View>

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
                  <Text style={styles.buttonText}>Create Account</Text>
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
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  backText: { fontSize: 14, fontFamily: FontFamily.medium },
  header: {
    alignItems: "center",
    gap: 10,
    paddingTop: 32,
    paddingBottom: 32,
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
    paddingHorizontal: 24,
  },
  formSection: { gap: 14 },
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
  eyeButton: { paddingRight: 14, paddingVertical: 8 },
  hints: { gap: 4, paddingHorizontal: 4 },
  hint: { fontSize: 12, fontFamily: FontFamily.medium },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -6,
  },
  errorText: { fontSize: 13, fontFamily: FontFamily.medium },
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
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  successButton: {
    width: "100%",
    marginTop: 20,
  },
});