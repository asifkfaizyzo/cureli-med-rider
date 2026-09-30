// app/(app)/delivery-history.tsx (do not remove this comment)

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";
import { useDialog } from "../../src/components/Dialog/DialogProvider";
import { deliveryApi } from "../../src/features/delivery/api/delivery.api";
import { HistoryCard } from "../../src/components/history/HistoryCard";
import { HistoryFilterBar } from "../../src/components/history/HistoryFilterBar";
import { HistoryDetailModal } from "../../src/components/history/HistoryDetailModal";
import type {
  DeliveryHistoryItem,
  DeliveryHistoryDetail,
  HistoryStatusFilter,
} from "../../src/types/delivery";

const PAGE_LIMIT = 20;

export default function DeliveryHistoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { alert } = useDialog();

  // List state
  const [items, setItems] = useState<DeliveryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter | "ALL">(
    "ALL",
  );
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DeliveryHistoryDetail | null>(null);

  const fetchHistory = useCallback(
    async (targetPage: number, replace = false) => {
      try {
        if (targetPage === 1 && !replace) setLoading(true);
        if (targetPage > 1) setLoadingMore(true);

        const params: any = {
          page: targetPage,
          limit: PAGE_LIMIT,
        };
        if (statusFilter !== "ALL") params.status = [statusFilter];
        if (fromDate) params.from_date = fromDate.toISOString();
        if (toDate) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);
          params.to_date = endOfDay.toISOString();
        }

        const res = await deliveryApi.getDeliveryHistory(params);

        setItems((prev) =>
          targetPage === 1 ? res.deliveries : [...prev, ...res.deliveries],
        );
        setHasMore(targetPage < res.pagination.totalPages);
        setPage(targetPage);
      } catch (err: any) {
        console.error("[DeliveryHistory] fetch failed", err);
        await alert({
          title: "Failed to Load",
          message:
            err?.response?.data?.message || "Could not fetch history.",
          icon: "error",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, fromDate, toDate, alert],
  );

  // Initial + filter change trigger
  useEffect(() => {
    fetchHistory(1);
  }, [statusFilter, fromDate, toDate, fetchHistory]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory(1, true);
  };

  const handleEndReached = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchHistory(page + 1);
    }
  };

  const handleClearDates = () => {
    setFromDate(null);
    setToDate(null);
  };

  const handleCardPress = async (deliveryId: string) => {
    setDetailVisible(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const result = await deliveryApi.getDeliveryHistoryDetail(deliveryId);
      setDetail(result);
    } catch (err: any) {
      await alert({
        title: "Failed to Load Details",
        message:
          err?.response?.data?.message ||
          "Could not fetch delivery details.",
        icon: "error",
      });
      setDetailVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setDetail(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Delivery History
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterWrap, { backgroundColor: colors.background.page }]}>
        <HistoryFilterBar
          activeStatus={statusFilter}
          fromDate={fromDate}
          toDate={toDate}
          onStatusChange={setStatusFilter}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onClearDates={handleClearDates}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color={colors.text.faint} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No Deliveries Yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.text.muted }]}>
            No delivery records match your current filter.
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.delivery_id}
          renderItem={({ item }) => (
            <HistoryCard
              item={item}
              onPress={() => handleCardPress(item.delivery_id)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 20,
          }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.brand.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* Detail Modal */}
      <HistoryDetailModal
        visible={detailVisible}
        loading={detailLoading}
        detail={detail}
        onClose={handleCloseDetail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    elevation: 2,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  filterWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    textAlign: "center",
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});