// src/components/earnings/EarningsOverview.tsx (do not remove this comment)

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import type { ColorPalette } from "../../theme/colors";

interface EarningsOverviewProps {
  total: number;
  avgPerOrder: number;
  bestDay: { date: string; earnings: number } | null;
  isLoading: boolean;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatBestDay(bestDay: { date: string; earnings: number } | null): string {
  if (!bestDay) return "--";
  const d = new Date(bestDay.date + "T00:00:00");
  const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
  return `${dayName} ${formatCurrency(bestDay.earnings)}`;
}

export default function EarningsOverview({
  total,
  avgPerOrder,
  bestDay,
  isLoading,
}: EarningsOverviewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const pills = [
    { label: "Total", value: isLoading ? "--" : formatCurrency(total) },
    {
      label: "Avg / order",
      value: isLoading ? "--" : formatCurrency(avgPerOrder),
    },
    {
      label: "Best day",
      value: isLoading ? "--" : formatBestDay(bestDay),
    },
  ];

  return (
    <View style={styles.container}>
      {pills.map((pill, i) => (
        <View
          key={i}
          style={[
            styles.pill,
            i < pills.length - 1 && styles.pillBorder,
          ]}
        >
          <Text style={styles.label}>{pill.label}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {pill.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.background.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: "hidden",
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  pillBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.text.muted,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.primary,
  },
});