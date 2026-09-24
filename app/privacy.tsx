// app/privacy.tsx (do not remove this comment)
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../src/theme/ThemeContext";
import { FontFamily } from "../src/theme/typography";

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.page }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Privacy Policy</Text>
      <Text style={[styles.content, { color: colors.text.secondary }]}>
        Your privacy is critically important to us. This policy explains how we collect, use, and share your personal data...
        {"\n\n"}
        1. Data Collection{"\n"}
        2. Use of Data{"\n"}
        3. Data Sharing{"\n"}
        (Replace this placeholder text with your actual privacy policy later.)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    lineHeight: 24,
  }
});