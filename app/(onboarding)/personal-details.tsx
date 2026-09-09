//app\(onboarding)\personal-details.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function PersonalDetailsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState<string>("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Track field touch status
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    dob: false,
  });

  // ── Load existing data on mount ──────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const status = await onboardingApi.getStatus();
        if (status.personal_details) {
          setName(status.personal_details.full_name || "");
          setEmail(status.personal_details.email || "");
          if (status.personal_details.date_of_birth) {
            setDob(new Date(status.personal_details.date_of_birth));
          }
          if (status.personal_details.sex) {
            setGender(status.personal_details.sex);
          }
        }
      } catch {
        // Silent fail — user can still fill fresh
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, []);

  // Validations
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
    email.trim(),
  );

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const isDobValid = dob ? calculateAge(dob) >= 18 : false;
  const isGenderValid = gender.length > 0;
  const formIsValid =
    isNameValid && isEmailValid && isDobValid && isGenderValid;

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  async function handleSave() {
    if (!formIsValid || !dob) return;
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    const formattedDob = formatDate(dob);

    try {
      await onboardingApi.savePersonalDetails({
        full_name: name.trim(),
        email: email.trim(),
        date_of_birth: formattedDob,
        sex: gender,
      });

      updateRider({
        full_name: name.trim(),
        email: email.trim(),
        date_of_birth: formattedDob,
        sex: gender,
        has_personal_details: true,
        onboarding_step: "LOCATION",
      });

      router.replace("/(onboarding)/location");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to save details.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <OnboardingWrapper currentStep="PERSONAL_DETAILS">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.accent} />
        </View>
      </OnboardingWrapper>
    );
  }

  return (
    <OnboardingWrapper currentStep="PERSONAL_DETAILS">
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
          <View style={styles.headerBlock}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Personal Details
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Please provide your official information to get started.
            </Text>
          </View>

          <View style={styles.formGroup}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Full Name *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.name && !isNameValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="person-outline"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="As written on your Aadhaar/PAN"
                  placeholderTextColor={colors.text.faint}
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  autoCapitalize="words"
                  editable={!loading}
                />
                {touched.name && isNameValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.name && !isNameValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Please enter at least 2 characters
                </Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Email Address *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.email && !isEmailValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="mail-outline"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.text.faint}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {touched.email && isEmailValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.email && !isEmailValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Enter a valid email address
                </Text>
              )}
            </View>

            {/* DOB */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Date of Birth *
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDatePicker(true);
                }}
                activeOpacity={0.7}
                disabled={loading}
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.dob && !isDobValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="cake"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    styles.dateText,
                    { color: dob ? colors.text.primary : colors.text.faint },
                  ]}
                >
                  {dob ? formatDate(dob) : "Select date of birth"}
                </Text>
                <MaterialIcons
                  name="calendar-today"
                  size={18}
                  color={colors.text.faint}
                  style={styles.rightIcon}
                />
              </TouchableOpacity>
              {touched.dob && !isDobValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  {!dob
                    ? "Date of birth is required"
                    : "Must be at least 18 years old"}
                </Text>
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Gender *
              </Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => {
                  const isSelected = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        {
                          backgroundColor: isSelected
                            ? colors.brand.accent
                            : colors.background.input,
                          borderColor: isSelected
                            ? colors.brand.accent
                            : colors.border.input,
                        },
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setGender(g);
                      }}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      {isSelected && (
                        <MaterialIcons
                          name="check"
                          size={16}
                          color="#ffffff"
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.genderText,
                          {
                            color: isSelected
                              ? "#ffffff"
                              : colors.text.secondary,
                          },
                        ]}
                      >
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

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

      <CustomDatePickerModal
        visible={showDatePicker}
        initialDate={dob}
        onClose={() => {
          setShowDatePicker(false);
          setTouched((p) => ({ ...p, dob: true }));
        }}
        onConfirm={(selectedDate) => {
          setDob(selectedDate);
          setShowDatePicker(false);
          setTouched((p) => ({ ...p, dob: true }));
        }}
      />
    </OnboardingWrapper>
  );
}

// ── CUSTOM DATE PICKER (unchanged from original) ───────────────

