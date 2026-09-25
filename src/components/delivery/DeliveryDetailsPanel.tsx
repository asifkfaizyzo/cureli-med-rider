// src/components/delivery/DeliveryDetailsPanel.tsx (do not remove this comment)

import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

const COLLAPSED_HEIGHT = 220;
const EXPANDED_HEIGHT = 420;

interface DeliveryDetailsPanelProps {
  children: React.ReactNode;
}

/**
 * Simple two-state (collapsed/expanded) panel with a chevron toggle,
 * per product decision (no draggable bottom-sheet here — that pattern
 * stays reserved for HomeBottomSheet on the browse/home screen).
 */
export function DeliveryDetailsPanel({ children }: DeliveryDetailsPanelProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, heightAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: heightAnim,
          backgroundColor: colors.background.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.handleRow}
        onPress={() => setIsExpanded((prev) => !prev)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 20, right: 20 }}
      >
        <View style={[styles.handleBar, { backgroundColor: colors.border.default }]} />
        <Ionicons
          name={isExpanded ? "chevron-down" : "chevron-up"}
          size={16}
          color={colors.text.muted}
        />
      </TouchableOpacity>

      <View style={[styles.content, { paddingBottom: 16 + insets.bottom }]}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
    gap: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});