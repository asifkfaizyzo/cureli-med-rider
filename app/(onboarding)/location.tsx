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
import * as Location from 'expo-location';
import { useTheme } from '../../src/theme/ThemeContext';
import { onboardingApi } from '../../src/features/onboarding/api/onboarding.api';
import { useAuthStore } from '../../src/store/authStore';

export default function LocationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [prefAddress, setPrefAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = city.trim().length >= 2 && address.trim().length >= 5;

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location in settings.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLat(loc.coords.latitude);
      setLng(loc.coords.longitude);

      // Reverse geocode
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geo) {
        const resolved = [geo.street, geo.city, geo.region, geo.postalCode]
          .filter(Boolean)
          .join(', ');
        setPrefAddress(resolved);
        if (!city && geo.city) setCity(geo.city);
        if (!address) setAddress(resolved);
      }
    } catch {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    if (!isValid) return;
    setError(null);
    setLoading(true);

    try {
      await onboardingApi.saveLocation({
        current_city: city.trim(),
        residential_address: address.trim(),
        preferred_lat: lat ?? undefined,
        preferred_lng: lng ?? undefined,
        preferred_address: prefAddress.trim() || undefined,
      });

      updateRider({
        current_city: city.trim(),
        residential_address: address.trim(),
        has_location: true,
      });

      router.push('/(onboarding)/vehicle-details');
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
          <View style={[styles.progressFill, { backgroundColor: colors.brand.primary, width: '40%' }]} />
        </View>
        <Text style={[styles.stepText, { color: colors.text.muted }]}>Step 2 of 5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text.primary }]}>Your Location</Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          Where are you based? This helps us find orders near you.
        </Text>

        <Text style={[styles.label, { color: colors.text.secondary }]}>Current City *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background.input, borderColor: colors.border.input, color: colors.text.primary }]}
          placeholder="e.g. Mumbai"
          placeholderTextColor={colors.text.faint}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: colors.text.secondary }]}>Residential Address *</Text>
        <TextInput
          style={[styles.input, styles.multiline, { backgroundColor: colors.background.input, borderColor: colors.border.input, color: colors.text.primary }]}
          placeholder="Full address with area, street, landmark"
          placeholderTextColor={colors.text.faint}
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.text.secondary }]}>Preferred Delivery Area (optional)</Text>
        <TouchableOpacity
          style={[styles.locBtn, { backgroundColor: colors.background.input, borderColor: colors.border.input }]}
          onPress={useCurrentLocation}
          disabled={locating}
          activeOpacity={0.7}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.brand.primary} />
          ) : (
            <Text style={[styles.locBtnText, { color: colors.brand.primary }]}>
              📍 Use current location
            </Text>
          )}
        </TouchableOpacity>

        {lat && lng && (
          <Text style={[styles.coords, { color: colors.text.muted }]}>
            Pin set: {lat.toFixed(4)}, {lng.toFixed(4)}
            {prefAddress ? `\n${prefAddress}` : ''}
          </Text>
        )}

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
  multiline: { height: 90, paddingTop: 14 },
  locBtn: { borderWidth: 1, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  locBtnText: { fontSize: 15, fontWeight: '600' },
  coords: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  error: { fontSize: 13, marginTop: 4 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});