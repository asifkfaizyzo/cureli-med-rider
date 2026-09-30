// src/components/history/HistoryCard.tsx (do not remove this comment)

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { DeliveryHistoryItem } from "../../types/delivery";

interface HistoryCardProps {
  item: DeliveryHistoryItem;
  onPress: () => void;
}

export function HistoryCard({ item, onPress }: HistoryCardProps) {
  const { colors } = useTheme();

  const statusConfig = getStatusConfig(item.status, colors);
  const displayDate = item.delivered_at || item.failed_at || item.created_at;

  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {/* Top row: Order # + Status */}
      <View style={styles.topRow}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderNumber, { color: colors.text.muted }]}>
            #{item.order_number}
          </Text>
          <Text style={[styles.dateText, { color: colors.text.faint }]}>
            {formattedDate}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: statusConfig.bg,
              borderColor: statusConfig.border,
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Route: pharmacy → customer */}
      <View style={styles.routeRow}>
        <View style={styles.routeLeg}>
          <Ionicons name="medkit-outline" size={14} color={colors.brand.primary} />
          <Text
            style={[styles.routeText, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {item.pharmacy_name || "Pharmacy"}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={12} color={colors.text.faint} />
        <View style={styles.routeLeg}>
          <Ionicons name="person-outline" size={14} color={colors.brand.secondary} />
          <Text
            style={[styles.routeText, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {item.customer_name || "Customer"}
          </Text>
        </View>
      </View>

      {/* Bottom row: distance + earnings */}
      <View style={[styles.bottomRow, { borderTopColor: colors.border.subtle }]}>
        <View style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: colors.text.muted }]}>
            Distance
          </Text>
          <Text style={[styles.metaValue, { color: colors.text.primary }]}>
            {item.total_distance_km.toFixed(1)} km
          </Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: colors.text.muted }]}>
            Items
          </Text>
          <Text style={[styles.metaValue, { color: colors.text.primary }]}>
            {item.item_count}
          </Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: colors.text.muted }]}>
            Earning
          </Text>
          <Text style={[styles.earningValue, { color: colors.status.success }]}>
            ₹{item.total_rider_earning.toFixed(0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getStatusConfig(status: string, colors: any) {
  switch (status) {
    case "DELIVERED":
      return {
        label: "Delivered",
        color: colors.status.success,
        bg: colors.status.successBg,
        border: colors.status.successBorder,
      };
    case "FAILED":
      return {
        label: "Failed",
        color: colors.status.error,
        bg: colors.status.errorBg,
        border: colors.status.errorBorder,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: colors.text.muted,
        bg: colors.background.tint,
        border: colors.border.default,
      };
    default:
      return {
        label: status,
        color: colors.text.muted,
        bg: colors.background.tint,
        border: colors.border.default,
      };
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderInfo: {
    flex: 1,
    gap: 2,
  },
  orderNumber: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeLeg: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  routeText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  metaCol: {
    flex: 1,
    alignItems: "flex-start",
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  earningValue: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});