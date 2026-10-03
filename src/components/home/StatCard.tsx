// src/components/home/StatCard.tsx (do not remove this comment)
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
  const { colors, isDark } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          bg: colors.status.successBg,
          border: colors.status.successBorder,
          iconBg: isDark ? "rgba(74, 222, 128, 0.15)" : "#dcfce7",
          iconColor: iconColor || colors.status.success,
        };
      case "warning":
        return {
          bg: colors.status.warningBg,
          border: isDark ? "rgba(251, 191, 36, 0.2)" : "#fef3c7",
          iconBg: isDark ? "rgba(251, 191, 36, 0.15)" : "#fef3c7",
          iconColor: iconColor || colors.status.warning,
        };
      case "info":
        return {
          bg: colors.status.infoBg,
          border: isDark ? "rgba(56, 189, 248, 0.2)" : "#bae6fd",
          iconBg: isDark ? "rgba(56, 189, 248, 0.15)" : "#e0f2fe",
          iconColor: iconColor || colors.status.info,
        };
      default:
        return {
          bg: colors.background.card,
          border: colors.border.default,
          iconBg: colors.background.tint,
          iconColor: iconColor || colors.brand.primary,
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: currentVariant.bg,
          borderColor: currentVariant.border,
        },
      ]}
    >
      {/* Header: Icon + Label */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: currentVariant.iconBg },
          ]}
        >
          <Ionicons name={icon} size={17} color={currentVariant.iconColor} />
        </View>
        <Text
          style={[styles.label, { color: colors.text.secondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </View>

      {/* Main Metric Value */}
      <View style={styles.content}>
        <Text
          style={[styles.value, { color: colors.text.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {value}
        </Text>

        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.text.muted }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    justifyContent: "space-between",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
  },
  content: {
    gap: 2,
    justifyContent: "flex-end",
  },
  value: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 15,
  },
});