// cureli-rider-app/app/(app)/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../src/theme/ThemeContext";
import { FontFamily } from "../../../src/theme/typography";

const BAR_WIDTH = 360;
const PADDING = 10;
const SLOT_WIDTH = (BAR_WIDTH - PADDING * 2) / 4; // 78px per slot

// Center points for each of the 4 tabs
const CENTERS = [
  PADDING + SLOT_WIDTH * 0.5,
  PADDING + SLOT_WIDTH * 1.5,
  PADDING + SLOT_WIDTH * 2.5,
  PADDING + SLOT_WIDTH * 3.5,
];

const PILL_WIDTHS = [92, 102, 96, 92];

interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { name: "home", label: "Home", icon: "home-outline" },
  { name: "wallet", label: "Wallet", icon: "wallet-outline" },
  { name: "refer", label: "Refer", icon: "people-outline" },
  { name: "more", label: "More", icon: "grid-outline" },
];

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 280,
  mass: 0.5,
};

function CustomTabBar({ state, navigation }: any) {
  const { colors, isDark } = useTheme();
  const activeIndex = state.index;

  const [displayIndex, setDisplayIndex] = useState(activeIndex);

  // Shared animation values
  const animIndex = useSharedValue(activeIndex);
  const pillLeft = useSharedValue(
    CENTERS[activeIndex] - PILL_WIDTHS[activeIndex] / 2,
  );
  const pillWidth = useSharedValue(PILL_WIDTHS[activeIndex]);
  const labelOpacity = useSharedValue(1);

  const updateDisplayIndex = (idx: number) => {
    setDisplayIndex(idx);
  };

  useEffect(() => {
    // Animate active slot tracker
    animIndex.value = withSpring(activeIndex, SPRING_CONFIG);

    // Slide pill position smoothly
    const targetLeft = CENTERS[activeIndex] - PILL_WIDTHS[activeIndex] / 2;
    pillLeft.value = withSpring(targetLeft, SPRING_CONFIG);

    // Expand / contract width
    pillWidth.value = withSpring(PILL_WIDTHS[activeIndex], SPRING_CONFIG);

    // Fade active label safely on UI thread & sync to JS thread
    labelOpacity.value = withTiming(0, { duration: 90 }, (finished) => {
      if (finished) {
        runOnJS(updateDisplayIndex)(activeIndex);
        labelOpacity.value = withTiming(1, { duration: 130 });
      }
    });
  }, [activeIndex]);

  const handleTabPress = (index: number, name: string) => {
    if (activeIndex === index) return;
    navigation.navigate(name);
  };

  // ── Adaptive Light/Dark Mode Mapping ────────────────────────────
  
  // 1. Bar Background: Light Purple in Light mode, Deep Midnight Purple in Dark mode
  const containerBg = isDark ? colors.background.accent : colors.brand.light;
  
  // 2. Bar Border: Soft purple in Light mode, Strong Dark Purple in Dark mode
  const containerBorder = colors.border.brand;

  // 3. Inactive Circles: Mid-Purple in Light mode, Dark violet tint in Dark mode
  const inactiveIconBg = isDark ? colors.background.tint : colors.brand.mid;

  // 4. Inactive Icons: Clean white in Light mode, Light-Purple accent in Dark mode
  const inactiveIconColor = isDark ? colors.brand.light : colors.text.inverse;
  
  // 5. Traveling Active Pill: Deep Purple in Light mode, Vibrant Lilac in Dark mode
  const activeBg = isDark ? colors.brand.accent : colors.brand.primary;

  // 6. Active Text/Icon: Clean white in Light mode, Pure black (contrast) in Dark mode
  const activeTextIconColor = isDark ? colors.text.inverse : colors.brand.primaryText;

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    left: pillLeft.value,
    width: pillWidth.value,
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [
      { translateX: interpolate(labelOpacity.value, [0, 1], [-4, 0]) },
    ],
  }));

  return (
    <View style={styles.absoluteWrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: containerBg,
            borderColor: containerBorder,
          },
        ]}
      >
        {/* INACTIVE ICONS */}
        {TABS.map((tab, idx) => {
          const inactiveStyle = useAnimatedStyle(() => {
            const opacity = interpolate(
              animIndex.value,
              [idx - 0.45, idx, idx + 0.45],
              [1, 0, 1],
              Extrapolation.CLAMP,
            );
            return { opacity };
          });

          return (
            <Animated.View
              key={`inactive-${tab.name}`}
              style={[
                styles.inactiveIconBg,
                {
                  left: CENTERS[idx] - 20,
                  backgroundColor: inactiveIconBg,
                },
                inactiveStyle,
              ]}
              pointerEvents="none"
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={inactiveIconColor}
              />
            </Animated.View>
          );
        })}

        {/* SINGLE TRAVELING ACTIVE PILL */}
        <Animated.View
          style={[
            styles.activePill,
            { backgroundColor: activeBg },
            pillAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <Animated.View style={[styles.pillContent, labelAnimatedStyle]}>
            <Ionicons
              name={TABS[displayIndex]?.icon ?? "home-outline"}
              size={20}
              color={activeTextIconColor}
            />
            <Text style={[styles.pillText, { color: activeTextIconColor }]}>
              {TABS[displayIndex]?.label ?? "Home"}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* TRANSPARENT TAP TARGETS */}
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={`target-${tab.name}`}
            style={[
              styles.tapTarget,
              {
                left: PADDING + idx * SLOT_WIDTH,
                width: SLOT_WIDTH,
              },
            ]}
            onPress={() => handleTabPress(idx, tab.name)}
            activeOpacity={0.85}
          />
        ))}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="refer" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  absoluteWrapper: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  container: {
    width: BAR_WIDTH,
    height: 58,
    borderRadius: 29,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING,
    borderWidth: 1.5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  inactiveIconBg: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    position: "absolute",
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  pillText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  tapTarget: {
    position: "absolute",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});