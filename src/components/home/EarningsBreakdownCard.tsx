import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { PeriodStats } from "../../types/location";

interface EarningsBreakdownCardProps {
  stats: PeriodStats;
}

export function EarningsBreakdownCard({ stats }: EarningsBreakdownCardProps) {
  const { colors } = useTheme();

  const breakdown = [
    {
      icon: "flash-outline" as const,
      label: "Surge Bonus",
      value: `₹${stats.surge_earnings.toFixed(0)}`,
      color: colors.status.warning,
    },
    {
      icon: "gift-outline" as const,
      label: "Customer Tips",
      value: `₹${stats.tips.toFixed(0)}`,
      color: colors.status.success,
    },
  ];

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
        <Ionicons name="pie-chart-outline" size={20} color={colors.text.secondary} />
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Earnings Breakdown
        </Text>
      </View>

      <View style={styles.items}>
        {breakdown.map((item, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.itemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={[styles.itemLabel, { color: colors.text.secondary }]}>
                {item.label}
              </Text>
            </View>
            <Text style={[styles.itemValue, { color: colors.text.primary }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border.subtle },
        ]}
      />

      <View style={styles.total}>
        <Text style={[styles.totalLabel, { color: colors.text.secondary }]}>
          Total Bonuses
        </Text>
        <Text style={[styles.totalValue, { color: colors.status.success }]}>
          ₹{(stats.surge_earnings + stats.tips).toFixed(0)}
        </Text>
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
  items: {
    gap: 12,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  itemValue: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  divider: {
    height: 1,
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
});