// src/components/history/HistoryDetailModal.tsx (do not remove this comment)

import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { DeliveryHistoryDetail } from "../../types/delivery";

interface HistoryDetailModalProps {
  visible: boolean;
  loading: boolean;
  detail: DeliveryHistoryDetail | null;
  onClose: () => void;
}

export function HistoryDetailModal({
  visible,
  loading,
  detail,
  onClose,
}: HistoryDetailModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: colors.background.page }]}>
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
            onPress={onClose}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Delivery Details
          </Text>
          <View style={{ width: 26 }} />
        </View>

        {loading || !detail ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            {/* Order Header Info */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <View style={styles.summaryTop}>
                <View>
                  <Text style={[styles.orderLabel, { color: colors.text.muted }]}>
                    Order
                  </Text>
                  <Text style={[styles.orderNum, { color: colors.text.primary }]}>
                    #{detail.order_number}
                  </Text>
                </View>
                <StatusBadge status={detail.status} colors={colors} />
              </View>
              {detail.status === "FAILED" && detail.failure_reason && (
                <View style={[styles.failureBox, { backgroundColor: colors.status.errorBg }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.status.error} />
                  <Text style={[styles.failureText, { color: colors.status.error }]}>
                    {detail.failure_reason.replace(/_/g, " ")}
                    {detail.failure_note ? ` — ${detail.failure_note}` : ""}
                  </Text>
                </View>
              )}
            </View>

            {/* Earnings Breakdown */}
            <SectionHeader icon="wallet" title="EARNINGS BREAKDOWN" colors={colors} />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <EarningRow
                label="Pickup Fee (Leg 1)"
                value={detail.earnings.pickup_fee}
                colors={colors}
              />
              <EarningRow
                label="Drop Fee (Leg 2)"
                value={detail.earnings.drop_fee}
                colors={colors}
              />
              {detail.earnings.surge_fee > 0 && (
                <EarningRow
                  label="Surge Bonus"
                  value={detail.earnings.surge_fee}
                  colors={colors}
                  highlight
                />
              )}
              {detail.earnings.floor_topup_fee > 0 && (
                <EarningRow
                  label="Minimum Guarantee Top-up"
                  value={detail.earnings.floor_topup_fee}
                  colors={colors}
                />
              )}
              {detail.earnings.tip_amount > 0 && (
                <EarningRow
                  label="Customer Tip"
                  value={detail.earnings.tip_amount}
                  colors={colors}
                  highlight
                />
              )}
              <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
                  Total Earning
                </Text>
                <Text style={[styles.totalValue, { color: colors.status.success }]}>
                  ₹{detail.earnings.total_earning.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Distance Info */}
            <SectionHeader icon="navigate" title="DISTANCE" colors={colors} />
            <View
              style={[
                styles.card,
                styles.distanceCard,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <DistanceCol
                label="Pickup Leg"
                value={detail.distances.pickup_km}
                colors={colors}
              />
              <View style={[styles.vDivider, { backgroundColor: colors.border.subtle }]} />
              <DistanceCol
                label="Drop Leg"
                value={detail.distances.drop_km}
                colors={colors}
              />
              <View style={[styles.vDivider, { backgroundColor: colors.border.subtle }]} />
              <DistanceCol
                label="Total"
                value={detail.distances.total_km}
                colors={colors}
                highlight
              />
            </View>

            {/* Pharmacy */}
            <SectionHeader icon="medkit" title="PHARMACY (PICKUP)" colors={colors} />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <InfoLine
                label="Store"
                value={
                  detail.pharmacy.branch_name
                    ? `${detail.pharmacy.shop_name} — ${detail.pharmacy.branch_name}`
                    : detail.pharmacy.shop_name || "—"
                }
                colors={colors}
              />
              <InfoLine
                label="Address"
                value={detail.pharmacy.address || "—"}
                colors={colors}
              />
              <InfoLine
                label="Contact"
                value={detail.pharmacy.contact_number || "—"}
                colors={colors}
              />
            </View>

            {/* Customer */}
            <SectionHeader icon="person" title="CUSTOMER (DROP)" colors={colors} />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <InfoLine
                label="Name"
                value={detail.customer.name || "—"}
                colors={colors}
              />
              <InfoLine
                label="Phone"
                value={detail.customer.phone || "—"}
                colors={colors}
              />
              <InfoLine
                label="Address"
                value={
                  [
                    detail.customer.address_line_1,
                    detail.customer.address_line_2,
                    detail.customer.landmark,
                    detail.customer.city,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"
                }
                colors={colors}
              />
            </View>

            {/* Items */}
            <SectionHeader
              icon="cube"
              title={`ITEMS (${detail.items.length})`}
              colors={colors}
            />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              {detail.items.map((item, idx) => (
                <React.Fragment key={item.item_id}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text
                        style={[styles.itemName, { color: colors.text.primary }]}
                        numberOfLines={2}
                      >
                        {item.medicine_name}
                      </Text>
                      {item.pack_size && (
                        <Text style={[styles.itemMeta, { color: colors.text.muted }]}>
                          {item.pack_size}
                        </Text>
                      )}
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={[styles.itemQty, { color: colors.text.secondary }]}>
                        × {item.quantity}
                      </Text>
                      <Text style={[styles.itemPrice, { color: colors.text.primary }]}>
                        ₹{item.line_total.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  {idx < detail.items.length - 1 && (
                    <View
                      style={[styles.divider, { backgroundColor: colors.border.subtle }]}
                    />
                  )}
                </React.Fragment>
              ))}
              <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />
              <View style={styles.itemRow}>
                <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
                  Order Total
                </Text>
                <Text style={[styles.totalValue, { color: colors.text.primary }]}>
                  ₹{detail.order_total.toFixed(2)} ({detail.payment_method})
                </Text>
              </View>
            </View>

            {/* Timeline */}
            <SectionHeader icon="time" title="TIMELINE" colors={colors} />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <TimelineRow
                label="Assigned"
                ts={detail.timestamps.assigned_at}
                colors={colors}
              />
              <TimelineRow
                label="Accepted"
                ts={detail.timestamps.accepted_at}
                colors={colors}
              />
              <TimelineRow
                label="Arrived at Pharmacy"
                ts={detail.timestamps.arrived_at_pharmacy_at}
                colors={colors}
              />
              <TimelineRow
                label="Picked Up"
                ts={detail.timestamps.picked_up_at}
                colors={colors}
              />
              <TimelineRow
                label="Arrived at Customer"
                ts={detail.timestamps.arrived_at_customer_at}
                colors={colors}
              />
              <TimelineRow
                label="Delivered"
                ts={detail.timestamps.delivered_at}
                colors={colors}
                final
              />
              {detail.timestamps.failed_at && (
                <TimelineRow
                  label="Failed"
                  ts={detail.timestamps.failed_at}
                  colors={colors}
                  final
                  fail
                />
              )}
            </View>

            {/* Rating */}
            {detail.rating && (
              <>
                <SectionHeader
                  icon="star"
                  title="CUSTOMER RATING"
                  colors={colors}
                />
                <View
                  style={[
                    styles.card,
                    styles.ratingCard,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons
                        key={n}
                        name={n <= detail.rating!.stars ? "star" : "star-outline"}
                        size={22}
                        color={n <= detail.rating!.stars ? "#F59E0B" : colors.text.faint}
                      />
                    ))}
                  </View>
                  <Text style={[styles.ratingValue, { color: colors.text.primary }]}>
                    {detail.rating.stars}.0 / 5.0
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ── Sub-Components ────────────────────────────────────────────────────────

function StatusBadge({ status, colors }: { status: string; colors: any }) {
  const config = (() => {
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
  })();

  return (
    <View
      style={[
        styles.badgeBig,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <Text style={[styles.badgeBigText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  colors: any;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color={colors.brand.primary} />
      <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>
        {title}
      </Text>
    </View>
  );
}

function EarningRow({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: number;
  colors: any;
  highlight?: boolean;
}) {
  return (
    <View style={styles.earningRow}>
      <Text style={[styles.earningLabel, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.earningValue,
          {
            color: highlight ? colors.brand.secondary : colors.text.primary,
          },
        ]}
      >
        ₹{value.toFixed(2)}
      </Text>
    </View>
  );
}

function DistanceCol({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: number;
  colors: any;
  highlight?: boolean;
}) {
  return (
    <View style={styles.distanceCol}>
      <Text style={[styles.distLabel, { color: colors.text.muted }]}>{label}</Text>
      <Text
        style={[
          styles.distValue,
          { color: highlight ? colors.brand.primary : colors.text.primary },
        ]}
      >
        {value.toFixed(1)}
      </Text>
      <Text style={[styles.distUnit, { color: colors.text.faint }]}>km</Text>
    </View>
  );
}

function InfoLine({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoLine}>
      <Text style={[styles.infoLineLabel, { color: colors.text.muted }]}>
        {label}
      </Text>
      <Text style={[styles.infoLineValue, { color: colors.text.primary }]}>
        {value}
      </Text>
    </View>
  );
}

function TimelineRow({
  label,
  ts,
  colors,
  final,
  fail,
}: {
  label: string;
  ts: string | null;
  colors: any;
  final?: boolean;
  fail?: boolean;
}) {
  const formatted = ts
    ? new Date(ts).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const dotColor = !ts
    ? colors.text.faint
    : fail
      ? colors.status.error
      : final
        ? colors.status.success
        : colors.brand.primary;
  return (
    <View style={styles.timelineRow}>
      <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.timelineLabel, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <Text style={[styles.timelineTime, { color: colors.text.muted }]}>
        {formatted}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  scrollContent: { padding: 16 },

  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  orderNum: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  badgeBig: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeBigText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  failureBox: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  failureText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },

  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  earningLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  earningValue: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },

  distanceCard: {
    flexDirection: "row",
    padding: 16,
  },
  distanceCol: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  distLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.3,
  },
  distValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  distUnit: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
  },
  vDivider: {
    width: 1,
    marginHorizontal: 8,
  },

  infoLine: {
    gap: 3,
    paddingVertical: 5,
  },
  infoLineLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.3,
  },
  infoLineValue: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    lineHeight: 18,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    gap: 10,
  },
  itemLeft: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  itemMeta: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  itemQty: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  timelineTime: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },

  ratingCard: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});