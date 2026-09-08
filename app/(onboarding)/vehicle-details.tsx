// app/(onboarding)/vehicle-details.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

const VEHICLE_TYPES = [
  { id: "BIKE", label: "Bike", icon: "motorcycle" },
  { id: "SCOOTER", label: "Scooter", icon: "moped" },
  { id: "EV", label: "EV", icon: "electric-bike" },
  { id: "OTHER", label: "Other", icon: "commute" },
] as const;

const RC_REGEX =
  /^([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}|[0-9]{2}BH[0-9]{4}[A-Z]{1,2})$/;

export default function VehicleDetailsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  // Form Fields
  const [vType, setVType] = useState<string>("");
  const [vNumber, setVNumber] = useState("");
  const [vMake, setVMake] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track touched state for inputs
  const [touched, setTouched] = useState({
    vNumber: false,
    vMake: false,
  });

  // Sanitizes registration input
  const cleanRcInput = (text: string) => {
    return text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  };

  // Validations
  const cleanedVNumber = cleanRcInput(vNumber);
  const isTypeValid = vType.length > 0;
  const isNumberValid = RC_REGEX.test(cleanedVNumber);
  const formIsValid = isTypeValid && isNumberValid;

  // Safe Stack-Aware Back Navigation
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(onboarding)/location");
    }
  };

  async function handleSave() {
    if (!formIsValid) return;
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      await onboardingApi.saveVehicleDetails({
        vehicle_type: vType,
        vehicle_number: cleanedVNumber,
        vehicle_make_model: vMake.trim() || undefined,
      });

      updateRider({
        vehicle_type: vType,
        vehicle_number: cleanedVNumber,
        has_vehicle_details: true,
      });

      router.push("/(onboarding)/doc-driving-license");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to save vehicle details.",
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
                      index <= 2 ? colors.brand.accent : colors.border.input,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepText, { color: colors.text.muted }]}>
            Step 3 of 5: Vehicle Details
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
              Vehicle Details
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Tell us about your delivery vehicle to configure correct routes.
            </Text>
          </View>

          <View style={styles.formGroup}>
            {/* Vehicle Type Picker */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Vehicle Type *
              </Text>
              <View style={styles.typeGrid}>
                {VEHICLE_TYPES.map((t) => {
                  const isSelected = vType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: isSelected
                            ? colors.background.tint
                            : colors.background.input,
                          borderColor: isSelected
                            ? colors.brand.accent
                            : colors.border.input,
                        },
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setVType(t.id);
                      }}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <View
                        style={[
                          styles.typeIconContainer,
                          {
                            backgroundColor: isSelected
                              ? colors.brand.accent
                              : colors.background.elevated,
                          },
                        ]}
                      >
                        <MaterialIcons
                          name={t.icon as any}
                          size={24}
                          color={isSelected ? "#ffffff" : colors.text.muted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.typeCardText,
                          {
                            color: isSelected
                              ? colors.brand.accent
                              : colors.text.primary,
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Vehicle Number Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Vehicle Number (RC) *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.vNumber && !isNumberValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="tag"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.plateInput,
                    { color: colors.text.primary },
                  ]}
                  placeholder="MH02AB1234 or 22BH1234AA"
                  placeholderTextColor={colors.text.faint}
                  value={vNumber}
                  onChangeText={(t) => setVNumber(cleanRcInput(t))}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, vNumber: true }))
                  }
                  autoCapitalize="characters"
                  maxLength={13}
                  editable={!loading}
                />
                {touched.vNumber && isNumberValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.vNumber && !isNumberValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Enter a valid Indian vehicle RC number (e.g. MH02AB1234)
                </Text>
              )}
            </View>

            {/* Make & Model Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Make & Model
                <Text
                  style={[styles.optionalTag, { color: colors.text.faint }]}
                >
                  {"  "}(Optional)
                </Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor: colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="commute"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="e.g. Honda Activa 6G"
                  placeholderTextColor={colors.text.faint}
                  value={vMake}
                  onChangeText={setVMake}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
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
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  typeCard: {
    width: "48%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 8,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeCardText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
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
  plateInput: {
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
  },
  fieldError: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginTop: 2,
    marginLeft: 2,
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
