// cureli-rider-app/app/(app)/(tabs)/more.tsx (do not remove this comment)

import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { RiderHeader } from "../../../src/components/home/RiderHeader";
import { MoreActionButtons } from "../../../src/components/profile/MoreActionButtons";
import {
  MenuItem,
  MoreMenuSection,
} from "../../../src/components/profile/MoreMenuSection";
import { ProfileCard } from "../../../src/components/profile/ProfileCard";
import { useDialog } from "../../../src/components/Dialog/DialogProvider";
import { useAuthStore } from "../../../src/store/authStore";
import { useRiderOperationalStore } from "../../../src/store/riderOperationalStore";
import { useTheme } from "../../../src/theme/ThemeContext";

export default function MoreScreen() {
  const { colors } = useTheme();
  const { alert, confirm } = useDialog();

  // Auth store
  const rider = useAuthStore((state) => state.rider);
  const logout = useAuthStore((state) => state.logout);

  // Operational store (for guards)
  const isOnline = useRiderOperationalStore((state) => state.isOnline);
  const isToggling = useRiderOperationalStore((state) => state.isToggling);
  const activeDeliveryId = useRiderOperationalStore(
    (state) => state.activeDeliveryId,
  );

  const handleMenuPress = (label: string) => {
    Alert.alert(
      "Feature Coming Soon",
      `"${label}" setup will be available in the next release.`,
    );
  };

  const handleLogoutPress = async () => {
    // ── Guard 1: Availability toggle in progress ────────────
    if (isToggling) {
      await alert({
        title: "Please Wait",
        message:
          "Your availability is being updated. Please wait a moment before logging out.",
        icon: "hourglass-empty",
      });
      return;
    }

    // ── Guard 2: Active delivery in progress ────────────────
    if (activeDeliveryId) {
      await alert({
        title: "Active Delivery",
        message:
          "You have a delivery in progress. Please complete or cancel it before logging out.",
        icon: "local-shipping",
      });
      return;
    }

    // ── Guard 3: Rider is still online ──────────────────────
    if (isOnline) {
      await alert({
        title: "Go Offline First",
        message:
          "You are currently online and may receive order requests. Please go offline from the Home tab before logging out.",
        icon: "warning",
      });
      return;
    }

    // ── All clear: confirm logout ───────────────────────────
    const confirmed = await confirm({
      title: "Log Out",
      message:
        "Are you sure you want to log out? You will stop receiving order alerts until you log back in.",
      confirmLabel: "Log Out",
      cancelLabel: "Cancel",
      destructive: true,
      icon: "logout",
    });

    if (!confirmed) return;

    // Execute logout (authStore.logout handles full cleanup:
    // stops location tracking, resets operational store, calls backend, clears auth)
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("[MoreScreen] Logout failed:", err);
      // Force navigate even if API call fails — local state is already cleared
      router.replace("/(auth)/login");
    }
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      "Account Deletion Request",
      "For security and compliance reasons, account deletion requests must be verified. Please contact administrator support at support@cureli.in to process your request.",
      [{ text: "Okay", style: "default" }],
    );
  };

  // Group 1: My Account Menu Data
  const accountItems: MenuItem[] = [
    {
      label: "Personal Information",
      icon: "person-outline",
      onPress: () => handleMenuPress("Personal Information"),
    },
    {
      label: "Documents",
      icon: "document-text-outline",
      onPress: () => handleMenuPress("Documents"),
    },
    {
      label: "Delivery History",
      icon: "receipt-outline",
      onPress: () => handleMenuPress("Delivery History"),
    },
    {
      label: "Notifications",
      icon: "notifications-outline",
      onPress: () => handleMenuPress("Notifications"),
    },
    {
      label: "KYC & Bank",
      icon: "card-outline",
      onPress: () => handleMenuPress("KYC & Bank"),
    },
    {
      label: "Training",
      icon: "school-outline",
      onPress: () => handleMenuPress("Training"),
    },
  ];

  // Group 2: Support & Legal Menu Data
  const supportItems: MenuItem[] = [
    {
      label: "Help Center & FAQ",
      icon: "help-circle-outline",
      onPress: () => handleMenuPress("Help Center & FAQ"),
    },
    {
      label: "Terms & Conditions",
      icon: "document-lock-outline",
      onPress: () => handleMenuPress("Terms & Conditions"),
    },
    {
      label: "Privacy Policy",
      icon: "shield-checkmark-outline",
      onPress: () => handleMenuPress("Privacy Policy"),
    },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.page }]}
    >
      <RiderHeader
        collapsed={false}
        onHelpPress={() => handleMenuPress("Help Center")}
        onSOSPress={() =>
          Alert.alert(
            "SOS Triggered",
            "Emergency support signal sent to operations desk.",
          )
        }
        onNotificationsPress={() => handleMenuPress("Notifications")}
        hasUnreadNotifications={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Stats Card with CDN Photo Support */}
        <ProfileCard
          fullName={rider?.full_name || "Rider Partner"}
          phone={rider?.phone || ""}
          rating={rider?.rating || "0.0"}
          totalTrips={rider?.total_deliveries || 0}
          photoKey={rider?.profile_photo_url || rider?.profile_photo_key}
        />

        {/* Sections */}
        <MoreMenuSection title="MY ACCOUNT" items={accountItems} />
        <MoreMenuSection title="SUPPORT & LEGAL" items={supportItems} />

        {/* Bottom actions */}
        <MoreActionButtons
          onLogout={handleLogoutPress}
          onDeleteAccount={handleDeleteAccountPress}
          version="Version 1.0.0 (Production)"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});