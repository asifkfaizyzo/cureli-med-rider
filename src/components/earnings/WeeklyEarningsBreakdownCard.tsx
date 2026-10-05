// src/components/earnings/WeeklyEarningsBreakdownCard.tsx (do not remove this comment)

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import type { ColorPalette } from "../../theme/colors";
import type { WeeklyEarningsBreakdown } from "../../types/earnings";

interface WeeklyEarningsBreakdownCardProps {
  breakdown: WeeklyEarningsBreakdown | undefined;
  deltaPct: number | null;
  isLoading: boolean;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

interface CategoryRow {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  colorKey: "base" | "tip" | "incentive" | "surge";
}

const CATEGORY_COLORS: Record<
  string,
  { light: string; dark: string; text: string }
> = {
  base: { light: "#0C97B8", dark: "#38bdf8", text: "#0C97B8" },
  tip: { light: "#22c55e", dark: "#4ade80", text: "#22c55e" },
  incentive: { light: "#6A20CD", dark: "#B084EB", text: "#6A20CD" },
  surge: { light: "#f59e0b", dark: "#fbbf24", text: "#f59e0b" },
};

export default function WeeklyEarningsBreakdownCard({
  breakdown,
  deltaPct,
  isLoading,
}: WeeklyEarningsBreakdownCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (isLoading || !breakdown) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>This Week</Text>
        <View style={styles.skeleton} />
      </View>
    );
  }

  const total = breakdown.total || 1;

  const rows: CategoryRow[] = [
    {
      label: "Base & Distance",
      icon: "bicycle",
      value: breakdown.base_fee,
      colorKey: "base",
    },
    {
      label: "Tips",
      icon: "heart",
      value: breakdown.tips,
      colorKey: "tip",
    },
    {
      label: "Incentives",
      icon: "trophy",
      value: breakdown.incentive_earnings,
      colorKey: "incentive",
    },
    {
      label: "Surge",
      icon: "flash",
      value: breakdown.surge_fee,
      colorKey: "surge",
    },
  ];

  // Filter out zero-value rows to keep it clean
  const activeRows = rows.filter((r) => r.value > 0);
  const displayRows = activeRows.length > 0 ? activeRows : rows;

  const deltaText =
    deltaPct === null
      ? "New this week"
      : deltaPct > 0
        ? `+${deltaPct}% vs last week`
        : deltaPct < 0
          ? `${deltaPct}% vs last week`
          : "Same as last week";

  const deltaColor =
    deltaPct === null
      ? colors.text.muted
      : deltaPct > 0
        ? colors.status.success
        : deltaPct < 0
          ? colors.status.error
          : colors.text.muted;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.totalValue}>
          {formatCurrency(breakdown.total)}
        </Text>
      </View>

      {/* Delta */}
      <Text style={[styles.delta, { color: deltaColor }]}>{deltaText}</Text>

      {/* Category Rows */}
      <View style={styles.rowsContainer}>
        {displayRows.map((row) => {
          const catColor = isDark
            ? CATEGORY_COLORS[row.colorKey].dark
            : CATEGORY_COLORS[row.colorKey].light;
          const pct = Math.max((row.value / total) * 100, 2);

          return (
            <View key={row.colorKey} style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[styles.rowIcon, { backgroundColor: catColor + "18" }]}
                >
                  <Ionicons name={row.icon} size={13} color={catColor} />
                </View>
                <Text style={styles.rowLabel}>{row.label}</Text>
              </View>
              <Text style={[styles.rowValue, { color: catColor }]}>
                {formatCurrency(row.value)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Mini stacked bar */}
      <View style={styles.stackedBar}>
        {displayRows.map((row) => {
          const catColor = isDark
            ? CATEGORY_COLORS[row.colorKey].dark
            : CATEGORY_COLORS[row.colorKey].light;
          const pct = Math.max((row.value / total) * 100, 1);
          return (
            <View
              key={row.colorKey}
              style={[
                styles.stackedSegment,
                { width: `${pct}%`, backgroundColor: catColor },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 14,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
      gap: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text.secondary,
    },
    totalValue: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text.primary,
    },
    delta: {
      fontSize: 12,
      fontWeight: "500",
      marginTop: -4,
    },
    rowsContainer: {
      gap: 8,
      marginTop: 4,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    rowIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.text.primary,
    },
    rowValue: {
      fontSize: 14,
      fontWeight: "700",
    },
    stackedBar: {
      flexDirection: "row",
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
      backgroundColor: colors.background.tint,
      marginTop: 4,
    },
    stackedSegment: {
      height: "100%",
    },
    skeleton: {
      height: 80,
      borderRadius: 8,
      backgroundColor: colors.background.tint,
    },
  });