import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../theme/ThemeContext";

interface ChevronButtonProps {
  onPress: () => void;
  isOpen: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Isolated spring configs — tuned independently of the header's `withTiming`
// and the bottom sheet's own internal spring, so none of the three can ever
// visually interfere with each other.
const ROTATE_SPRING = { damping: 14, mass: 0.7, stiffness: 160 };
const PRESS_IN_SPRING = { damping: 14, stiffness: 320 };
const PRESS_OUT_SPRING = { damping: 12, stiffness: 220 };

export function ChevronButton({ onPress, isOpen }: ChevronButtonProps) {
  const { colors } = useTheme();

  // Fully local shared values — this component owns its entire animation
  // lifecycle now, instead of receiving a style computed in HomeScreen.
  // That keeps it decoupled from whatever HomeScreen/header/sheet are doing.
  const openProgress = useSharedValue(isOpen ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    openProgress.value = withSpring(isOpen ? 1 : 0, ROTATE_SPRING);
  }, [isOpen, openProgress]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      openProgress.value,
      [0, 1],
      [colors.background.card, colors.brand.light],
    ),
    borderColor: interpolateColor(
      openProgress.value,
      [0, 1],
      [colors.border.default, colors.brand.mid],
    ),
    transform: [
      { scale: pressScale.value },
      { rotate: `${openProgress.value * 180}deg` },
    ],
  }));

  // Ionicons doesn't support animating its `color` prop on the UI thread,
  // so we cross-fade two stacked icons by opacity instead — gives a smooth
  // color transition rather than an abrupt swap.
  const closedIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - openProgress.value,
  }));
  const openIconStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value,
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.88, PRESS_IN_SPRING);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, PRESS_OUT_SPRING);
  };

  return (
    <AnimatedPressable
      style={[styles.button, containerStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={[styles.iconLayer, closedIconStyle]}>
        <Ionicons name="chevron-up" size={24} color={colors.text.primary} />
      </Animated.View>
      <Animated.View style={[styles.iconLayer, openIconStyle]}>
        <Ionicons name="chevron-up" size={24} color={colors.brand.primary} />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 108, // Align directly above the navigation bar
    alignSelf: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 9999, // Extremely high layout stack layer
  },
  iconLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});