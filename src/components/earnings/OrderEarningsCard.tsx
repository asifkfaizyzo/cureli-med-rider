// src/components/earnings/OrderEarningsCard.tsx (do not remove this comment)

import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import type { ColorPalette } from "../../theme/colors";
import type { OrderEarningsItem } from "../../types/earnings";

interface OrderEarningsCardProps {
  order: OrderEarningsItem;
  onPress: (deliveryId: string) => void;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function OrderEarningsCard({
  order,
  onPress,
}: OrderEarningsCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const hasSurge = order.earnings.surge_fee > 0;
  const hasTip = order.earnings.tip_amount > 0;
  const hasFloorTopup = order.earnings.floor_topup_fee > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress(order.delivery_id)}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <Text style={styles.orderNumber} numberOfLines={1}>
            {order.order_number}
          </Text>
          {order.pharmacy_name ? (
            <Text style={styles.pharmacy} numberOfLines={1}>
              {order.pharmacy_name}
            </Text>
          ) : null}
        </View>
        <View style={styles.rightInfo}>
          <Text style={styles.totalEarning}>
            {formatCurrency(order.earnings.total_earning)}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.text.faint}
          />
        </View>
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {formatDate(order.delivered_at)} {formatTime(order.delivered_at)}
          </Text>
          <Text style={styles.metaDot}>{"  ·  "}</Text>
          <Text style={styles.meta}>
            {order.total_distance_km.toFixed(1)} km
          </Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownItem}>
            Base {formatCurrency(order.earnings.pickup_fee + order.earnings.drop_fee)}
          </Text>
          {hasSurge && (
            <Text style={[styles.breakdownItem, styles.surgeText]}>
              Surge +{formatCurrency(order.earnings.surge_fee)}
            </Text>
          )}
          {hasFloorTopup && (
            <Text style={styles.breakdownItem}>
              Topup +{formatCurrency(order.earnings.floor_topup_fee)}
            </Text>
          )}
          {hasTip && (
            <Text style={[styles.breakdownItem, styles.tipText]}>
              Tip +{formatCurrency(order.earnings.tip_amount)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: ColorPalette) => StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.primary,
  },
  pharmacy: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  rightInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  totalEarning: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.brand.secondary,
  },
  bottomRow: {
    marginTop: 10,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  meta: {
    fontSize: 11,
    color: colors.text.muted,
  },
  metaDot: {
    fontSize: 11,
    color: colors.text.faint,
  },
  breakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  breakdownItem: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  surgeText: {
    color: colors.status.warning,
  },
  tipText: {
    color: colors.status.success,
  },
});