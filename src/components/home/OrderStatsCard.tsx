// src/components/home/OrderStatsCard.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { OrderActionStats } from "../../types/location";

interface OrderStatsCardProps {
  orders?: OrderActionStats;
}

export function OrderStatsCard({ orders }: OrderStatsCardProps) {
  const { colors, isDark } = useTheme();

  if (!orders) return null;

  const counts = [
    {
      icon: "checkmark-circle" as const,
      label: "Accepted",
      value: orders.accepted ?? 0,
      color: colors.status.success,
      bg: isDark ? "rgba(74, 222, 128, 0.12)" : "#dcfce7",
    },
    {
      icon: "close-circle" as const,
      label: "Denied",
      value: orders.denied ?? 0,
      color: colors.status.error,
      bg: isDark ? "rgba(248, 113, 113, 0.12)" : "#fee2e2",
    },
    {
      icon: "remove-circle" as const,
      label: "Cancelled",
      value: orders.cancelled ?? 0,
      color: colors.status.warning,
      bg: isDark ? "rgba(251, 191, 36, 0.12)" : "#fef3c7",
    },
  ];

  const acceptanceRate = Math.min(
    Math.max(orders.acceptance_rate ?? 100, 0),
    100,
  );
  const completionRate = Math.min(
    Math.max(orders.completion_rate ?? 100, 0),
    100,
  );

  const getRateColor = (
    val: number,
    goodThreshold: number,
    warnThreshold: number,
  ) => {
    if (val >= goodThreshold) return colors.status.success;
    if (val >= warnThreshold) return colors.status.warning;
    return colors.status.error;
  };

  const acceptanceColor = getRateColor(acceptanceRate, 80, 60);
  const completionColor = getRateColor(completionRate, 90, 70);

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
              name="stats-chart"
              size={15}
              color={colors.brand.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Order Performance
          </Text>
        </View>
      </View>

      {/* Counts Row */}
      <View
        style={[
          styles.countsContainer,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : colors.background.tint,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        {counts.map((item, i) => (
          <View
            key={i}
            style={[
              styles.countItem,
              i < counts.length - 1 && [
                styles.countDivider,
                { borderRightColor: colors.border.subtle },
              ],
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={14} color={item.color} />
            </View>
            <Text
              style={[styles.countValue, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {item.value}
            </Text>
            <Text
              style={[styles.countLabel, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Rates Row with Mini Progress Bars */}
      <View style={styles.ratesRow}>
        {/* Acceptance Rate Card */}
        <View
          style={[
            styles.rateCard,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.03)"
                : colors.background.tint,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View style={styles.rateHeader}>
            <Text style={[styles.rateLabel, { color: colors.text.secondary }]}>
              Acceptance
            </Text>
            <Text style={[styles.rateValue, { color: acceptanceColor }]}>
              {acceptanceRate}%
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? "#333333" : "#E5E7EB" },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${acceptanceRate}%`,
                  backgroundColor: acceptanceColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Completion Rate Card */}
        <View
          style={[
            styles.rateCard,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.03)"
                : colors.background.tint,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View style={styles.rateHeader}>
            <Text style={[styles.rateLabel, { color: colors.text.secondary }]}>
              Completion
            </Text>
            <Text style={[styles.rateValue, { color: completionColor }]}>
              {completionRate}%
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? "#333333" : "#E5E7EB" },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${completionRate}%`,
                  backgroundColor: completionColor,
                },
              ]}
            />
          </View>
        </View>
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
  countsContainer: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  countItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  countDivider: {
    borderRightWidth: 1,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  countValue: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    lineHeight: 22,
  },
  countLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  ratesRow: {
    flexDirection: "row",
    gap: 10,
  },
  rateCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rateLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  rateValue: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});