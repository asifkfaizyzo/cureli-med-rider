// src/components/earnings/PayoutHistoryCard.tsx (do not remove this comment)

import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import type { ColorPalette } from "../../theme/colors";
import type { PayoutHistoryItem, PayoutStatus } from "../../types/earnings";

interface PayoutHistoryCardProps {
  payout: PayoutHistoryItem;
  onPress?: () => void;
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

const getStatusConfig = (
  colors: ColorPalette,
): Record<PayoutStatus, { label: string; color: string; bg: string }> => ({
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

export default function PayoutHistoryCard({
  payout,
  onPress,
}: PayoutHistoryCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const statusConfig = useMemo(() => getStatusConfig(colors), [colors]);
  const statusCfg = statusConfig[payout.status] || statusConfig.PENDING;

  // Show gross subtitle only when deductions exist and amounts differ
  const hasDeductions = payout.deductions && payout.deductions.length > 0;
  const grossDiffers =
    hasDeductions &&
    Math.abs(payout.gross_amount - payout.net_amount) > 0.01;

  const content = (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.weekRange}>
          {formatWeekRange(payout.week_start, payout.week_end)}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.badgeText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.amount}>
            {formatCurrency(payout.net_amount)}
          </Text>
          {grossDiffers && (
            <Text style={styles.grossSub}>
              Gross {formatCurrency(payout.gross_amount)}
            </Text>
          )}
        </View>
        <View style={styles.metaRow}>
          {/* {payout.utr_reference ? (
            <Text style={styles.meta} numberOfLines={1}>
              UTR: {payout.utr_reference}
            </Text>
          ) : payout.payment_method ? (
            <Text style={styles.meta}>{payout.payment_method}</Text>
          ) : null} */}
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

      {/* Chevron hint when tappable */}
      {onPress && (
        <View style={styles.chevronHint}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.text.faint}
          />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.touchable}
        activeOpacity={0.7}
        onPress={onPress}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchable}>{content}</View>;
}

const getStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    touchable: {
      marginHorizontal: 16,
      marginBottom: 8,
    },
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 12,
      padding: 14,
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
      alignItems: "flex-end",
      marginTop: 8,
    },
    amountBlock: {
      gap: 2,
    },
    amount: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text.primary,
    },
    grossSub: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.text.muted,
    },
    metaRow: {
      gap: 6,
      flexDirection: "column",
      alignItems: "flex-end",
      maxWidth: "50%",
    },
    meta: {
      fontSize: 11,
      color: colors.text.muted,
    },
    chevronHint: {
      position: "absolute",
      right: 10,
      top: "80%",
      marginTop: -8,
    },
  });