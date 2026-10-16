// src/components/delivery/DeliveryMapView.tsx (do not remove this comment)

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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
  latitude: 9.9312,
  longitude: 76.2673,
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

  // Track native map readiness — fitToCoordinates silently fails
  // if called before the native view is initialized.
  const [mapReady, setMapReady] = useState(false);

  // Composite key (leg + coords) so auto-fit fires for each unique
  // destination, not just once per leg. Fixes batch mode where
  // multiple orders share the same leg but have different coordinates.
  const lastAutoFitKeyRef = useRef<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const lastRouteKeyRef = useRef<string | null>(null);

  const fitToBoth = useCallback(() => {
    if (!mapRef.current || !mapReady || !currentLocation || targetLat == null || targetLng == null) {
      return;
    }
    mapRef.current.fitToCoordinates(
      [
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        { latitude: targetLat, longitude: targetLng },
      ],
      { edgePadding: FIT_EDGE_PADDING, animated: true },
    );
  }, [currentLocation, targetLat, targetLng, mapReady]);

  // Auto-fit once per unique destination (leg + coordinates), the moment
  // both points AND the native map are available. Using a composite key
  // instead of just `leg` ensures re-fit when switching between orders
  // in batch mode that share the same leg but have different coordinates.
  useEffect(() => {
    if (!mapReady || !currentLocation || targetLat == null || targetLng == null) return;

    const fitKey = `${leg}:${targetLat.toFixed(4)},${targetLng.toFixed(4)}`;
    if (lastAutoFitKeyRef.current === fitKey) return;

    const timer = setTimeout(() => {
      fitToBoth();
      lastAutoFitKeyRef.current = fitKey;
    }, 400);

    return () => clearTimeout(timer);
  }, [leg, currentLocation, targetLat, targetLng, fitToBoth, mapReady]);

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
        onMapReady={() => setMapReady(true)}
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

      {/* Loading overlay while map initializes or destination is unknown */}
      {(!mapReady || targetLat == null || targetLng == null) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={isDark ? "#B084EB" : "#6A20CD"} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});