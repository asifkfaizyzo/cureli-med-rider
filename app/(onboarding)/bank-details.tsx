// app/(onboarding)/bank-details.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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

export default function BankDetailsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  // Form Fields
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track field touch status for inline validations
  const [touched, setTouched] = useState({
    holderName: false,
    bankName: false,
    ifsc: false,
    accountNumber: false,
    confirmAccountNumber: false,
  });

  // Validations
  const isHolderNameValid = holderName.trim().length >= 2;
  const isBankNameValid = bankName.trim().length >= 2;
  const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  const isAccountLengthValid =
    accountNumber.length >= 9 && accountNumber.length <= 18;
  const isMatching =
    accountNumber === confirmAccountNumber && accountNumber.length > 0;

  const isValid =
    isHolderNameValid &&
    isBankNameValid &&
    isIfscValid &&
    isAccountLengthValid &&
    isMatching;

  // Safe Stack-Aware Back Navigation
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(onboarding)/status");
    }
  };

  const scrollToField = (offset: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: offset, animated: true });
    }, 100);
  };

  async function handleSave() {
    if (!isValid) return;
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      await onboardingApi.saveBankDetails({
        bank_account_number: accountNumber.trim(),
        bank_ifsc: ifsc.trim(),
        bank_holder_name: holderName.trim(),
        bank_name: bankName.trim(),
      });

      updateRider({
        bank_holder_name: holderName.trim(),
        bank_account_last4: accountNumber.slice(-4),
        bank_verified: false,
        has_bank_details: true,
      });

      router.push("/(onboarding)/terms");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to save bank details.",
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
                    backgroundColor: colors.brand.accent,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepText, { color: colors.text.muted }]}>
            Step 5 of 5: Bank Details
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.headerBlock}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Bank Details
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Enter the bank account where you would like to receive payouts.
            </Text>
          </View>

          <View style={styles.formGroup}>
            {/* Account Holder Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Account Holder Name *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.holderName && !isHolderNameValid
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
                  placeholder="Name as written in bank account"
                  placeholderTextColor={colors.text.faint}
                  value={holderName}
                  onChangeText={setHolderName}
                  onFocus={() => scrollToField(20)}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, holderName: true }))
                  }
                  autoCapitalize="words"
                  editable={!loading}
                />
                {touched.holderName && isHolderNameValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.holderName && !isHolderNameValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Please enter a valid holder name (min 2 characters)
                </Text>
              )}
            </View>

            {/* Bank Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Bank Name *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.bankName && !isBankNameValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="account-balance"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor={colors.text.faint}
                  value={bankName}
                  onChangeText={setBankName}
                  onFocus={() => scrollToField(100)}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, bankName: true }))
                  }
                  autoCapitalize="words"
                  editable={!loading}
                />
                {touched.bankName && isBankNameValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.bankName && !isBankNameValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Please enter a valid bank name (min 2 characters)
                </Text>
              )}
            </View>

            {/* IFSC Code */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                IFSC Code *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.ifsc && !isIfscValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="vpn-key"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.codeField,
                    { color: colors.text.primary },
                  ]}
                  placeholder="e.g. HDFC0001234"
                  placeholderTextColor={colors.text.faint}
                  value={ifsc}
                  onChangeText={(t) =>
                    setIfsc(t.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  onFocus={() => scrollToField(180)}
                  onBlur={() => setTouched((prev) => ({ ...prev, ifsc: true }))}
                  maxLength={11}
                  autoCapitalize="characters"
                  editable={!loading}
                />
                {touched.ifsc && isIfscValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.ifsc && !isIfscValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Enter a valid 11-digit IFSC code (e.g. SBIN0001234)
                </Text>
              )}
            </View>

            {/* Account Number */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Account Number *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.accountNumber && !isAccountLengthValid
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="credit-card"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.codeField,
                    { color: colors.text.primary },
                  ]}
                  placeholder="Enter bank account number"
                  placeholderTextColor={colors.text.faint}
                  keyboardType="number-pad"
                  value={accountNumber}
                  onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ""))}
                  onFocus={() => scrollToField(260)}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, accountNumber: true }))
                  }
                  maxLength={18}
                  editable={!loading}
                />
                {touched.accountNumber && isAccountLengthValid && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.accountNumber && !isAccountLengthValid && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Account number must be between 9 to 18 digits
                </Text>
              )}
            </View>

            {/* Confirm Account Number */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Confirm Account Number *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor:
                      touched.confirmAccountNumber && !isMatching
                        ? colors.status.error
                        : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.codeField,
                    { color: colors.text.primary },
                  ]}
                  placeholder="Re-enter bank account number"
                  placeholderTextColor={colors.text.faint}
                  keyboardType="number-pad"
                  value={confirmAccountNumber}
                  onChangeText={(t) =>
                    setConfirmAccountNumber(t.replace(/\D/g, ""))
                  }
                  onFocus={() => scrollToField(340)}
                  onBlur={() =>
                    setTouched((prev) => ({
                      ...prev,
                      confirmAccountNumber: true,
                    }))
                  }
                  maxLength={18}
                  editable={!loading}
                />
                {touched.confirmAccountNumber && isMatching && (
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {touched.confirmAccountNumber && !isMatching && (
                <Text
                  style={[styles.fieldError, { color: colors.status.error }]}
                >
                  Account numbers do not match
                </Text>
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

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isDark
                  ? colors.brand.accent
                  : colors.brand.primary,
              },
              (!isValid || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Submit Details</Text>
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
  codeField: {
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
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
