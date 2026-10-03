// src/components/earnings/PayoutHistoryCard.tsx (do not remove this comment)

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import type { ColorPalette } from "../../theme/colors";
import type { PayoutHistoryItem } from "../../types/earnings";

interface PayoutHistoryCardProps {
  payout: PayoutHistoryItem;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const e = new Date(end + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${s} - ${e}`;
}

const getStatusConfig = (colors: ColorPalette): Record<string, { label: string; color: string; bg: string }> => ({
  PENDING: {
    label: "Pending",
    color: colors.status.warning,
    bg: colors.status.warningBg,
  },
  PROCESSING: {
    label: "Processing",
    color: colors.status.info,
    bg: colors.status.infoBg,
  },
  COMPLETED: {
    label: "Completed",
    color: colors.status.success,
    bg: colors.status.successBg,
  },
  FAILED: {
    label: "Failed",
    color: colors.status.error,
    bg: colors.status.errorBg,
  },
});

export default function PayoutHistoryCard({ payout }: PayoutHistoryCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const statusConfig = useMemo(() => getStatusConfig(colors), [colors]);
  const statusCfg = statusConfig[payout.status] || statusConfig.PENDING;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.weekRange}>
          {formatWeekRange(payout.week_start, payout.week_end)}
        </Text>
        <View
          style={[styles.badge, { backgroundColor: statusCfg.bg }]}
        >
          <Text style={[styles.badgeText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.amount}>
          {formatCurrency(payout.gross_amount)}
        </Text>
        <View style={styles.metaRow}>
          {payout.payment_method ? (
            <Text style={styles.meta}>{payout.payment_method}</Text>
          ) : null}
          {payout.processed_at ? (
            <Text style={styles.meta}>
              {new Date(payout.processed_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
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
    alignItems: "center",
  },
  weekRange: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  metaRow: {
    gap: 8,
    flexDirection: "row",
  },
  meta: {
    fontSize: 11,
    color: colors.text.muted,
  },
});