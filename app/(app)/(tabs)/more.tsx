// app/(app)/(tabs)/more.tsx (do not remove this comment)
// cureli-rider-app/app/(app)/(tabs)/more.tsx

import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/theme/ThemeContext";
import { FontFamily } from "../../../src/theme/typography";
import { useAuthStore } from "../../../src/store/authStore";
import { useRiderOperationalStore } from "../../../src/store/riderOperationalStore";
import { RiderHeader } from "../../../src/components/home/RiderHeader";

export default function MoreScreen() {
  const { colors } = useTheme();
  
  // Dynamic user data
  const rider = useAuthStore((state) => state.rider);
  const logout = useAuthStore((state) => state.logout);
  const isOnline = useRiderOperationalStore((state) => state.isOnline);

  const fullName = rider?.full_name || "Rider Partner";
  const rawPhone = rider?.phone || "";
  const displayPhone = rawPhone.startsWith("+91") ? rawPhone : `+91 ${rawPhone}`;
  
  // Format avatar initials
  const initials = fullName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "R";

  // Dynamic Metrics
  const currentRating = rider?.rating ? Number(rider.rating).toFixed(1) : "0.0";
  const totalTrips = rider?.total_deliveries ?? 0;

  // Custom alert handler for dummy buttons
  const handleMenuPress = (label: string) => {
    Alert.alert("Feature Coming Soon", `"${label}" setup will be available in the next release.`);
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.error("[MoreScreen] Logout failed:", err);
            }
          } 
        },
      ]
    );
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      "Account Deletion Request",
      "For security and compliance reasons, account deletion requests must be verified. Please contact administrator support at support@cureli.in to process your request.",
      [{ text: "Okay", style: "default" }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      {/* Dynamic Header wired directly to operational store */}
      <RiderHeader
        collapsed={false}
        onHelpPress={() => handleMenuPress("Help Center")}
        onSOSPress={() => Alert.alert("SOS Triggered", "Emergency support signal sent to operations desk.")}
        onNotificationsPress={() => handleMenuPress("Notifications")}
        hasUnreadNotifications={false}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dynamic Profile Summary Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.background.card, borderColor: colors.border.subtle }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.background.tint, borderColor: colors.brand.soft }]}>
              <Text style={[styles.avatarText, { color: colors.brand.primary }]}>{initials}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.text.primary }]}>{fullName}</Text>
              <Text style={[styles.profilePhone, { color: colors.text.secondary }]}>{displayPhone}</Text>
            </View>
          </View>

          {/* Stats Segment - Acceptance rate explicitly removed as requested */}
          <View style={[styles.statsDivider, { backgroundColor: colors.border.subtle }]} />
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statValueRow}>
                <Ionicons name="star" size={18} color="#FFB300" style={styles.statIcon} />
                <Text style={[styles.statValue, { color: colors.text.primary }]}>{currentRating}</Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.text.muted }]}>Rating</Text>
            </View>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border.subtle }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{totalTrips}</Text>
              <Text style={[styles.statLabel, { color: colors.text.muted }]}>Total Trips</Text>
            </View>
          </View>
        </View>

        {/* Option Group: My Account */}
        <Text style={[styles.groupTitle, { color: colors.text.muted }]}>MY ACCOUNT</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.background.card, borderColor: colors.border.subtle }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("Personal Information")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Personal Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("Documents")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Documents</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("Delivery History")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="receipt-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Delivery History</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("Notifications")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("KYC & Bank Details")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="card-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>KYC & Bank</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("Training Modules")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="school-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Training</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Option Group: Support & Legal */}
        <Text style={[styles.groupTitle, { color: colors.text.muted }]}>SUPPORT & LEGAL</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.background.card, borderColor: colors.border.subtle }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("Help & Support Center")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Help Center & FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("Terms & Conditions")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-lock-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress("Privacy Policy")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.text.secondary} />
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Destructive Buttons */}
        <View style={styles.actionBlock}>
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.border.subtle }]}
            onPress={handleLogoutPress}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.brand.primary} />
            <Text style={[styles.logoutText, { color: colors.brand.primary }]}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccountPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.deleteText, { color: colors.status.error }]}>Delete Account</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: colors.text.muted }]}>Version 1.0.0 (Production)</Text>
        </View>
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
    paddingBottom: 100,
  },
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
  groupTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  actionBlock: {
    marginTop: 12,
    alignItems: "center",
    gap: 12,
  },
  logoutButton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  deleteButton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  versionText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    marginTop: 8,
  },
});