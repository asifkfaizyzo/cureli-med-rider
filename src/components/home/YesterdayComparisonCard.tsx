// src/components/home/YesterdayComparisonCard.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { YesterdayStats } from "../../types/location";

interface YesterdayComparisonCardProps {
  yesterday?: YesterdayStats;
  showEarnings?: boolean; // INDEPENDENT only
}

function DeltaPill({
  value,
  label,
  colors,
}: {
  value: number | null | undefined;
  label: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  if (value === undefined) return null;

  let icon: keyof typeof Ionicons.glyphMap = "remove";
  let text = "Same as yesterday";
  let color = colors.text.muted;
  let bg = colors.background.tint;

  if (value === null) {
    icon = "sparkles-outline";
    text = "New activity today";
    color = colors.status.success;
    bg = colors.status.successBg;
  } else if (value > 0) {
    icon = "trending-up";
    text = `+${value}% vs yesterday`;
    color = colors.status.success;
    bg = colors.status.successBg;
  } else if (value < 0) {
    icon = "trending-down";
    text = `${value}% vs yesterday`;
    color = colors.status.error;
    bg = colors.status.errorBg;
  }

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.pillLabel, { color: colors.text.secondary }]}>
        {label}:
      </Text>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

export function YesterdayComparisonCard({
  yesterday,
  showEarnings = false,
}: YesterdayComparisonCardProps) {
  const { colors } = useTheme();

  if (!yesterday) return null;

  // Don't render if all deltas are 0 (nothing interesting to show)
  const hasDelta =
    yesterday.deliveries_delta_pct !== 0 ||
    yesterday.online_hours_delta_pct !== 0 ||
    (showEarnings && yesterday.earnings_delta_pct !== 0);

  if (!hasDelta) return null;

  return (
    <View style={styles.container}>
      <DeltaPill
        value={yesterday.deliveries_delta_pct}
        label="Deliveries"
        colors={colors}
      />
      <DeltaPill
        value={yesterday.online_hours_delta_pct}
        label="Hours"
        colors={colors}
      />
      {showEarnings && (
        <DeltaPill
          value={yesterday.earnings_delta_pct}
          label="Earnings"
          colors={colors}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  pillText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
});