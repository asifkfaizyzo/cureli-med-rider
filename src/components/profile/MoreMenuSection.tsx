// cureli-rider-app/src/components/profile/MoreMenuSection.tsx

import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";

export interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface MoreMenuSectionProps {
  title: string;
  items: MenuItem[];
}

export function MoreMenuSection({ title, items }: MoreMenuSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.groupTitle, { color: colors.text.muted }]}>{title}</Text>
      <View
        style={[
          styles.menuGroup,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={20} color={colors.text.secondary} />
                <Text style={[styles.menuItemText, { color: colors.text.primary }]}>
                  {item.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            </TouchableOpacity>

            {index < items.length - 1 && (
              <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
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
});