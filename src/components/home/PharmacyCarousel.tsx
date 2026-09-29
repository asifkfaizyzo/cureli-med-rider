// src/components/home/PharmacyCarousel.tsx (do not remove this comment)
import {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import type { NearbyShop } from "../../types/location";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 340);
const CARD_GAP = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const HORIZONTAL_PAD = (SCREEN_WIDTH - CARD_WIDTH) / 2;

export interface PharmacyCarouselHandle {
  scrollToIndex: (index: number) => void;
}

interface PharmacyCarouselProps {
  shops: NearbyShop[];
  activeIndex: number;
  isSheetOpen: boolean;
  onIndexChange: (index: number) => void;
  onCardPress?: (index: number) => void;
}

export const PharmacyCarousel = forwardRef<
  PharmacyCarouselHandle,
  PharmacyCarouselProps
>(({ shops, activeIndex, isSheetOpen, onIndexChange, onCardPress }, ref) => {
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number) => {
      if (index >= 0 && index < shops.length && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    },
  }));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isSheetOpen ? 160 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isSheetOpen ? 0 : 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSheetOpen, translateY, opacity]);

  const handleNavigate = useCallback((shop: NearbyShop) => {
    const url =
      Platform.OS === "ios"
        ? `maps://?daddr=${shop.lat},${shop.lng}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}&travelmode=driving`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps?q=${shop.lat},${shop.lng}`);
    });
  }, []);

  const handleMomentumEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP_INTERVAL);
      const clampedIndex = Math.max(0, Math.min(index, shops.length - 1));
      if (clampedIndex !== activeIndex) {
        onIndexChange(clampedIndex);
      }
    },
    [shops.length, activeIndex, onIndexChange]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: NearbyShop; index: number }) => {
      const isActive = index === activeIndex;

      const cardBg = colors?.background?.card || "#FFFFFF";
      const textPrimary = colors?.text?.primary || "#000000";
      const textSecondary = colors?.text?.secondary || "#374151";
      const textMuted = colors?.text?.muted || "#8C8C8C";
      const defaultBorder = colors?.border?.default || "#E5E7EB";
      const activeBorder = colors?.border?.strong || colors?.brand?.primary || "#6A20CD";

      const successColor = colors?.status?.success || "#22C55E";
      const errorColor = colors?.status?.error || "#EF4444";

      const formattedDistance =
        typeof item.distance_km === "number"
          ? `${item.distance_km.toFixed(1)} km`
          : "Nearby";

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onCardPress?.(index)}
          style={{ width: CARD_WIDTH, marginRight: CARD_GAP }}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: isActive ? activeBorder : defaultBorder,
                borderWidth: isActive ? 1.8 : 1,
                shadowColor: isDark ? "#000000" : colors?.brand?.primary || "#6A20CD",
                shadowOpacity: isActive ? (isDark ? 0.35 : 0.12) : 0.03,
                transform: [{ scale: isActive ? 1.01 : 0.98 }],
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.detailsColumn}>
                <View style={styles.titleWrapper}>
                  <Text
                    style={[styles.shopName, { color: textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.shop_name}
                  </Text>
                  {item.branch_name && (
                    <Text
                      style={[styles.branchName, { color: textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.branch_name}
                    </Text>
                  )}
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.distanceText, { color: colors?.brand?.secondary || "#0C97B8" }]}>
                    {formattedDistance}
                  </Text>

                  <View style={[styles.dividerDot, { backgroundColor: defaultBorder }]} />

                  <View style={styles.statusIndicator}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: item.is_open ? successColor : errorColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.is_open ? successColor : errorColor },
                      ]}
                      numberOfLines={1}
                    >
                      {item.status_message || (item.is_open ? "Open Now" : "Closed")}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.compactNavBtn,
                  {
                    backgroundColor: colors?.brand?.primary || "#6A20CD",
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => handleNavigate(item)}
              >
                <Ionicons name="navigate" size={15} color="#FFFFFF" />
                <Text style={styles.navBtnLabel}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [activeIndex, colors, isDark, handleNavigate, onCardPress]
  );

  const keyExtractor = useCallback((item: NearbyShop) => item.branch_id, []);

  if (!shops || shops.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents={isSheetOpen ? "none" : "auto"}
    >
      <FlatList
        ref={flatListRef}
        data={shops}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PAD,
        }}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_data, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
      />
    </Animated.View>
  );
});

PharmacyCarousel.displayName = "PharmacyCarousel";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 160,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsColumn: {
    flex: 1,
    paddingRight: 12,
  },
  titleWrapper: {
    marginBottom: 4,
  },
  shopName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  branchName: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.85,
    marginTop: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  compactNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
    minWidth: 64,
  },
  navBtnLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

export const dummyShops: NearbyShop[] = [
  {
    branch_id: "preview-shop-1",
    shop_name: "Care Plus Pharmacy",
    branch_name: "Downtown Terminal Hub",
    lat: 37.7749,
    lng: -122.4194,
    distance_km: 0.4,
    is_open: true,
    status_message: "Open Now • Closes 10 PM",
    address: "512 Main Street, Suite B",
    is_live: true,
  },
  {
    branch_id: "preview-shop-2",
    shop_name: "Apex Pharma 24/7",
    branch_name: "East Medical District",
    lat: 37.7833,
    lng: -122.4167,
    distance_km: 1.2,
    is_open: true,
    status_message: "Open 24 Hours",
    address: "900 Broadway Avenue Blvd",
    is_live: true,
  },
  {
    branch_id: "preview-shop-3",
    shop_name: "MediSafe Apothecary",
    branch_name: "West Plaza Shopping Center",
    lat: 37.7599,
    lng: -122.4348,
    distance_km: 3.7,
    is_open: false,
    status_message: "Closed • Opens 8 AM",
    address: "142 Sector-C Commercial Drive",
    is_live: false,
  },
];