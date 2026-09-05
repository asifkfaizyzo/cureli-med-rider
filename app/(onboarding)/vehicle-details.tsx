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

const VEHICLE_TYPES = ['BIKE', 'SCOOTER', 'EV', 'OTHER'] as const;

export default function VehicleDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  const [vType, setVType] = useState<string>('');
  const [vNumber, setVNumber] = useState('');
  const [vMake, setVMake] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = vType.length > 0 && vNumber.trim().length >= 4;

  async function handleSave() {
    if (!isValid) return;
    setError(null);
    setLoading(true);

    try {
      await onboardingApi.saveVehicleDetails({
        vehicle_type: vType,
        vehicle_number: vNumber.trim().toUpperCase(),
        vehicle_make_model: vMake.trim() || undefined,
      });

      updateRider({
        vehicle_type: vType,
        vehicle_number: vNumber.trim().toUpperCase(),
        has_vehicle_details: true,
      });

      router.push('/(onboarding)/doc-driving-license');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to save.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.progress}>
        <View style={[styles.progressBar, { backgroundColor: colors.border.default }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.brand.primary, width: '60%' }]} />
        </View>
        <Text style={[styles.stepText, { color: colors.text.muted }]}>Step 3 of 5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text.primary }]}>Vehicle Details</Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          Tell us about your delivery vehicle
        </Text>

        <Text style={[styles.label, { color: colors.text.secondary }]}>Vehicle Type *</Text>
        <View style={styles.typeRow}>
          {VEHICLE_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeBtn,
                {
                  backgroundColor: vType === t ? colors.brand.primary : colors.background.input,
                  borderColor: vType === t ? colors.brand.primary : colors.border.input,
                },
              ]}
              onPress={() => setVType(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeText, { color: vType === t ? '#fff' : colors.text.secondary }]}>
                {t === 'EV' ? 'EV' : t.charAt(0) + t.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text.secondary }]}>Vehicle Number *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background.input, borderColor: colors.border.input, color: colors.text.primary }]}
          placeholder="e.g. MH02AB1234"
          placeholderTextColor={colors.text.faint}
          value={vNumber}
          onChangeText={(t) => setVNumber(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={20}
        />

        <Text style={[styles.label, { color: colors.text.secondary }]}>Make & Model (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background.input, borderColor: colors.border.input, color: colors.text.primary }]}
          placeholder="e.g. Honda Activa 6G"
          placeholderTextColor={colors.text.faint}
          value={vMake}
          onChangeText={setVMake}
          autoCapitalize="words"
        />

        {error && <Text style={[styles.error, { color: colors.status.error }]}>{error}</Text>}

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
  scroll: { padding: 24, gap: 10, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 12, height: 50, paddingHorizontal: 16, fontSize: 15 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  typeText: { fontSize: 13, fontWeight: '600' },
  error: { fontSize: 13, marginTop: 4 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});