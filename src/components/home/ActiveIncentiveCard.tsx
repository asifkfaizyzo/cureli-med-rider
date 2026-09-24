// src/components/home/ActiveIncentiveCard.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { ActiveIncentive } from "../../types/location";

interface ActiveIncentiveCardProps {
  incentive: ActiveIncentive;
}

export function ActiveIncentiveCard({ incentive }: ActiveIncentiveCardProps) {
  const { colors, isDark } = useTheme();

  const progressPercentage = Math.min(
    (incentive.current_progress /
      (incentive.tiers[incentive.tiers.length - 1]?.target || 1)) *
      100,
    100,
  );

  const nextTier = incentive.tiers.find((t) => !t.achieved);

  return (
    <LinearGradient
      colors={
        isDark
          ? [colors.brand.accent + "40", colors.brand.accent + "10"]
          : [colors.brand.primary + "15", colors.brand.primary + "05"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        { borderColor: isDark ? colors.brand.accent : colors.brand.primary },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isDark ? colors.brand.accent : colors.brand.primary },
            ]}
          >
            <Ionicons name="trophy" size={18} color="#ffffff" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {incentive.title}
            </Text>
            <Text style={[styles.period, { color: colors.text.secondary }]}>
              {incentive.period} • {incentive.metric_type === "ORDER_COUNT" ? "Orders" : "Earnings"}
            </Text>
          </View>
        </View>
        {incentive.is_featured && (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.status.warningBg },
            ]}
          >
            <Ionicons name="star" size={12} color={colors.status.warning} />
            <Text style={[styles.badgeText, { color: colors.status.warning }]}>
              Featured
            </Text>
          </View>
        )}
      </View>

      {incentive.description && (
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {incentive.description}
        </Text>
      )}

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
            Progress
          </Text>
          <Text style={[styles.progressValue, { color: colors.text.primary }]}>
            {incentive.current_progress} /{" "}
            {incentive.tiers[incentive.tiers.length - 1]?.target || 0}
          </Text>
        </View>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.background.card },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: isDark ? colors.brand.accent : colors.brand.primary,
                width: `${progressPercentage}%`,
              },
            ]}
          />
        </View>
        {nextTier && (
          <Text style={[styles.nextTierText, { color: colors.text.muted }]}>
            {nextTier.target - incentive.current_progress} more to unlock ₹
            {nextTier.reward} bonus
          </Text>
        )}
      </View>

      <View style={styles.tiers}>
        {incentive.tiers.map((tier) => (
          <View
            key={tier.level}
            style={[
              styles.tier,
              {
                backgroundColor: tier.achieved
                  ? colors.status.successBg
                  : colors.background.tint,
                borderColor: tier.achieved
                  ? colors.status.success
                  : colors.border.default,
              },
            ]}
          >
            <View style={styles.tierHeader}>
              <View
                style={[
                  styles.tierIndicator,
                  {
                    backgroundColor: tier.achieved
                      ? colors.status.success
                      : "transparent",
                    borderColor: tier.achieved
                      ? colors.status.success
                      : colors.border.default,
                  },
                ]}
              >
                {tier.achieved && (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                )}
              </View>
              <Text style={[styles.tierLevel, { color: colors.text.secondary }]}>
                Tier {tier.level}
              </Text>
            </View>
            <Text style={[styles.tierTarget, { color: colors.text.primary }]}>
              {tier.target}{" "}
              {incentive.metric_type === "ORDER_COUNT" ? "orders" : "base"}
            </Text>
            <Text style={[styles.tierReward, { color: colors.status.success }]}>
              ₹{tier.reward}
            </Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  period: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  progressValue: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  nextTierText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  tiers: {
    flexDirection: "row",
    gap: 8,
  },
  tier: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    alignItems: "center",
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tierIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tierLevel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
  },
  tierTarget: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: "center",
  },
  tierReward: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});