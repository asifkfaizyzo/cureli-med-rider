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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { onboardingApi } from '../../src/features/onboarding/api/onboarding.api';
import { useAuthStore } from '../../src/store/authStore';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;

export default function PersonalDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    /^\d{4}-\d{2}-\d{2}$/.test(dob) &&
    gender.length > 0;

  async function handleSave() {
    if (!isValid) return;
    setError(null);
    setLoading(true);

    try {
      await onboardingApi.savePersonalDetails({
        full_name: name.trim(),
        email: email.trim(),
        date_of_birth: dob,
        sex: gender,
      });

      updateRider({
        full_name: name.trim(),
        email: email.trim(),
        date_of_birth: dob,
        sex: gender,
        has_personal_details: true,
      });

      router.push('/(onboarding)/location');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Failed to save details.',
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
      {/* Progress */}
      <View style={styles.progress}>
        <View style={[styles.progressBar, { backgroundColor: colors.border.default }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.brand.primary, width: '20%' }]} />
        </View>
        <Text style={[styles.stepText, { color: colors.text.muted }]}>Step 1 of 5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text.primary }]}>Personal Details</Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          Tell us about yourself
        </Text>

        {/* Name */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>Full Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background.input, borderColor: colors.border.input, color: colors.text.primary }]}
          placeholder="Enter your full name"
          placeholderTextColor={colors.text.faint}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Email */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>Email *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background.input, borderColor: colors.border.input, color: colors.text.primary }]}
          placeholder="your@email.com"
          placeholderTextColor={colors.text.faint}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* DOB */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>Date of Birth * (YYYY-MM-DD)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background.input, borderColor: colors.border.input, color: colors.text.primary }]}
          placeholder="1995-06-15"
          placeholderTextColor={colors.text.faint}
          value={dob}
          onChangeText={(t) => setDob(t.replace(/[^\d-]/g, ''))}
          maxLength={10}
          keyboardType="numbers-and-punctuation"
        />

        {/* Gender */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>Gender *</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderBtn,
                {
                  backgroundColor: gender === g ? colors.brand.primary : colors.background.input,
                  borderColor: gender === g ? colors.brand.primary : colors.border.input,
                },
              ]}
              onPress={() => setGender(g)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.genderText,
                  { color: gender === g ? '#fff' : colors.text.secondary },
                ]}
              >
                {g.charAt(0) + g.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && (
          <Text style={[styles.error, { color: colors.status.error }]}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: isValid ? colors.brand.primary : colors.border.default }]}
          onPress={handleSave}
          disabled={!isValid || loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progress: { paddingTop: 60, paddingHorizontal: 24, gap: 6 },
  progressBar: { height: 4, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  stepText: { fontSize: 12, fontWeight: '500' },
  scroll: { padding: 24, gap: 12, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, height: 50, paddingHorizontal: 16, fontSize: 15 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  genderText: { fontSize: 14, fontWeight: '600' },
  error: { fontSize: 13, marginTop: 4 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});