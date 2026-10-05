// src/components/home/IncentiveDetailModal.tsx (do not remove this comment)

import React from "react";
import {
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
import { IncentiveStepper } from "./IncentiveStepper";
import type { ActiveIncentive } from "../../types/location";

interface IncentiveDetailModalProps {
  visible: boolean;
  incentive: ActiveIncentive | null;
  onClose: () => void;
}

function getPeriodLabel(period: string): string {
  switch (period) {
    case "DAILY":
      return "6:00 AM - 5:59 AM";
    case "WEEKLY":
      return "Mon 6AM - Sun 6AM";
    default:
      return "Custom period";
  }
}

function getMetricLabel(metricType: string): string {
  return metricType === "ORDER_COUNT" ? "Completed orders" : "Base earnings (pickup + drop)";
}

function formatEndsAt(endsAt: string): string {
  const now = new Date();
  const end = new Date(endsAt);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return "Ending soon";
  const diffHours = Math.ceil(diffMs / 3_600_000);
  if (diffHours < 24) return `Ends in ${diffHours}h`;
  const diffDays = Math.ceil(diffHours / 24);
  if (diffDays === 1) return "Ends tomorrow";
  return `Ends in ${diffDays} days`;
}

interface ConditionRow {
  key: string;
  label: string;
  met: boolean;
}

function getConditions(gating: ActiveIncentive["gating"]): ConditionRow[] {
  return [
    { key: "hours", label: "Minimum online hours", met: gating.online_hours_met },
    { key: "denials", label: "Maximum denials", met: gating.denial_count_ok },
    { key: "cancellations", label: "Maximum cancellations", met: gating.cancellation_count_ok },
    { key: "acceptance", label: "Minimum acceptance rate", met: gating.acceptance_rate_ok },
    { key: "completion", label: "Minimum completion rate", met: gating.completion_rate_ok },
  ];
}

export function IncentiveDetailModal({
  visible,
  incentive,
  onClose,
}: IncentiveDetailModalProps) {
  const { colors, isDark } = useTheme();

  if (!incentive) return null;

  const conditions = getConditions(incentive.gating);
  const warnings = incentive.gating.warnings ?? [];
  const isEligible = incentive.gating.is_eligible;
  const accentColor = isDark ? colors.brand.accent : colors.brand.primary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay.dark }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background.card },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text
                style={[styles.title, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {incentive.title}
              </Text>
              <View style={styles.headerBadges}>
                <Text style={[styles.periodBadge, { color: colors.text.muted }]}>
                  {getPeriodLabel(incentive.period)}
                </Text>
                {incentive.is_featured && (
                  <View
                    style={[
                      styles.featuredPill,
                      { backgroundColor: accentColor },
                    ]}
                  >
                    <Text style={styles.featuredPillText}>FEATURED</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Description */}
            {incentive.description ? (
              <Text style={[styles.description, { color: colors.text.secondary }]}>
                {incentive.description}
              </Text>
            ) : null}

            {/* Stepper */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Milestone Rewards
              </Text>
              <IncentiveStepper
                tiers={incentive.tiers}
                currentProgress={incentive.current_progress}
                metricType={incentive.metric_type}
              />
              <Text style={[styles.metricHint, { color: colors.text.muted }]}>
                Tracking: {getMetricLabel(incentive.metric_type)}
              </Text>
            </View>

            {/* Qualifying Conditions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Qualifying Conditions
              </Text>
              <Text style={[styles.sectionHint, { color: colors.text.muted }]}>
                You must meet ALL conditions to receive the reward.
              </Text>

              <View
                style={[
                  styles.conditionsBox,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : colors.background.tint,
                    borderColor: colors.border.subtle,
                  },
                ]}
              >
                {conditions.map((cond, i) => (
                  <View
                    key={cond.key}
                    style={[
                      styles.conditionRow,
                      i < conditions.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cond.met ? "checkmark-circle" : "close-circle"}
                      size={18}
                      color={
                        cond.met
                          ? colors.status.success
                          : colors.status.error
                      }
                    />
                    <Text
                      style={[
                        styles.conditionLabel,
                        {
                          color: cond.met
                            ? colors.text.primary
                            : colors.status.error,
                        },
                      ]}
                    >
                      {cond.label}
                    </Text>
                    <Text
                      style={[
                        styles.conditionStatus,
                        {
                          color: cond.met
                            ? colors.status.success
                            : colors.status.error,
                        },
                      ]}
                    >
                      {cond.met ? "Met" : "Not met"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Active Warnings */}
            {warnings.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Active Warnings
                </Text>
                <View
                  style={[
                    styles.warningsBox,
                    {
                      backgroundColor: isEligible
                        ? colors.status.warningBg
                        : colors.status.errorBg,
                    },
                  ]}
                >
                  {warnings.map((w, i) => (
                    <View key={i} style={styles.warningRow}>
                      <Ionicons
                        name={isEligible ? "warning" : "alert-circle"}
                        size={14}
                        color={
                          isEligible
                            ? colors.status.warning
                            : colors.status.error
                        }
                      />
                      <Text
                        style={[
                          styles.warningText,
                          {
                            color: isEligible
                              ? colors.status.warning
                              : colors.status.error,
                          },
                        ]}
                      >
                        {w}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Footer info */}
            <View style={styles.footerInfo}>
              <Text style={[styles.footerText, { color: colors.text.muted }]}>
                {formatEndsAt(incentive.ends_at)}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  title: { fontSize: 18, fontFamily: FontFamily.bold, lineHeight: 22 },
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  periodBadge: { fontSize: 12, fontFamily: FontFamily.medium },
  featuredPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featuredPillText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: "#fff",
  },
  closeBtn: { paddingTop: 2 },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  description: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.semiBold },
  sectionHint: { fontSize: 12, fontFamily: FontFamily.regular, lineHeight: 16 },
  conditionsBox: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  conditionLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  conditionStatus: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  warningsBox: {
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
  },
  metricHint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  footerInfo: {
    alignItems: "center",
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
});