// src/components/home/IncentiveRow.tsx (do not remove this comment)

import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { ActiveIncentive } from "../../types/location";
import { DailyIncentiveCard } from "./DailyIncentiveCard";
import { WeeklyIncentiveCard } from "./WeeklyIncentiveCard";

const CARD_WIDTH = Dimensions.get("window").width * 0.82;

interface IncentiveRowProps {
  incentives: ActiveIncentive[];
  periodType: "DAILY" | "WEEKLY" | "CUSTOM_PERIOD";
  rowTitle: string;
  isPinned: (id: string) => boolean;
  pinnedId: string | null;
  onTogglePin: (id: string) => void;
}

export function IncentiveRow({
  incentives,
  periodType,
  rowTitle,
  isPinned,
  pinnedId,
  onTogglePin,
}: IncentiveRowProps) {
  const { colors } = useTheme();

  const sorted = useMemo(() => {
    return [...incentives].sort((a, b) => {
      const aPinned = a.schedule_id === pinnedId;
      const bPinned = b.schedule_id === pinnedId;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;

      return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
    });
  }, [incentives, pinnedId]);

  if (sorted.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.rowTitle, { color: colors.text.primary }]}>
        {rowTitle}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {sorted.map((incentive) => (
          <View key={incentive.schedule_id} style={styles.cardWrapper}>
            {periodType === "DAILY" ? (
              <DailyIncentiveCard
                incentive={incentive}
                isPinned={isPinned(incentive.schedule_id)}
                onTogglePin={() => onTogglePin(incentive.schedule_id)}
              />
            ) : (
              <WeeklyIncentiveCard
                incentive={incentive}
                isPinned={isPinned(incentive.schedule_id)}
                onTogglePin={() => onTogglePin(incentive.schedule_id)}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  rowTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    marginLeft: 2,
  },
  scrollContent: {
    paddingHorizontal: 2,
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
});
