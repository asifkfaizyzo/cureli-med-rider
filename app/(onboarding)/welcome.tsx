// app/(onboarding)/welcome.tsx

import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/theme/ThemeContext";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background.page }]}>
      <View style={styles.content}>
        <Text style={styles.celebrationEmoji}>🎉</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Onboarding Complete!
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          Your account is fully registered, approved, and ready. You can go
          online now to start accepting delivery orders!
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.brand.primary }]}
        onPress={() => router.replace("/(app)/home")}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 16,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
