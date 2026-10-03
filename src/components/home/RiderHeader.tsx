// src/components/home/RiderHeader.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRiderPhotoUrl } from "../../features/auth/utils/avatar";
import { useAvailabilityToggle } from "../../hooks/useAvailabilityToggle";
import { useAuthStore } from "../../store/authStore";
import { useRiderOperationalStore } from "../../store/riderOperationalStore";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import { AvailabilityToggle } from "./AvailabilityToggle";

interface RiderHeaderProps {
  onHelpPress?: () => void;
  onSOSPress?: () => void;
  onNotificationsPress?: () => void;
  hasUnreadNotifications?: boolean;
  collapsed?: boolean;
  onRequestExpand?: () => void;
  onAvatarPress?: () => void;
}

const LOGO = require("../../../assets/images/cureli_rider_logo.png");
const DEFAULT_TOP_ROW_HEIGHT = 64;

export function RiderHeader({
  onHelpPress,
  onSOSPress,
  onNotificationsPress,
  hasUnreadNotifications = true,
  collapsed = false,
  onRequestExpand,
  onAvatarPress,
}: RiderHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const isOnline = useRiderOperationalStore((state) => state.isOnline);
  const isToggling = useRiderOperationalStore((state) => state.isToggling);
  const rider = useAuthStore((state) => state.rider);
  const toggleMutation = useAvailabilityToggle();

  const collapseProgress = useSharedValue(collapsed ? 1 : 0);
  const [topRowHeight, setTopRowHeight] = useState(DEFAULT_TOP_ROW_HEIGHT);
  const hasMeasuredRef = useRef(false);

  // Error tracking for CDN photo delivery
  const [imageError, setImageError] = useState(false);

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

  useEffect(() => {
    collapseProgress.value = withTiming(collapsed ? 1 : 0, { duration: 220 });
  }, [collapsed, collapseProgress]);

  const topRowAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: (1 - collapseProgress.value) * topRowHeight,
      opacity: 1 - collapseProgress.value,
      transform: [{ translateY: collapseProgress.value * -6 }],
      marginBottom: (1 - collapseProgress.value) * 12,
    };
  }, [topRowHeight]);

  const handleToggle = () => {
    if (!isToggling) toggleMutation.mutate(!isOnline);
  };

  const handleAvatarPress = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push("/(app)/personal-info");
    }
  };

  const firstName = rider?.full_name?.trim()?.split(" ")?.[0] || "Rider";
  const initial = rider?.full_name?.trim()?.charAt(0)?.toUpperCase() || "R";
  const welcomeLine = `Welcome back, ${firstName}`;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 10,
          backgroundColor: colors.background.card,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      {/* Row 1 (collapsible): Logo + welcome + avatar */}
      <Animated.View style={[{ overflow: "hidden" }, topRowAnimatedStyle]}>
        <Pressable
          onPress={onRequestExpand}
          disabled={!onRequestExpand}
          style={styles.topRow}
          onLayout={(e) => {
            if (hasMeasuredRef.current) return;
            const h = e.nativeEvent.layout.height;
            if (h > 0) {
              hasMeasuredRef.current = true;
              setTopRowHeight(h);
            }
          }}
        >
          <View style={styles.brandBlock}>
            <View
              style={[
                styles.logoWrap,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </View>

            <Text
              style={[styles.welcomeLine, { color: colors.text.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {welcomeLine}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.avatar,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.brand.soft,
              },
            ]}
            onPress={handleAvatarPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="View Profile"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {photoUrl && !imageError ? (
              <Image
                key={photoUrl}
                source={{ uri: photoUrl }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <Text
                style={[styles.avatarText, { color: colors.brand.primary }]}
              >
                {initial}
              </Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Animated.View>

      {/* Row 2: Toggle (left) + action buttons (right) */}
      <View style={styles.bottomRow}>
        <AvailabilityToggle
          isOnline={isOnline}
          isToggling={isToggling}
          onToggle={handleToggle}
        />

        {/* <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.helpButton,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.subtle,
              },
            ]}
            onPress={onHelpPress}
            activeOpacity={0.8}
            accessibilityLabel="Help"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name="headset-outline"
              size={18}
              color={colors.brand.primary}
            />
            <Text style={[styles.helpText, { color: colors.brand.primary }]}>
              Help
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sosButton,
              {
                backgroundColor: colors.status.errorBg,
                borderColor: colors.status.errorBorder,
              },
            ]}
            onPress={onSOSPress}
            activeOpacity={0.85}
            accessibilityLabel="Emergency SOS"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={[styles.sosText, { color: colors.status.error }]}>
              SOS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: colors.background.tint },
            ]}
            onPress={onNotificationsPress}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.text.secondary}
            />
            {hasUnreadNotifications && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.status.error,
                    borderColor: colors.background.card,
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        </View> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    elevation: 3,
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 34, height: 34 },
  welcomeLine: { flex: 1, fontSize: 14, fontFamily: FontFamily.bold },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: { fontSize: 13, fontFamily: FontFamily.bold },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  helpButton: {
    height: 35,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  helpText: { fontSize: 12, fontFamily: FontFamily.bold, letterSpacing: 0.2 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  sosButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  sosText: { fontSize: 12, fontFamily: FontFamily.bold, letterSpacing: 0.4 },
});
