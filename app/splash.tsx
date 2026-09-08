// app/splash.tsx

import { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Image, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import { useTheme } from "../src/theme/ThemeContext";
import { authApi } from "../src/features/auth/api/auth.api";
import { getRouteForRider } from "../src/features/auth/utils/authNavigation";
import { FontFamily } from "../src/theme/typography";

export default function Splash() {
  const { colors } = useTheme();
  const router = useRouter();
  const { status, accessToken, setAuth, clearAuth } = useAuthStore();
  const hasRouted = useRef(false);

  useEffect(() => {
    if (status === "checking" || status === "unknown") return;
    if (hasRouted.current) return;

    async function handleRedirection() {
      hasRouted.current = true;

      if (status === "unauthenticated" || !accessToken) {
        router.replace("/(auth)/login");
        return;
      }

      try {
        // Silently fetch fresh details from server before making routing decisions
        const rider = await authApi.getMe();
        setAuth(rider, accessToken, useAuthStore.getState().refreshToken!);

        const targetRoute = getRouteForRider(rider);
        router.replace(targetRoute as any);
      } catch (err) {
        clearAuth();
        router.replace("/(auth)/login");
      }
    }

    handleRedirection();
  }, [status, accessToken]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/cureli_rider_logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>DELIVERY PARTNER</Text>
      </View>
      <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 64,
    backgroundColor: "#05015A",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 220,
    height: 60,
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  spinner: {
    marginTop: "auto",
  },
});