import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";

interface EmptyStateCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

export function EmptyStateCard({ icon, title, message }: EmptyStateCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <Ionicons name={icon} size={40} color={colors.text.muted} />
      </View>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.text.secondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 20,
  },
});