// cureli-rider-app/app/(app)/(tabs)/more.tsx (do not remove this comment)

import Constants from "expo-constants";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useDialog } from "../../../src/components/Dialog/DialogProvider";
import { RiderHeader } from "../../../src/components/home/RiderHeader";
import { MoreActionButtons } from "../../../src/components/profile/MoreActionButtons";
import {
  MenuItem,
  MoreMenuSection,
} from "../../../src/components/profile/MoreMenuSection";
import { ProfileCard } from "../../../src/components/profile/ProfileCard";
import { useAuthStore } from "../../../src/store/authStore";
import { useRiderOperationalStore } from "../../../src/store/riderOperationalStore";
import { useTheme } from "../../../src/theme/ThemeContext";

// Dynamically extract version info from app.config.js with native fallbacks
const appVersion =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
const versionCode =
  Constants.expoConfig?.android?.versionCode ?? Constants.nativeBuildVersion;
const appEnvironment = __DEV__ ? "Development" : "Production";

const formattedVersion = `Version ${appVersion}${
  versionCode ? ` (${versionCode})` : ""
} • ${appEnvironment}`;

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
    alert({
      title: "Feature Coming Soon",
      message: `"${label}" setup will be available in the next release.`,
      icon: "info-outline",
    });
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
    alert({
      title: "Account Deletion Request",
      message:
        "For security and compliance reasons, account deletion requests must be verified. Please contact administrator support at info@curelihealth.com to process your request.",
      icon: "info-outline",
    });
  };

  // Group 1: My Account Menu Data
  const accountItems: MenuItem[] = [
    {
      label: "Personal Information",
      icon: "person-outline",
      onPress: () => router.push("/(app)/personal-info"),
    },
    {
      label: "Documents",
      icon: "document-text-outline",
      onPress: () => router.push("/(app)/documents"),
    },
    // {
    //   label: "Notifications",
    //   icon: "notifications-outline",
    //   onPress: () => handleMenuPress("Notifications"),
    // },
    // {
    //   label: "Wallet & Banking",
    //   icon: "card-outline",
    //   onPress: () => handleMenuPress("KYC & Bank"),
    // },
    {
      label: "Delivery History",
      icon: "receipt-outline",
      onPress: () => router.push("/(app)/delivery-history"),
    },
    {
      label: "Theme & Colors",
      icon: "color-palette-outline",
      onPress: () => router.push("/(app)/theme"),
    },
    // {
    //   label: "Training",
    //   icon: "school-outline",
    //   onPress: () => handleMenuPress("Training"),
    // },
  ];

  // Group 2: Support & Legal Menu Data
  const supportItems: MenuItem[] = [
    // {
    //   label: "Help Center & FAQ",
    //   icon: "help-circle-outline",
    //   onPress: () => handleMenuPress("Help Center & FAQ"),
    // },
    {
      label: "Terms & Conditions",
      icon: "document-lock-outline",
      onPress: () => router.push("/terms"),
    },
    {
      label: "Privacy Policy",
      icon: "shield-checkmark-outline",
      onPress: () => router.push("/privacy"),
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
          alert({
            title: "SOS Triggered",
            message: "Emergency support signal sent to operations desk.",
            icon: "warning",
            destructive: true,
          })
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
          version={formattedVersion}
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
