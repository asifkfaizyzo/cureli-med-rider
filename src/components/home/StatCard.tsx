import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  subtitle?: string;
  iconColor?: string;
  variant?: "default" | "success" | "warning" | "info";
}

export function StatCard({
  icon,
  label,
  value,
  subtitle,
  iconColor,
  variant = "default",
}: StatCardProps) {
  const { colors } = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case "success":
        return {
          bg: colors.status.successBg,
          border: colors.status.successBorder,
          icon: iconColor || colors.status.success,
        };
      case "warning":
        return {
          bg: colors.status.warningBg,
          border: colors.status.warningBg,
          icon: iconColor || colors.status.warning,
        };
      case "info":
        return {
          bg: colors.status.infoBg,
          border: colors.status.infoBg,
          icon: iconColor || colors.status.info,
        };
      default:
        return {
          bg: colors.background.card,
          border: colors.border.default,
          icon: iconColor || colors.brand.primary,
        };
    }
  };

  const variantColors = getVariantColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantColors.bg,
          borderColor: variantColors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <Ionicons name={icon} size={20} color={variantColors.icon} />
        </View>
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          {label}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color: colors.text.primary }]}>
          {value}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  content: {
    gap: 4,
  },
  value: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
});