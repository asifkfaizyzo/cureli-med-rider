// src/components/OnboardingWrapper.tsx (do not remove this comment)
// src/components/OnboardingWrapper.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";
import { FontFamily } from "../theme/typography";
import type { OnboardingStep } from "../types/auth";

// ── Step metadata ──────────────────────────────────────────────

type SectionKey = "details" | "docs";

interface StepMeta {
  section: SectionKey;
  index: number;      // 0-based within section
  label: string;      // short label under dot
  backRoute: string | null;   // where "back" goes (null = can't go back)
}

const STEP_META: Record<OnboardingStep, StepMeta | null> = {
  PERSONAL_DETAILS: {
    section: "details",
    index: 0,
    label: "Personal",
    backRoute: null,
  },
  LOCATION: {
    section: "details",
    index: 1,
    label: "Location",
    backRoute: "/(onboarding)/personal-details",
  },
  VEHICLE_DETAILS: {
    section: "details",
    index: 2,
    label: "Vehicle",
    backRoute: "/(onboarding)/location",
  },
  RC_UPLOAD: {
    section: "docs",
    index: 0,
    label: "RC",
    backRoute: "/(onboarding)/vehicle-details",
  },
  DL_UPLOAD: {
    section: "docs",
    index: 1,
    label: "DL",
    backRoute: "/(onboarding)/doc-vehicle-rc",
  },
  AADHAAR_UPLOAD: {
    section: "docs",
    index: 2,
    label: "Aadhaar",
    backRoute: "/(onboarding)/doc-driving-license",
  },
  PAN_UPLOAD: {
    section: "docs",
    index: 3,
    label: "PAN",
    backRoute: "/(onboarding)/doc-aadhar",
  },
  LIVE_PHOTO: {
    section: "docs",
    index: 4,
    label: "Photo",
    backRoute: "/(onboarding)/doc-pan",
  },
  COMPLETED: null,
};

const DETAILS_STEPS: OnboardingStep[] = [
  "PERSONAL_DETAILS",
  "LOCATION",
  "VEHICLE_DETAILS",
];

const DOC_STEPS: OnboardingStep[] = [
  "RC_UPLOAD",
  "DL_UPLOAD",
  "AADHAAR_UPLOAD",
  "PAN_UPLOAD",
  "LIVE_PHOTO",
];

const STEP_ORDER: OnboardingStep[] = [...DETAILS_STEPS, ...DOC_STEPS];

interface OnboardingWrapperProps {
  children: ReactNode;
  currentStep: OnboardingStep;
}

export function OnboardingWrapper({
  children,
  currentStep,
}: OnboardingWrapperProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { logout } = useAuthStore();

  const meta = STEP_META[currentStep];

  // If no meta (e.g., COMPLETED), just render children with no header chrome
  if (!meta) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        {children}
      </SafeAreaView>
    );
  }

  const currentIdx = STEP_ORDER.indexOf(currentStep);

  function handleBack() {
    if (!meta?.backRoute) return;
    router.replace(meta.backRoute as any);
  }

  function handleLogout() {
    Alert.alert(
      "Log out?",
      "Your progress is saved. You can continue where you left off next time you log in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  }

  function renderSectionDots(sectionKey: SectionKey, steps: OnboardingStep[]) {
    const isActiveSection = meta!.section === sectionKey;
    return (
      <View style={styles.sectionColumn}>
        <View style={styles.dotRow}>
          {steps.map((step, i) => {
            const stepIdx = STEP_ORDER.indexOf(step);
            const isComplete = stepIdx < currentIdx;
            const isCurrent = stepIdx === currentIdx;
            const isFuture = stepIdx > currentIdx;

            return (
              <View key={step} style={styles.dotWithConnector}>
                <View
                  style={[
                    styles.dot,
                    isComplete && {
                      backgroundColor: colors.brand.accent,
                      borderColor: colors.brand.accent,
                    },
                    isCurrent && {
                      backgroundColor: colors.background.page,
                      borderColor: colors.brand.accent,
                      borderWidth: 2,
                    },
                    isFuture && {
                      backgroundColor: colors.background.input,
                      borderColor: colors.border.input,
                    },
                  ]}
                >
                  {isComplete && (
                    <MaterialIcons name="check" size={10} color="#fff" />
                  )}
                  {isCurrent && (
                    <View
                      style={[
                        styles.activeDotInner,
                        { backgroundColor: colors.brand.accent },
                      ]}
                    />
                  )}
                </View>
                {i < steps.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      {
                        backgroundColor: isComplete
                          ? colors.brand.accent
                          : colors.border.input,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: isActiveSection
                ? colors.brand.accent
                : colors.text.muted,
            },
            isActiveSection && styles.sectionLabelActive,
          ]}
        >
          {sectionKey === "details" ? "DETAILS" : "DOCUMENTS"}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      {/* Root KeyboardAvoidingView ensures header metrics are properly bypassed */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[
              styles.topBtn,
              !meta.backRoute && styles.topBtnDisabled,
            ]}
            onPress={handleBack}
            disabled={!meta.backRoute}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons
              name="chevron-left"
              size={22}
              color={
                meta.backRoute ? colors.text.secondary : colors.text.disabled
              }
            />
            <Text
              style={[
                styles.topBtnText,
                {
                  color: meta.backRoute
                    ? colors.text.secondary
                    : colors.text.disabled,
                },
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topBtn, styles.logoutBtn]}
            onPress={handleLogout}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons
              name="logout"
              size={16}
              color={colors.status.error}
            />
            <Text style={[styles.topBtnText, { color: colors.status.error }]}>
              Log out
            </Text>
          </TouchableOpacity>
        </View>

        {/* progress Stepper */}
        <View
          style={[
            styles.stepperContainer,
            { borderBottomColor: colors.border.subtle },
          ]}
        >
          {renderSectionDots("details", DETAILS_STEPS)}

          <View
            style={[
              styles.sectionDivider,
              {
                backgroundColor:
                  meta.section === "docs"
                    ? colors.brand.accent
                    : colors.border.input,
              },
            ]}
          />

          {renderSectionDots("docs", DOC_STEPS)}
        </View>

        {/* Content Box */}
        <View style={styles.content}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  logoutBtn: {
    gap: 6,
  },
  topBtnDisabled: {
    opacity: 0.35,
  },
  topBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  sectionColumn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dotWithConnector: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connector: {
    width: 14,
    height: 2.5,
    borderRadius: 1.25,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
    opacity: 0.6,
  },
  sectionLabelActive: {
    fontFamily: FontFamily.bold,
    opacity: 1.0,
  },
  sectionDivider: {
    width: 24,
    height: 2.5,
    borderRadius: 1.25,
    marginBottom: 18,
  },
  content: {
    flex: 1,
  },
});