// src/components/home/SurgeBanner.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";
import type { SurgeInfo } from "../../types/location";

interface SurgeBannerProps {
  surge: SurgeInfo;
  isOnline: boolean;
}

export function SurgeBanner({ surge, isOnline }: SurgeBannerProps) {
  const { colors } = useTheme();

  if (!surge || !surge.is_active) return null;

  const valueText =
    surge.calc_type === "MULTIPLIER"
      ? `${surge.value}x`
      : `+₹${surge.value}`;

  return (
    <LinearGradient
      colors={[colors.brand.primary, colors.brand.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { shadowColor: colors.brand.primary }]}
    >
      {/* Main Row containing Surge details and Value */}
      <View style={styles.mainRow}>
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Ionicons name="flash" size={18} color="#ffffff" />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Surge Active</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
              </View>
            </View>
            <Text style={styles.subtitle} numberOfLines={2}>
              {surge.rule_name || "Bonus pay active"} per delivery
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.value} numberOfLines={1}>
            {valueText}
          </Text>
          {surge.expires_at && (
            <Text style={styles.expiry} numberOfLines={1}>
              Ends {new Date(surge.expires_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          )}
        </View>
      </View>

      {/* Sleek full-width bottom banner if Offline (no text collision) */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="information-circle-outline" size={14} color="#ffffff" />
          <Text style={styles.cta}>
            Go online now to start earning this bonus
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 6, // Safety spacing to prevent overlap
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
  liveIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80", // Pulsing green status color
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 15,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 70,
  },
  value: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: "#ffffff",
    lineHeight: 28,
  },
  expiry: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 1,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 2,
  },
  cta: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: "#ffffff",
    flex: 1,
  },
});