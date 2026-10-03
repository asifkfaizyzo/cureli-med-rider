// src/components/home/ActiveIncentiveCard.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { ActiveIncentive } from "../../types/location";

interface ActiveIncentiveCardProps {
  incentive: ActiveIncentive;
}

export function ActiveIncentiveCard({ incentive }: ActiveIncentiveCardProps) {
  const { colors, isDark } = useTheme();

  const isOrderBased = incentive.metric_type === "ORDER_COUNT";
  const tiers = incentive.tiers ?? [];
  const maxTarget = tiers.length > 0 ? tiers[tiers.length - 1].target : 0;
  const currentProgress = incentive.current_progress ?? 0;

  // Main linear progress bar calculation (for the top horizontal card bar)
  const progressPercentage =
    maxTarget > 0 ? Math.min((currentProgress / maxTarget) * 100, 100) : 0;

  const nextTier = tiers.find((tier) => !tier.achieved);
  const allAchieved = tiers.length > 0 && tiers.every((tier) => tier.achieved);
  const isEligible = incentive.gating?.is_eligible ?? true;

  const accentColor = isDark ? colors.brand.accent : colors.brand.primary;
  const successColor = colors.status.success;

  const getPeriodTime = () => {
    switch (incentive.period) {
      case "DAILY":
        return "12:00 AM - 11:59 PM";
      case "WEEKLY":
        return "Monday - Sunday";
      default:
        return "Current shift window";
    }
  };

  const getMetricTitle = () => {
    return isOrderBased ? "Daily Streak" : "Weekly Challenge";
  };

  const formatTarget = (target: number) => {
    return isOrderBased ? `${target}` : `₹${target.toLocaleString("en-IN")}`;
  };

  const formatProgress = (value: number) => {
    return isOrderBased ? `${value}` : `₹${value.toLocaleString("en-IN")}`;
  };

  const getRemainingText = () => {
    if (!nextTier) {
      return "All milestones unlocked";
    }

    const remaining = Math.max(0, nextTier.target - currentProgress);

    if (isOrderBased) {
      return `${remaining} more ${
        remaining === 1 ? "order" : "orders"
      } to unlock ₹${nextTier.reward} bonus`;
    }

    return `₹${remaining.toLocaleString(
      "en-IN",
    )} more base earnings to unlock ₹${nextTier.reward} bonus`;
  };

  const isTierReached = (tier: (typeof tiers)[number]) => {
    return tier.achieved || currentProgress >= tier.target;
  };

  // ── NEW: GEOMETRIC INTERPOLATION STEPPER ENGINE ──
  // Resolves alignment mismatch by calculating percentages relative to circle centers
  const N = tiers.length;
  const itemWidth = N > 0 ? 100 / N : 0;
  const firstCircleCenter = N > 0 ? 0.5 * itemWidth : 0;

  const getStepperProgress = () => {
    if (N === 0) return 0;

    // Calculate centers of circles in percentage of parent container width
    const centers = tiers.map((_, i) => (i + 0.5) * itemWidth);

    if (currentProgress <= 0) return 0;

    // Below Tier 1 -> Line interpolates from 0 to Circle 1
    const firstTarget = tiers[0].target;
    if (currentProgress < firstTarget) {
      const ratio = currentProgress / firstTarget;
      return ratio * centers[0];
    }

    // Between Tiers -> Interpolate line strictly between the two circle centers
    for (let i = 0; i < N - 1; i++) {
      const currentTarget = tiers[i].target;
      const nextTarget = tiers[i + 1].target;

      if (currentProgress >= currentTarget && currentProgress < nextTarget) {
        const ratio = (currentProgress - currentTarget) / (nextTarget - currentTarget);
        const startCenter = centers[i];
        const endCenter = centers[i + 1];
        return startCenter + ratio * (endCenter - startCenter);
      }
    }

    // Exceeded or equal to last target -> Terminate line exactly centered on the last circle
    return centers[N - 1];
  };

  const stepperProgress = getStepperProgress();
  // Completed bar starts at circle 1 center, and stretches to active progress point
  const completedLineWidth = Math.max(0, stepperProgress - firstCircleCenter);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.card,
          borderColor: !isEligible ? colors.status.error : colors.border.default,
        },
      ]}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isEligible
                  ? colors.background.tint
                  : colors.status.errorBg,
              },
            ]}
          >
            <Ionicons
              name={allAchieved ? "checkmark-circle" : "trophy"}
              size={18}
              color={isEligible ? accentColor : colors.status.error}
            />
          </View>

          <View style={styles.headerText}>
            <Text
              style={[styles.title, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {incentive.title}
            </Text>
            <Text style={[styles.period, { color: colors.text.muted }]}>
              {getMetricTitle()} • {getPeriodTime()}
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
            <Ionicons name="warning" size={11} color={colors.status.error} />
            <Text style={[styles.riskText, { color: colors.status.error }]}>
              AT RISK
            </Text>
          </View>
        )}
      </View>

      {/* =====================================================
          PROGRESS BAR
      ===================================================== */}
      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
          Progress
        </Text>
        <Text style={[styles.progressValue, { color: colors.text.primary }]}>
          {formatProgress(currentProgress)} / {formatTarget(maxTarget)}
        </Text>
      </View>

      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: isEligible ? accentColor : colors.status.error,
            },
          ]}
        />
      </View>

      <Text
        style={[
          styles.nextTierText,
          { color: allAchieved ? successColor : colors.text.muted },
        ]}
      >
        {allAchieved ? "All milestones unlocked" : getRemainingText()}
      </Text>

      {/* =====================================================
          MILESTONE STEPPER
      ===================================================== */}
      <View
        style={[
          styles.stepperWrapper,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.02)"
              : colors.background.tint,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
          Milestone Pay Rewards
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepperScrollContent}
        >
          <View
            style={[
              styles.stepper,
              { width: Math.max(tiers.length * 70, 360) },
            ]}
          >
            {/* ---------------- REWARD ROW ---------------- */}
            <View style={styles.stepperRow}>
              {tiers.map((tier) => {
                const reached = isTierReached(tier);
                return (
                  <View key={`reward-${tier.level}`} style={styles.stepItem}>
                    <Text
                      style={[
                        styles.rewardText,
                        {
                          color: reached ? successColor : colors.text.secondary,
                        },
                      ]}
                    >
                      ₹{tier.reward}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* ---------------- STEPPER PROGRESS LINE ---------------- */}
            <View style={styles.lineContainer}>
              {/* Dynamic gray background track */}
              <View
                style={[
                  styles.stepLine,
                  {
                    left: `${firstCircleCenter}%`,
                    right: `${firstCircleCenter}%`,
                    backgroundColor: colors.border.default,
                  },
                ]}
              />

              {/* Dynamic matching progress line */}
              {tiers.length > 1 && (
                <View
                  style={[
                    styles.completedLine,
                    {
                      left: `${firstCircleCenter}%`,
                      width: `${completedLineWidth}%`,
                      backgroundColor: successColor,
                    },
                  ]}
                />
              )}

              {/* Milestone circles overlay */}
              <View style={styles.stepperRow}>
                {tiers.map((tier) => {
                  const reached = isTierReached(tier);
                  return (
                    <View key={`circle-${tier.level}`} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepCircle,
                          {
                            backgroundColor: reached
                              ? successColor
                              : colors.background.card,
                            borderColor: reached
                              ? successColor
                              : colors.border.default,
                          },
                        ]}
                      >
                        {reached ? (
                          <Ionicons name="checkmark" size={10} color="#ffffff" />
                        ) : (
                          <View
                            style={[
                              styles.innerDot,
                              { backgroundColor: colors.border.default },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ---------------- TARGET ROW ---------------- */}
            <View style={[styles.stepperRow, styles.targetRow]}>
              {tiers.map((tier) => {
                const reached = isTierReached(tier);
                return (
                  <View key={`target-${tier.level}`} style={styles.stepItem}>
                    <Text
                      style={[
                        styles.targetText,
                        {
                          color: reached
                            ? colors.text.primary
                            : colors.text.secondary,
                        },
                      ]}
                    >
                      {formatTarget(tier.target)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={styles.metricLabelRow}>
          <View
            style={[
              styles.metricDot,
              { backgroundColor: colors.status.warning },
            ]}
          />
          <Text style={[styles.metricLabel, { color: colors.text.muted }]}>
            {isOrderBased ? "Completed orders" : "Base earnings"}
          </Text>
        </View>
      </View>

      {/* =====================================================
          GATING WARNINGS
      ===================================================== */}
      {incentive.gating?.warnings && incentive.gating.warnings.length > 0 && (
        <View
          style={[
            styles.gatingSection,
            {
              backgroundColor: isEligible
                ? colors.status.warningBg
                : colors.status.errorBg,
            },
          ]}
        >
          <View style={styles.gatingIcon}>
            <Ionicons
              name={isEligible ? "information-circle" : "alert-circle"}
              size={15}
              color={isEligible ? colors.status.warning : colors.status.error}
            />
          </View>
          <View style={styles.gatingTexts}>
            {incentive.gating.warnings.map((warning, index) => (
              <Text
                key={index}
                style={[
                  styles.gatingWarning,
                  {
                    color: isEligible
                      ? colors.status.warning
                      : colors.status.error,
                  },
                ]}
              >
                {warning}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* =====================================================
          RATE CARD FOOTER
      ===================================================== */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.rateCardButton}
        onPress={() => {
          // TODO: Navigate to rate card
        }}
      >
        <Text style={[styles.rateCardText, { color: accentColor }]}>
          See rate card details
        </Text>
        <Ionicons name="chevron-forward" size={12} color={accentColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
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
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    lineHeight: 18,
  },
  period: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  progressValue: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  nextTierText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    lineHeight: 15,
  },
  stepperWrapper: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  stepperScrollContent: {
    paddingVertical: 4,
  },
  stepper: {
    position: "relative",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepItem: {
    flex: 1,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  lineContainer: {
    height: 24,
    justifyContent: "center",
    position: "relative",
    marginVertical: 4,
  },
  stepLine: {
    position: "absolute",
    top: 11,
    height: 2,
    borderRadius: 1,
  },
  completedLine: {
    position: "absolute",
    top: 11,
    height: 2,
    borderRadius: 1,
  },
  stepCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  targetRow: {
    marginTop: 2,
  },
  targetText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
  },
  gatingSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  gatingIcon: {
    paddingTop: 1,
  },
  gatingTexts: {
    flex: 1,
    gap: 2,
  },
  gatingWarning: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    lineHeight: 14,
  },
  rateCardButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    marginTop: 2,
  },
  rateCardText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
});