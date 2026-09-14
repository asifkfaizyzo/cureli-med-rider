import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../src/features/auth/api/auth.api";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

export default function ResetPasswordScreen() {
  const { colors, isDark } = useTheme();
  const { token, phone } = useLocalSearchParams<{
    token: string;
    phone: string;
  }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Guard: redirect if no token
  useEffect(() => {
    if (!token) {
      router.replace("/(auth)/forgot-password");
    }
  }, [token]);

  function validate(): string | null {
    if (!password) return "Enter a new password";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
      return "Must contain at least one letter and one number";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!token) return "Session expired. Please request a new reset code.";
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
      await authApi.resetPassword(token!, password);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword &&
    !!token;

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
            Password Reset Successful!
          </Text>

          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Your password has been changed. All previous sessions have been
            logged out. Please log in with your new credentials.
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
            onPress={() =>
              router.replace({
                pathname: "/(auth)/login",
                params: { phone: phone ?? "" },
              })
            }
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Back to Login</Text>
            <MaterialIcons name="login" size={20} color="#ffffff" />
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
              <MaterialIcons
                name="lock-reset"
                size={28}
                color={colors.brand.accent}
              />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>
              Set new password
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Choose a strong password with at least 8 characters.
            </Text>
          </View>

          <View style={styles.formSection}>
            {/* New Password */}
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

            {/* Confirm Password */}
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
                placeholder="Confirm new password"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!loading}
              />
            </View>

            {/* Mismatch error */}
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

            {/* General error */}
            {error &&
              !(confirmPassword.length > 0 && password !== confirmPassword) && (
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

            {/* Submit */}
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
                  <Text style={styles.buttonText}>Reset Password</Text>
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
  return "Failed to reset password. Please try again.";
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
