import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { onboardingApi } from '../../src/features/onboarding/api/onboarding.api';
import { useAuthStore } from '../../src/store/authStore';

export default function SubmitReviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { rider, updateRider } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      await onboardingApi.submit();
      updateRider({ status: 'PENDING_REVIEW' });
      router.replace('/(onboarding)/status');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Submission failed.');
    } finally {
      setLoading(false);
    }
  }

  const docs = [
    { label: 'Driving License', done: true },
    { label: 'Aadhaar Card', done: true },
    { label: 'PAN Card', done: true },
    { label: 'Live Photo', done: true },
  ];

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background.page }]} contentContainerStyle={styles.scroll}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { backgroundColor: colors.border.default }]}><View style={[styles.progressFill, { backgroundColor: colors.brand.primary, width: '95%' }]} /></View>
        <Text style={[styles.stepText, { color: colors.text.muted }]}>Step 5 of 5</Text>
      </View>

      <Text style={[styles.title, { color: colors.text.primary }]}>Review & Submit</Text>
      <Text style={[styles.subtitle, { color: colors.text.muted }]}>
        Make sure everything looks good before submitting for verification.
      </Text>

      {/* Summary */}
      <View style={[styles.section, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Personal Info</Text>
        <Row label="Name" value={rider?.full_name ?? '—'} colors={colors} />
        <Row label="Email" value={rider?.email ?? '—'} colors={colors} />
        <Row label="DOB" value={rider?.date_of_birth ?? '—'} colors={colors} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Location</Text>
        <Row label="City" value={rider?.current_city ?? '—'} colors={colors} />
        <Row label="Address" value={rider?.residential_address ?? '—'} colors={colors} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Vehicle</Text>
        <Row label="Type" value={rider?.vehicle_type ?? '—'} colors={colors} />
        <Row label="Number" value={rider?.vehicle_number ?? '—'} colors={colors} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Documents</Text>
        {docs.map((d) => (
          <Row key={d.label} label={d.label} value="✓ Uploaded" colors={colors} valueColor="#22c55e" />
        ))}
      </View>

      {error && <Text style={[styles.error, { color: colors.status.error }]}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.brand.primary }]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit for Verification</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value, colors, valueColor }: { label: string; value: string; colors: any; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.text.muted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor || colors.text.primary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, progress: { paddingTop: 60, paddingHorizontal: 24, gap: 6 }, progressBar: { height: 4, borderRadius: 2 }, progressFill: { height: 4, borderRadius: 2 }, stepText: { fontSize: 12, fontWeight: '500' },
  scroll: { padding: 24, gap: 12, paddingBottom: 40 }, title: { fontSize: 24, fontWeight: '700', marginTop: 8 }, subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  section: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 }, sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, rowLabel: { fontSize: 13 }, rowValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  error: { fontSize: 13 }, button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});