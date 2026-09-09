// cureli-rider-app/app/(onboarding)/welcome.tsx

import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

interface ReadyPoint {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}

const READY_POINTS: ReadyPoint[] = [
  {
    icon: "shield-checkmark-outline",
    title: "Account Verified",
    desc: "Your documents and profile are officially approved.",
  },
  {
    icon: "flash-outline",
    title: "Instant Order Dispatch",
    desc: "Receive nearby medicine & clinic delivery requests.",
  },
  {
    icon: "wallet-outline",
    title: "Flexible Daily Payouts",
    desc: "Track completed trips and earnings in real time.",
  },
];

export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Radar Pulse Animation
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.55);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.65, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [pulseScale, pulseOpacity]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const primaryAccent = isDark ? colors.brand.accent : colors.brand.primary;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>
        {/* Top Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View entering={FadeInDown.duration(600).springify()}>
            <View style={styles.badgeWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { backgroundColor: primaryAccent },
                  pulseAnimatedStyle,
                ]}
              />
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.innerIconBadge,
                    { backgroundColor: primaryAccent },
                  ]}
                >
                  <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.textContainer}
          >
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Ready to Ride
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Your rider onboarding is complete. You can now go online and begin
              accepting deliveries.
            </Text>
          </Animated.View>
        </View>

        {/* Feature / Status Items */}
        <View style={styles.checklistSection}>
          {READY_POINTS.map((item, index) => (
            <Animated.View
              key={item.title}
              entering={FadeInDown.delay(350 + index * 120).duration(500)}
              style={[
                styles.itemCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.04)"
                    : "rgba(0, 0, 0, 0.02)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.05)",
                },
              ]}
            >
              <View
                style={[
                  styles.itemIconBox,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={primaryAccent} />
              </View>
              <View style={styles.itemTextBox}>
                <Text
                  style={[styles.itemTitle, { color: colors.text.primary }]}
                >
                  {item.title}
                </Text>
                <Text style={[styles.itemDesc, { color: colors.text.muted }]}>
                  {item.desc}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* CTA Button */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(600)}
          style={styles.bottomBar}
        >
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: primaryAccent }]}
            onPress={() => router.replace("/(app)/(tabs)/home")}
            activeOpacity={0.88}
          >
            <Text style={[styles.primaryButtonText, { color: "#FFFFFF" }]}>
              Go to Dashboard
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroSection: {
    alignItems: "center",
    marginTop: 20,
  },
  badgeWrapper: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulseRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  innerIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    textAlign: "center",
  },
  checklistSection: {
    gap: 12,
    marginVertical: 20,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTextBox: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },
  bottomBar: {
    paddingBottom: 8,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },
});