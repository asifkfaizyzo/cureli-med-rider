// app/(onboarding)/vehicle-details.tsx (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\cureli-med-rider\app\(onboarding)\vehicle-details.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Focus States
  const [isNumberFocused, setIsNumberFocused] = useState(false);
  const [isMakeFocused, setIsMakeFocused] = useState(false);

  const [touched, setTouched] = useState({ vNumber: false, vMake: false });

  // ── Load existing data ──────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const status = await onboardingApi.getStatus();
        if (status.vehicle_details) {
          setVType(status.vehicle_details.vehicle_type || "");
          setVNumber(status.vehicle_details.vehicle_number || "");
          setVMake(status.vehicle_details.vehicle_make_model || "");
        }
      } catch {
        // silent fail
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, []);

  const cleanRcInput = (text: string) => {
    return text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  };

  const cleanedVNumber = cleanRcInput(vNumber);
  const isTypeValid = vType.length > 0;
  const isNumberValid = RC_REGEX.test(cleanedVNumber);
  const formIsValid = isTypeValid && isNumberValid;

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
        onboarding_step: "RC_UPLOAD",
      });

      router.replace("/(onboarding)/doc-vehicle-rc");
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

  if (initialLoading) {
    return (
      <OnboardingWrapper currentStep="VEHICLE_DETAILS">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.accent} />
        </View>
      </OnboardingWrapper>
    );
  }

  return (
    <OnboardingWrapper currentStep="VEHICLE_DETAILS">
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Vehicle Details
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Tell us about your delivery vehicle to configure correct routes.
          </Text>
        </View>

        <View style={styles.formGroup}>
          {/* Vehicle Type Grid Selector */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Vehicle Type *
            </Text>
            <View style={styles.typeGrid}>
              {VEHICLE_TYPES.map((t) => {
                const isSelected = vType === t.id;
                const cardActiveBg = colors.background.tint;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: isSelected
                          ? cardActiveBg
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

          {/* Vehicle Number (RC) Input */}
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
                      : isNumberFocused
                      ? colors.border.inputFocused
                      : colors.border.input,
                },
              ]}
            >
              <MaterialIcons
                name="tag"
                size={20}
                color={isNumberFocused ? colors.brand.accent : colors.text.faint}
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
                onChangeText={(t) => {
                  setVNumber(cleanRcInput(t));
                  if (error) setError(null);
                }}
                onFocus={() => setIsNumberFocused(true)}
                onBlur={() => {
                  setIsNumberFocused(false);
                  setTouched((p) => ({ ...p, vNumber: true }));
                }}
                autoCapitalize="characters"
                maxLength={13}
                editable={!loading}
              />
              {touched.vNumber && isNumberValid && (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={colors.status.success}
                  style={styles.rightIcon}
                />
              )}
            </View>
            {touched.vNumber && !isNumberValid && (
              <View style={styles.fieldErrorRow}>
                <MaterialIcons name="error-outline" size={13} color={colors.status.error} />
                <Text style={[styles.fieldError, { color: colors.status.error }]}>
                  Enter a valid Indian vehicle RC number (e.g. MH02AB1234)
                </Text>
              </View>
            )}
          </View>

          {/* Make & Model (Optional) */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Make & Model
              </Text>
              <View
                style={[
                  styles.optionalBadge,
                  { backgroundColor: colors.background.input, borderColor: colors.border.input },
                ]}
              >
                <Text style={[styles.optionalTag, { color: colors.text.muted }]}>
                  Optional
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.background.input,
                  borderColor: isMakeFocused
                    ? colors.border.inputFocused
                    : colors.border.input,
                },
              ]}
            >
              <MaterialIcons
                name="commute"
                size={20}
                color={isMakeFocused ? colors.brand.accent : colors.text.faint}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="e.g. Honda Activa 6G"
                placeholderTextColor={colors.text.faint}
                value={vMake}
                onChangeText={(text) => {
                  setVMake(text);
                  if (error) setError(null);
                }}
                onFocus={() => setIsMakeFocused(true)}
                onBlur={() => setIsMakeFocused(false)}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
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

        {/* Save & Continue CTA */}
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
  inputContainer: { gap: 6 },
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
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  typeCard: {
    width: "47%",
    flexGrow: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 10,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeCardText: { fontSize: 14, fontFamily: FontFamily.bold },
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
  plateInput: {
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
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