// src/components/home/HomeBottomSheet.tsx (do not remove this comment)
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useDashboard } from "../../hooks/useDashboard";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import { ActiveIncentiveCard } from "./ActiveIncentiveCard";
import { OrderStatsCard } from "./OrderStatsCard";
import { YesterdayComparisonCard } from "./YesterdayComparisonCard";
import { WeeklySummaryCard } from "./WeeklySummaryCard";
import { MonthlyStatsCard } from "./MonthlyStatsCard";
import { RatingCard } from "./RatingCard";

interface HomeBottomSheetProps {
  onSnapChange?: (index: number) => void;
  riderType: "TEAM" | "INDEPENDENT";
}

export const HomeBottomSheet = React.forwardRef<BottomSheet, HomeBottomSheetProps>(
  ({ onSnapChange, riderType }, ref) => {
    const { colors, isDark } = useTheme();
    const { data: dashboard, isLoading } = useDashboard();

    const isTeam = riderType === "TEAM";

    // Dynamic bottom-sheet snap ranges (60% default, expands to 92%)
    const snapPoints = useMemo(() => ["60%", "92%"], []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        onSnapChange?.(index);
      },
      [onSnapChange],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1} // Starts fully closed
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: colors.background.card }}
        handleIndicatorStyle={{ backgroundColor: colors.border.default, width: 44, height: 4 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.content,
            { backgroundColor: colors.background.card },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {isTeam ? "Today's Duty Log" : "Today's Summary"}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
            </View>
          ) : dashboard ? (
            <>
              {/* Top Summary Cards Row */}
              <View style={styles.cardRow}>
                {/* CARD 1: Status or Earnings */}
                <View
                  style={[
                    styles.miniCard,
                    {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : colors.background.tint,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: isTeam
                            ? (isDark ? "rgba(176, 132, 235, 0.15)" : colors.background.tint)
                            : (isDark ? "rgba(74, 222, 128, 0.12)" : "#dcfce7"),
                        },
                      ]}
                    >
                      <Ionicons
                        name={isTeam ? "time" : "cash"}
                        size={15}
                        color={isTeam ? colors.brand.primary : colors.status.success}
                      />
                    </View>
                    <Text style={[styles.miniLabel, { color: colors.text.secondary }]} numberOfLines={1}>
                      {isTeam ? "Shift Status" : "Live Earnings"}
                    </Text>
                  </View>

                  <Text
                    style={[styles.miniValue, { color: colors.text.primary, fontSize: isTeam ? 18 : 22 }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {isTeam ? "ACTIVE DUTY" : `₹${(dashboard.earnings?.today?.total ?? 0).toFixed(0)}`}
                  </Text>
                </View>

                {/* CARD 2: Deliveries */}
                <View
                  style={[
                    styles.miniCard,
                    {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : colors.background.tint,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: isDark ? "rgba(56, 189, 248, 0.12)" : "#e0f2fe",
                        },
                      ]}
                    >
                      <Ionicons name="bicycle" size={15} color={colors.status.info} />
                    </View>
                    <Text style={[styles.miniLabel, { color: colors.text.secondary }]} numberOfLines={1}>
                      {isTeam ? "Tasks Completed" : "Deliveries"}
                    </Text>
                  </View>

                  <Text
                    style={[styles.miniValue, { color: colors.text.primary, fontSize: 22 }]}
                    numberOfLines={1}
                  >
                    {dashboard.today?.deliveries_completed ?? 0}
                  </Text>
                </View>
              </View>

              {/* ── Active Incentives (INDEPENDENT only) ── */}
              {!isTeam &&
                dashboard.active_incentives &&
                dashboard.active_incentives.length > 0 &&
                dashboard.active_incentives.map((incentive) => (
                  <ActiveIncentiveCard
                    key={incentive.schedule_id}
                    incentive={incentive}
                  />
                ))}

              {/* ── Yesterday Comparison ─────────────────── */}
              {dashboard.yesterday && (
                <YesterdayComparisonCard
                  yesterday={dashboard.yesterday}
                  showEarnings={!isTeam}
                />
              )}

              {/* ── Order Performance (both types) ────────── */}
              {dashboard.orders && <OrderStatsCard orders={dashboard.orders} />}

              {/* ── Weekly Performance Summary ────────────── */}
              {dashboard.week && (
                <WeeklySummaryCard
                  week={dashboard.week}
                  earnings={!isTeam ? dashboard.earnings?.week : undefined}
                />
              )}

              {/* ── Monthly Performance Summary (TEAM only) ── */}
              {!isTeam && dashboard.team?.month && (
                <MonthlyStatsCard stats={dashboard.team.month} />
              )}

              {/* ── Rating Card ─────────────────────────── */}
              {dashboard.rating && <RatingCard rating={dashboard.rating} />}
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.text.muted }]}>
                No data available
              </Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

HomeBottomSheet.displayName = "HomeBottomSheet";

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 100, // Clears floating navigation bar smoothly
  },
  header: {
    marginBottom: 2,
    marginLeft: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  loading: {
    paddingVertical: 50,
    alignItems: "center",
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  miniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  miniLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  miniValue: {
    fontFamily: FontFamily.bold,
    lineHeight: 28,
  },
  empty: {
    paddingVertical: 50,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
});