// src/components/home/HomeBottomSheet.tsx (do not remove this comment)
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useDashboard } from "../../hooks/useDashboard";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";

interface HomeBottomSheetProps {
  onSnapChange?: (index: number) => void;
  riderType: "TEAM" | "INDEPENDENT";
}

export const HomeBottomSheet = React.forwardRef<BottomSheet, HomeBottomSheetProps>(
  ({ onSnapChange, riderType }, ref) => {
    const { colors } = useTheme();
    const { data: dashboard, isLoading } = useDashboard();

    const isTeam = riderType === "TEAM";

    // Single active snap point at 60% and secondary at 90%
    const snapPoints = useMemo(() => ["60%", "90%"], []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        onSnapChange?.(index);
      },
      [onSnapChange],
    );

    // Get first active incentive if available
    const activeIncentive = dashboard?.active_incentives?.[0] ?? null;

    return (
      <BottomSheet
        ref={ref}
        index={-1} // Starts completely closed/hidden offscreen
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true} // Allows sliding down to fully close
        backgroundStyle={{ backgroundColor: colors.background.card }}
        handleIndicatorStyle={{ backgroundColor: colors.border.default }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.content,
            { backgroundColor: colors.background.card },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {isTeam ? "Today's Duty Log" : "Today's Summary"}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.brand.primary} />
            </View>
          ) : dashboard ? (
            <>
              {/* Earnings & Task Row */}
              <View style={styles.cardRow}>
                <View
                  style={[
                    styles.miniCard,
                    {
                      backgroundColor: colors.background.tint,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  <Text style={[styles.miniLabel, { color: colors.text.secondary }]}>
                    {isTeam ? "Shift Status" : "Earnings"}
                  </Text>
                  <Text style={[styles.miniValue, { color: colors.text.primary, fontSize: isTeam ? 20 : 24 }]}>
                    {isTeam
                      ? "ACTIVE"
                      : `₹${(dashboard.earnings?.today?.total ?? 0).toFixed(0)}`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.miniCard,
                    {
                      backgroundColor: colors.background.tint,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  <Text style={[styles.miniLabel, { color: colors.text.secondary }]}>
                    {isTeam ? "Completed Tasks" : "Deliveries"}
                  </Text>
                  <Text style={[styles.miniValue, { color: colors.text.primary }]}>
                    {dashboard.today?.deliveries_completed ?? 0}
                  </Text>
                </View>
              </View>

              {/* Conditional Incentives Section: Only for Independent Contractors */}
              {!isTeam && activeIncentive && (
                <View
                  style={[
                    styles.incentiveCard,
                    {
                      backgroundColor: colors.background.tint,
                      borderColor: activeIncentive.gating?.is_eligible
                        ? colors.border.brand
                        : colors.status.error,
                    },
                  ]}
                >
                  <View style={styles.incentiveHeader}>
                    <Text style={[styles.incentiveTitle, { color: colors.text.primary }]}>
                      {activeIncentive.title}
                    </Text>
                    <View style={styles.headerBadges}>
                      <Text style={[styles.incentivePeriod, { color: colors.text.secondary }]}>
                        {activeIncentive.period}
                      </Text>
                      {!activeIncentive.gating?.is_eligible && (
                        <View style={[styles.atRiskBadge, { backgroundColor: colors.status.errorBg }]}>
                          <Text style={[styles.atRiskText, { color: colors.status.error }]}>AT RISK</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                      Progress: {activeIncentive.current_progress} /{" "}
                      {activeIncentive.tiers[activeIncentive.tiers.length - 1]?.target || 0}
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: colors.background.card }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: activeIncentive.gating?.is_eligible
                              ? colors.brand.primary
                              : colors.status.error,
                            width: `${Math.min(
                              (activeIncentive.current_progress /
                                (activeIncentive.tiers[activeIncentive.tiers.length - 1]?.target || 1)) *
                                100,
                              100,
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Tiers */}
                  <View style={styles.tiersContainer}>
                    {activeIncentive.tiers.map((tier) => (
                      <View key={tier.level} style={styles.tier}>
                        <View
                          style={[
                            styles.tierIndicator,
                            {
                              backgroundColor: tier.achieved
                                ? colors.status.success
                                : colors.background.card,
                              borderColor: tier.achieved
                                ? colors.status.success
                                : colors.border.default,
                            },
                          ]}
                        >
                          {tier.achieved && <Text style={styles.tierCheck}>✓</Text>}
                        </View>
                        <View style={styles.tierInfo}>
                          <Text style={[styles.tierTarget, { color: colors.text.primary }]}>
                            {tier.target}{" "}
                            {activeIncentive?.metric_type === "ORDER_COUNT"
                              ? "orders"
                              : "base"}
                          </Text>
                          <Text style={[styles.tierReward, { color: colors.status.success }]}>
                            ₹{tier.reward}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Weekly/Shift Summary */}
              <View style={styles.divider} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                {isTeam ? "Shift Metrics" : "This Week"}
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                    {isTeam ? "Duty Duration" : "Earnings"}
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>
                    {isTeam
                      ? `${(dashboard.today?.online_hours ?? 0).toFixed(1)} Hrs`
                      : `₹${(dashboard.earnings?.week?.total ?? 0).toFixed(0)}`}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                    Deliveries
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>
                    {isTeam
                      ? (dashboard.today?.deliveries_completed ?? 0)
                      : (dashboard.week?.deliveries_completed ?? 0)}
                  </Text>
                </View>
                {!isTeam && (
                  <>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                        Tips
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text.primary }]}>
                        ₹{(dashboard.week?.tips ?? 0).toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                        Days Active
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text.primary }]}>
                        {(dashboard.week?.days_online ?? 0)} Days
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.text.muted }]}>
                No data available
              </Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

HomeBottomSheet.displayName = "HomeBottomSheet";

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 120, // Pad the bottom so content scrolls above floating tabs
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  miniCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  miniLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  miniValue: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
  },
  incentiveCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  incentiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  incentiveTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  headerBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  incentivePeriod: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textTransform: "uppercase",
  },
  atRiskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  atRiskText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
  },
  progressContainer: {
    gap: 6,
  },
  progressText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  tiersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  tier: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  tierIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tierCheck: {
    fontSize: 12,
    color: "#ffffff",
    fontFamily: FontFamily.bold,
  },
  tierInfo: {
    alignItems: "center",
    gap: 2,
  },
  tierTarget: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
  },
  tierReward: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
});