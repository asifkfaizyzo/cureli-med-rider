// src/components/home/RatingCard.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { RatingInfo } from "../../types/location";

interface RatingCardProps {
  rating?: RatingInfo;
}

export function RatingCard({ rating }: RatingCardProps) {
  const { colors, isDark } = useTheme();

  if (!rating || !rating.total_ratings || rating.total_ratings === 0) return null;

  const stars = rating.stars ?? 0;
  const totalRatings = rating.total_ratings ?? 0;

  const getRatingBadge = (val: number) => {
    if (val >= 4.7) {
      return {
        text: "Top Rated",
        icon: "ribbon" as const,
        color: colors.status.warning,
        bg: isDark ? "rgba(251, 191, 36, 0.15)" : "#fef3c7",
        border: isDark ? "rgba(251, 191, 36, 0.25)" : "#fde68a",
      };
    }
    if (val >= 4.2) {
      return {
        text: "Great Service",
        icon: "thumbs-up" as const,
        color: colors.status.success,
        bg: isDark ? "rgba(74, 222, 128, 0.15)" : "#dcfce7",
        border: colors.status.successBorder,
      };
    }
    if (val >= 3.8) {
      return {
        text: "Good Service",
        icon: "checkmark-circle" as const,
        color: colors.status.info,
        bg: isDark ? "rgba(56, 189, 248, 0.15)" : "#e0f2fe",
        border: isDark ? "rgba(56, 189, 248, 0.25)" : "#bae6fd",
      };
    }
    return {
      text: "Needs Attention",
      icon: "alert-circle" as const,
      color: colors.status.error,
      bg: isDark ? "rgba(248, 113, 113, 0.15)" : "#fee2e2",
      border: colors.status.errorBorder,
    };
  };

  const badge = getRatingBadge(stars);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIconContainer,
              {
                backgroundColor: isDark
                  ? "rgba(251, 191, 36, 0.15)"
                  : "#fef3c7",
              },
            ]}
          >
            <Ionicons name="star" size={15} color={colors.status.warning} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Customer Rating
          </Text>
        </View>

        <View
          style={[
            styles.tierBadge,
            {
              backgroundColor: badge.bg,
              borderColor: badge.border,
            },
          ]}
        >
          <Ionicons name={badge.icon} size={11} color={badge.color} />
          <Text style={[styles.tierBadgeText, { color: badge.color }]}>
            {badge.text}
          </Text>
        </View>
      </View>

      {/* Body: Split metrics card */}
      <View
        style={[
          styles.cardBody,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : colors.background.tint,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        {/* Rating Score */}
        <View style={styles.ratingLeft}>
          <View style={styles.starsRow}>
            <Text
              style={[styles.ratingValue, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {stars.toFixed(1)}
            </Text>
            <Ionicons
              name="star"
              size={18}
              color={colors.status.warning}
              style={styles.starIcon}
            />
          </View>
          <Text style={[styles.ratingSub, { color: colors.text.muted }]}>
            Average Rating
          </Text>
        </View>

        {/* Vertical Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.border.subtle },
          ]}
        />

        {/* Review Count */}
        <View style={styles.ratingRight}>
          <Text
            style={[styles.countValue, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {totalRatings}
          </Text>
          <Text style={[styles.countLabel, { color: colors.text.secondary }]}>
            Customer Rating{totalRatings !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
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
    gap: 8,
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ratingLeft: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    lineHeight: 28,
  },
  starIcon: {
    marginBottom: 2,
  },
  ratingSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  ratingRight: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  countValue: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    lineHeight: 28,
  },
  countLabel: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
});