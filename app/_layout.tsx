// app/_layout.tsx

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  LogBox,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/store/authStore";
import { ThemeProvider, useTheme } from "../src/theme/ThemeContext";

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

// ── Floating Dev Theme Switcher Component ───────────────────────────
function GlobalThemeToggle() {
  // Pull values matching your exact ThemeContextValue interface
  const { colors, isDark, setPreference } = useTheme();

  const handleToggle = () => {
    // Toggles between "light" and "dark" using setPreference
    setPreference(isDark ? "light" : "dark");
  };

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: isDark ? "#1E1E1E" : "#ffffff",
            borderColor: isDark ? colors.brand.accent : colors.brand.primary,
          },
        ]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isDark ? "sunny" : "moon"}
          size={20}
          color={isDark ? "#FBBF24" : colors.brand.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const { initialize } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Amulya: require("../assets/fonts/Amulya-Variable.ttf"),
    "Amulya-Variable": require("../assets/fonts/Amulya-Variable.ttf"),
    "Amulya-Bold": require("../assets/fonts/Amulya-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    initialize();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" options={{ animation: "fade" }} />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
        </Stack>

        {/* Global theme toggle overlay on top of every page */}
        <GlobalThemeToggle />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 40,
    right: 16,
    zIndex: 999999,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
});
