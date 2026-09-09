// cureli-rider-app/app/(app)/home.tsx

import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.page }]}
    >
      <View style={styles.container}>
        <Text style={[styles.text, { color: colors.text.primary }]}>
          HomeScreen
        </Text>

        {/* Test Button for Welcome Screen Animation */}
        <TouchableOpacity
          style={[
            styles.testButton,
            {
              backgroundColor: isDark
                ? colors.brand.accent
                : colors.brand.primary,
            },
          ]}
          onPress={() => router.push("/(onboarding)/welcome")}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
            Preview Welcome Screen
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  text: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
  },
  testButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
});
