// cureli-rider-app/src/components/profile/ProfileCard.tsx

import React, { useState } from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import { getRiderPhotoUrl } from "../../features/auth/utils/avatar";

interface ProfileCardProps {
  fullName: string;
  phone: string;
  rating: string | number;
  totalTrips: number;
  photoKey: string | null | undefined;
}

export function ProfileCard({
  fullName,
  phone,
  rating,
  totalTrips,
  photoKey,
}: ProfileCardProps) {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  const displayPhone = phone.startsWith("+91") ? phone : `+91 ${phone}`;
  const photoUrl = getRiderPhotoUrl(photoKey);

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "R";

  return (
    <View
      style={[
        styles.profileCard,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      <View style={styles.profileHeader}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.brand.soft,
            },
          ]}
        >
          {photoUrl && !imageError ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <Text style={[styles.avatarText, { color: colors.brand.primary }]}>
              {initials}
            </Text>
          )}
        </View>
        <View style={styles.profileDetails}>
          <Text style={[styles.profileName, { color: colors.text.primary }]}>
            {fullName}
          </Text>
          <Text style={[styles.profilePhone, { color: colors.text.secondary }]}>
            {displayPhone}
          </Text>
        </View>
      </View>

      <View style={[styles.statsDivider, { backgroundColor: colors.border.subtle }]} />

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <View style={styles.statValueRow}>
            <Ionicons name="star" size={18} color="#FFB300" style={styles.statIcon} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {Number(rating).toFixed(1)}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.text.muted }]}>Rating</Text>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: colors.border.subtle }]} />

        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {totalTrips}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.muted }]}>Total Trips</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  profileDetails: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  statsDivider: {
    height: 1,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statIcon: {
    marginRight: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 24,
  },
});