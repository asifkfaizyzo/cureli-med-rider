// src/components/home/WeeklySummaryCard.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { WeekStats, WeekEarnings } from "../../types/location";

interface WeeklySummaryCardProps {
  week?: WeekStats;
  earnings?: WeekEarnings; // INDEPENDENT only
}

export function WeeklySummaryCard({ week, earnings }: WeeklySummaryCardProps) {
  const { colors, isDark } = useTheme();

  if (!week) return null;

  const metrics: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color: string;
    bg: string;
  }[] = [];

  // INDEPENDENT: show earnings first
  if (earnings) {
    metrics.push({
      icon: "cash",
      label: "Weekly Earnings",
      value: `₹${(earnings.total ?? 0).toFixed(0)}`,
      color: colors.status.success,
      bg: isDark ? "rgba(74, 222, 128, 0.12)" : "#dcfce7",
    });
  }

  metrics.push(
    {
      icon: "bicycle",
      label: "Deliveries Completed",
      value: (week.deliveries_completed ?? 0).toString(),
      color: colors.brand.primary,
      bg: isDark ? "rgba(176, 132, 235, 0.15)" : colors.background.tint,
    },
    {
      icon: "time",
      label: "Online Hours",
      value: `${(week.online_hours ?? 0).toFixed(1)}h`,
      color: colors.status.info,
      bg: isDark ? "rgba(56, 189, 248, 0.12)" : "#e0f2fe",
    },
    {
      icon: "calendar",
      label: "Days Active",
      value: `${week.days_online ?? 0} days`,
      color: colors.brand.secondary,
      bg: isDark ? "rgba(12, 151, 184, 0.12)" : colors.status.infoBg,
    },
  );

  // Tips shown for both types if they exist
  if (week.tips > 0) {
    metrics.push({
      icon: "heart",
      label: "Tips Earned",
      value: `₹${week.tips.toFixed(0)}`,
      color: colors.status.warning,
      bg: isDark ? "rgba(251, 191, 36, 0.12)" : "#fef3c7",
    });
  }

  // Delta Badge configuration
  const deltaVal = earnings?.delta_pct_vs_last_week;
  const showDelta = deltaVal != null && deltaVal !== 0;

  const deltaTheme =
    deltaVal != null && deltaVal >= 0
      ? {
          color: colors.status.success,
          bg: colors.status.successBg,
          border: colors.status.successBorder,
          icon: "trending-up" as const,
          sign: "+",
        }
      : {
          color: colors.status.error,
          bg: colors.status.errorBg,
          border: colors.status.errorBorder,
          icon: "trending-down" as const,
          sign: "",
        };

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIconContainer,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons
              name="calendar"
              size={15}
              color={colors.brand.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Weekly Performance
          </Text>
        </View>

        {showDelta && (
          <View
            style={[
              styles.deltaBadge,
              {
                backgroundColor: deltaTheme.bg,
                borderColor: deltaTheme.border,
              },
            ]}
          >
            <Ionicons name={deltaTheme.icon} size={11} color={deltaTheme.color} />
            <Text style={[styles.deltaText, { color: deltaTheme.color }]}>
              {deltaTheme.sign}
              {deltaVal}% WoW
            </Text>
          </View>
        )}
      </View>

      {/* Metrics List */}
      <View style={styles.list}>
        {metrics.map((metric, index) => (
          <View key={index}>
            <View style={styles.metric}>
              <View style={[styles.iconContainer, { backgroundColor: metric.bg }]}>
                <Ionicons name={metric.icon} size={16} color={metric.color} />
              </View>

              <View style={styles.metricContent}>
                <Text
                  style={[styles.metricLabel, { color: colors.text.secondary }]}
                  numberOfLines={1}
                >
                  {metric.label}
                </Text>
                <Text
                  style={[styles.metricValue, { color: colors.text.primary }]}
                  numberOfLines={1}
                >
                  {metric.value}
                </Text>
              </View>
            </View>

            {/* Separator line except for the last item */}
            {index < metrics.length - 1 && (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.border.subtle },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  deltaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  deltaText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  list: {
    gap: 10,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metricContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    flex: 1,
    marginRight: 10,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  separator: {
    height: 1,
    marginTop: 10,
    marginLeft: 40, // Aligns separator line cleanly past the metric icon
  },
});