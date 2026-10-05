// src/components/home/IncentiveStepper.tsx (do not remove this comment)

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { IncentiveTier } from "../../types/location";

interface IncentiveStepperProps {
  tiers: IncentiveTier[];
  currentProgress: number;
  metricType: "ORDER_COUNT" | "BASE_EARNINGS";
}

function formatTarget(value: number, metricType: string): string {
  return metricType === "ORDER_COUNT"
    ? `${Math.round(value)}`
    : `₹${value.toLocaleString("en-IN")}`;
}

export function IncentiveStepper({
  tiers,
  currentProgress,
  metricType,
}: IncentiveStepperProps) {
  const { colors } = useTheme();

  const N = tiers.length;
  if (N === 0) return null;

  const itemWidth = 100 / N;
  const firstCenter = 0.5 * itemWidth;
  const centers = tiers.map((_, i) => (i + 0.5) * itemWidth);

  // Geometric interpolation for progress line
  let stepperProgress = 0;
  if (currentProgress > 0) {
    if (currentProgress < tiers[0].target) {
      stepperProgress = (currentProgress / tiers[0].target) * centers[0];
    } else {
      let found = false;
      for (let i = 0; i < N - 1; i++) {
        if (
          currentProgress >= tiers[i].target &&
          currentProgress < tiers[i + 1].target
        ) {
          const ratio =
            (currentProgress - tiers[i].target) /
            (tiers[i + 1].target - tiers[i].target);
          stepperProgress = centers[i] + ratio * (centers[i + 1] - centers[i]);
          found = true;
          break;
        }
      }
      if (!found) stepperProgress = centers[N - 1];
    }
  }

  const completedWidth = Math.max(0, stepperProgress - firstCenter);
  const successColor = colors.status.success;

  return (
    <View style={styles.stepper}>
      {/* Reward row */}
      <View style={styles.row}>
        {tiers.map((tier) => {
          const reached = tier.achieved || currentProgress >= tier.target;
          return (
            <View key={`r-${tier.level}`} style={styles.stepItem}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.rewardText,
                  { color: reached ? successColor : colors.text.secondary },
                ]}
              >
                ₹{tier.reward}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Line + circles */}
      <View style={styles.lineContainer}>
        <View
          style={[
            styles.trackLine,
            {
              left: `${firstCenter}%`,
              right: `${firstCenter}%`,
              backgroundColor: colors.border.default,
            },
          ]}
        />
        {N > 1 && (
          <View
            style={[
              styles.progressLine,
              {
                left: `${firstCenter}%`,
                width: `${completedWidth}%`,
                backgroundColor: successColor,
              },
            ]}
          />
        )}
        <View style={styles.row}>
          {tiers.map((tier) => {
            const reached = tier.achieved || currentProgress >= tier.target;
            return (
              <View key={`c-${tier.level}`} style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
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
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  ) : (
                    <View
                      style={[
                        styles.dot,
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

      {/* Target row */}
      <View style={styles.row}>
        {tiers.map((tier) => {
          const reached = tier.achieved || currentProgress >= tier.target;
          return (
            <View key={`t-${tier.level}`} style={styles.stepItem}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.targetText,
                  {
                    color: reached
                      ? colors.text.primary
                      : colors.text.secondary,
                  },
                ]}
              >
                {formatTarget(tier.target, metricType)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { position: "relative", width: "100%" },
  row: { flexDirection: "row", alignItems: "center", width: "100%" },
  stepItem: { flex: 1, alignItems: "center" },
  rewardText: { fontSize: 11, fontFamily: FontFamily.bold },
  lineContainer: {
    height: 24,
    justifyContent: "center",
    position: "relative",
    marginVertical: 4,
    width: "100%",
  },
  trackLine: {
    position: "absolute",
    top: 11,
    height: 2,
    borderRadius: 1,
  },
  progressLine: {
    position: "absolute",
    top: 11,
    height: 2,
    borderRadius: 1,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  targetText: { fontSize: 10, fontFamily: FontFamily.medium, marginTop: 2 },
});