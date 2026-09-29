// app/(app)/personal-info.tsx (do not remove this comment)

import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Image,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";
import { useAuthStore } from "../../src/store/authStore";
import { getRiderPhotoUrl } from "../../src/features/auth/utils/avatar";

export default function PersonalInfoScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const rider = useAuthStore((state) => state.rider);
  const initialize = useAuthStore((state) => state.initialize);

  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync data with backend on pull-to-refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await initialize();
    } catch (err) {
      console.error("[PersonalInfoScreen] Fresh sync failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Fallback chain across common property names returned by the backend/store
  const rawPhotoKeyOrUrl =
    rider?.profile_photo_url ||
    rider?.profile_photo_key ||
    (rider as any)?.profile_photo ||
    (rider as any)?.photo_url ||
    (rider as any)?.avatar_url;

  const photoUrl = getRiderPhotoUrl(rawPhotoKeyOrUrl);

  // Reset error state whenever the photo URL changes/loads
  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  // Helper to format Date string
  const formatDOB = (dobString: string | null | undefined) => {
    if (!dobString) return "—";
    try {
      const date = new Date(dobString);
      if (isNaN(date.getTime())) return dobString;
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dobString;
    }
  };

  // Format phone number
  const formatPhone = (phoneNum: string | null | undefined) => {
    if (!phoneNum) return "—";
    return phoneNum.startsWith("+91") ? phoneNum : `+91 ${phoneNum}`;
  };

  // Resolve status styling
  const getStatusConfig = (status: string | undefined) => {
    switch (status) {
      case "ACTIVE":
        return {
          label: "Active",
          color: colors.status.success,
          bgColor: colors.status.successBg,
          borderColor: colors.status.successBorder,
        };
      case "PENDING_REVIEW":
        return {
          label: "In Review",
          color: colors.status.warning,
          bgColor: colors.status.warningBg,
          borderColor: colors.status.warning,
        };
      case "DRAFT":
        return {
          label: "Draft",
          color: colors.text.muted,
          bgColor: colors.background.tint,
          borderColor: colors.border.default,
        };
      default:
        return {
          label: status || "Unknown",
          color: colors.status.error,
          bgColor: colors.status.errorBg,
          borderColor: colors.status.errorBorder,
        };
    }
  };

  const statusConfig = getStatusConfig(rider?.status);
  const initials =
    rider?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "R";

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Personal Information
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* Profile Header Card */}
        <View
          style={[
            styles.profileHero,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.brand.soft,
              },
            ]}
          >
            {photoUrl && !imageError ? (
              <Image
                key={photoUrl}
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

          <Text style={[styles.profileName, { color: colors.text.primary }]}>
            {rider?.full_name || "Rider Partner"}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Section 1: Basic Details */}
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={16} color={colors.brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>
            BASIC DETAILS
          </Text>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <InfoRow label="Full Name" value={rider?.full_name} colors={colors} />
          <Divider color={colors.border.subtle} />
          <InfoRow label="Phone Number" value={formatPhone(rider?.phone)} colors={colors} />
          <Divider color={colors.border.subtle} />
          <InfoRow label="Email Address" value={rider?.email} colors={colors} />
          <Divider color={colors.border.subtle} />
          <InfoRow label="Date of Birth" value={formatDOB(rider?.date_of_birth)} colors={colors} />
          <Divider color={colors.border.subtle} />
          <InfoRow
            label="Gender"
            value={rider?.sex ? rider.sex.charAt(0) + rider.sex.slice(1).toLowerCase() : null}
            colors={colors}
          />
        </View>

        {/* Section 2: Operating Location */}
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={16} color={colors.brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>
            LOCATION & WORK AREA
          </Text>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <InfoRow label="Current Operating City" value={rider?.current_city} colors={colors} />
          <Divider color={colors.border.subtle} />
          <InfoRow label="Residential Address" value={rider?.residential_address} colors={colors} />
          <Divider color={colors.border.subtle} />
          <InfoRow label="Preferred Operating Zone" value={rider?.preferred_address} colors={colors} />
        </View>

        {/* Section 3: Vehicle Details */}
        <View style={styles.sectionHeader}>
          <Ionicons name="bicycle" size={16} color={colors.brand.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>
            VEHICLE DETAILS
          </Text>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          <InfoRow
            label="Vehicle Type"
            value={
              rider?.vehicle_type
                ? rider.vehicle_type.charAt(0) + rider.vehicle_type.slice(1).toLowerCase()
                : null
            }
            colors={colors}
          />
          <Divider color={colors.border.subtle} />
          <InfoRow label="Registration Plate Number" value={rider?.vehicle_number} colors={colors} />
          <Divider color={colors.border.subtle} />
          <InfoRow label="Make & Model" value={rider?.vehicle_make_model} colors={colors} />
        </View>

        {/* Support Help Note */}
        <View
          style={[
            styles.supportBox,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.brand.soft,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.brand.primary} />
          <Text style={[styles.supportText, { color: colors.text.secondary }]}>
            To modify your verification details, vehicle or operating zone, please submit a change ticket or write to Support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper Components
function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | null | undefined;
  colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.text.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text.primary }]}>
        {value?.trim() ? value : "—"}
      </Text>
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  scrollContent: {
    padding: 16,
  },
  profileHero: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 10,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.6,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: "column",
    gap: 4,
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  supportBox: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  supportText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
});