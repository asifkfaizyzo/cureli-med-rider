// app/(auth)/otp.tsx

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { authApi } from '../../src/features/auth/api/auth.api';
import { getRouteForRider } from '../../src/features/auth/utils/authNavigation';
import { FontFamily } from '../../src/theme/typography';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function OtpScreen() {
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone ?? '';

  const { setAuth, setTempToken } = useAuthStore();
  const { colors } = useTheme();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Countdown timer
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

  // Auto-verify when all 6 digits entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !loading) {
      Keyboard.dismiss();
      handleVerify(otp);
    }
  }, [otp]);

  async function handleVerify(code: string) {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.verifyOtp(phone, code);

      if (result.is_new && result.temp_token) {
        // Store token in Zustand — DO NOT pass as URL param
        setTempToken(result.temp_token);
        // Small delay to let store persist before navigation
        setTimeout(() => {
          router.replace('/(auth)/set-password');
        }, 150);
      } else if (result.accessToken && result.rider) {
        setAuth(result.rider, result.accessToken, result.refreshToken!);
        const target = getRouteForRider(result.rider);
        setTimeout(() => {
          router.replace(target as any);
        }, 150);
      }
    } catch (err: unknown) {
      setOtp('');
      setError(extractErrorMessage(err));
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !phone || resending) return;
    setResending(true);
    setError(null);
    setOtp('');

    try {
      const result = await authApi.sendOtp(phone);
      setResendCooldown(result.timeout || RESEND_COOLDOWN);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  function handleOtpChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (error) setError(null);
  }

  function renderOtpBoxes() {
    return (
      <View style={styles.otpBoxRow}>
        {Array.from({ length: OTP_LENGTH }).map((_, index) => {
          const char = otp[index] ?? '';
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
              onPress={() => inputRef.current?.focus()}
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
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.text.muted} />
            <Text style={[styles.backText, { color: colors.text.muted }]}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View
              style={[
                styles.otpIconWrapper,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons name="sms" size={28} color={colors.brand.accent} />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>
              Verification code
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              We sent a 6-digit code to{'\n'}
              <Text
                style={[styles.phoneHighlight, { color: colors.text.primary }]}
              >
                +91 {phone}
              </Text>
            </Text>
          </View>

          <View style={styles.otpSection}>
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              autoFocus
              caretHidden
              style={styles.hiddenInput}
              editable={!loading}
            />
            {renderOtpBoxes()}
          </View>

          <View style={styles.statusSlot}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.brand.accent} size="small" />
                <Text
                  style={[styles.loadingText, { color: colors.brand.accent }]}
                >
                  Verifying…
                </Text>
              </View>
            ) : error ? (
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
            ) : (
              <View />
            )}
          </View>

          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.text.muted }]}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0 || resending || loading}
            >
              {resending ? (
                <ActivityIndicator color={colors.brand.accent} size="small" />
              ) : resendCooldown > 0 ? (
                <Text
                  style={[styles.resendCooldown, { color: colors.text.faint }]}
                >
                  Resend in {resendCooldown}s
                </Text>
              ) : (
                <Text
                  style={[styles.resendActive, { color: colors.brand.accent }]}
                >
                  Resend code
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    const message = axiosErr.response?.data?.message;
    if (message) return message;
  }
  return 'Failed to verify OTP. Please try again.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backText: { fontSize: 14, fontFamily: FontFamily.medium },
  header: { alignItems: 'center', gap: 10, paddingTop: 16 },
  otpIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneHighlight: { fontFamily: FontFamily.semiBold },
  otpSection: { alignItems: 'center', position: 'relative', marginTop: 8 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  otpBoxRow: { flexDirection: 'row', gap: 10 },
  otpBox: {
    width: 48,
    height: 58,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otpChar: { fontSize: 22, fontFamily: FontFamily.bold },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: 2,
    height: 22,
    borderRadius: 1,
  },
  statusSlot: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  errorText: { fontSize: 13, fontFamily: FontFamily.medium },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { fontSize: 14, fontFamily: FontFamily.medium },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  resendLabel: { fontSize: 14, fontFamily: FontFamily.regular },
  resendCooldown: { fontSize: 14, fontFamily: FontFamily.semiBold },
  resendActive: { fontSize: 14, fontFamily: FontFamily.bold },
});