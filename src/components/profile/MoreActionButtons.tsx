// cureli-rider-app/src/components/profile/MoreActionButtons.tsx

import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";

interface MoreActionButtonsProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
  version: string;
}

export function MoreActionButtons({
  onLogout,
  onDeleteAccount,
  version,
}: MoreActionButtonsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.actionBlock}>
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.border.subtle }]}
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.brand.primary} />
        <Text style={[styles.logoutText, { color: colors.brand.primary }]}>
          Log Out
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDeleteAccount}
        activeOpacity={0.8}
      >
        <Text style={[styles.deleteText, { color: colors.status.error }]}>
          Delete Account
        </Text>
      </TouchableOpacity>

      <Text style={[styles.versionText, { color: colors.text.muted }]}>
        {version}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 120,
  },
});