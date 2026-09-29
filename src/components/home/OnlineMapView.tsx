// src/components/home/OnlineMapView.tsx (do not remove this comment)
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import MapView, {
  MapPressEvent,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { darkMapStyle, lightMapStyle } from "../../constants/mapStyle";
import { useMarkerBitmap } from "../../hooks/useMarkerBitmap";
import { useNearbyShops } from "../../hooks/useNearbyShops";
import { useRiderOperationalStore } from "../../store/riderOperationalStore";
import { useTheme } from "../../theme/ThemeContext";
import { PharmacyCarousel, PharmacyCarouselHandle } from "./PharmacyCarousel";
import { RecenterButton } from "./RecenterButton";
import { RiderMarker, RiderMarkerBitmapSource } from "./RiderMarker";
import { ShopMarker, ShopMarkerBitmapSource } from "./ShopMarker";

const DEFAULT_REGION: Region = {
  latitude: 9.9312,
  longitude: 76.2673,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type OnlineMapViewProps = {
  onUserInteract?: () => void;
  isSheetOpen?: boolean;
};

// ── Animated "Searching for orders" Pill ─────────────────────

function SearchingOrdersPill() {
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();

    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim, entryAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const textPrimaryColor =
    colors?.text?.primary || (isDark ? "#F9FAFB" : "#111827");
  const cardBgColor =
    colors?.background?.card || (isDark ? "#1E293B" : "#FFFFFF");
  const borderColor = isDark ? "#334155" : "#E2E8F0";

  return (
    <Animated.View
      style={[
        styles.pillContainer,
        {
          opacity: entryAnim,
          backgroundColor: cardBgColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.dotWrapper}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <View style={styles.solidDot} />
      </View>
      <Text style={[styles.pillText, { color: textPrimaryColor }]}>
        Searching for orders...
      </Text>
    </Animated.View>
  );
}

// ── Helper: compute a region that fits two coordinate points ──
function computeFitBothRegion(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  paddingFactor = 1.8,
): Region {
  const centerLat = (lat1 + lat2) / 2;
  const centerLng = (lng1 + lng2) / 2;

  const latDiff = Math.abs(lat1 - lat2);
  const lngDiff = Math.abs(lng1 - lng2);

  // Minimum delta so we don't over-zoom when points are very close
  const MIN_DELTA = 0.008;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDiff * paddingFactor, MIN_DELTA),
    longitudeDelta: Math.max(lngDiff * paddingFactor, MIN_DELTA),
  };
}

// ── Main Map Component ───────────────────────────────────────

export function OnlineMapView({
  onUserInteract,
  isSheetOpen = false,
}: OnlineMapViewProps) {
  const { isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const carouselRef = useRef<PharmacyCarouselHandle>(null);
  const currentLocation = useRiderOperationalStore(
    (state) => state.currentLocation,
  );
  const { data: shopsData } = useNearbyShops();

  const shops = shopsData?.shops ?? [];

  const [hasUserPanned, setHasUserPanned] = useState(false);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [activeShopIndex, setActiveShopIndex] = useState(0);

  // Gate: prevent the scroll-sync effect from overriding the
  // initial rider-centered camera on the very first render.
  const isInitialCameraSet = useRef(false);

  // ── Pre-rendered Bitmaps ─────────────────────────────────
  const { viewRef: riderIconRef, uri: riderIconUri } = useMarkerBitmap([
    isDark,
  ]);
  const { viewRef: shopOpenRef, uri: shopOpenUri } = useMarkerBitmap([isDark]);
  const { viewRef: shopSelectedRef, uri: shopSelectedUri } = useMarkerBitmap([
    isDark,
  ]);
  const { viewRef: shopClosedRef, uri: shopClosedUri } = useMarkerBitmap([
    isDark,
  ]);

  // ── Location → initial camera (rider-centered) ───────────
  const handleLocationUpdate = useCallback(() => {
    if (
      !initialRegionSet &&
      currentLocation &&
      mapRef.current &&
      !hasUserPanned
    ) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500,
      );
      setInitialRegionSet(true);
      // Mark that the first camera animation is done so the
      // scroll-sync effect is allowed to run from now on.
      setTimeout(() => {
        isInitialCameraSet.current = true;
      }, 600);
    }
  }, [currentLocation, initialRegionSet, hasUserPanned]);

  useEffect(() => {
    handleLocationUpdate();
  }, [handleLocationUpdate]);

  // ── Scroll sync: fit BOTH rider + active shop in frame ────
  // Only fires after the initial rider-centered camera is set.
  useEffect(() => {
    if (
      !isInitialCameraSet.current ||
      !currentLocation ||
      shops.length === 0 ||
      activeShopIndex < 0 ||
      activeShopIndex >= shops.length ||
      !mapRef.current
    ) {
      return;
    }

    const shop = shops[activeShopIndex];
    const fitRegion = computeFitBothRegion(
      currentLocation.lat,
      currentLocation.lng,
      shop.lat,
      shop.lng,
    );

    mapRef.current.animateToRegion(fitRegion, 450);
  }, [activeShopIndex, shops, currentLocation]);

  // ── Card TAP: zoom tightly into just the shop ────────────
  const handleShopCardPress = useCallback(
    (index: number) => {
      setActiveShopIndex(index);
      carouselRef.current?.scrollToIndex(index);

      if (
        shops.length > 0 &&
        index >= 0 &&
        index < shops.length &&
        mapRef.current
      ) {
        const shop = shops[index];
        mapRef.current.animateToRegion(
          {
            latitude: shop.lat,
            longitude: shop.lng,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          },
          400,
        );
      }
    },
    [shops],
  );

  // ── Marker tap → scroll carousel + fit both ──────────────
  const handleShopMarkerPress = useCallback((index: number) => {
    setActiveShopIndex(index);
    carouselRef.current?.scrollToIndex(index);
  }, []);

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
        500,
      );
      setHasUserPanned(false);
    }
  };

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
      <ShopMarkerBitmapSource viewRef={shopOpenRef} variant="open" />
      <ShopMarkerBitmapSource viewRef={shopSelectedRef} variant="selected" />
      <ShopMarkerBitmapSource viewRef={shopClosedRef} variant="closed" />

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

        {shops.map((shop, index) => {
          const isSelected = index === activeShopIndex;
          const iconUri = isSelected
            ? shopSelectedUri
            : shop.is_open
              ? shopOpenUri
              : shopClosedUri;

          return (
            <ShopMarker
              key={shop.branch_id}
              coordinate={{
                latitude: shop.lat,
                longitude: shop.lng,
              }}
              shopName={shop.shop_name}
              isOpen={shop.is_open}
              isSelected={isSelected}
              iconUri={iconUri}
              onPress={() => handleShopMarkerPress(index)}
            />
          );
        })}
      </MapView>

      <SearchingOrdersPill />

      <PharmacyCarousel
        ref={carouselRef}
        shops={shops}
        activeIndex={activeShopIndex}
        isSheetOpen={isSheetOpen}
        onIndexChange={setActiveShopIndex}
        onCardPress={handleShopCardPress}
      />

      {hasUserPanned && <RecenterButton onPress={handleRecenter} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  pillContainer: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 99,
  },
  dotWrapper: {
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  solidDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  pulseRing: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
});
