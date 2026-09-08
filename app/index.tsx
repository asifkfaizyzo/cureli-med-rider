// app/index.tsx

import { router, useRootNavigationState } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const { status } = useAuthStore();
  const navigationState = useRootNavigationState();

  const wasAuthenticated = useRef(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticated.current = true;
    }
  }, [status]);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (status === "unknown" || status === "checking") return;
    if (hasNavigated.current) return;

    hasNavigated.current = true;

    const timer = setTimeout(() => {
      if (status === "unauthenticated" && wasAuthenticated.current) {
        // Direct route jump if logout occurred mid-session
        router.replace("/(auth)/login");
      } else {
        // Otherwise use the validating silent splash layout
        router.replace("/splash");
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [status, navigationState?.key]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#05015A",
  },
});
