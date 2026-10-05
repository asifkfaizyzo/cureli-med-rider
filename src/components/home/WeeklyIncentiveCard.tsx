// src/components/home/WeeklyIncentiveCard.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { ActiveIncentive } from "../../types/location";
import { IncentiveDetailModal } from "./IncentiveDetailModal";
import { IncentivePinButton } from "./IncentivePinButton";
import { IncentiveStepper } from "./IncentiveStepper";

interface WeeklyIncentiveCardProps {
  incentive: ActiveIncentive;
  isPinned: boolean;
  onTogglePin: () => void;
}

function getPeriodLabel(period: string): string {
  if (period === "WEEKLY") return "Mon 6AM - Sun 6AM";
  return "Multi-day challenge";
}

function formatEndsAt(endsAt: string): string {
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (diffMs <= 0) return "Ending soon";
  const h = Math.ceil(diffMs / 3_600_000);
  if (h < 24) return `Ends in ${h}h`;
  const d = Math.ceil(h / 24);
  if (d === 1) return "Ends tomorrow";
  return `Ends in ${d}d`;
}

export function WeeklyIncentiveCard({
  incentive,
  isPinned,
  onTogglePin,
}: WeeklyIncentiveCardProps) {
  const { colors, isDark } = useTheme();
  const [detailVisible, setDetailVisible] = useState(false);

  const isEligible = incentive.gating?.is_eligible ?? true;
  const isFeatured = incentive.is_featured;
  const accentColor = isDark ? colors.brand.accent : colors.brand.primary;
  const warnings = incentive.gating?.warnings ?? [];
  const firstWarning = warnings[0] ?? null;
  const extraWarnings = warnings.length > 1 ? warnings.length - 1 : 0;

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isFeatured
              ? isDark
                ? "rgba(176, 132, 235, 0.08)"
                : colors.background.tint
              : colors.background.card,
            borderColor: isFeatured
              ? accentColor
              : isEligible
                ? colors.border.default
                : colors.status.error,
            borderWidth: isFeatured ? 1.5 : 1,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.icon,
                {
                  backgroundColor: isEligible
                    ? colors.background.tint
                    : colors.status.errorBg,
                },
              ]}
            >
              <Ionicons
                name="trophy"
                size={16}
                color={isEligible ? accentColor : colors.status.error}
              />
            </View>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: colors.text.primary }]}
                  numberOfLines={1}
                >
                  {incentive.title}
                </Text>
                {isFeatured && (
                  <View
                    style={[
                      styles.featuredPill,
                      { backgroundColor: accentColor },
                    ]}
                  >
                    <Text style={styles.featuredText}>FEATURED</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.subtitle, { color: colors.text.muted }]}>
                {getPeriodLabel(incentive.period)} ·{" "}
                {formatEndsAt(incentive.ends_at)}
              </Text>
            </View>
          </View>
          {!isEligible && (
            <View
              style={[
                styles.riskBadge,
                { backgroundColor: colors.status.errorBg },
              ]}
            >
              <Text style={[styles.riskText, { color: colors.status.error }]}>
                AT RISK
              </Text>
            </View>
          )}
        </View>

        {/* Stepper */}
        <View
          style={[
            styles.stepperBox,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.02)"
                : colors.background.tint,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <IncentiveStepper
            tiers={incentive.tiers}
            currentProgress={incentive.current_progress}
            metricType={incentive.metric_type}
          />
        </View>

        {/* Gating hint */}
        {firstWarning && (
          <View style={styles.gatingRow}>
            <Ionicons
              name={isEligible ? "information-circle" : "alert-circle"}
              size={13}
              color={isEligible ? colors.status.warning : colors.status.error}
            />
            <Text
              style={[
                styles.gatingText,
                {
                  color: isEligible
                    ? colors.status.warning
                    : colors.status.error,
                },
              ]}
              numberOfLines={1}
            >
              {firstWarning}
            </Text>
          </View>
        )}
        {extraWarnings > 0 && (
          <Text style={[styles.moreHint, { color: colors.text.muted }]}>
            + {extraWarnings} more condition{extraWarnings > 1 ? "s" : ""}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => setDetailVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.detailsText, { color: accentColor }]}>
              See full details
            </Text>
            <Ionicons name="chevron-forward" size={12} color={accentColor} />
          </TouchableOpacity>
          <IncentivePinButton
            isPinned={isPinned}
            onToggle={onTogglePin}
            accentColor={accentColor}
          />
        </View>
      </View>

      <IncentiveDetailModal
        visible={detailVisible}
        incentive={incentive}
        onClose={() => setDetailVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontFamily: FontFamily.bold, flexShrink: 1 },
  featuredPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: { fontSize: 8, fontFamily: FontFamily.bold, color: "#fff" },
  subtitle: { fontSize: 11, fontFamily: FontFamily.regular, marginTop: 2 },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskText: { fontSize: 9, fontFamily: FontFamily.bold },
  stepperBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
  },
  gatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gatingText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  moreHint: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    marginLeft: 19,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailsText: { fontSize: 11, fontFamily: FontFamily.bold },
});
