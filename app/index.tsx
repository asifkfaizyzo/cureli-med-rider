// app/index.tsx (do not remove this comment)
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { getOnboardingStepRoute } from "../src/features/auth/utils/authNavigation";
import { useAuthStore } from "../src/store/authStore";
import { useTheme } from "../src/theme/ThemeContext";

export default function Index() {
  const { colors } = useTheme();
  const { status, rider, initialize } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsReady(true);
    };
    init();
  }, []);

  // Show loading spinner while checking auth
  if (!isReady || status === "checking" || status === "unknown") {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background.page }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  // Not authenticated → Auth flow
  if (status === "unauthenticated" || !rider) {
    return <Redirect href="/(auth)/phone" />;
  }

  // Authenticated but onboarding incomplete
  if (rider.status === "DRAFT" || rider.status === "PENDING_REVIEW") {
    // Check which onboarding step to redirect to
    if (rider.onboarding_step === "COMPLETED" && rider.submitted_for_review) {
      return <Redirect href="/(onboarding)/status" />;
    }

    const route = getOnboardingStepRoute(rider.onboarding_step);
    return <Redirect href={route} />;
  }

  // Authenticated + onboarding complete but terms not accepted
  if (rider.status === "ACTIVE" && !rider.terms_accepted_at) {
    return <Redirect href="/(onboarding)/terms" />;
  }

  // Authenticated + onboarding complete + terms accepted → Main app
  if (rider.status === "ACTIVE") {
    return <Redirect href="/(app)/(tabs)" />;
  }

  // Account suspended/blocked/rejected
  if (
    rider.status === "SUSPENDED" ||
    rider.status === "BLOCKED" ||
    rider.status === "REJECTED"
  ) {
    return <Redirect href="/(onboarding)/status" />;
  }

  // Fallback
  return <Redirect href="/(auth)/phone" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});