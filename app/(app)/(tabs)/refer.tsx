// app/(app)/(tabs)/refer.tsx (do not remove this comment)
// cureli-rider-app/app/(app)/(tabs)/refer.tsx

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../src/theme/ThemeContext";
import { FontFamily } from "../../../src/theme/typography";

export default function ReferScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <Text style={[styles.text, { color: colors.text.primary }]}>Refer & Earn</Text>
      <Text style={[styles.subtext, { color: colors.text.muted }]}>
        Invite other delivery partners and earn bonus credits.
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