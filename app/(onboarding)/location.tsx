// app/(onboarding)/location.tsx (do not remove this comment)
//app\(onboarding)\location.tsx
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { OnboardingWrapper } from "../../src/components/OnboardingWrapper";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

// Import your localized city list JSON
import cityListData from "../../assets/data/cityList.json";

interface CityItem {
  city: string;
  state: string;
}

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Focus States
  const [isCityFocused, setIsCityFocused] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);

  // City Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<CityItem[]>([]);

  const [touched, setTouched] = useState({ city: false, address: false });

  // ── Load existing data ──────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const status = await onboardingApi.getStatus();
        if (status.location) {
          setCity(status.location.current_city || "");
          setAddress(status.location.residential_address || "");
          setPrefAddress(status.location.preferred_address || "");
          if (status.location.preferred_lat)
            setLat(status.location.preferred_lat);
          if (status.location.preferred_lng)
            setLng(status.location.preferred_lng);
        }
      } catch {
        // silent fail
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, []);

  const isCityValid = city.trim().length >= 2;
  const isAddressValid = address.trim().length >= 5;
  const formIsValid = isCityValid && isAddressValid;

  // Handle City input changes and update suggestions
  const handleCityChange = (text: string) => {
    setCity(text);
    if (error) setError(null);

    if (text.trim().length > 0) {
      const filtered = cityListData
        .filter((item) => item.city.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 5); // Limit to top 5 matches
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // When user selects a city from suggestion dropdown
  const handleSelectCity = (selectedCity: string) => {
    setCity(selectedCity);
    setSuggestions([]);
    setTouched((p) => ({ ...p, city: true }));
    Keyboard.dismiss();
  };

  async function useCurrentLocation() {
    Keyboard.dismiss();
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable location permissions in your device settings.",
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLat(loc.coords.latitude);
      setLng(loc.coords.longitude);

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
          setTouched((p) => ({ ...p, city: true }));
        }
        if (!address) {
          setAddress(resolved);
          setTouched((p) => ({ ...p, address: true }));
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
        onboarding_step: "VEHICLE_DETAILS",
      });

      router.replace("/(onboarding)/vehicle-details");
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

  if (initialLoading) {
    return (
      <OnboardingWrapper currentStep="LOCATION">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.accent} />
        </View>
      </OnboardingWrapper>
    );
  }

  const hasLocation = lat !== null && lng !== null;

  return (
    <OnboardingWrapper currentStep="LOCATION">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Your Location
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Tell us where you're based so we can match you with orders nearby.
            </Text>
          </View>

          <View style={styles.formGroup}>
            {/* City Container with zIndex to handle suggestions overlay */}
            <View style={[styles.inputContainer, styles.cityContainer]}>
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
                        : isCityFocused
                          ? colors.border.inputFocused
                          : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="location-city"
                  size={20}
                  color={
                    isCityFocused ? colors.brand.accent : colors.text.faint
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="e.g. New Delhi"
                  placeholderTextColor={colors.text.faint}
                  value={city}
                  onChangeText={handleCityChange}
                  onFocus={() => setIsCityFocused(true)}
                  onBlur={() => {
                    setIsCityFocused(false);
                    setTouched((p) => ({ ...p, city: true }));
                    // Delayed suggestions clearing to register click handlers first
                    setTimeout(() => setSuggestions([]), 200);
                  }}
                  autoCapitalize="words"
                  editable={!loading}
                />
                {touched.city && isCityValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>

              {/* Suggestions Dropdown Overlay */}
              {isCityFocused && suggestions.length > 0 && (
                <View
                  style={[
                    styles.suggestionsOverlay,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.default,
                    },
                  ]}
                >
                  {suggestions.map((item, index) => (
                    <TouchableOpacity
                      key={`${item.city}-${index}`}
                      style={[
                        styles.suggestionItem,
                        {
                          borderBottomColor:
                            index === suggestions.length - 1
                              ? "transparent"
                              : colors.border.subtle,
                        },
                      ]}
                      onPress={() => handleSelectCity(item.city)}
                    >
                      <MaterialIcons
                        name="place"
                        size={18}
                        color={colors.brand.accent}
                        style={styles.suggestionItemIcon}
                      />
                      <View>
                        <Text
                          style={[
                            styles.suggestionText,
                            { color: colors.text.primary },
                          ]}
                        >
                          {item.city}
                        </Text>
                        <Text
                          style={[
                            styles.suggestionStateText,
                            { color: colors.text.muted },
                          ]}
                        >
                          {item.state}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {touched.city && !isCityValid && (
                <View style={styles.fieldErrorRow}>
                  <MaterialIcons
                    name="error-outline"
                    size={13}
                    color={colors.status.error}
                  />
                  <Text
                    style={[styles.fieldError, { color: colors.status.error }]}
                  >
                    Please enter a valid city name
                  </Text>
                </View>
              )}
            </View>

            {/* Address */}
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
                        : isAddressFocused
                          ? colors.border.inputFocused
                          : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="home"
                  size={20}
                  color={
                    isAddressFocused ? colors.brand.accent : colors.text.faint
                  }
                  style={styles.textareaIcon}
                />
                <TextInput
                  style={[styles.textarea, { color: colors.text.primary }]}
                  placeholder="House no, street, area, landmark, PIN code"
                  placeholderTextColor={colors.text.faint}
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    if (error) setError(null);
                  }}
                  onFocus={() => setIsAddressFocused(true)}
                  onBlur={() => {
                    setIsAddressFocused(false);
                    setTouched((p) => ({ ...p, address: true }));
                  }}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!loading}
                />
                {touched.address && isAddressValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={colors.status.success}
                    style={styles.textareaRightIcon}
                  />
                )}
              </View>
              {touched.address && !isAddressValid && (
                <View style={styles.fieldErrorRow}>
                  <MaterialIcons
                    name="error-outline"
                    size={13}
                    color={colors.status.error}
                  />
                  <Text
                    style={[styles.fieldError, { color: colors.status.error }]}
                  >
                    Please provide a detailed address (min 5 characters)
                  </Text>
                </View>
              )}
            </View>

            {/* Preferred Delivery Area */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>
                  Preferred Delivery Area
                </Text>
                <View
                  style={[
                    styles.optionalBadge,
                    {
                      backgroundColor: colors.background.input,
                      borderColor: colors.border.input,
                    },
                  ]}
                >
                  <Text
                    style={[styles.optionalTag, { color: colors.text.muted }]}
                  >
                    Optional
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.locateBtn,
                  hasLocation
                    ? {
                        backgroundColor: colors.background.tint,
                        borderColor: colors.brand.accent,
                        borderStyle: "solid",
                      }
                    : {
                        backgroundColor: colors.background.input,
                        borderColor: colors.brand.accent,
                        borderStyle: "dashed",
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
                      name={hasLocation ? "refresh" : "my-location"}
                      size={18}
                      color={colors.brand.accent}
                    />
                    <Text
                      style={[
                        styles.locateBtnText,
                        { color: colors.brand.accent },
                      ]}
                    >
                      {hasLocation
                        ? "Update current location"
                        : "Use current location"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {hasLocation && (
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
                      size={22}
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
                      {prefAddress || "Location Pinned"}
                    </Text>
                    <View style={styles.coordRow}>
                      <MaterialIcons
                        name="explore"
                        size={12}
                        color={colors.text.muted}
                      />
                      <Text
                        style={[
                          styles.locationCoords,
                          { color: colors.text.muted },
                        ]}
                      >
                        {lat!.toFixed(5)}°, {lng!.toFixed(5)}°
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={colors.status.success}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Form-level error */}
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

          {/* Save & Continue Button */}
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
                <Text style={styles.buttonText}>Save & Continue</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 24,
  },
  headerBlock: { gap: 6 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, lineHeight: 30 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22 },
  formGroup: { gap: 18 },
  inputContainer: { gap: 6, position: "relative" },
  cityContainer: { zIndex: 999 }, // High zIndex so suggestions float over Address
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 13, fontFamily: FontFamily.semiBold, paddingLeft: 2 },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionalTag: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  inputIcon: { paddingLeft: 14 },
  rightIcon: { paddingRight: 14 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  suggestionsOverlay: {
    position: "absolute",
    top: 74,
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionItemIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  suggestionStateText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginTop: 1,
  },
  textareaWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 100,
  },
  textareaIcon: { paddingLeft: 14, paddingTop: 16 },
  textareaRightIcon: { paddingRight: 14, paddingTop: 16 },
  textarea: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 10,
    paddingVertical: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingLeft: 2,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  locateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  locateBtnText: { fontSize: 14, fontFamily: FontFamily.bold },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginTop: 10,
  },
  locationIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  locationDetails: { flex: 1, gap: 4 },
  locationTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    lineHeight: 18,
  },
  coordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationCoords: { fontSize: 11, fontFamily: FontFamily.medium },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -8,
  },
  errorText: { fontSize: 13, fontFamily: FontFamily.medium },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#ffffff", fontSize: 16, fontFamily: FontFamily.bold },
});
