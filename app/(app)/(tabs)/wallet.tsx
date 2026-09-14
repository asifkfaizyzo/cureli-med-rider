// cureli-rider-app/app/(app)/(tabs)/wallet.tsx

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../src/theme/ThemeContext";
import { FontFamily } from "../../../src/theme/typography";

export default function WalletScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <Text style={[styles.text, { color: colors.text.primary }]}>Wallet</Text>
      <Text style={[styles.subtext, { color: colors.text.muted }]}>
        Earnings and instant payouts overview.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  text: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
  },
  subtext: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
  },
});