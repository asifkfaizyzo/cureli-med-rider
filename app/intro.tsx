// app/intro.tsx (do not remove this comment)
// app/intro.tsx
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { introStorage } from "../src/lib/mmkvStorage";
import { useTheme } from "../src/theme/ThemeContext";
import { FontFamily } from "../src/theme/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Medicine delivery is now easier",
    subtitle: "Now, managing goods delivery has become simpler than ever.",
    image: require("../assets/images/onboarding_1.png"),
  },
  {
    id: "2",
    title: "Package tracking is safer",
    subtitle: "Tracking your package ensures a safer delivery experience.",
    image: require("../assets/images/onboarding_2.png"),
  },
  {
    id: "3",
    title: "Minutes Away. At Your Door.",
    subtitle: "Quick, reliable delivery whenever you need it.",
    image: require("../assets/images/onboarding_3.png"),
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [current, setCurrent] = useState(0);
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);

  const isLast = current === SLIDES.length - 1;

  function finish() {
    introStorage.markSeen();
    router.replace("/(auth)/login");
  }

  function handleRegister() {
    introStorage.markSeen();
    router.replace("/(auth)/phone");
  }

  function goToSlide(index: number) {
    if (index < 0 || index >= SLIDES.length) return;
    listRef.current?.scrollToIndex({ index, animated: true });
    setCurrent(index);
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    goToSlide(current + 1);
  }

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index >= 0 && index < SLIDES.length) {
      setCurrent(index);
    }
  }

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrent(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.page }]}
    >
      <View style={styles.container}>
        {/* Header: Logo and Skip */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={require("../assets/images/cureli_rider_logo.png")}
              style={styles.logo}
            />
            <View style={styles.brandTextCol}>
              <Text style={[styles.brandName, { color: colors.text.logo }]}>
                Cureli
              </Text>
              <Text
                style={[styles.brandSubtitle, { color: colors.text.muted }]}
              >
                Delivery Partner
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={finish}
            activeOpacity={0.7}
            style={styles.skipBtn}
          >
            <Text style={[styles.skipText, { color: colors.text.primary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Swipeable Slides */}
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          onMomentumScrollEnd={onMomentumScrollEnd}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.imageContainer}>
                <Image
                  source={item.image}
                  style={[
                    styles.illustration,
                    { backgroundColor: isDark ? "#2C2C2E" : "#D9D9D9" },
                  ]}
                />
              </View>

              <View style={styles.textContent}>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.text.muted }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Dots (tappable) */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((slide, i) => (
            <TouchableOpacity
              key={slide.id}
              onPress={() => goToSlide(i)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === current
                        ? colors.brand.primary
                        : colors.border.default,
                    width: i === current ? 16 : 6,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.brand.primary },
            ]}
            onPress={next}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { borderColor: colors.border.default },
            ]}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.secondaryBtnText, { color: colors.text.primary }]}
            >
              I'm new, sign me up
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimerText, { color: colors.text.muted }]}>
            By Login or Register, you agree to our{" "}
            <Text
              style={[styles.linkText, { color: colors.text.brand }]}
              onPress={() => router.push("/terms")}
            >
              Terms of service
            </Text>{" "}
            and{" "}
            <Text
              style={[styles.linkText, { color: colors.text.brand }]}
              onPress={() => router.push("/privacy")}
            >
              Privacy and policy
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },
  brandTextCol: {
    flexDirection: "column",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 30,
    fontFamily: FontFamily.amulyaBold,
    lineHeight: 24,
    letterSpacing: 0,
  },
  brandSubtitle: {
    fontSize: 8,
    fontFamily: FontFamily.medium,
    lineHeight: 14,
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  list: {
    flexGrow: 0,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  illustration: {
    width: 350,
    height: 350,
    borderRadius: 8,
    resizeMode: "contain",
  },
  textContent: {
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: FontFamily.regular,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  linkText: {
    fontFamily: FontFamily.medium,
  },
});