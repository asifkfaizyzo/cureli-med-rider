// src/components/delivery/BatchDeliveryScreen.tsx (do not remove this comment)
//
// Two-state batch delivery screen for Same Day orders.
// View "list": grouped vertical order list with progress header.
// View "detail": drill-in map + leg panel (reuses instant delivery components).

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { deliveryApi } from "../../features/delivery/api/delivery.api";
import { useBatchAutoEnRoute } from "../../hooks/useBatchAutoEnRoute";
import { useDeliveryStore } from "../../store/deliveryStore";
import { useTheme } from "../../theme/ThemeContext";
import type { ColorPalette } from "../../theme/colors";
import type {
  ActiveDelivery,
  DeliveryStatus,
  SameDayBatchOrder,
} from "../../types/delivery";
import { useDialog } from "../Dialog/DialogProvider";
import { CustomerLegPanel } from "./CustomerLegPanel";
import { DeliveryDetailsPanel } from "./DeliveryDetailsPanel";
import { DeliveryMapView } from "./DeliveryMapView";
import { PharmacyLegPanel } from "./PharmacyLegPanel";
import { TopStatusBar } from "./TopStatusBar";

// ── Types ──────────────────────────────────────────────────────────────

type ListItem =
  | {
      type: "section";
      key: string;
      title: string;
      count: number;
      collapsible?: boolean;
    }
  | { type: "order"; key: string; order: SameDayBatchOrder };

// ── Status helpers ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING_ASSIGNMENT: "Pending",
  RIDER_NOTIFIED: "Notified",
  ACCEPTED: "Accepted",
  ARRIVED_AT_PHARMACY: "At Pharmacy",
  PICKED_UP: "Picked Up",
  EN_ROUTE: "En Route",
  ARRIVED_AT_CUSTOMER: "At Customer",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

function getStatusColor(status: DeliveryStatus, colors: ColorPalette): string {
  switch (status) {
    case "ACCEPTED":
      return colors.status.info;
    case "ARRIVED_AT_PHARMACY":
      return colors.brand.primary;
    case "PICKED_UP":
      return colors.status.warning;
    case "EN_ROUTE":
      return colors.status.warning;
    case "ARRIVED_AT_CUSTOMER":
      return colors.status.success;
    case "DELIVERED":
      return colors.status.success;
    case "FAILED":
      return colors.status.error;
    case "CANCELLED":
      return colors.text.muted;
    default:
      return colors.text.muted;
  }
}

function isOrderActive(status: DeliveryStatus): boolean {
  return !["DELIVERED", "FAILED", "CANCELLED"].includes(status);
}

function isPostPickup(status: DeliveryStatus): boolean {
  return ["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_CUSTOMER", "DELIVERED"].includes(
    status,
  );
}

/**
 * Pre-pickup: customer details are null (privacy design), so show
 * the pharmacy address/branch the rider is picking up from.
 * Post-pickup: show the customer delivery address.
 */
function getOrderAddress(order: SameDayBatchOrder): string {
  if (isPostPickup(order.status) && order.customer) {
    const c = order.customer;
    return (
      [c.address_line_1, c.landmark, c.city].filter(Boolean).join(", ") ||
      "Customer location"
    );
  }
  // Pre-pickup — show pharmacy info (customer hidden until pickup)
  const p = order.pharmacy;
  if (p.branch_name) return `Pickup: ${p.branch_name}`;
  if (p.shop_name) return `Pickup: ${p.shop_name}`;
  if (p.address) return p.address;
  return "Pharmacy location";
}

// ── Component ──────────────────────────────────────────────────────────

