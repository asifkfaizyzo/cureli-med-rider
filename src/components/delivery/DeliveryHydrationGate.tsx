// src/components/delivery/DeliveryHydrationGate.tsx (do not remove this comment)

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useDeliveryStore } from "../../store/deliveryStore";

/**
 * Blocking gate shown once per authenticated session, before we know
 * whether the rider currently has an active delivery in progress.
 *
 * Fails CLOSED on purpose: if the initial "check for active delivery"
 * request fails (e.g. bad network right at app launch), we do NOT assume
 * "no active delivery" and let the rider navigate freely — a real
 * in-progress delivery would then be missed and the rider could
 * accidentally wander around the app instead of being locked into
 * ActiveDeliveryScreen. Instead we block with a clear retry action.
 */
export function DeliveryHydrationGate() {
  const { colors } = useTheme();
  const syncError = useDeliveryStore((s) => s.syncError);
  const requestResync = useDeliveryStore((s) => s.requestResync);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.page }]}
    >
      {syncError ? (
        <View style={styles.content}>
          <View
            style={[styles.iconWrap, { backgroundColor: colors.status.errorBg }]}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={30}
              color={colors.status.error}
            />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Couldn't check delivery status
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            {syncError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.brand.primary }]}
            onPress={requestResync}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={16} color={colors.brand.primaryText} />
            <Text style={[styles.retryText, { color: colors.brand.primaryText }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.loadingText, { color: colors.text.muted }]}>
            Checking for active deliveries...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "800",
  },
});