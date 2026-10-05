// app/(app)/(tabs)/wallet.tsx (do not remove this comment)

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EarningsOverview from "../../../src/components/earnings/EarningsOverview";
import OrderEarningsCard from "../../../src/components/earnings/OrderEarningsCard";
import PayoutDetailModal from "../../../src/components/earnings/PayoutDetailModal";
import PayoutHistoryCard from "../../../src/components/earnings/PayoutHistoryCard";
import WeeklyBarChart from "../../../src/components/earnings/WeeklyBarChart";
import WeeklyEarningsBreakdownCard from "../../../src/components/earnings/WeeklyEarningsBreakdownCard";
import { HistoryDetailModal } from "../../../src/components/history/HistoryDetailModal";
import { deliveryApi } from "../../../src/features/delivery/api/delivery.api";
import {
  useEarningsOverview,
  useOrderEarnings,
  usePayoutHistory,
  useWeeklyEarnings,
} from "../../../src/hooks/useEarnings";
import { useTheme } from "../../../src/theme/ThemeContext";
import type { ColorPalette } from "../../../src/theme/colors";
import type { DeliveryHistoryDetail } from "../../../src/types/delivery";
import type {
  OrderEarningsItem,
  PayoutHistoryItem,
} from "../../../src/types/earnings";

// ── Date Helpers ─────────────────────────────────────────────

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);

  // 6AM shift boundary
  if (
    now <
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 6, 0, 0)
  ) {
    monday.setDate(monday.getDate() - 7);
  }
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

