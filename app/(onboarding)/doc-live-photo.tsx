import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/theme/ThemeContext';
import { onboardingApi } from '../../src/features/onboarding/api/onboarding.api';

export default function DocLivePhotoScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [uri, setUri] = useState<string | null>(null);
  const [state, setState] = useState<'empty' | 'uploading' | 'done' | 'error'>('empty');
  const [error, setError] = useState<string | null>(null);

  async function handleTakePhoto() {
    setError(null);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });

    if (result.canceled || !result.assets[0]) return;

    const img = result.assets[0];
    setUri(img.uri);
    setState('uploading');

    try {
      await onboardingApi.uploadDocument(
        'PROFILE_PHOTO',
        true,
        img.uri,
        'selfie.jpg',
        img.mimeType || 'image/jpeg',
      );
      setState('done');
    } catch {
      setState('error');
      setError('Failed to upload photo.');
    }
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background.page }]} contentContainerStyle={styles.scroll}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { backgroundColor: colors.border.default }]}><View style={[styles.progressFill, { backgroundColor: colors.brand.primary, width: '85%' }]} /></View>
        <Text style={[styles.stepText, { color: colors.text.muted }]}>Step 4 of 5 — Documents</Text>
      </View>

      <Text style={[styles.title, { color: colors.text.primary }]}>Live Selfie</Text>
      <Text style={[styles.subtitle, { color: colors.text.muted }]}>
        Take a clear photo of your face right now. No gallery uploads allowed.
      </Text>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.background.card, borderColor: state === 'done' ? '#22c55e' : colors.border.default }]}
        onPress={handleTakePhoto}
        disabled={state === 'uploading'}
        activeOpacity={0.7}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <View style={[styles.faceGuide, { borderColor: colors.border.default }]}>
              <Text style={{ fontSize: 48 }}>🤳</Text>
            </View>
            <Text style={[styles.phText, { color: colors.text.muted }]}>Tap to take selfie</Text>
          </View>
        )}
        <View style={styles.footer}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Live Photo</Text>
          {state === 'uploading' && <ActivityIndicator size="small" color={colors.brand.primary} />}
          {state === 'done' && <Text style={{ color: '#22c55e', fontSize: 18 }}>✓</Text>}
          {state === 'error' && <Text style={{ color: colors.status.error, fontSize: 13 }}>Retake</Text>}
          {state === 'empty' && <Text style={{ color: colors.brand.primary, fontSize: 13 }}>📷 Camera</Text>}
        </View>
      </TouchableOpacity>

      {error && <Text style={[styles.error, { color: colors.status.error }]}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: state === 'done' ? colors.brand.primary : colors.border.default }]}
        onPress={() => router.push('/(onboarding)/submit-review')}
        disabled={state !== 'done'}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue to Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, progress: { paddingTop: 60, paddingHorizontal: 24, gap: 6 }, progressBar: { height: 4, borderRadius: 2 }, progressFill: { height: 4, borderRadius: 2 }, stepText: { fontSize: 12, fontWeight: '500' },
  scroll: { padding: 24, gap: 12, paddingBottom: 40 }, title: { fontSize: 24, fontWeight: '700', marginTop: 8 }, subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: { borderWidth: 1.5, borderRadius: 14, overflow: 'hidden' }, preview: { width: '100%', height: 280, resizeMode: 'cover' },
  placeholder: { height: 240, alignItems: 'center', justifyContent: 'center', gap: 12 },
  faceGuide: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  phText: { fontSize: 14 }, footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }, label: { fontSize: 15, fontWeight: '600' }, error: { fontSize: 13 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});