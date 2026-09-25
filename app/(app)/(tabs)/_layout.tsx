// app/(app)/(tabs)/_layout.tsx (do not remove this comment)

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useState, useMemo } from "react";
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
import { useAuthStore } from "../../../src/store/authStore";

const BAR_WIDTH = 360;
const PADDING = 10;

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 280,
  mass: 0.5,
};

interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// ── Semantic Tab Definition ────────────────────────────────────
const ALL_TABS: Record<string, TabItem> = {
  home: { name: "home", label: "Home", icon: "home-outline" },
  wallet: { name: "wallet", label: "Wallet", icon: "wallet-outline" },
  refer: { name: "refer", label: "Refer", icon: "people-outline" },
  more: { name: "more", label: "More", icon: "grid-outline" },
};

const PILL_WIDTHS_MAP: Record<string, number> = {
  home: 92,
  wallet: 102,
  refer: 96,
  more: 92,
};

function CustomTabBar({ state, navigation, activeTabs }: any) {
  const { colors, isDark } = useTheme();

  // Get current active route name from raw navigation state
  const currentRouteName = state.routes[state.index].name;

  // Map active route index securely to the active filtered subset array
  const safeActiveIndex = useMemo(() => {
    const idx = activeTabs.findIndex((t: TabItem) => t.name === currentRouteName);
    return idx !== -1 ? idx : 0;
  }, [activeTabs, currentRouteName]);

  const [displayIndex, setDisplayIndex] = useState(safeActiveIndex);

  // Dynamic layout metrics
  const tabCount = activeTabs.length;
  const slotWidth = (BAR_WIDTH - PADDING * 2) / tabCount;

  const centers = useMemo(() => {
    return activeTabs.map((_: any, idx: number) => PADDING + slotWidth * (idx + 0.5));
  }, [activeTabs, slotWidth]);

  const pillWidths = useMemo(() => {
    return activeTabs.map((tab: TabItem) => PILL_WIDTHS_MAP[tab.name] ?? 92);
  }, [activeTabs]);

  // Animated Shared Values
  const animIndex = useSharedValue(safeActiveIndex);
  const pillLeft = useSharedValue(
    centers[safeActiveIndex] - pillWidths[safeActiveIndex] / 2,
  );
  const pillWidth = useSharedValue(pillWidths[safeActiveIndex]);
  const labelOpacity = useSharedValue(1);

  const updateDisplayIndex = (idx: number) => {
    setDisplayIndex(idx);
  };

  React.useEffect(() => {
    animIndex.value = withSpring(safeActiveIndex, SPRING_CONFIG);

    const targetLeft = centers[safeActiveIndex] - pillWidths[safeActiveIndex] / 2;
    pillLeft.value = withSpring(targetLeft, SPRING_CONFIG);
    pillWidth.value = withSpring(pillWidths[safeActiveIndex], SPRING_CONFIG);

    labelOpacity.value = withTiming(0, { duration: 90 }, (finished) => {
      if (finished) {
        runOnJS(updateDisplayIndex)(safeActiveIndex);
        labelOpacity.value = withTiming(1, { duration: 130 });
      }
    });
  }, [safeActiveIndex, centers, pillWidths]);

  const handleTabPress = (index: number, name: string) => {
    navigation.navigate(name);
  };

  const containerBg = isDark ? colors.background.accent : colors.brand.light;
  const containerBorder = colors.border.brand;
  const inactiveIconBg = isDark ? colors.background.tint : colors.brand.mid;
  const inactiveIconColor = isDark ? colors.brand.light : colors.text.inverse;
  const activeBg = isDark ? colors.brand.accent : colors.brand.primary;
  const activeTextIconColor = isDark
    ? colors.text.inverse
    : colors.brand.primaryText;

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    left: pillLeft.value,
    width: pillWidth.value,
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateX: interpolate(labelOpacity.value, [0, 1], [-4, 0]) }],
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
        {activeTabs.map((tab: TabItem, idx: number) => {
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
                  left: centers[idx] - 20,
                  backgroundColor: inactiveIconBg,
                },
                inactiveStyle,
              ]}
              pointerEvents="none"
            >
              <Ionicons name={tab.icon} size={20} color={inactiveIconColor} />
            </Animated.View>
          );
        })}

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
              name={activeTabs[displayIndex]?.icon ?? "home-outline"}
              size={20}
              color={activeTextIconColor}
            />
            <Text style={[styles.pillText, { color: activeTextIconColor }]}>
              {activeTabs[displayIndex]?.label ?? "Home"}
            </Text>
          </Animated.View>
        </Animated.View>

        {activeTabs.map((tab: TabItem, idx: number) => (
          <TouchableOpacity
            key={`target-${tab.name}`}
            style={[
              styles.tapTarget,
              {
                left: PADDING + idx * slotWidth,
                width: slotWidth,
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
  const riderType = useAuthStore((state) => state.rider?.rider_type) || "INDEPENDENT";
  const isTeam = riderType === "TEAM";

  const activeTabs = useMemo(() => {
    if (isTeam) {
      return [ALL_TABS.home, ALL_TABS.more];
    }
    return [ALL_TABS.home, ALL_TABS.wallet, ALL_TABS.refer, ALL_TABS.more];
  }, [isTeam]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} activeTabs={activeTabs} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Route Redirection Handler (hidden from visual tab layout) */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen name="home" />
      
      <Tabs.Screen 
        name="wallet" 
        options={{
          href: isTeam ? null : "/wallet",
        }}
      />
      <Tabs.Screen 
        name="refer" 
        options={{
          href: isTeam ? null : "/refer",
        }}
      />
      
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