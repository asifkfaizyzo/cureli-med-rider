// cureli-rider-app/app/(app)/(tabs)/home.tsx

import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../src/theme/ThemeContext";
import { FontFamily } from "../../../src/theme/typography";

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors?.background?.page ?? "#0a0a0a" },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors?.text?.primary ?? "#FFFFFF" },
        ]}
      >
        Home
      </Text>

      {/* Test Button for Welcome Screen */}
      <TouchableOpacity
        style={[
          styles.testButton,
          {
            backgroundColor: isDark
              ? colors?.brand?.accent ?? "#059669"
              : colors?.brand?.primary ?? "#10B981",
          },
        ]}
        onPress={() => router.push("/(onboarding)/welcome")}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.buttonText,
            { color: colors?.text?.inverse ?? "#FFFFFF" },
          ]}
        >
          Preview Welcome Screen
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
});