export function BatchDeliveryScreen() {
  const { colors } = useTheme();
  const dialog = useDialog();
  const activeBatches = useDeliveryStore((s) => s.activeBatches);
  const updateOrderInBatch = useDeliveryStore((s) => s.updateOrderInBatch);
  const removeOrderFromBatch = useDeliveryStore((s) => s.removeOrderFromBatch);
  const removeBatch = useDeliveryStore((s) => s.removeBatch);
  const setActiveBatches = useDeliveryStore((s) => s.setActiveBatches);

  const batch = activeBatches[0] || null;

  // ── View state ─────────────────────────────────────────────────────
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  // Auto-transition PICKED_UP → EN_ROUTE after delay
  useBatchAutoEnRoute();

  // ── Derived data ───────────────────────────────────────────────────
  const selectedOrder = useMemo(
    () => batch?.orders.find((o) => o.order_id === selectedOrderId) || null,
    [batch, selectedOrderId],
  );

  const completedCount = useMemo(
    () => batch?.orders.filter((o) => o.status === "DELIVERED").length || 0,
    [batch],
  );

  const allDelivered = useMemo(
    () =>
      batch != null &&
      batch.orders.length > 0 &&
      batch.orders.every((o) =>
        ["DELIVERED", "FAILED", "CANCELLED"].includes(o.status),
      ),
    [batch],
  );

  const pharmacyName = useMemo(() => {
    if (!batch || batch.orders.length === 0) return "";
    const p = batch.orders[0].pharmacy;
    return [p.shop_name, p.branch_name].filter(Boolean).join(" · ");
  }, [batch]);

  const activeCount = useMemo(
    () => batch?.orders.filter((o) => isOrderActive(o.status)).length || 0,
    [batch],
  );

  // ── List data ──────────────────────────────────────────────────────
  const listData = useMemo<ListItem[]>(() => {
    if (!batch) return [];

    const pickupNeeded = batch.orders.filter((o) =>
      [
        "PENDING_ASSIGNMENT",
        "RIDER_NOTIFIED",
        "ACCEPTED",
        "ARRIVED_AT_PHARMACY",
      ].includes(o.status),
    );
    const inTransit = batch.orders.filter((o) =>
      ["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_CUSTOMER"].includes(o.status),
    );
    const completed = batch.orders.filter((o) =>
      ["DELIVERED", "FAILED", "CANCELLED"].includes(o.status),
    );

    const result: ListItem[] = [];

    if (pickupNeeded.length > 0) {
      result.push({
        type: "section",
        key: "sec-pickup",
        title: "PICKUP NEEDED",
        count: pickupNeeded.length,
      });
      pickupNeeded.forEach((o) =>
        result.push({ type: "order", key: o.delivery_id, order: o }),
      );
    }

    if (inTransit.length > 0) {
      result.push({
        type: "section",
        key: "sec-transit",
        title: "IN TRANSIT",
        count: inTransit.length,
      });
      inTransit.forEach((o) =>
        result.push({ type: "order", key: o.delivery_id, order: o }),
      );
    }

    if (completed.length > 0) {
      result.push({
        type: "section",
        key: "sec-completed",
        title: "COMPLETED",
        count: completed.length,
        collapsible: true,
      });
      if (completedExpanded) {
        completed.forEach((o) =>
          result.push({ type: "order", key: o.delivery_id, order: o }),
        );
      }
    }

    return result;
  }, [batch, completedExpanded]);

  // ── Detail view: leg + map coords ──────────────────────────────────
  const leg = useMemo(() => {
    if (!selectedOrder) return "PHARMACY" as const;
    return isPostPickup(selectedOrder.status) ? "CUSTOMER" : "PHARMACY";
  }, [selectedOrder]);

  const targetLat = useMemo(() => {
    if (!selectedOrder) return null;
    return leg === "PHARMACY"
      ? selectedOrder.pharmacy.latitude
      : (selectedOrder.customer?.latitude ?? null);
  }, [selectedOrder, leg]);

  const targetLng = useMemo(() => {
    if (!selectedOrder) return null;
    return leg === "PHARMACY"
      ? selectedOrder.pharmacy.longitude
      : (selectedOrder.customer?.longitude ?? null);
  }, [selectedOrder, leg]);

  // ── Effects ────────────────────────────────────────────────────────

  useEffect(() => {
    if (allDelivered && batch) {
      const timer = setTimeout(() => {
        removeBatch(batch.batch_group_id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allDelivered, batch, removeBatch]);

  useEffect(() => {
    if (view === "detail" && !selectedOrder) {
      setView("list");
      setSelectedOrderId(null);
    }
  }, [view, selectedOrder]);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleStatusUpdated = useCallback(
    async (updated: ActiveDelivery) => {
      updateOrderInBatch(updated.delivery_id, {
        status: updated.status,
        order_status: updated.order_status,
        timestamps: updated.timestamps,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      try {
        const all = await deliveryApi.getActiveDeliveries();
        setActiveBatches(all.batches);
      } catch {
        // Silent — local patch is good enough until next SSE event
      }
    },
    [updateOrderInBatch, setActiveBatches],
  );

  const handleDeliveryDone = useCallback(() => {
    if (!selectedOrder || !batch) return;

    // Mark as DELIVERED locally so it appears in the COMPLETED section.
    // The allDelivered effect auto-clears the batch 3s after all orders finish.
    updateOrderInBatch(selectedOrder.delivery_id, {
      status: "DELIVERED" as DeliveryStatus,
    });

    setSelectedOrderId(null);
    setView("list");

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, [selectedOrder, batch, updateOrderInBatch]);

  const handleBack = useCallback(() => {
    setSelectedOrderId(null);
    setView("list");
    deliveryApi
      .getActiveDeliveries()
      .then((all) => setActiveBatches(all.batches))
      .catch(() => {});
  }, [setActiveBatches]);

  const handleOrderTap = useCallback((order: SameDayBatchOrder) => {
    if (!isOrderActive(order.status)) return;
    setSelectedOrderId(order.order_id);
    setView("detail");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }, []);

  // ── Render: null guard ─────────────────────────────────────────────
  if (!batch) return null;

  // ── Render: Detail View ────────────────────────────────────────────
  if (view === "detail" && selectedOrder) {
    const deliveryAsActive = selectedOrder as unknown as ActiveDelivery;

    return (
      <View
        style={[styles.container, { backgroundColor: colors.background.page }]}
      >
        <TopStatusBar
          orderNumber={selectedOrder.order_number}
          leg={leg}
          onBack={handleBack}
        />
        <KeyboardAvoidingView
          style={styles.flexFill}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.mapContainer}>
            <DeliveryMapView
              leg={leg}
              targetLat={targetLat}
              targetLng={targetLng}
            />
          </View>
          <DeliveryDetailsPanel>
            {leg === "PHARMACY" ? (
              <PharmacyLegPanel
                delivery={deliveryAsActive}
                onStatusUpdated={handleStatusUpdated}
              />
            ) : (
              <CustomerLegPanel
                delivery={deliveryAsActive}
                onStatusUpdated={handleStatusUpdated}
                onDeliveryDone={handleDeliveryDone}
              />
            )}
          </DeliveryDetailsPanel>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Progress ring values ───────────────────────────────────────────
  const totalOrders = batch.order_count || 1;
  const progressPct = Math.round((completedCount / totalOrders) * 100);

  // ── Render: List View ──────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* ── Header with progress ring ──────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[styles.batchIcon, { backgroundColor: colors.brand.light }]}
          >
            <Ionicons name="cube" size={18} color={colors.brand.primary} />
          </View>
          <View style={styles.headerTextBlock}>
            <Text
              style={[styles.headerTitle, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              Same Day Batch
            </Text>
            <Text style={[styles.headerSub, { color: colors.text.muted }]}>
              {activeCount} active · {pharmacyName || "Pharmacy"}
            </Text>
          </View>
        </View>

        {/* Circular progress */}
        <View style={styles.progressRing}>
          <View
            style={[
              styles.progressRingTrack,
              { borderColor: colors.background.tint },
            ]}
          >
            <View
              style={[
                styles.progressRingFill,
                {
                  borderColor:
                    progressPct === 100
                      ? colors.status.success
                      : colors.brand.primary,
                  // Simple visual: rotate a half-circle overlay
                  // For a true ring you'd use an SVG/ART library;
                  // this gives a clean "done / not done" indicator.
                  opacity: progressPct > 0 ? 1 : 0,
                },
              ]}
            />
            <Text
              style={[
                styles.progressRingText,
                {
                  color:
                    progressPct === 100
                      ? colors.status.success
                      : colors.brand.primary,
                },
              ]}
            >
              {completedCount}/{totalOrders}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Linear progress bar (thin, under header) ───────────────── */}
      <View
        style={[styles.progressBar, { backgroundColor: colors.background.tint }]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor:
                progressPct === 100
                  ? colors.status.success
                  : colors.brand.primary,
              width: `${progressPct}%`,
            },
          ]}
        />
      </View>

      {/* ── Scrollable List ────────────────────────────────────────── */}
      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* All Delivered Banner */}
            {allDelivered && (
              <View
                style={[
                  styles.completeBanner,
                  {
                    backgroundColor: colors.status.successBg,
                    borderColor: colors.status.successBorder,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.status.success}
                />
                <Text
                  style={[
                    styles.completeBannerText,
                    { color: colors.status.success },
                  ]}
                >
                  All delivered! Batch complete 🎉
                </Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={<View style={styles.listFooter} />}
        renderItem={({ item }) => {
          if (item.type === "section") {
            const isCollapsible = item.collapsible === true;
            return (
              <TouchableOpacity
                style={styles.sectionHeader}
                activeOpacity={isCollapsible ? 0.6 : 1}
                onPress={
                  isCollapsible
                    ? () => setCompletedExpanded((prev) => !prev)
                    : undefined
                }
                disabled={!isCollapsible}
              >
                <View style={styles.sectionLeft}>
                  <View
                    style={[
                      styles.sectionDot,
                      {
                        backgroundColor:
                          item.title === "PICKUP NEEDED"
                            ? colors.brand.primary
                            : item.title === "IN TRANSIT"
                              ? colors.status.warning
                              : colors.status.success,
                      },
                    ]}
                  />
                  <Text
                    style={[styles.sectionTitle, { color: colors.text.muted }]}
                  >
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.sectionCount,
                      { backgroundColor: colors.background.tint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionCountText,
                        { color: colors.text.muted },
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                </View>
                {isCollapsible && (
                  <Ionicons
                    name={completedExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.text.muted}
                  />
                )}
              </TouchableOpacity>
            );
          }

          // ── Order card ───────────────────────────────────────────
          const order = item.order;
          const isActive = isOrderActive(order.status);
          const statusColor = getStatusColor(order.status, colors);
          const isCod = order.payment_method === "COD";
          const address = getOrderAddress(order);
          const customerName = order.customer?.name || "Customer";

          return (
            <TouchableOpacity
              style={[
                styles.orderCard,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.subtle,
                },
              ]}
              activeOpacity={isActive ? 0.65 : 0.9}
              onPress={() => handleOrderTap(order)}
              disabled={!isActive}
            >
              {/* Left status bar */}
              <View
                style={[styles.statusBar, { backgroundColor: statusColor }]}
              />

              <View style={styles.orderCardContent}>
                {/* Row 1: Order number + status badge + arrow */}
                <View style={styles.orderCardTop}>
                  <Text
                    style={[styles.orderNum, { color: colors.text.primary }]}
                  >
                    #{order.order_number}
                  </Text>
                  <View style={styles.orderCardTopRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${statusColor}18` },
                      ]}
                    >
                      <Text
                        style={[styles.statusLabel, { color: statusColor }]}
                      >
                        {STATUS_LABELS[order.status]}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.text.muted}
                      />
                    )}
                  </View>
                </View>

                {/* Row 2: Customer + items + amount */}
                <View style={styles.orderMetaRow}>
                  <View style={styles.orderMetaLeft}>
                    <Ionicons
                      name="person-outline"
                      size={12}
                      color={colors.text.muted}
                    />
                    <Text
                      style={[
                        styles.orderMetaText,
                        { color: colors.text.secondary },
                      ]}
                      numberOfLines={1}
                    >
                      {customerName}
                    </Text>
                  </View>
                  <View style={styles.orderMetaRight}>
                    <Text
                      style={[
                        styles.orderMetaText,
                        { color: colors.text.muted },
                      ]}
                    >
                      {order.item_count} item
                      {order.item_count === 1 ? "" : "s"}
                    </Text>
                    <Text
                      style={[
                        styles.orderAmount,
                        { color: colors.text.primary },
                      ]}
                    >
                      ₹{order.total_amount.toFixed(0)}
                    </Text>
                  </View>
                </View>

                {/* Row 3: Address */}
                <View style={styles.orderAddressRow}>
                  <Ionicons
                    name={isPostPickup(order.status) ? "home-outline" : "storefront-outline"}
                    size={12}
                    color={colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.orderAddressText,
                      { color: colors.text.muted },
                    ]}
                    numberOfLines={1}
                  >
                    {address}
                  </Text>
                </View>

                {/* Row 4: Payment */}
                <View style={styles.orderBottomRow}>
                  <View
                    style={[
                      styles.paymentBadge,
                      {
                        backgroundColor: isCod
                          ? colors.status.warningBg
                          : colors.status.successBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isCod ? "cash-outline" : "card-outline"}
                      size={10}
                      color={
                        isCod ? colors.status.warning : colors.status.success
                      }
                    />
                    <Text
                      style={[
                        styles.paymentBadgeText,
                        {
                          color: isCod
                            ? colors.status.warning
                            : colors.status.success,
                        },
                      ]}
                    >
                      {isCod ? "COD" : order.payment_method}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexFill: { flex: 1 },
  mapContainer: { flex: 1, position: "relative" },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  batchIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressRing: {
    marginLeft: 8,
  },
  progressRingTrack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 3,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  progressRingText: {
    fontSize: 12,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },

  // ── Progress bar ──
  progressBar: {
    height: 3,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  // ── Complete banner ──
  completeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
  },
  completeBannerText: {
    fontSize: 14,
    fontWeight: "800",
  },

  // ── Section headers ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: "800",
  },

  // ── Order cards ──
  listContent: {
    paddingBottom: 8,
  },
  orderCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  statusBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  orderCardContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  orderCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderCardTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  orderNum: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  orderMetaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderMetaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderAmount: {
    fontSize: 13,
    fontWeight: "800",
  },
  orderAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  orderAddressText: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  orderBottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Footer ──
  listFooter: {
    height: 32,
  },
});