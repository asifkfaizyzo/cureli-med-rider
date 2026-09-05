import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { authApi } from '../../src/features/auth/api/auth.api';

export default function OtpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown on mount
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleVerify() {
    if (otp.length !== 6) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.verifyOtp(phone!, otp);

      if (result.is_new && result.temp_token) {
        // New rider → set password
        router.replace({
          pathname: '/(auth)/set-password',
          params: { temp_token: result.temp_token },
        });
      } else if (result.accessToken && result.rider) {
        // Existing rider (shouldn't happen from this flow, but handle)
        const { useAuthStore } = require('../../src/store/authStore');
        useAuthStore
          .getState()
          .setAuth(result.rider, result.accessToken, result.refreshToken!);
        router.replace('/(app)/home');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Invalid OTP. Try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (timer > 0) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.sendOtp(phone!);
      setTimer(result.timeout);
      setOtp('');

      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Failed to resend OTP.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: colors.text.muted }]}>
            ← Back
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.phoneLabel, { color: colors.text.muted }]}>
            Verify your number
          </Text>
          <Text style={[styles.phoneValue, { color: colors.text.primary }]}>
            +91 {phone}
          </Text>
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Enter the 6-digit OTP
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Sent via SMS to your phone
          </Text>

          <TextInput
            style={[
              styles.otpInput,
              {
                backgroundColor: colors.background.input,
                borderColor: error
                  ? colors.status.error
                  : colors.border.input,
                color: colors.text.primary,
              },
            ]}
            placeholder="000000"
            placeholderTextColor={colors.text.faint}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(t) => {
              setOtp(t.replace(/\D/g, ''));
              setError(null);
            }}
            returnKeyType="done"
            onSubmitEditing={handleVerify}
            autoFocus
          />

          {error && (
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor:
                  otp.length === 6
                    ? colors.brand.primary
                    : colors.border.default,
              },
            ]}
            onPress={handleVerify}
            disabled={otp.length !== 6 || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={timer > 0 || loading}
            activeOpacity={0.7}
            style={styles.resendBtn}
          >
            <Text
              style={[
                styles.resendText,
                {
                  color:
                    timer > 0 ? colors.text.faint : colors.brand.primary,
                },
              ]}
            >
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 20,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 14, fontWeight: '500' },
  header: { alignItems: 'center', gap: 4 },
  phoneLabel: { fontSize: 13 },
  phoneValue: { fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  otpInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 60,
    fontSize: 28,
    letterSpacing: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: { fontSize: 13, marginTop: 2 },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendBtn: { alignItems: 'center', marginTop: 8, padding: 4 },
  resendText: { fontSize: 14, fontWeight: '500' },
});