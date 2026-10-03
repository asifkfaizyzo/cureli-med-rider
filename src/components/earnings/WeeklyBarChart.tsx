// src/components/earnings/WeeklyBarChart.tsx (do not remove this comment)

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import type { ColorPalette } from "../../theme/colors";
import type { WeeklyEarningsData } from "../../types/earnings";

interface WeeklyBarChartProps {
  data: WeeklyEarningsData | undefined;
  isLoading: boolean;
  weekStart: string;
  isCurrentWeek: boolean;
  selectedDay: string | null;
  onWeekPrev: () => void;
  onWeekNext: () => void;
  onDaySelect: (date: string | null) => void;
}

const BAR_MAX_HEIGHT = 120;
const BAR_MIN_HEIGHT = 4;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const s = start.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  const e = end.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${s} - ${e}`;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${Math.round(amount)}`;
}

export default function WeeklyBarChart({
  data,
  isLoading,
  weekStart,
  isCurrentWeek,
  selectedDay,
  onWeekPrev,
  onWeekNext,
  onDaySelect,
}: WeeklyBarChartProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const maxEarning = useMemo(() => {
    if (!data) return 1;
    const m = Math.max(...data.days.map((d) => d.earnings), 1);
    return m;
  }, [data]);

  const hasOlder = data?.has_older_data ?? true;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={onWeekPrev}
          disabled={!hasOlder}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={hasOlder ? colors.text.primary : colors.text.disabled}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Weekly Earnings</Text>
          <Text style={styles.weekRange}>{formatWeekRange(weekStart)}</Text>
        </View>

        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={onWeekNext}
          disabled={isCurrentWeek}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isCurrentWeek ? colors.text.disabled : colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Bars */}
      {isLoading ? (
        <View style={styles.barsRow}>
          {DAY_LABELS.map((_, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={[styles.barSkeleton, { height: 40 + i * 8 }]} />
              <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.barsRow}>
          {(data?.days ?? []).map((day) => {
            const isSelected = selectedDay === day.date;
            const height =
              day.earnings > 0
                ? Math.max(
                    BAR_MIN_HEIGHT,
                    (day.earnings / maxEarning) * BAR_MAX_HEIGHT,
                  )
                : 2;

            return (
              <TouchableOpacity
                key={day.date}
                style={styles.barColumn}
                activeOpacity={0.7}
                onPress={() =>
                  onDaySelect(isSelected ? null : day.date)
                }
              >
                <Text
                  style={[
                    styles.barAmount,
                    isSelected && styles.barAmountSelected,
                  ]}
                >
                  {day.earnings > 0 ? formatCurrency(day.earnings) : ""}
                </Text>
                <View
                  style={[
                    styles.bar,
                    { height },
                    isSelected
                      ? styles.barSelected
                      : day.earnings > 0
                        ? styles.barActive
                        : styles.barEmpty,
                  ]}
                />
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                  ]}
                >
                  {day.day_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Selected day indicator */}
      {selectedDay && !isLoading && (
        <TouchableOpacity
          style={styles.clearFilter}
          onPress={() => onDaySelect(null)}
        >
          <Text style={styles.clearFilterText}>
            Showing {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}
          </Text>
          <Ionicons name="close-circle" size={14} color={colors.text.muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  weekRange: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: BAR_MAX_HEIGHT + 40,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barAmount: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.text.muted,
    marginBottom: 4,
  },
  barAmountSelected: {
    color: colors.brand.primary,
  },
  bar: {
    width: "70%",
    maxWidth: 32,
    borderRadius: 6,
    marginBottom: 6,
  },
  barSelected: {
    backgroundColor: colors.brand.primary,
  },
  barActive: {
    backgroundColor: colors.brand.secondary,
  },
  barEmpty: {
    backgroundColor: colors.border.default,
  },
  barSkeleton: {
    width: "70%",
    maxWidth: 32,
    borderRadius: 6,
    backgroundColor: colors.background.tint,
    marginBottom: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.text.muted,
  },
  dayLabelSelected: {
    color: colors.brand.primary,
    fontWeight: "700",
  },
  clearFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 4,
  },
  clearFilterText: {
    fontSize: 12,
    color: colors.text.muted,
  },
});