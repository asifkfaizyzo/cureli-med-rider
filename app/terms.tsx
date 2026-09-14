import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../src/theme/ThemeContext";
import { FontFamily } from "../src/theme/typography";

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.page }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Terms of Service</Text>
      <Text style={[styles.content, { color: colors.text.secondary }]}>
        Welcome to Cureli. By using our application, you agree to these terms...
        {"\n\n"}
        1. Acceptance of Terms{"\n"}
        2. Description of Service{"\n"}
        3. User Obligations{"\n"}
        (Replace this placeholder text with your actual terms later.)
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