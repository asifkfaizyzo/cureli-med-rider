// src/components/home/EarningsBreakdownCard.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { TodayEarnings } from "../../types/location";

interface EarningsBreakdownCardProps {
  earnings: TodayEarnings;
}

export function EarningsBreakdownCard({ earnings }: EarningsBreakdownCardProps) {
  const { colors, isDark } = useTheme();

  const breakdown = [
    {
      icon: "navigate-outline" as const,
      label: "Base + Distance",
      value: earnings.base_fee,
      color: colors.brand.primary,
      bg: isDark ? "rgba(176, 132, 235, 0.12)" : colors.background.tint,
    },
    {
      icon: "flash-outline" as const,
      label: "Surge Bonus",
      value: earnings.surge_fee,
      color: colors.status.warning,
      bg: isDark ? "rgba(251, 191, 36, 0.12)" : "#fef3c7",
    },
    {
      icon: "arrow-up-circle-outline" as const,
      label: "Floor Topup",
      value: earnings.floor_topup_fee,
      color: colors.status.info,
      bg: isDark ? "rgba(56, 189, 248, 0.12)" : "#e0f2fe",
    },
    {
      icon: "gift-outline" as const,
      label: "Customer Tips",
      value: earnings.tips,
      color: colors.status.success,
      bg: isDark ? "rgba(74, 222, 128, 0.12)" : "#dcfce7",
    },
    {
      icon: "trophy-outline" as const,
      label: "Incentive Rewards",
      value: earnings.incentive_earnings,
      color: isDark ? colors.brand.accent : colors.brand.primary,
      bg: isDark ? "rgba(176, 132, 235, 0.15)" : colors.background.tint,
    },
  ];

  // Only show rows that have a non-zero value, but always show at least base
  const visibleRows = breakdown.filter(
    (row) => row.value > 0 || row.label === "Base + Distance",
  );

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
              name="pie-chart"
              size={16}
              color={colors.brand.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Earnings Breakdown
          </Text>
        </View>
      </View>

      {/* Breakdown Items */}
      <View style={styles.items}>
        {visibleRows.map((item, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <Text
                style={[styles.itemLabel, { color: colors.text.secondary }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </View>
            <Text style={[styles.itemValue, { color: colors.text.primary }]}>
              ₹{item.value.toFixed(0)}
            </Text>
          </View>
        ))}
      </View>

      {/* Bottom Total Highlight Box */}
      <View
        style={[
          styles.totalCard,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : colors.background.tint,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.totalLeft}>
          <Text style={[styles.totalLabel, { color: colors.text.secondary }]}>
            Total Today
          </Text>
          {earnings.per_order_avg > 0 && (
            <Text style={[styles.avgText, { color: colors.text.muted }]}>
              ₹{earnings.per_order_avg.toFixed(0)} / order avg
            </Text>
          )}
        </View>

        <Text style={[styles.totalValue, { color: colors.status.success }]}>
          ₹{earnings.total.toFixed(0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 14,
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
  items: {
    gap: 10,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  itemValue: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  totalLeft: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  avgText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
});