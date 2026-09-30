// app/(app)/theme.tsx (do not remove this comment)
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, ThemePreference } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

export default function ThemeScreen() {
  const { colors, preference, setPreference } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleThemeSelect = (mode: ThemePreference) => {
    setPreference(mode);
  };

  const themeOptions = [
    {
      id: "dark" as ThemePreference,
      label: "Dark Mode",
      subtitle: "Recommended for low-light environments & battery saving",
      icon: "moon-outline" as keyof typeof Ionicons.glyphMap,
    },
    {
      id: "light" as ThemePreference,
      label: "Light Mode",
      subtitle: "Classic high contrast experience during the day",
      icon: "sunny-outline" as keyof typeof Ionicons.glyphMap,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>App Theme</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>CHOOSE THEME</Text>

        <View style={[styles.cardGroup, { backgroundColor: colors.background.card, borderColor: colors.border.subtle }]}>
          {themeOptions.map((option, index) => {
            const isSelected = preference === option.id;

            return (
              <React.Fragment key={option.id}>
                <TouchableOpacity
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  onPress={() => handleThemeSelect(option.id)}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.iconWrapper, { backgroundColor: colors.background.tint }]}>
                      <Ionicons name={option.icon} size={20} color={isSelected ? colors.brand.primary : colors.text.secondary} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: colors.text.muted }]}>
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: isSelected ? colors.brand.primary : colors.border.default,
                        backgroundColor: isSelected ? colors.brand.primary : "transparent",
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color={colors.text.inverse} />}
                  </View>
                </TouchableOpacity>

                {index < themeOptions.length - 1 && (
                  <View style={[styles.rowDivider, { backgroundColor: colors.border.subtle }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={[styles.footerText, { color: colors.text.muted }]}>
          The application interface will adapt instantly based on your selection.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  optionSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});