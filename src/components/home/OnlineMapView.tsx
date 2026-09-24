import { useCallback, useRef, useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import MapView, { Region, PROVIDER_GOOGLE, MapPressEvent } from "react-native-maps";
import { useTheme } from "../../theme/ThemeContext";
import { useRiderOperationalStore } from "../../store/riderOperationalStore";
import { useNearbyShops } from "../../hooks/useNearbyShops";
import { useMarkerBitmap } from "../../hooks/useMarkerBitmap";
import { RiderMarker, RiderMarkerBitmapSource } from "./RiderMarker";
import { ShopMarker } from "./ShopMarker";
import { RecenterButton } from "./RecenterButton";
import { lightMapStyle, darkMapStyle } from "../../constants/mapStyle";

const DEFAULT_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type OnlineMapViewProps = {
  onUserInteract?: () => void;
};

export function OnlineMapView({ onUserInteract }: OnlineMapViewProps) {
  const { isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const currentLocation = useRiderOperationalStore((state) => state.currentLocation);
  const { data: shops } = useNearbyShops();

  const [hasUserPanned, setHasUserPanned] = useState(false);
  const [initialRegionSet, setInitialRegionSet] = useState(false);

  // Re-capture the rider icon bitmap if the theme (light/dark) changes,
  // since the icon's colors depend on it.
  const { viewRef: riderIconRef, uri: riderIconUri } = useMarkerBitmap([isDark]);

  const handleLocationUpdate = useCallback(() => {
    if (!initialRegionSet && currentLocation && mapRef.current && !hasUserPanned) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
      setInitialRegionSet(true);
    }
  }, [currentLocation, initialRegionSet, hasUserPanned]);

  const handleRegionChangeComplete = () => {
    if (initialRegionSet) {
      setHasUserPanned(true);
    }
  };

  const handleRecenter = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
      setHasUserPanned(false);
    }
  };

  const handleShopPress = (shopName: string, isOpen: boolean) => {
    Alert.alert(shopName, isOpen ? "Currently open" : "Currently closed", [
      { text: "OK" },
    ]);
  };

  handleLocationUpdate();

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
      {/* Rendered OUTSIDE <MapView> on purpose — see comment in
          RiderMarkerBitmapSource for why this must never be a MapView child. */}
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
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={(_e: MapPressEvent) => onUserInteract?.()}
        onPanDrag={() => onUserInteract?.()}
      >
        {currentLocation && (
          <RiderMarker
            coordinate={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            iconUri={riderIconUri}
          />
        )}

        {shops?.shops.map((shop) => (
          <ShopMarker
            key={shop.branch_id}
            coordinate={{
              latitude: shop.lat,
              longitude: shop.lng,
            }}
            shopName={shop.shop_name}
            isOpen={shop.is_open}
            onPress={() => handleShopPress(shop.shop_name, shop.is_open)}
          />
        ))}
      </MapView>

      {hasUserPanned && <RecenterButton onPress={handleRecenter} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});