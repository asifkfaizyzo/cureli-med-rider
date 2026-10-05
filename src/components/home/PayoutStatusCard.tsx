// src/components/home/PayoutStatusCard.tsx (do not remove this comment)

import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { PayoutSection } from "../../types/location";
import type { PayoutStatus } from "../../types/earnings";

interface PayoutStatusCardProps {
  payout?: PayoutSection;
}

const STATUS_CONFIG: Record<
  PayoutStatus,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  PENDING: { icon: "time-outline", label: "Pending" },
  PROCESSING: { icon: "sync-outline", label: "Processing" },
  COMPLETED: { icon: "checkmark-circle-outline", label: "Paid" },
  FAILED: { icon: "alert-circle-outline", label: "Failed" },
};

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

export function PayoutStatusCard({ payout }: PayoutStatusCardProps) {
  const { colors, isDark } = useTheme();

  if (!payout || !payout.current_week) return null;

  const currentWeekStart = formatShortDate(payout.current_week.week_start);
  const currentWeekEnd = formatShortDate(payout.current_week.week_end);

  const lastPayout = payout.last_payout;
  const lastStatus = (lastPayout?.status || "PENDING") as PayoutStatus;
  const statusCfg = STATUS_CONFIG[lastStatus] || STATUS_CONFIG.PENDING;

  const getStatusTheme = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          color: colors.status.success,
          bg: colors.status.successBg,
          border: colors.status.successBorder,
        };
      case "FAILED":
        return {
          color: colors.status.error,
          bg: colors.status.errorBg,
          border: colors.status.errorBorder,
        };
      case "PROCESSING":
        return {
          color: colors.status.info,
          bg: colors.status.infoBg,
          border: isDark ? "rgba(56, 189, 248, 0.25)" : "#bae6fd",
        };
      default:
        return {
          color: colors.status.warning,
          bg: colors.status.warningBg,
          border: isDark ? "rgba(251, 191, 36, 0.25)" : "#fef3c7",
        };
    }
  };

  const statusTheme = getStatusTheme(lastStatus);

  // Net amount display logic
  const lastNet = lastPayout?.net_amount ?? lastPayout?.gross_amount ?? 0;
  const lastGross = lastPayout?.gross_amount ?? 0;
  const grossDiffers =
    lastPayout != null && Math.abs(lastGross - lastNet) > 0.01;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIconContainer,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons name="wallet" size={16} color={colors.brand.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Payout Summary
          </Text>
        </View>
      </View>

      {/* Current Week Accumulated Highlight Card */}
      <View
        style={[
          styles.currentWeekCard,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : colors.background.tint,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.currentWeekLeft}>
          <Text style={[styles.currentLabel, { color: colors.text.secondary }]}>
            Current Cycle
          </Text>
          <Text style={[styles.currentSub, { color: colors.text.muted }]}>
            {currentWeekStart} – {currentWeekEnd}
          </Text>
        </View>

        <View style={styles.currentWeekRight}>
          <Text style={[styles.currentAmount, { color: colors.text.primary }]}>
            ₹{(payout.current_week.accumulated_amount ?? 0).toFixed(0)}
          </Text>
          <Text style={[styles.accumulatedLabel, { color: colors.text.muted }]}>
            Accumulated
          </Text>
        </View>
      </View>

      {/* Last Payout Row */}
      {lastPayout && (
        <View
          style={[
            styles.lastPayoutContainer,
            { borderColor: colors.border.subtle },
          ]}
        >
          <View style={styles.lastPayoutLeft}>
            <Text style={[styles.lastLabel, { color: colors.text.secondary }]}>
              Last Payout
            </Text>
            <Text style={[styles.lastSub, { color: colors.text.muted }]}>
              {formatShortDate(lastPayout.week_start)} –{" "}
              {formatShortDate(lastPayout.week_end)}
            </Text>
          </View>

          <View style={styles.lastPayoutRight}>
            <Text style={[styles.lastAmount, { color: colors.text.primary }]}>
              ₹{lastNet.toFixed(0)}
            </Text>
            {grossDiffers && (
              <Text style={[styles.lastGrossSub, { color: colors.text.muted }]}>
                Gross ₹{lastGross.toFixed(0)}
              </Text>
            )}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusTheme.bg,
                  borderColor: statusTheme.border,
                },
              ]}
            >
              <Ionicons
                name={statusCfg.icon}
                size={11}
                color={statusTheme.color}
              />
              <Text
                style={[styles.statusText, { color: statusTheme.color }]}
                numberOfLines={1}
              >
                {statusCfg.label}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  currentWeekCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  currentWeekLeft: {
    gap: 3,
  },
  currentLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  currentSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  currentWeekRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  currentAmount: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  accumulatedLabel: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
  },
  lastPayoutContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 2,
    borderTopWidth: 1,
  },
  lastPayoutLeft: {
    gap: 2,
  },
  lastLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  lastSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  lastPayoutRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  lastAmount: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  lastGrossSub: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
});