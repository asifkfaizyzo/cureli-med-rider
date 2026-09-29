// src/components/delivery/ActiveDeliveryScreen.tsx (do not remove this comment)

import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useDeliveryStore } from "../../store/deliveryStore";
import { getDeliveryLeg } from "../../utils/deliveryStatus";
import { useAutoEnRoute } from "../../hooks/useAutoEnRoute";
import { TopStatusBar } from "./TopStatusBar";
import { DeliveryMapView } from "./DeliveryMapView";
import { DeliveryDetailsPanel } from "./DeliveryDetailsPanel";
import { PharmacyLegPanel } from "./PharmacyLegPanel";
import { CustomerLegPanel } from "./CustomerLegPanel";

export function ActiveDeliveryScreen() {
  const { colors } = useTheme();
  const delivery = useDeliveryStore((s) => s.activeDelivery);

  useAutoEnRoute(delivery);

  if (!delivery) return null;

  const leg = getDeliveryLeg(delivery);
  const targetLat =
    leg === "PHARMACY" ? delivery.pharmacy.latitude : delivery.customer?.latitude ?? null;
  const targetLng =
    leg === "PHARMACY" ? delivery.pharmacy.longitude : delivery.customer?.longitude ?? null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <TopStatusBar orderNumber={delivery.order_number} leg={leg} />

      {/*
        KeyboardAvoidingView shrinks its own height by the keyboard's
        height when it appears. Since mapContainer below is flex: 1 and
        DeliveryDetailsPanel has a fixed/animated height, the map simply
        gets shorter to make room — the panel (and the OTP boxes inside
        it) rises up above the keyboard instead of being covered by it.

        behavior differs by platform because Android and iOS handle
        window resizing differently:
          - iOS: nothing resizes automatically, so we must use "padding"
            (adds bottom padding equal to keyboard height).
          - Android: "height" works better here since the OS keyboard
            already interacts with windowSoftInputMode; "padding" can
            double-apply spacing on some Android versions.
      */}
      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.mapContainer}>
          <DeliveryMapView leg={leg} targetLat={targetLat} targetLng={targetLng} />
        </View>

        <DeliveryDetailsPanel>
          {leg === "PHARMACY" ? (
            <PharmacyLegPanel delivery={delivery} />
          ) : (
            <CustomerLegPanel delivery={delivery} />
          )}
        </DeliveryDetailsPanel>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexFill: { flex: 1 },
  mapContainer: { flex: 1, position: "relative" },
});