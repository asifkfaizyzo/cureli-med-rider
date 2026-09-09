import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import {
  Alert,
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

// ── Props ──────────────────────────────────────────────────────

interface OnboardingWrapperProps {
  children: ReactNode;
  currentStep: OnboardingStep;
}

// ── Component ──────────────────────────────────────────────────

export function OnboardingWrapper({
  children,
  currentStep,
}: OnboardingWrapperProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { logout } = useAuthStore();

  const meta = STEP_META[currentStep];

  // If no meta (e.g., COMPLETED), just render children with no chrome
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
        {/* Dot row */}
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
                      backgroundColor: colors.brand.accent,
                      borderColor: colors.brand.accent,
                      transform: [{ scale: 1.2 }],
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

        {/* Section label */}
        <Text
          style={[
            styles.sectionLabel,
            {
              color: isActiveSection
                ? colors.text.primary
                : colors.text.faint,
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
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[
            styles.topBtn,
            !meta.backRoute && styles.topBtnDisabled,
          ]}
          onPress={handleBack}
          disabled={!meta.backRoute}
          hitSlop={10}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={
              meta.backRoute ? colors.text.muted : colors.text.disabled
            }
          />
          <Text
            style={[
              styles.topBtnText,
              {
                color: meta.backRoute
                  ? colors.text.muted
                  : colors.text.disabled,
              },
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topBtn}
          onPress={handleLogout}
          hitSlop={10}
        >
          <MaterialIcons
            name="logout"
            size={18}
            color={colors.status.error}
          />
          <Text style={[styles.topBtnText, { color: colors.status.error }]}>
            Log out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      <View style={styles.stepperContainer}>
        {renderSectionDots("details", DETAILS_STEPS)}

        {/* Divider line between sections */}
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

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  topBtnDisabled: {
    opacity: 0.4,
  },
  topBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.5,
  },
  sectionLabelActive: {
    fontFamily: FontFamily.bold,
  },
  sectionDivider: {
    width: 20,
    height: 2,
    borderRadius: 1,
    marginBottom: 20, // aligns with dot row (not label)
  },
  content: {
    flex: 1,
  },
});