// app/(onboarding)/location.tsx

import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

export default function LocationScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  // Form Fields
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [prefAddress, setPrefAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // UI States
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track field touch status for inline validations
  const [touched, setTouched] = useState({
    city: false,
    address: false,
  });

  // Validations
  const isCityValid = city.trim().length >= 2;
  const isAddressValid = address.trim().length >= 10;
  const formIsValid = isCityValid && isAddressValid;

  // Safe Stack-Aware Back Navigation
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(onboarding)/personal-details");
    }
  };

  async function useCurrentLocation() {
    Keyboard.dismiss();
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable location permissions in your device settings to use this feature.",
        );
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
          .join(", ");
        setPrefAddress(resolved);
        if (!city && geo.city) {
          setCity(geo.city);
          setTouched((prev) => ({ ...prev, city: true }));
        }
        if (!address) {
          setAddress(resolved);
          setTouched((prev) => ({ ...prev, address: true }));
        }
      }
    } catch {
      Alert.alert("Location Error", "Could not fetch your current location.");
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    if (!formIsValid) return;
    Keyboard.dismiss();
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

      router.push("/(onboarding)/vehicle-details");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to save location details.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Step Header */}
        <View style={styles.progressContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
            hitSlop={12}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={colors.text.muted}
            />
            <Text style={[styles.backText, { color: colors.text.muted }]}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.stepTracker}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepBar,
                  {
                    backgroundColor:
                      index <= 1 ? colors.brand.accent : colors.border.input,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepText, { color: colors.text.muted }]}>
            Step 2 of 5: Location
          </Text>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.headerBlock}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Your Location
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Where are you based? This helps us match you with nearby orders.
            </Text>
          </View>

          <View style={styles.formGroup}>
            {/* City Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Current City *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.city && !isCityValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="location-city"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor={colors.text.faint}
                  value={city}
                  onChangeText={setCity}
                  onBlur={() => setTouched((prev) => ({ ...prev, city: true }))}
                  autoCapitalize="words"
                  editable={!loading}
                />
                {touched.city && isCityValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.city && !isCityValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Please enter a valid city name
                </Text>
              )}
            </View>

            {/* Residential Address */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Residential Address *
              </Text>
              <View
                style={[
                  styles.textareaWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.address && !isAddressValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="home"
                  size={20}
                  color={colors.text.faint}
                  style={styles.textareaIcon}
                />
                <TextInput
                  style={[styles.textarea, { color: colors.text.primary }]}
                  placeholder="House no, street, area, landmark, PIN code"
                  placeholderTextColor={colors.text.faint}
                  value={address}
                  onChangeText={setAddress}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, address: true }))
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
              {touched.address && !isAddressValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Please provide a detailed address (min 10 characters)
                </Text>
              )}
            </View>

            {/* Preferred Delivery Area */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Preferred Delivery Area
                <Text
                  style={[styles.optionalTag, { color: colors.text.faint }]}
                >
                  {"  "}(Optional)
                </Text>
              </Text>

              <TouchableOpacity
                style={[
                  styles.locateBtn,
                  {
                    backgroundColor: colors.background.tint,
                    borderColor: colors.brand.accent,
                  },
                ]}
                onPress={useCurrentLocation}
                disabled={locating || loading}
                activeOpacity={0.75}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={colors.brand.accent} />
                ) : (
                  <>
                    <MaterialIcons
                      name="my-location"
                      size={18}
                      color={colors.brand.accent}
                    />
                    <Text
                      style={[
                        styles.locateBtnText,
                        { color: colors.brand.accent },
                      ]}
                    >
                      {lat && lng
                        ? "Update current location"
                        : "Use current location"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Resolved Location Card */}
              {lat && lng && (
                <View
                  style={[
                    styles.locationCard,
                    {
                      backgroundColor: colors.background.input,
                      borderColor: colors.border.input,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.locationIconBadge,
                      { backgroundColor: colors.background.tint },
                    ]}
                  >
                    <MaterialIcons
                      name="place"
                      size={20}
                      color={colors.brand.accent}
                    />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text
                      style={[
                        styles.locationTitle,
                        { color: colors.text.primary },
                      ]}
                      numberOfLines={2}
                    >
                      {prefAddress || "Location pinned"}
                    </Text>
                    <Text
                      style={[
                        styles.locationCoords,
                        { color: colors.text.muted },
                      ]}
                    >
                      {lat.toFixed(5)}°, {lng.toFixed(5)}°
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Form Level Error Banner */}
          {error && (
            <View style={styles.errorRow}>
              <MaterialIcons
                name="error-outline"
                size={16}
                color={colors.status.error}
              />
              <Text style={[styles.errorText, { color: colors.status.error }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isDark
                  ? colors.brand.accent
                  : colors.brand.primary,
              },
              (!formIsValid || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={!formIsValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  stepTracker: {
    flexDirection: "row",
    gap: 6,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 24,
  },
  headerBlock: {
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  formGroup: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  optionalTag: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  inputIcon: {
    paddingLeft: 14,
  },
  rightIcon: {
    paddingRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  textareaWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 100,
  },
  textareaIcon: {
    paddingLeft: 14,
    paddingTop: 16,
  },
  textarea: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 10,
    paddingVertical: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  fieldError: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginTop: 2,
    marginLeft: 2,
  },
  locateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  locateBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginTop: 10,
  },
  locationIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  locationDetails: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    lineHeight: 18,
  },
  locationCoords: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
});
