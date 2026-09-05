import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/theme/ThemeContext';
import { onboardingApi } from '../../src/features/onboarding/api/onboarding.api';

export default function DocPanScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [uri, setUri] = useState<string | null>(null);
  const [state, setState] = useState<'empty' | 'uploading' | 'done' | 'error'>('empty');
  const [error, setError] = useState<string | null>(null);

  async function handlePick() {
    setError(null);

    const img: { uri: string; name: string; type: string } | null = await new Promise((resolve) => {
      Alert.alert('Choose source', '', [
        { text: 'Camera', onPress: async () => { const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 }); if (!r.canceled && r.assets[0]) resolve({ uri: r.assets[0].uri, name: 'pan.jpg', type: r.assets[0].mimeType || 'image/jpeg' }); else resolve(null); } },
        { text: 'Gallery', onPress: async () => { const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }); if (!r.canceled && r.assets[0]) resolve({ uri: r.assets[0].uri, name: 'pan.jpg', type: r.assets[0].mimeType || 'image/jpeg' }); else resolve(null); } },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });

    if (!img) return;

    setUri(img.uri);
    setState('uploading');
    try {
      await onboardingApi.uploadDocument('PAN_FRONT', true, img.uri, img.name, img.type);
      setState('done');
    } catch {
      setState('error');
      setError('Failed to upload PAN card.');
    }
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background.page }]} contentContainerStyle={styles.scroll}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { backgroundColor: colors.border.default }]}><View style={[styles.progressFill, { backgroundColor: colors.brand.primary, width: '80%' }]} /></View>
        <Text style={[styles.stepText, { color: colors.text.muted }]}>Step 4 of 5 — Documents</Text>
      </View>

      <Text style={[styles.title, { color: colors.text.primary }]}>PAN Card</Text>
      <Text style={[styles.subtitle, { color: colors.text.muted }]}>Upload the front side of your PAN card</Text>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.background.card, borderColor: state === 'done' ? '#22c55e' : colors.border.default }]}
        onPress={handlePick}
        disabled={state === 'uploading'}
        activeOpacity={0.7}
      >
        {uri ? <Image source={{ uri }} style={styles.preview} /> : <View style={styles.placeholder}><Text style={{ fontSize: 32 }}>💳</Text><Text style={[styles.phText, { color: colors.text.muted }]}>PAN Card Front</Text></View>}
        <View style={styles.footer}>
          <Text style={[styles.label, { color: colors.text.primary }]}>PAN Card</Text>
          {state === 'uploading' && <ActivityIndicator size="small" color={colors.brand.primary} />}
          {state === 'done' && <Text style={{ color: '#22c55e', fontSize: 18 }}>✓</Text>}
          {state === 'error' && <Text style={{ color: colors.status.error, fontSize: 13 }}>Retry</Text>}
          {state === 'empty' && <Text style={{ color: colors.brand.primary, fontSize: 13 }}>Upload</Text>}
        </View>
      </TouchableOpacity>

      {error && <Text style={[styles.error, { color: colors.status.error }]}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: state === 'done' ? colors.brand.primary : colors.border.default }]}
        onPress={() => router.push('/(onboarding)/doc-live-photo')}
        disabled={state !== 'done'}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, progress: { paddingTop: 60, paddingHorizontal: 24, gap: 6 }, progressBar: { height: 4, borderRadius: 2 }, progressFill: { height: 4, borderRadius: 2 }, stepText: { fontSize: 12, fontWeight: '500' },
  scroll: { padding: 24, gap: 12, paddingBottom: 40 }, title: { fontSize: 24, fontWeight: '700', marginTop: 8 }, subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: { borderWidth: 1.5, borderRadius: 14, overflow: 'hidden' }, preview: { width: '100%', height: 200, resizeMode: 'cover' }, placeholder: { height: 140, alignItems: 'center', justifyContent: 'center', gap: 8 }, phText: { fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }, label: { fontSize: 15, fontWeight: '600' }, error: { fontSize: 13 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});