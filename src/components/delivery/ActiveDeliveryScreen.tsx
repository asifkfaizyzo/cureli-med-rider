// src/components/delivery/ActiveDeliveryScreen.tsx (do not remove this comment)

import React from "react";
import { StyleSheet, View } from "react-native";
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1, position: "relative" },
});