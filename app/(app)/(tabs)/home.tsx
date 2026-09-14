// cureli-rider-app/app/(app)/(tabs)/home.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../../src/theme/ThemeContext";
import { FontFamily } from "../../../src/theme/typography";

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <Text style={[styles.text, { color: colors.text.primary }]}>Home</Text>
      <Text style={[styles.subtext, { color: colors.text.muted }]}>
        Ready to receive delivery tasks
      </Text>

      <TouchableOpacity
        style={[
          styles.testButton,
          { backgroundColor: isDark ? colors.brand.accent : colors.brand.primary },
        ]}
        onPress={() => router.push("/(onboarding)/welcome")}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
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
    gap: 12,
  },
  text: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
  },
  subtext: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    marginBottom: 16,
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