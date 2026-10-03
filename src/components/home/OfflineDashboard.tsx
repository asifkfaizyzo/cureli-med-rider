// src/components/home/OfflineDashboard.tsx (do not remove this comment)
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthStore } from "../../store/authStore";
import { useRiderOperationalStore } from "../../store/riderOperationalStore";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import { ActiveIncentiveCard } from "./ActiveIncentiveCard";
import { EarningsBreakdownCard } from "./EarningsBreakdownCard";
import { EmptyStateCard } from "./EmptyStateCard";
import { MonthlyStatsCard } from "./MonthlyStatsCard";
import { OrderStatsCard } from "./OrderStatsCard";
import { PayoutStatusCard } from "./PayoutStatusCard";
import { RatingCard } from "./RatingCard";
import { StatCardRow } from "./StatCardRow";
import { SurgeBanner } from "./SurgeBanner";
import { WeeklySummaryCard } from "./WeeklySummaryCard";
import { YesterdayComparisonCard } from "./YesterdayComparisonCard";

export function OfflineDashboard() {
  const { colors, isDark } = useTheme();
  const { data: dashboard, isLoading, refetch, isRefetching } = useDashboard();
  const riderType = useAuthStore((s) => s.rider?.rider_type);
  const isOnline = useRiderOperationalStore((s) => s.isOnline);

  const isIndependent = riderType === "INDEPENDENT";

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

  // Defensive activity check
  const todayDeliveries = dashboard.today?.deliveries_completed ?? 0;
  const weekDeliveries = dashboard.week?.deliveries_completed ?? 0;
  const hasAnyActivity = todayDeliveries > 0 || weekDeliveries > 0;

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
      {/* ── Sleek Offline Status Banner ────────────────── */}
      <View
        style={[
          styles.statusBanner,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.02)"
              : colors.background.tint,
            borderColor: colors.border.default,
          },
        ]}
      >
        <View style={styles.bannerRow}>
          <View style={styles.bannerLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.status.warningBg },
              ]}
            >
              <Ionicons
                name="moon"
                size={16}
                color={colors.status.warning}
              />
            </View>
            <View>
              <View style={styles.offlineRow}>
                <Text style={[styles.bannerTitle, { color: colors.text.primary }]}>
                  Currently Offline
                </Text>
                <View style={styles.offlineDot} />
              </View>
              <Text
                style={[styles.bannerSubtitle, { color: colors.text.muted }]}
                numberOfLines={2}
              >
                {isIndependent
                  ? "Toggle online at the top of the screen to start matching with orders and earning."
                  : "Go online at the top of the screen to resume your active shift duty."}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── INDEPENDENT: Surge Banner ──────────────────── */}
      {isIndependent && dashboard.surge?.is_active && (
        <SurgeBanner surge={dashboard.surge} isOnline={isOnline} />
      )}

      {hasAnyActivity ? (
        <>
          {/* ── Top Stats Row ──────────────────────────────── */}
          {isIndependent && dashboard.earnings ? (
            <StatCardRow
              leftIcon="cash-outline"
              leftLabel="Today's Earnings"
              leftValue={`₹${(dashboard.earnings.today?.total ?? 0).toFixed(0)}`}
              leftSubtitle={`${(dashboard.today?.online_hours ?? 0).toFixed(1)}h online`}
              leftVariant="success"
              rightIcon="bicycle-outline"
              rightLabel="Deliveries"
              rightValue={todayDeliveries}
              rightSubtitle={
                todayDeliveries > 0
                  ? `₹${(dashboard.earnings.today?.per_order_avg ?? 0).toFixed(0)}/order`
                  : "No deliveries yet"
              }
              rightVariant="info"
            />
          ) : (
            <StatCardRow
              leftIcon="bicycle-outline"
              leftLabel="Deliveries"
              leftValue={todayDeliveries}
              leftSubtitle={`${(dashboard.today?.online_hours ?? 0).toFixed(1)}h online`}
              leftVariant="info"
              rightIcon="time-outline"
              rightLabel="Online Hours"
              rightValue={`${(dashboard.today?.online_hours ?? 0).toFixed(1)}h`}
              rightSubtitle={
                (dashboard.today?.tips ?? 0) > 0
                  ? `₹${dashboard.today.tips.toFixed(0)} in tips`
                  : "No tips yet"
              }
              rightVariant="default"
            />
          )}

          {/* ── INDEPENDENT: Earnings Breakdown ────────────── */}
          {isIndependent && dashboard.earnings?.today && (
            <EarningsBreakdownCard earnings={dashboard.earnings.today} />
          )}

          {/* ── Order Performance (both types) ─────────────── */}
          {dashboard.orders && <OrderStatsCard orders={dashboard.orders} />}

          {/* ── INDEPENDENT: Active Incentives ─────────────── */}
          {isIndependent &&
            dashboard.active_incentives &&
            dashboard.active_incentives.length > 0 &&
            dashboard.active_incentives.map((incentive) => (
              <ActiveIncentiveCard
                key={incentive.schedule_id}
                incentive={incentive}
              />
            ))}

          {/* ── Yesterday Comparison ───────────────────────── */}
          {dashboard.yesterday && (
            <YesterdayComparisonCard
              yesterday={dashboard.yesterday}
              showEarnings={isIndependent}
            />
          )}

          {/* ── INDEPENDENT: Payout Status ─────────────────── */}
          {isIndependent && dashboard.payout && (
            <PayoutStatusCard payout={dashboard.payout} />
          )}

          {/* ── Weekly Summary (both types) ────────────────── */}
          {dashboard.week && (
            <WeeklySummaryCard
              week={dashboard.week}
              earnings={isIndependent ? dashboard.earnings?.week : undefined}
            />
          )}

          {/* ── TEAM: Monthly Stats ────────────────────────── */}
          {!isIndependent && dashboard.team?.month && (
            <MonthlyStatsCard stats={dashboard.team.month} />
          )}

          {/* ── Rating (both types) ────────────────────────── */}
          {dashboard.rating && <RatingCard rating={dashboard.rating} />}
        </>
      ) : (
        <EmptyStateCard
          icon="bicycle-outline"
          title="Ready to Start?"
          message={
            isIndependent
              ? "Toggle online and accept your first delivery to see your earnings here"
              : "Toggle online and accept your first delivery to see your performance here"
          }
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
  statusBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f59e0b", // Amber indicator for pause state
  },
  bannerTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
    marginTop: 2,
    paddingRight: 32, // Padding to ensure text fits clean
  },
  bottomSpacer: {
    height: 100,
  },
});