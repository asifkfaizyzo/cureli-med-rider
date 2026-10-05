// src/components/earnings/PayoutDetailModal.tsx (do not remove this comment)

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { ColorPalette } from "../../theme/colors";
import type { PayoutHistoryItem, PayoutStatus } from "../../types/earnings";

// ── Props ────────────────────────────────────────────────────

interface PayoutDetailModalProps {
  visible: boolean;
  payout: PayoutHistoryItem | null;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

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
  return `${s} – ${e}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskAccount(acc?: string): string {
  if (!acc || acc.length < 4) return acc || "—";
  const last4 = acc.slice(-4);
  return `XXXX XXXX ${last4}`;
}

// ── Status Config ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PayoutStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING: { label: "Pending Review", icon: "time-outline" },
  PROCESSING: { label: "Processing", icon: "sync-outline" },
  COMPLETED: { label: "Completed", icon: "checkmark-circle-outline" },
  FAILED: { label: "Failed", icon: "alert-circle-outline" },
};

function getStatusTheme(
  status: PayoutStatus,
  colors: ColorPalette,
  isDark: boolean,
) {
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
    case "PENDING":
    default:
      return {
        color: colors.status.warning,
        bg: colors.status.warningBg,
        border: isDark ? "rgba(251, 191, 36, 0.25)" : "#fef3c7",
      };
  }
}

// ── Component ────────────────────────────────────────────────

export default function PayoutDetailModal({
  visible,
  payout,
  onClose,
}: PayoutDetailModalProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [copied, setCopied] = useState(false);

  const handleCopyUtr = useCallback(() => {
    if (!payout?.utr_reference) return;
    Clipboard.setString(payout.utr_reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [payout?.utr_reference]);

  if (!payout) return null;

  const statusCfg = STATUS_CONFIG[payout.status] || STATUS_CONFIG.PENDING;
  const statusTheme = getStatusTheme(payout.status, colors, isDark);
  const hasDeductions = payout.deductions && payout.deductions.length > 0;
  const grossDiffers =
    hasDeductions && Math.abs(payout.gross_amount - payout.net_amount) > 0.01;
  const snapshot = payout.breakdown_snapshot;
  const isTeam = snapshot?.type === "TEAM_SALARY";
  const bank = payout.bank_snapshot;
  const hasDaily =
    !isTeam && snapshot?.daily && snapshot.daily.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Card */}
      <View style={styles.card}>
        {/* Drag Handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Payout Details</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Amount & Status Card ──────────────────────── */}
          <View
            style={[
              styles.amountCard,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.03)"
                  : colors.background.tint,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <View style={styles.amountTopRow}>
              <Text style={styles.weekRange}>
                {formatWeekRange(payout.week_start, payout.week_end)}
              </Text>
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
                >
                  {statusCfg.label}
                </Text>
              </View>
            </View>

            <View style={styles.amountRow}>
              <View>
                <Text style={styles.netLabel}>Net Payout</Text>
                <Text style={styles.netAmount}>
                  {formatCurrency(payout.net_amount)}
                </Text>
                {grossDiffers && (
                  <Text style={styles.grossSub}>
                    Gross {formatCurrency(payout.gross_amount)}
                  </Text>
                )}
              </View>
              {isTeam && (
                <View style={styles.teamTag}>
                  <Ionicons
                    name="people-outline"
                    size={12}
                    color={colors.brand.primary}
                  />
                  <Text
                    style={[styles.teamTagText, { color: colors.brand.primary }]}
                  >
                    Salary
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── UTR Reference ─────────────────────────────── */}
          {payout.utr_reference && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>UTR Reference</Text>
              <View
                style={[
                  styles.utrRow,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : colors.background.tint,
                    borderColor: colors.border.subtle,
                  },
                ]}
              >
                <Text style={styles.utrText} numberOfLines={1}>
                  {payout.utr_reference}
                </Text>
                <TouchableOpacity
                  onPress={handleCopyUtr}
                  style={styles.copyBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={16}
                    color={
                      copied ? colors.status.success : colors.brand.primary
                    }
                  />
                  <Text
                    style={[
                      styles.copyText,
                      {
                        color: copied
                          ? colors.status.success
                          : colors.brand.primary,
                      },
                    ]}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Payment Details ───────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.detailGrid}>
              <DetailRow
                label="Method"
                value={payout.payment_method || "Bank Transfer"}
                colors={colors}
              />
              <DetailRow
                label="Processed"
                value={formatDate(payout.processed_at)}
                colors={colors}
              />
              {payout.status === "FAILED" && (
                <DetailRow
                  label="Status Note"
                  value="Payment will be retried"
                  colors={colors}
                  valueColor={colors.status.error}
                />
              )}
            </View>
          </View>

          {/* ── Bank Details ──────────────────────────────── */}
          {bank && (bank.account_holder_name || bank.bank_name) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank Details</Text>
              <View style={styles.detailGrid}>
                {bank.account_holder_name && (
                  <DetailRow
                    label="Account Holder"
                    value={bank.account_holder_name}
                    colors={colors}
                  />
                )}
                {bank.account_number && (
                  <DetailRow
                    label="Account No."
                    value={maskAccount(bank.account_number)}
                    colors={colors}
                  />
                )}
                {bank.bank_name && (
                  <DetailRow
                    label="Bank"
                    value={bank.bank_name}
                    colors={colors}
                  />
                )}
                {bank.ifsc_code && (
                  <DetailRow
                    label="IFSC"
                    value={bank.ifsc_code}
                    colors={colors}
                  />
                )}
              </View>
            </View>
          )}

          {/* ── Deductions ────────────────────────────────── */}
          {hasDeductions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deductions</Text>
              {payout.deductions.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.deductionRow,
                    {
                      backgroundColor: isDark
                        ? "rgba(239, 68, 68, 0.06)"
                        : "rgba(239, 68, 68, 0.04)",
                      borderColor: isDark
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(239, 68, 68, 0.15)",
                    },
                  ]}
                >
                  <View style={styles.deductionLeft}>
                    <Ionicons
                      name="remove-circle-outline"
                      size={14}
                      color={colors.status.error}
                    />
                    <View>
                      <Text style={styles.deductionLabel}>{d.label}</Text>
                      {d.note ? (
                        <Text style={styles.deductionNote}>{d.note}</Text>
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.deductionAmount}>
                    −{formatCurrency(d.amount)}
                  </Text>
                </View>
              ))}
              <View style={styles.deductionTotalRow}>
                <Text style={styles.deductionTotalLabel}>Total Deducted</Text>
                <Text style={styles.deductionTotalValue}>
                  −
                  {formatCurrency(
                    payout.deductions.reduce((s, d) => s + d.amount, 0),
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* ── Daily Breakdown (INDEPENDENT only) ────────── */}
          {hasDaily && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Breakdown</Text>
              {snapshot!.daily!.map((day, i) => (
                <View key={i} style={styles.dailyRow}>
                  <View style={styles.dailyLeft}>
                    <Text style={styles.dailyDay}>{day.day_name}</Text>
                    <Text style={styles.dailyDate}>{day.date}</Text>
                  </View>
                  <View style={styles.dailyRight}>
                    <Text style={styles.dailyAmount}>
                      {formatCurrency(day.total)}
                    </Text>
                    <Text style={styles.dailyDeliveries}>
                      {day.deliveries} deliveries
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── TEAM Attendance Summary ───────────────────── */}
          {isTeam && snapshot?.attendance && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attendance Summary</Text>
              <View style={styles.detailGrid}>
                <DetailRow
                  label="Days Active"
                  value={`${snapshot.attendance.days_active ?? 0} days`}
                  colors={colors}
                />
                <DetailRow
                  label="Total Hours"
                  value={`${(snapshot.attendance.total_hours ?? 0).toFixed(1)}h`}
                  colors={colors}
                />
                <DetailRow
                  label="Total Orders"
                  value={`${snapshot.attendance.total_orders ?? 0}`}
                  colors={colors}
                />
              </View>
            </View>
          )}

          {/* Bottom spacer */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Sub-component: Detail Row ────────────────────────────────

function DetailRow({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: ColorPalette;
  valueColor?: string;
}) {
  return (
    <View style={detailRowStyles.row}>
      <Text style={[detailRowStyles.label, { color: colors.text.muted }]}>
        {label}
      </Text>
      <Text
        style={[
          detailRowStyles.value,
          { color: valueColor || colors.text.primary },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const detailRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    flex: 1.5,
    textAlign: "right",
  },
});

// ── Styles ───────────────────────────────────────────────────

const getStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    card: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: "85%",
      backgroundColor: colors.background.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
    handleRow: {
      alignItems: "center",
      paddingBottom: 8,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border.default,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: FontFamily.bold,
      color: colors.text.primary,
    },
    closeBtn: {
      padding: 4,
    },
    scrollContent: {
      paddingHorizontal: 20,
    },

    // Amount Card
    amountCard: {
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      marginBottom: 16,
      gap: 10,
    },
    amountTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    weekRange: {
      fontSize: 13,
      fontFamily: FontFamily.medium,
      color: colors.text.secondary,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 10,
      fontFamily: FontFamily.bold,
    },
    amountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    netLabel: {
      fontSize: 11,
      fontFamily: FontFamily.medium,
      color: colors.text.muted,
      marginBottom: 2,
    },
    netAmount: {
      fontSize: 26,
      fontFamily: FontFamily.bold,
      color: colors.text.primary,
    },
    grossSub: {
      fontSize: 12,
      fontFamily: FontFamily.regular,
      color: colors.text.muted,
      marginTop: 2,
    },
    teamTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: "rgba(176, 132, 235, 0.1)",
    },
    teamTagText: {
      fontSize: 11,
      fontFamily: FontFamily.semiBold,
    },

    // Sections
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: FontFamily.semiBold,
      color: colors.text.secondary,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // UTR
    utrRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    utrText: {
      fontSize: 13,
      fontFamily: FontFamily.semiBold,
      color: colors.text.primary,
      flex: 1,
      marginRight: 8,
    },
    copyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    copyText: {
      fontSize: 12,
      fontFamily: FontFamily.semiBold,
    },

    // Detail Grid
    detailGrid: {
      paddingHorizontal: 2,
    },

    // Deductions
    deductionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 6,
    },
    deductionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    deductionLabel: {
      fontSize: 13,
      fontFamily: FontFamily.semiBold,
      color: colors.text.primary,
    },
    deductionNote: {
      fontSize: 11,
      fontFamily: FontFamily.regular,
      color: colors.text.muted,
      marginTop: 1,
    },
    deductionAmount: {
      fontSize: 14,
      fontFamily: FontFamily.bold,
      color: colors.status.error,
    },
    deductionTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 8,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    deductionTotalLabel: {
      fontSize: 13,
      fontFamily: FontFamily.semiBold,
      color: colors.text.secondary,
    },
    deductionTotalValue: {
      fontSize: 14,
      fontFamily: FontFamily.bold,
      color: colors.status.error,
    },

    // Daily Breakdown
    dailyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    dailyLeft: {
      gap: 2,
    },
    dailyDay: {
      fontSize: 13,
      fontFamily: FontFamily.semiBold,
      color: colors.text.primary,
    },
    dailyDate: {
      fontSize: 11,
      fontFamily: FontFamily.regular,
      color: colors.text.muted,
    },
    dailyRight: {
      alignItems: "flex-end",
      gap: 2,
    },
    dailyAmount: {
      fontSize: 14,
      fontFamily: FontFamily.bold,
      color: colors.text.primary,
    },
    dailyDeliveries: {
      fontSize: 11,
      fontFamily: FontFamily.regular,
      color: colors.text.muted,
    },
  });