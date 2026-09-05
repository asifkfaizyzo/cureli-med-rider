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

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function SetPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { temp_token } = useLocalSearchParams<{ temp_token: string }>();
  const { setAuth } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = PASSWORD_REGEX.test(password);
  const match = password === confirm && confirm.length > 0;
  const canSubmit = isValid && match;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authApi.setPassword(temp_token!, password);
      setAuth(result.rider, result.accessToken, result.refreshToken);

      // New rider always goes to onboarding
      router.replace('/(onboarding)/personal-details');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Failed to set password.',
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Create your password
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            You'll use this to log in to your rider account
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
          {/* Password */}
          <Text style={[styles.label, { color: colors.text.secondary }]}>
            Password
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background.input,
                borderColor: colors.border.input,
                color: colors.text.primary,
              },
            ]}
            placeholder="Min 8 chars, letter + number"
            placeholderTextColor={colors.text.faint}
            secureTextEntry
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
          />

          {/* Validation hints */}
          <View style={styles.hints}>
            <Text
              style={[
                styles.hint,
                {
                  color: password.length >= 8
                    ? colors.status.success ?? '#22c55e'
                    : colors.text.faint,
                },
              ]}
            >
              {password.length >= 8 ? '✓' : '○'} At least 8 characters
            </Text>
            <Text
              style={[
                styles.hint,
                {
                  color: /[A-Za-z]/.test(password) && /\d/.test(password)
                    ? colors.status.success ?? '#22c55e'
                    : colors.text.faint,
                },
              ]}
            >
              {/[A-Za-z]/.test(password) && /\d/.test(password) ? '✓' : '○'}{' '}
              Letter and number
            </Text>
          </View>

          {/* Confirm */}
          <Text style={[styles.label, { color: colors.text.secondary }]}>
            Confirm password
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background.input,
                borderColor:
                  confirm.length > 0 && !match
                    ? colors.status.error
                    : colors.border.input,
                color: colors.text.primary,
              },
            ]}
            placeholder="Re-enter password"
            placeholderTextColor={colors.text.faint}
            secureTextEntry
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              setError(null);
            }}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {confirm.length > 0 && !match && (
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              Passwords don't match
            </Text>
          )}

          {error && (
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: canSubmit
                  ? colors.brand.primary
                  : colors.border.default,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
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
  header: { alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 24, gap: 8 },
  label: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  hints: { gap: 4, marginTop: 4, marginBottom: 4 },
  hint: { fontSize: 12 },
  errorText: { fontSize: 13, marginTop: 2 },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});