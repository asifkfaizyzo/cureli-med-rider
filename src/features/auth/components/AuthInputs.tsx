// src/features/auth/components/AuthInputs.tsx (do not remove this comment)
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { forwardRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";
import { FontFamily } from "../../../theme/typography";

export function PhoneField({ phone, onChange, error, disabled, otpSent, onEdit }: any) {
  const { colors, isDark } = useTheme();

  return (
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
            backgroundColor: isDark ? colors.background.elevated : "#f1f5f9",
            borderRightColor: colors.border.input,
          },
        ]}
      >
        <Text style={styles.prefixFlag}>🇮🇳</Text>
        <Text style={[styles.prefixText, { color: colors.text.secondary }]}>+91</Text>
      </View>
      <TextInput
        style={[styles.input, { color: colors.text.primary }]}
        value={phone}
        onChangeText={onChange}
        placeholder="98765 43210"
        placeholderTextColor={colors.text.faint}
        keyboardType="number-pad"
        maxLength={10}
        editable={!disabled && !otpSent}
        returnKeyType="done"
      />
      {otpSent && (
        <TouchableOpacity onPress={onEdit} style={styles.pencilButton} hitSlop={8} disabled={disabled}>
          <MaterialIcons name="edit" size={18} color={colors.brand.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function PasswordField({ password, onChange, error, disabled, onSubmit, cleanedPhone }: any) {
  const { colors } = useTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.background.input,
            borderColor: error ? colors.status.error : colors.border.input,
          },
        ]}
      >
        <MaterialIcons name="lock-outline" size={20} color={colors.text.faint} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text.primary }]}
          value={password}
          onChangeText={onChange}
          placeholder="Enter your password"
          placeholderTextColor={colors.text.faint}
          secureTextEntry={!showPassword}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          editable={!disabled}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8} style={styles.eyeButton}>
          <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color={colors.text.faint} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.forgotPasswordRow}
        onPress={() => router.push({ pathname: "/(auth)/forgot-password", params: { phone: cleanedPhone } })}
        disabled={disabled}
      >
        <Text style={[styles.forgotPasswordText, { color: colors.brand.accent }]}>Forgot Password?</Text>
      </TouchableOpacity>
    </>
  );
}

export const OtpField = forwardRef<TextInput, any>(
  ({ otp, onChange, error, disabled, loading, resendCooldown, resending, onResend, length }, ref) => {
    const { colors } = useTheme();

    return (
      <View style={styles.otpSectionContainer}>
        <TextInput
          ref={ref}
          value={otp}
          onChangeText={onChange}
          keyboardType="number-pad"
          maxLength={length}
          caretHidden
          style={styles.hiddenInput}
          editable={!disabled}
        />
        <View style={styles.otpBoxRow}>
          {Array.from({ length }).map((_, index) => {
            const char = otp[index] ?? "";
            const isCurrent = index === otp.length && !loading;
            const isFilled = index < otp.length;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.otpBox,
                  { backgroundColor: colors.background.input, borderColor: colors.border.input },
                  isFilled && { borderColor: colors.brand.accent, backgroundColor: colors.background.tint },
                  isCurrent && { borderColor: colors.brand.accent, borderWidth: 2, backgroundColor: colors.background.card },
                  error ? { borderColor: colors.status.error, backgroundColor: colors.status.errorBg } : null,
                ]}
                // @ts-ignore
                onPress={() => ref?.current?.focus()}
                activeOpacity={1}
              >
                <Text style={[styles.otpChar, { color: colors.text.primary }]}>{char}</Text>
                {isCurrent && <View style={[styles.cursor, { backgroundColor: colors.brand.accent }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.resendInlineRow}>
          <Text style={[styles.resendInlineText, { color: colors.text.muted }]}>Didn't receive the OTP?</Text>
          <TouchableOpacity onPress={onResend} disabled={resendCooldown > 0 || resending || disabled}>
            {resending ? (
              <ActivityIndicator color={colors.brand.accent} size="small" />
            ) : resendCooldown > 0 ? (
              <Text style={[styles.resendCooldownText, { color: colors.text.faint }]}>Resend in {resendCooldown}s</Text>
            ) : (
              <Text style={[styles.resendActiveText, { color: colors.brand.accent }]}>Resend SMS</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
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
  pencilButton: { paddingHorizontal: 14, justifyContent: "center", alignItems: "center" },
  inputIcon: { paddingLeft: 14 },
  eyeButton: { paddingRight: 14, paddingVertical: 8 },
  forgotPasswordRow: { alignSelf: "flex-end", marginTop: -6, marginBottom: -4 },
  forgotPasswordText: { fontSize: 13, fontFamily: FontFamily.semiBold },
  otpSectionContainer: { alignItems: "center", width: "100%", gap: 16, marginTop: 6 },
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
  cursor: { position: "absolute", bottom: 10, width: 2, height: 20, borderRadius: 1 },
  resendInlineRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 4 },
  resendInlineText: { fontSize: 13, fontFamily: FontFamily.regular },
  resendCooldownText: { fontSize: 13, fontFamily: FontFamily.semiBold },
  resendActiveText: { fontSize: 13, fontFamily: FontFamily.bold },
});