// src/components/home/OfflineDashboard.tsx (do not remove this comment)
import { StyleSheet, ScrollView, RefreshControl, View, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import { useDashboard } from "../../hooks/useDashboard";
import { StatCardRow } from "./StatCardRow";
import { StatCard } from "./StatCard";
import { WeeklySummaryCard } from "./WeeklySummaryCard";
import { EarningsBreakdownCard } from "./EarningsBreakdownCard";
import { ActiveIncentiveCard } from "./ActiveIncentiveCard";
import { EmptyStateCard } from "./EmptyStateCard";
import { ActivityIndicator } from "react-native";

export function OfflineDashboard() {
  const { colors } = useTheme();
  const { data: dashboard, isLoading, refetch, isRefetching } = useDashboard();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!dashboard) {
    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background.page }]}
        contentContainerStyle={styles.emptyContent}
      >
        <EmptyStateCard
          icon="stats-chart-outline"
          title="No Data Available"
          message="Complete your first delivery to see your stats here"
        />
      </ScrollView>
    );
  }

  const hasEarnings = dashboard.today.earnings > 0 || dashboard.week.earnings > 0;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background.page }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.brand.primary}
          colors={[colors.brand.primary]}
        />
      }
    >
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Dashboard
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
          Go online to start accepting orders
        </Text>
      </View>

      {hasEarnings ? (
        <>
          {/* Today's Stats */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Today
            </Text>
            <StatCardRow
              leftIcon="cash-outline"
              leftLabel="Earnings"
              leftValue={`₹${dashboard.today.earnings.toFixed(0)}`}
              leftSubtitle={`${dashboard.today.online_hours.toFixed(1)}h online`}
              leftVariant="success"
              rightIcon="bicycle-outline"
              rightLabel="Deliveries"
              rightValue={dashboard.today.deliveries_completed}
              rightSubtitle={
                dashboard.today.deliveries_completed > 0
                  ? `₹${(dashboard.today.earnings / dashboard.today.deliveries_completed).toFixed(0)}/order`
                  : "No deliveries yet"
              }
              rightVariant="info"
            />
          </View>

          {/* Earnings Breakdown */}
          {(dashboard.today.tips > 0 || dashboard.today.surge_earnings > 0) && (
            <View style={styles.section}>
              <EarningsBreakdownCard stats={dashboard.today} />
            </View>
          )}

          {/* Active Incentive */}
          {dashboard.active_incentive && (
            <View style={styles.section}>
              <ActiveIncentiveCard incentive={dashboard.active_incentive} />
            </View>
          )}

          {/* Weekly Summary */}
          <View style={styles.section}>
            <WeeklySummaryCard stats={dashboard.week} />
          </View>

          {/* Additional Metrics */}
          <View style={styles.section}>
            <StatCard
              icon="time-outline"
              label="Online Hours This Week"
              value={`${dashboard.week.online_hours.toFixed(1)}h`}
              subtitle={`Average ${(dashboard.week.online_hours / 7).toFixed(1)}h/day`}
              variant="default"
            />
          </View>
        </>
      ) : (
        <EmptyStateCard
          icon="bicycle-outline"
          title="Ready to Start?"
          message="Toggle online and accept your first delivery to see your earnings here"
        />
      )}

      {/* Bottom spacing for tab bar */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  emptyContent: {
    padding: 16,
    flex: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    gap: 4,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
  },
  bottomSpacer: {
    height: 100, // Clears floating tab bar
  },
});