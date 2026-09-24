// src/components/home/StatCardRow.tsx (do not remove this comment)
import { StyleSheet, View } from "react-native";
import { StatCard } from "./StatCard";
import { Ionicons } from "@expo/vector-icons";

interface StatCardRowProps {
  leftIcon: keyof typeof Ionicons.glyphMap;
  leftLabel: string;
  leftValue: string | number;
  leftSubtitle?: string;
  leftVariant?: "default" | "success" | "warning" | "info";

  rightIcon: keyof typeof Ionicons.glyphMap;
  rightLabel: string;
  rightValue: string | number;
  rightSubtitle?: string;
  rightVariant?: "default" | "success" | "warning" | "info";
}

export function StatCardRow({
  leftIcon,
  leftLabel,
  leftValue,
  leftSubtitle,
  leftVariant,
  rightIcon,
  rightLabel,
  rightValue,
  rightSubtitle,
  rightVariant,
}: StatCardRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <StatCard
          icon={leftIcon}
          label={leftLabel}
          value={leftValue}
          subtitle={leftSubtitle}
          variant={leftVariant}
        />
      </View>
      <View style={styles.card}>
        <StatCard
          icon={rightIcon}
          label={rightLabel}
          value={rightValue}
          subtitle={rightSubtitle}
          variant={rightVariant}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
  },
});