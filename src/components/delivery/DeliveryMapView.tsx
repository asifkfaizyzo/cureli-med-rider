// src/components/delivery/DeliveryMapView.tsx (do not remove this comment)

import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as PolylineDecoder from "@mapbox/polyline";
import { api } from "../../services/api";
import { useTheme } from "../../theme/ThemeContext";
import { useRiderOperationalStore } from "../../store/riderOperationalStore";
import { useMarkerBitmap } from "../../hooks/useMarkerBitmap";
import { RiderMarker, RiderMarkerBitmapSource } from "../home/RiderMarker";
import { RecenterButton } from "../home/RecenterButton";
import { DestinationMarker } from "./DestinationMarker";
import { lightMapStyle, darkMapStyle } from "../../constants/mapStyle";
import type { DeliveryLeg } from "../../utils/deliveryStatus";

const DEFAULT_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Extra bottom padding accounts for the DeliveryDetailsPanel sitting on
// top of the map in its collapsed state, so fitToCoordinates doesn't
// place the destination marker underneath it.
const FIT_EDGE_PADDING = { top: 80, right: 80, bottom: 260, left: 80 };

interface DeliveryMapViewProps {
  leg: DeliveryLeg;
  targetLat: number | null;
  targetLng: number | null;
}

/**
 * Map for the active-delivery full-screen flow. Unlike the browse map
 * (OnlineMapView), this map is fully user-pannable/zoomable by design —
 * the rider owns the camera. The app only nudges the camera via the
 * explicit Recenter action (fits both rider + current target), and once
 * automatically per leg as soon as both points are first available.
 */
export function DeliveryMapView({ leg, targetLat, targetLng }: DeliveryMapViewProps) {
  const { isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const currentLocation = useRiderOperationalStore((s) => s.currentLocation);

  const { viewRef: riderIconRef, uri: riderIconUri } = useMarkerBitmap([isDark]);

  const hasAutoFittedForLegRef = useRef<DeliveryLeg | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const lastRouteKeyRef = useRef<string | null>(null);

  const fitToBoth = useCallback(() => {
    if (!mapRef.current || !currentLocation || targetLat == null || targetLng == null) {
      return;
    }
    mapRef.current.fitToCoordinates(
      [
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        { latitude: targetLat, longitude: targetLng },
      ],
      { edgePadding: FIT_EDGE_PADDING, animated: true },
    );
  }, [currentLocation, targetLat, targetLng]);

  // Auto-fit once per leg, the moment both points become available.
  // Fires again automatically when `leg` flips PHARMACY -> CUSTOMER.
  useEffect(() => {
    if (hasAutoFittedForLegRef.current === leg) return;
    if (!currentLocation || targetLat == null || targetLng == null) return;

    const timer = setTimeout(() => {
      fitToBoth();
      hasAutoFittedForLegRef.current = leg;
    }, 300);

    return () => clearTimeout(timer);
  }, [leg, currentLocation, targetLat, targetLng, fitToBoth]);

  // Fetch real driving route polyline when leg or destination changes
  useEffect(() => {
    if (!currentLocation || targetLat == null || targetLng == null) {
      setRouteCoords(null);
      return;
    }

    const routeKey = `${leg}:${targetLat.toFixed(4)},${targetLng.toFixed(4)}`;
    if (lastRouteKeyRef.current === routeKey && routeCoords) return;
    lastRouteKeyRef.current = routeKey;

    api
      .get("/mobile/places/directions", {
        params: {
          originLat: currentLocation.lat,
          originLng: currentLocation.lng,
          destLat: targetLat,
          destLng: targetLng,
        },
      })
      .then((res) => {
        const encoded = res.data?.data?.polyline;
        if (encoded) {
          const decoded = PolylineDecoder.decode(encoded).map(
            ([lat, lng]) => ({ latitude: lat, longitude: lng })
          );
          setRouteCoords(decoded);
        }
      })
      .catch(() => {
        // Fallback to straight line if API fails
        setRouteCoords([
          { latitude: currentLocation.lat, longitude: currentLocation.lng },
          { latitude: targetLat, longitude: targetLng },
        ]);
      });
  }, [leg, targetLat, targetLng, currentLocation?.lat, currentLocation?.lng]);

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <RiderMarkerBitmapSource viewRef={riderIconRef} />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsIndoors={false}
        showsBuildings={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={true}
      >
        {currentLocation && (
          <RiderMarker
            coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }}
            iconUri={riderIconUri}
          />
        )}

        {targetLat != null && targetLng != null && (
          <DestinationMarker coordinate={{ latitude: targetLat, longitude: targetLng }} type={leg} />
        )}

        {routeCoords && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={isDark ? "#B084EB" : "#6A20CD"}
            strokeWidth={3}
            lineDashPattern={[8, 8]}
            zIndex={1}
          />
        )}
      </MapView>

      <RecenterButton onPress={fitToBoth} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});