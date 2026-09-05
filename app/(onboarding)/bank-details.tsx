import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { onboardingApi } from '../../src/features/onboarding/api/onboarding.api';
import { useAuthStore } from '../../src/store/authStore';

export default function BankDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMatching = accountNumber === confirmAccountNumber && accountNumber.length > 0;
  const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  
  const isValid =
    holderName.trim().length >= 2 &&
    accountNumber.length >= 9 &&
    accountNumber.length <= 18 &&
    isMatching &&
    isIfscValid &&
    bankName.trim().length >= 2;

  async function handleSave() {
    if (!isValid) return;
    setError(null);
    setLoading(true);

    try {
      await onboardingApi.saveBankDetails({
        bank_account_number: accountNumber.trim(),
        bank_ifsc: ifsc.trim(),
        bank_holder_name: holderName.trim(),
        bank_name: bankName.trim(),
      });

      updateRider({
        bank_holder_name: holderName.trim(),
        bank_account_last4: accountNumber.slice(-4),
        bank_verified: false,
        has_bank_details: true,
      });

      router.push('/(onboarding)/terms');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Failed to save bank details.',
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text.primary }]}>Bank Details</Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          Enter your bank account where you would like to receive payouts.
        </Text>

        {/* Account Holder Name */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          Account Holder Name *
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
          placeholder="Name as in bank account"
          placeholderTextColor={colors.text.faint}
          value={holderName}
          onChangeText={setHolderName}
          autoCapitalize="words"
        />

        {/* Bank Name */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>Bank Name *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background.input,
              borderColor: colors.border.input,
              color: colors.text.primary,
            },
          ]}
          placeholder="e.g. HDFC Bank"
          placeholderTextColor={colors.text.faint}
          value={bankName}
          onChangeText={setBankName}
          autoCapitalize="words"
        />

        {/* IFSC Code */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>IFSC Code *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background.input,
              borderColor:
                ifsc.length > 0 && !isIfscValid ? colors.status.error : colors.border.input,
              color: colors.text.primary,
            },
          ]}
          placeholder="e.g. HDFC0001234"
          placeholderTextColor={colors.text.faint}
          value={ifsc}
          onChangeText={(t) => setIfsc(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={11}
          autoCapitalize="characters"
        />

        {/* Account Number */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>Account Number *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background.input,
              borderColor: colors.border.input,
              color: colors.text.primary,
            },
          ]}
          placeholder="Enter account number"
          placeholderTextColor={colors.text.faint}
          keyboardType="number-pad"
          value={accountNumber}
          onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ''))}
          maxLength={18}
        />

        {/* Confirm Account Number */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          Confirm Account Number *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background.input,
              borderColor:
                confirmAccountNumber.length > 0 && !isMatching
                  ? colors.status.error
                  : colors.border.input,
              color: colors.text.primary,
            },
          ]}
          placeholder="Re-enter account number"
          placeholderTextColor={colors.text.faint}
          keyboardType="number-pad"
          value={confirmAccountNumber}
          onChangeText={(t) => setConfirmAccountNumber(t.replace(/\D/g, ''))}
          maxLength={18}
        />

        {confirmAccountNumber.length > 0 && !isMatching && (
          <Text style={[styles.errorText, { color: colors.status.error }]}>
            Account numbers do not match
          </Text>
        )}

        {error && (
          <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isValid ? colors.brand.primary : colors.border.default,
            },
          ]}
          onPress={handleSave}
          disabled={!isValid || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Details</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 64,
    gap: 12,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  errorText: {
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});