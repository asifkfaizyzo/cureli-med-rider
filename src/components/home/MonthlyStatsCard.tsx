// src/components/home/MonthlyStatsCard.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { TeamMonthlyStats } from "../../types/location";

interface MonthlyStatsCardProps {
  stats: TeamMonthlyStats;
}

export function MonthlyStatsCard({ stats }: MonthlyStatsCardProps) {
  const { colors } = useTheme();

  const metrics = [
    {
      icon: "bicycle-outline" as const,
      label: "Deliveries",
      value: stats.deliveries_completed.toString(),
      color: colors.brand.primary,
    },
    {
      icon: "time-outline" as const,
      label: "Online Hours",
      value: `${stats.online_hours.toFixed(1)}h`,
      color: colors.status.info,
    },
    {
      icon: "heart-outline" as const,
      label: "Tips Earned",
      value: `₹${stats.tips.toFixed(0)}`,
      color: colors.status.warning,
    },
  ];

  const monthName = new Date().toLocaleString("en-IN", { month: "long" });

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
      <View style={styles.header}>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={colors.text.secondary}
        />
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {monthName} Summary
        </Text>
      </View>

      <View style={styles.grid}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metric}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons name={metric.icon} size={18} color={metric.color} />
            </View>
            <View style={styles.metricContent}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: colors.text.secondary },
                ]}
              >
                {metric.label}
              </Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: colors.text.primary },
                ]}
              >
                {metric.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  grid: {
    gap: 12,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  metricValue: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});