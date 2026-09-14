import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";
import { FontFamily } from "../../../theme/typography";

export function AuthHeader() {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image
          source={require("../../../../assets/images/cureli_rider_logo.png")}
          style={styles.logo}
        />
        <View style={styles.brandTextCol}>
          <Text style={[styles.brandName, { color: colors.text.logo }]}>
            Cureli
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.text.muted }]}>
            Delivery Partner
          </Text>
        </View>
      </View>
    </View>
  );
}

export function AuthTabs({ activeTab, switchTab, disabled }: any) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: colors.background.input },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "password" && {
            backgroundColor: isDark
              ? colors.background.elevated
              : colors.background.card,
          },
        ]}
        onPress={() => switchTab("password")}
        disabled={disabled}
      >
        <MaterialIcons
          name="lock"
          size={16}
          color={
            activeTab === "password" ? colors.brand.accent : colors.text.muted
          }
        />
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "password"
                  ? colors.text.primary
                  : colors.text.muted,
            },
          ]}
        >
          Password
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "otp" && {
            backgroundColor: isDark
              ? colors.background.elevated
              : colors.background.card,
          },
        ]}
        onPress={() => switchTab("otp")}
        disabled={disabled}
      >
        <MaterialIcons
          name="sms"
          size={16}
          color={activeTab === "otp" ? colors.brand.accent : colors.text.muted}
        />
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "otp" ? colors.text.primary : colors.text.muted,
            },
          ]}
        >
          OTP Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function WelcomeBlock({ activeTab, otpSent, cleanedPhone }: any) {
  const { colors } = useTheme();
  return (
    <View style={styles.welcomeBlock}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {activeTab === "password" ? "Welcome back" : "Quick sign in"}
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.muted }]}>
        {activeTab === "password"
          ? "Sign in using your password credentials"
          : otpSent
            ? `Enter verification code sent to +91 ${cleanedPhone}`
            : "Sign in instantly via high-speed SMS verification"}
      </Text>
    </View>
  );
}

export function AuthFooter() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View>
      <View style={styles.signUpContainer}>
        <Text style={[styles.signUpText, { color: colors.text.muted }]}>
          New Cureli Rider?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/phone")}>
          <Text style={[styles.signUpLink, { color: colors.brand.accent }]}>
            Create an account
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.termsText, { color: colors.text.faint }]}>
        By continuing, you agree to our{" "}
        <Text
          style={[styles.termsLink, { color: colors.brand.accent }]}
          onPress={() => router.push("/terms")}
        >
          Terms of Service
        </Text>{" "}
        and{" "}
        <Text
          style={[styles.termsLink, { color: colors.brand.accent }]}
          onPress={() => router.push("/privacy")}
        >
          Privacy Policy
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 24,
    marginTop: 50,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 78,
    height: 78,
    resizeMode: "contain",
  },
  brandTextCol: {
    flexDirection: "column",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 50,
    paddingTop: 8,
    paddingBottom: 8,
    fontFamily: FontFamily.amulyaBold,
    lineHeight: 24,
    letterSpacing: 0,
  },
  brandSubtitle: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    lineHeight: 14,
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabText: { fontSize: 14, fontFamily: FontFamily.semiBold },
  welcomeBlock: {
    gap: 6,
    marginBottom: 4,
    marginTop: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontFamily: FontFamily.bold, lineHeight: 30 },
  subtitle: { fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 20 },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  signUpText: { fontSize: 14, fontFamily: FontFamily.regular },
  signUpLink: { fontSize: 14, fontFamily: FontFamily.bold },
  termsText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  termsLink: { fontFamily: FontFamily.semiBold },
});