interface CustomDatePickerModalProps {
  visible: boolean;
  initialDate: Date | null;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

function CustomDatePickerModal({
  visible,
  initialDate,
  onClose,
  onConfirm,
}: CustomDatePickerModalProps) {
  const { colors } = useTheme();

  const defaultYear = new Date().getFullYear() - 18;
  const defaultDate = initialDate || new Date(defaultYear, 0, 1);

  const [tempDay, setTempDay] = useState(defaultDate.getDate());
  const [tempMonth, setTempMonth] = useState(defaultDate.getMonth());
  const [tempYear, setTempYear] = useState(defaultDate.getFullYear());

  const dayRef = useRef<FlatList>(null);
  const monthRef = useRef<FlatList>(null);
  const yearRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && initialDate) {
      setTempDay(initialDate.getDate());
      setTempMonth(initialDate.getMonth());
      setTempYear(initialDate.getFullYear());
    }
  }, [visible, initialDate]);

  const years = useMemo(() => {
    const list = [];
    const maxYear = new Date().getFullYear() - 18;
    for (let y = maxYear; y >= 1950; y--) list.push(y);
    return list;
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(tempYear, tempMonth + 1, 0).getDate();
  }, [tempMonth, tempYear]);

  const days = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    return list;
  }, [daysInMonth]);

  useEffect(() => {
    if (tempDay > daysInMonth) setTempDay(daysInMonth);
  }, [daysInMonth, tempDay]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        const dayIdx = days.indexOf(tempDay);
        const monthIdx = tempMonth;
        const yearIdx = years.indexOf(tempYear);

        if (dayIdx !== -1)
          dayRef.current?.scrollToIndex({
            index: dayIdx,
            animated: true,
            viewPosition: 0.5,
          });
        if (monthIdx !== -1)
          monthRef.current?.scrollToIndex({
            index: monthIdx,
            animated: true,
            viewPosition: 0.5,
          });
        if (yearIdx !== -1)
          yearRef.current?.scrollToIndex({
            index: yearIdx,
            animated: true,
            viewPosition: 0.5,
          });
      }, 100);
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm(new Date(tempYear, tempMonth, tempDay));
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background.elevated },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border.input },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Select Birth Date
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <MaterialIcons name="close" size={22} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.columnsContainer}>
            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: colors.text.faint }]}>
                Day
              </Text>
              <FlatList
                ref={dayRef}
                data={days}
                keyExtractor={(item) => `d-${item}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listPadding}
                getItemLayout={(_, index) => ({
                  length: 44,
                  offset: 44 * index,
                  index,
                })}
                renderItem={({ item }) => {
                  const isSelected = item === tempDay;
                  return (
                    <TouchableOpacity
                      onPress={() => setTempDay(item)}
                      style={[
                        styles.itemBtn,
                        isSelected && {
                          backgroundColor: colors.background.tint,
                          borderColor: colors.brand.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          {
                            color: isSelected
                              ? colors.brand.accent
                              : colors.text.secondary,
                          },
                          isSelected && styles.itemTextSelected,
                        ]}
                      >
                        {String(item).padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: colors.text.faint }]}>
                Month
              </Text>
              <FlatList
                ref={monthRef}
                data={MONTH_NAMES}
                keyExtractor={(item) => `m-${item}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listPadding}
                getItemLayout={(_, index) => ({
                  length: 44,
                  offset: 44 * index,
                  index,
                })}
                renderItem={({ item, index }) => {
                  const isSelected = index === tempMonth;
                  return (
                    <TouchableOpacity
                      onPress={() => setTempMonth(index)}
                      style={[
                        styles.itemBtn,
                        isSelected && {
                          backgroundColor: colors.background.tint,
                          borderColor: colors.brand.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          {
                            color: isSelected
                              ? colors.brand.accent
                              : colors.text.secondary,
                          },
                          isSelected && styles.itemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: colors.text.faint }]}>
                Year
              </Text>
              <FlatList
                ref={yearRef}
                data={years}
                keyExtractor={(item) => `y-${item}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listPadding}
                getItemLayout={(_, index) => ({
                  length: 44,
                  offset: 44 * index,
                  index,
                })}
                renderItem={({ item }) => {
                  const isSelected = item === tempYear;
                  return (
                    <TouchableOpacity
                      onPress={() => setTempYear(item)}
                      style={[
                        styles.itemBtn,
                        isSelected && {
                          backgroundColor: colors.background.tint,
                          borderColor: colors.brand.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          {
                            color: isSelected
                              ? colors.brand.accent
                              : colors.text.secondary,
                          },
                          isSelected && styles.itemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.modalFooterBtn,
                { borderColor: colors.border.input, borderWidth: 1 },
              ]}
            >
              <Text
                style={[
                  styles.modalFooterBtnText,
                  { color: colors.text.muted },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.modalFooterBtn,
                { backgroundColor: colors.brand.primary },
              ]}
            >
              <Text style={[styles.modalFooterBtnText, { color: "#ffffff" }]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────

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
    paddingTop: 8,
    paddingBottom: 40,
    gap: 24,
  },
  headerBlock: { gap: 4 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, lineHeight: 30 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22 },
  formGroup: { gap: 16 },
  inputContainer: { gap: 6 },
  label: { fontSize: 13, fontFamily: FontFamily.semiBold },
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
  dateText: { paddingVertical: 16 },
  fieldError: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginTop: 2,
    marginLeft: 2,
  },
  genderRow: { flexDirection: "row", gap: 10 },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  genderText: { fontSize: 14, fontFamily: FontFamily.bold },
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
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#ffffff", fontSize: 16, fontFamily: FontFamily.bold },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1.5,
  },
  modalTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  closeBtn: { padding: 4 },
  columnsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    height: 240,
    marginTop: 12,
  },
  pickerColumn: { flex: 1, marginHorizontal: 4 },
  columnLabel: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: FontFamily.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  listPadding: { paddingBottom: 24 },
  itemBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    marginVertical: 2,
  },
  itemText: { fontSize: 16, fontFamily: FontFamily.medium },
  itemTextSelected: { fontFamily: FontFamily.bold },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  modalFooterBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooterBtnText: { fontSize: 15, fontFamily: FontFamily.bold },
});
