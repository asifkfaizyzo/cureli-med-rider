// src/components/earnings/OrderEarningsList.tsx (do not remove this comment)

import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import type { ColorPalette } from "../../theme/colors";
import type { OrderEarningsItem } from "../../types/earnings";
import OrderEarningsCard from "./OrderEarningsCard";

interface OrderEarningsListProps {
  orders: OrderEarningsItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onOrderPress: (deliveryId: string) => void;
}

export default function OrderEarningsList({
  orders,
  isLoading,
  isFetchingNextPage,
  hasMore,
  onLoadMore,
  onOrderPress,
}: OrderEarningsListProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No deliveries yet</Text>
        <Text style={styles.emptySubtitle}>
          Completed orders will appear here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.delivery_id}
      renderItem={({ item }) => (
        <OrderEarningsCard order={item} onPress={onOrderPress} />
      )}
      scrollEnabled={false}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.brand.primary} />
          </View>
        ) : !hasMore && orders.length > 0 ? (
          <View style={styles.footer}>
            <Text style={styles.endText}>No more orders</Text>
          </View>
        ) : null
      }
    />
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  center: {
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
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endText: {
    fontSize: 12,
    color: colors.text.faint,
  },
});