function shiftWeek(weekStart: string, days: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekEnd(weekStart: string): string {
  return shiftWeek(weekStart, 6);
}

// ── Tab Type ─────────────────────────────────────────────────

type TabKey = "orders" | "payouts";

// ── Main Screen ──────────────────────────────────────────────

export default function EarningsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const currentWeekMonday = useMemo(() => getCurrentWeekMonday(), []);

  // State
  const [weekStart, setWeekStart] = useState(currentWeekMonday);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("orders");
  const [orderPage, setOrderPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);

  // Detail modal state — delivery history
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<DeliveryHistoryDetail | null>(
    null,
  );

  // Payout detail modal state
  const [payoutDetailVisible, setPayoutDetailVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] =
    useState<PayoutHistoryItem | null>(null);

  // Reset order page and list when filters change
  useEffect(() => {
    setOrderPage(1);
    setAllOrders([]);
  }, [weekStart, selectedDay]);

  useEffect(() => {
    setPayoutPage(1);
    setAllPayouts([]);
  }, []);

  // Queries
  const overview = useEarningsOverview();
  const weekly = useWeeklyEarnings(weekStart);

  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  const orders = useOrderEarnings({
    from: selectedDay ? undefined : weekStart,
    to: selectedDay ? undefined : weekEnd,
    day: selectedDay ?? undefined,
    page: orderPage,
    limit: 20,
  });

  const payouts = usePayoutHistory({
    page: payoutPage,
    limit: 20,
  });

  // Explicitly typed state arrays
  const [allOrders, setAllOrders] = useState<OrderEarningsItem[]>([]);
  const [allPayouts, setAllPayouts] = useState<PayoutHistoryItem[]>([]);

  // Deduplicated synchronization for orders
  useEffect(() => {
    if (!orders.data) return;

    if (orderPage === 1) {
      setAllOrders(orders.data.orders);
    } else {
      setAllOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.delivery_id));
        const newItems = orders.data!.orders.filter(
          (o) => !existingIds.has(o.delivery_id),
        );
        return [...prev, ...newItems];
      });
    }
  }, [orders.data, orderPage]);

  // Deduplicated synchronization for payouts
  useEffect(() => {
    if (!payouts.data) return;

    if (payoutPage === 1) {
      setAllPayouts(payouts.data.payouts);
    } else {
      setAllPayouts((prev) => {
        const existingIds = new Set(prev.map((p) => p.payout_id));
        const newItems = payouts.data!.payouts.filter(
          (p) => !existingIds.has(p.payout_id),
        );
        return [...prev, ...newItems];
      });
    }
  }, [payouts.data, payoutPage]);

  // Handlers
  const handleWeekPrev = useCallback(() => {
    setSelectedDay(null);
    setWeekStart((prev) => shiftWeek(prev, -7));
  }, []);

  const handleWeekNext = useCallback(() => {
    setSelectedDay(null);
    setWeekStart((prev) => shiftWeek(prev, 7));
  }, []);

  const handleDaySelect = useCallback((date: string | null) => {
    setSelectedDay(date);
  }, []);

  // Fetch detail from existing delivery history endpoint, then open modal
  const handleOrderPress = useCallback(async (deliveryId: string) => {
    setDetailData(null);
    setDetailLoading(true);
    setDetailVisible(true);
    try {
      const detail = await deliveryApi.getDeliveryHistoryDetail(deliveryId);
      setDetailData(detail);
    } catch (err) {
      console.error("Failed to fetch delivery detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailVisible(false);
    setDetailData(null);
    setDetailLoading(false);
  }, []);

  // Payout detail handlers
  const handlePayoutPress = useCallback((payout: PayoutHistoryItem) => {
    setSelectedPayout(payout);
    setPayoutDetailVisible(true);
  }, []);

  const handleClosePayoutDetail = useCallback(() => {
    setPayoutDetailVisible(false);
    setSelectedPayout(null);
  }, []);

  const handleLoadMoreOrders = useCallback(() => {
    if (
      orders.data &&
      orderPage < orders.data.pagination.totalPages &&
      !orders.isFetching
    ) {
      setOrderPage((p) => p + 1);
    }
  }, [orders.data, orderPage, orders.isFetching]);

  const handleLoadMorePayouts = useCallback(() => {
    if (
      payouts.data &&
      payoutPage < payouts.data.pagination.totalPages &&
      !payouts.isFetching
    ) {
      setPayoutPage((p) => p + 1);
    }
  }, [payouts.data, payoutPage, payouts.isFetching]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

      if (isCloseToBottom) {
        if (activeTab === "orders") {
          handleLoadMoreOrders();
        } else {
          handleLoadMorePayouts();
        }
      }
    },
    [activeTab, handleLoadMoreOrders, handleLoadMorePayouts],
  );

  const isCurrentWeek = weekStart === currentWeekMonday;

  const handleRefresh = useCallback(() => {
    overview.refetch();
    weekly.refetch();
    orders.refetch();
    payouts.refetch();
  }, [overview, weekly, orders, payouts]);

  const isRefreshing =
    overview.isRefetching ||
    weekly.isRefetching ||
    orders.isRefetching ||
    payouts.isRefetching;

  // ── Render ───────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Bar Chart */}
        <WeeklyBarChart
          data={weekly.data}
          isLoading={weekly.isLoading}
          weekStart={weekStart}
          isCurrentWeek={isCurrentWeek}
          selectedDay={selectedDay}
          onWeekPrev={handleWeekPrev}
          onWeekNext={handleWeekNext}
          onDaySelect={handleDaySelect}
        />

        {/* Overview Pills */}
        <EarningsOverview
          total={weekly.data?.total_earnings ?? 0}
          avgPerOrder={weekly.data?.per_order_avg ?? 0}
          bestDay={weekly.data?.best_day ?? null}
          isLoading={weekly.isLoading}
        />
        {/* Weekly Earnings Breakdown */}
        <WeeklyEarningsBreakdownCard
          breakdown={overview.data?.current_week_breakdown}
          deltaPct={overview.data?.current_week.delta_pct_vs_last_week ?? null}
          isLoading={overview.isLoading}
        />

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "orders" && styles.tabActive]}
            onPress={() => setActiveTab("orders")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "orders" && styles.tabTextActive,
              ]}
            >
              Order Earnings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "payouts" && styles.tabActive]}
            onPress={() => setActiveTab("payouts")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "payouts" && styles.tabTextActive,
              ]}
            >
              Payout History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "orders" ? (
          <View>
            {allOrders.map((order) => (
              <OrderEarningsCard
                key={order.delivery_id}
                order={order}
                onPress={handleOrderPress}
              />
            ))}
            {orders.isLoading && orderPage === 1 ? (
              <View style={styles.listCenter}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
                <Text style={styles.loadingText}>Loading orders...</Text>
              </View>
            ) : allOrders.length === 0 && !orders.isLoading ? (
              <View style={styles.listCenter}>
                <Text style={styles.emptyTitle}>No deliveries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Completed orders will appear here
                </Text>
              </View>
            ) : null}
            {orders.isFetching && orderPage > 1 && (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
              </View>
            )}
            {orders.data &&
              orderPage >= orders.data.pagination.totalPages &&
              allOrders.length > 0 && (
                <View style={styles.listFooter}>
                  <Text style={styles.endText}>No more orders</Text>
                </View>
              )}
          </View>
        ) : (
          <View>
            {allPayouts.map((payout) => (
              <PayoutHistoryCard
                key={payout.payout_id}
                payout={payout}
                onPress={() => handlePayoutPress(payout)}
              />
            ))}
            {payouts.isLoading && payoutPage === 1 ? (
              <View style={styles.listCenter}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
                <Text style={styles.loadingText}>Loading payouts...</Text>
              </View>
            ) : allPayouts.length === 0 && !payouts.isLoading ? (
              <View style={styles.listCenter}>
                <Text style={styles.emptyTitle}>No payouts yet</Text>
                <Text style={styles.emptySubtitle}>
                  Weekly payouts will appear here
                </Text>
              </View>
            ) : null}
            {payouts.isFetching && payoutPage > 1 && (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
              </View>
            )}
            {payouts.data &&
              payoutPage >= payouts.data.pagination.totalPages &&
              allPayouts.length > 0 && (
                <View style={styles.listFooter}>
                  <Text style={styles.endText}>No more payouts</Text>
                </View>
              )}
          </View>
        )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Delivery Detail Modal */}
      <HistoryDetailModal
        visible={detailVisible}
        loading={detailLoading}
        detail={detailData}
        onClose={handleCloseDetail}
      />

      {/* Payout Detail Modal */}
      <PayoutDetailModal
        visible={payoutDetailVisible}
        payout={selectedPayout}
        onClose={handleClosePayoutDetail}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────

const getStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background.page,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text.primary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    tabContainer: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      backgroundColor: colors.background.accent,
      borderRadius: 10,
      padding: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: colors.background.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.tab.inactive,
    },
    tabTextActive: {
      color: colors.tab.active,
    },
    listCenter: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    loadingText: {
      fontSize: 13,
      color: colors.text.muted,
      marginTop: 8,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text.primary,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.text.muted,
      marginTop: 4,
      textAlign: "center",
    },
    listFooter: {
      paddingVertical: 20,
      alignItems: "center",
    },
    endText: {
      fontSize: 12,
      color: colors.text.faint,
    },
    bottomSpacer: {
      height: 40,
    },
  });
