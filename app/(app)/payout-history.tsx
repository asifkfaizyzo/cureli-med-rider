// app/(app)/payout-history.tsx (do not remove this comment)

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
import { earningsApi } from "../../src/features/earnings/api/earnings.api";
import PayoutHistoryCard from "../../src/components/earnings/PayoutHistoryCard";
import PayoutDetailModal from "../../src/components/earnings/PayoutDetailModal";
import type { PayoutHistoryItem } from "../../src/types/earnings";

const PAGE_LIMIT = 20;

export default function PayoutHistoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { alert } = useDialog();

  // List state
  const [items, setItems] = useState<PayoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Detail modal state
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutHistoryItem | null>(
    null,
  );

  const fetchPayouts = useCallback(
    async (targetPage: number, replace = false) => {
      try {
        if (targetPage === 1 && !replace) setLoading(true);
        if (targetPage > 1) setLoadingMore(true);

        const res = await earningsApi.getPayouts({
          page: targetPage,
          limit: PAGE_LIMIT,
        });

        setItems((prev) =>
          targetPage === 1 ? res.payouts : [...prev, ...res.payouts],
        );
        setHasMore(targetPage < res.pagination.totalPages);
        setPage(targetPage);
      } catch (err: any) {
        console.error("[PayoutHistory] fetch failed", err);
        await alert({
          title: "Failed to Load",
          message:
            err?.response?.data?.message || "Could not fetch payout history.",
          icon: "error",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [alert],
  );

  // Initial load
  useEffect(() => {
    fetchPayouts(1);
  }, [fetchPayouts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayouts(1, true);
  };

  const handleEndReached = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchPayouts(page + 1);
    }
  };

  const handleCardPress = (payout: PayoutHistoryItem) => {
    setSelectedPayout(payout);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedPayout(null);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.page }]}
    >
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
          <Ionicons
            name="chevron-back"
            size={26}
            color={colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Payout History
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="wallet-outline"
            size={56}
            color={colors.text.faint}
          />
          <Text
            style={[styles.emptyTitle, { color: colors.text.primary }]}
          >
            No Payouts Yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.text.muted }]}>
            Your weekly payouts will appear here once processed.
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.payout_id}
          renderItem={({ item }) => (
            <PayoutHistoryCard
              payout={item}
              onPress={() => handleCardPress(item)}
            />
          )}
          contentContainerStyle={{
            paddingTop: 12,
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
            ) : !hasMore && items.length > 0 ? (
              <View style={styles.footerLoader}>
                <Text style={[styles.endText, { color: colors.text.faint }]}>
                  No more payouts
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Detail Modal */}
      <PayoutDetailModal
        visible={detailVisible}
        payout={selectedPayout}
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
  endText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
});