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
import { useState } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { authApi } from '../../src/features/auth/api/auth.api';
import { useAuthStore } from '../../src/store/authStore';

type Tab = 'password' | 'otp';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setAuth } = useAuthStore();

  const [tab, setTab] = useState<Tab>('password');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // ── OTP timer ──────────────────────────────────────────────
  function startTimer(seconds: number) {
    setOtpTimer(seconds);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Password login ─────────────────────────────────────────
  async function handlePasswordLogin() {
    if (!password || password.length < 8) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.login(phone!, password);
      setAuth(result.rider, result.accessToken, result.refreshToken);
      routeAfterAuth(result.rider);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Login failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ── OTP flow ───────────────────────────────────────────────
  async function handleSendOtp() {
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.sendOtp(phone!);
      setOtpSent(true);
      startTimer(result.timeout);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Failed to send OTP.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.verifyOtp(phone!, otp);

      if (result.is_new) {
        // Shouldn't happen for existing riders, but handle gracefully
        router.replace({
          pathname: '/(auth)/set-password',
          params: { temp_token: result.temp_token! },
        });
        return;
      }

      setAuth(result.rider!, result.accessToken!, result.refreshToken!);
      routeAfterAuth(result.rider!);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'OTP verification failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Post-auth routing ──────────────────────────────────────
  function routeAfterAuth(rider: any) {
    if (rider.rider_type === 'TEAM') {
      router.replace('/(app)/home');
      return;
    }

    switch (rider.status) {
      case 'ACTIVE':
        if (!rider.has_bank_details) {
          router.replace('/(onboarding)/bank-details');
        } else if (!rider.has_accepted_terms) {
          router.replace('/(onboarding)/terms');
        } else {
          router.replace('/(app)/home');
        }
        break;
      case 'PENDING_REVIEW':
      case 'REJECTED':
        router.replace('/(onboarding)/status');
        break;
      default:
        router.replace('/(onboarding)/personal-details');
        break;
    }
  }

  // ── Render ─────────────────────────────────────────────────
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
            ← Change number
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.phoneLabel, { color: colors.text.muted }]}>
            Logging in as
          </Text>
          <Text style={[styles.phoneValue, { color: colors.text.primary }]}>
            +91 {phone}
          </Text>
        </View>

        {/* Tabs */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.background.input },
          ]}
        >
          {(['password', 'otp'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tab,
                tab === t && {
                  backgroundColor: colors.background.card,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                },
              ]}
              onPress={() => {
                setTab(t);
                setError(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      tab === t
                        ? colors.text.primary
                        : colors.text.muted,
                    fontWeight: tab === t ? '600' : '400',
                  },
                ]}
              >
                {t === 'password' ? 'Password' : 'OTP'}
              </Text>
            </TouchableOpacity>
          ))}
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
          {tab === 'password' ? (
            <>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Enter your password
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.input,
                    borderColor: error
                      ? colors.status.error
                      : colors.border.input,
                    color: colors.text.primary,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={colors.text.faint}
                secureTextEntry
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError(null);
                }}
                returnKeyType="done"
                onSubmitEditing={handlePasswordLogin}
              />

              {error && (
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  {error}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      password.length >= 8
                        ? colors.brand.primary
                        : colors.border.default,
                  },
                ]}
                onPress={handlePasswordLogin}
                disabled={password.length < 8 || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {otpSent ? 'Enter OTP' : 'Verify via OTP'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.muted }]}>
                {otpSent
                  ? 'We sent a 6-digit code to your phone'
                  : 'Get a one-time code on your phone'}
              </Text>

              {otpSent ? (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background.input,
                        borderColor: error
                          ? colors.status.error
                          : colors.border.input,
                        color: colors.text.primary,
                        fontSize: 24,
                        letterSpacing: 8,
                        textAlign: 'center',
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
                    onSubmitEditing={handleVerifyOtp}
                  />

                  {error && (
                    <Text
                      style={[
                        styles.errorText,
                        { color: colors.status.error },
                      ]}
                    >
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
                    onPress={handleVerifyOtp}
                    disabled={otp.length !== 6 || loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify & Log In</Text>
                    )}
                  </TouchableOpacity>

                  {/* Resend */}
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={otpTimer > 0 || loading}
                    activeOpacity={0.7}
                    style={styles.resendBtn}
                  >
                    <Text
                      style={[
                        styles.resendText,
                        {
                          color:
                            otpTimer > 0
                              ? colors.text.faint
                              : colors.brand.primary,
                        },
                      ]}
                    >
                      {otpTimer > 0
                        ? `Resend in ${otpTimer}s`
                        : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.brand.primary },
                  ]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
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
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: { fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
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