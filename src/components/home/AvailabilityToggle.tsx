import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";

interface AvailabilityToggleProps {
  isOnline: boolean;
  isToggling: boolean;
  onToggle: () => void;
}

// ---- sizing ----
const TRACK_HEIGHT = 36;
const TRACK_BORDER_WIDTH = 1.5;
const TRACK_PADDING = 4; // thumb-to-edge gap
const THUMB_SIZE = 28;
const LABEL_GAP = 8; // min breathing room between thumb and label
const LABEL_EDGE_PADDING = 12; // FIXED gap between label text and the far/free edge
const MIN_TRACK_WIDTH = 108;
const PARALLAX = 8; // small slide-in distance during transition

const INNER_HEIGHT = TRACK_HEIGHT - TRACK_BORDER_WIDTH * 2;
const THUMB_TOP = (INNER_HEIGHT - THUMB_SIZE) / 2;

export const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  isOnline,
  isToggling,
  onToggle,
}) => {
  const { colors } = useTheme();

  const [onlineWidth, setOnlineWidth] = useState(0);
  const [offlineWidth, setOfflineWidth] = useState(0);
  const measured = onlineWidth > 0 && offlineWidth > 0;
  const maxTextWidth = Math.max(onlineWidth, offlineWidth);

  const trackWidth = Math.max(
    MIN_TRACK_WIDTH,
    Math.ceil(
      TRACK_PADDING * 2 + THUMB_SIZE + LABEL_GAP + maxTextWidth + LABEL_EDGE_PADDING,
    ),
  );

  const innerWidth = trackWidth - TRACK_BORDER_WIDTH * 2;
  const maxThumbTranslateX = innerWidth - THUMB_SIZE - TRACK_PADDING * 2;

  // Fixed resting positions, anchored to a real edge padding constant.
  const onlineTextLeft = LABEL_EDGE_PADDING;
  const offlineTextLeft = innerWidth - LABEL_EDGE_PADDING - offlineWidth;

  const slideAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;
  const iconAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;

  const [showBubble, setShowBubble] = useState(false);
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTranslateY = useRef(new Animated.Value(-4)).current;
  const isFirstMount = useRef(true);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? 1 : 0,
      useNativeDriver: false,
      bounciness: 6,
      speed: 16,
    }).start();

    Animated.timing(iconAnim, {
      toValue: isOnline ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setShowBubble(true);

    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleTranslateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleTranslateY, {
          toValue: -4,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowBubble(false));
    }, 1600);

    return () => clearTimeout(timer);
  }, [isOnline, slideAnim, iconAnim, bubbleOpacity, bubbleTranslateY]);

  const toggleBgColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.status.error, colors.status.success],
  });

  const thumbTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxThumbTranslateX],
  });

  // Online label: settles at its fixed left padding (slide=1),
  // slides in from `PARALLAX` px left while fading out toward slide=0.
  const onlineLabelTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-PARALLAX, 0],
  });
  const onlineLabelOpacity = slideAnim;

  // Offline label: settles at its fixed right padding (slide=0),
  // drifts `PARALLAX` px right while fading out toward slide=1.
  const offlineLabelTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PARALLAX],
  });
  const offlineLabelOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const onlineIconOpacity = iconAnim;
  const offlineIconOpacity = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const onlineIconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  const offlineIconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });

  const bubbleBg = isOnline ? colors.status.success : colors.status.error;

  return (
    <View style={styles.toggleArea}>
      <Pressable
        onPress={onToggle}
        disabled={isToggling}
        android_ripple={{ color: "rgba(0,0,0,0.10)", borderless: false }}
        style={({ pressed }) => [
          styles.togglePressable,
          pressed && !isToggling ? { opacity: 0.92 } : null,
        ]}
        accessibilityRole="switch"
        accessibilityState={{ checked: isOnline, disabled: isToggling }}
        accessibilityLabel="Availability"
      >
        <Animated.View
          style={[
            styles.toggleTrack,
            {
              width: trackWidth,
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT / 2,
              borderWidth: TRACK_BORDER_WIDTH,
              backgroundColor: toggleBgColor,
              borderColor: toggleBgColor,
            },
          ]}
        >
          {/* hidden measuring texts — don't affect layout */}
          <Text
            style={[styles.label, styles.measureLabel]}
            onLayout={(e) => setOnlineWidth(e.nativeEvent.layout.width)}
          >
            Online
          </Text>
          <Text
            style={[styles.label, styles.measureLabel]}
            onLayout={(e) => setOfflineWidth(e.nativeEvent.layout.width)}
          >
            Offline
          </Text>

          {measured && (
            <>
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.label,
                  styles.labelAbsolute,
                  {
                    left: onlineTextLeft,
                    opacity: onlineLabelOpacity,
                    color: colors.text.inverse,
                    transform: [{ translateX: onlineLabelTranslateX }],
                  },
                ]}
                numberOfLines={1}
              >
                Online
              </Animated.Text>

              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.label,
                  styles.labelAbsolute,
                  {
                    left: offlineTextLeft,
                    opacity: offlineLabelOpacity,
                    color: colors.text.inverse,
                    transform: [{ translateX: offlineLabelTranslateX }],
                  },
                ]}
                numberOfLines={1}
              >
                Offline
              </Animated.Text>
            </>
          )}

          {/* thumb */}
          <Animated.View
            style={[
              styles.thumb,
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: colors.background.card,
                left: TRACK_PADDING,
                top: THUMB_TOP,
                transform: [{ translateX: thumbTranslateX }],
              },
            ]}
          >
            {isToggling ? (
              <ActivityIndicator
                size="small"
                color={isOnline ? colors.status.success : colors.status.error}
              />
            ) : (
              <View style={styles.iconWrapper}>
                <Animated.View
                  style={[
                    styles.iconAbsolute,
                    {
                      opacity: offlineIconOpacity,
                      transform: [{ scale: offlineIconScale }],
                    },
                  ]}
                >
                  <Ionicons name="close" size={15} color={colors.status.error} />
                </Animated.View>

                <Animated.View
                  style={[
                    styles.iconAbsolute,
                    {
                      opacity: onlineIconOpacity,
                      transform: [{ scale: onlineIconScale }],
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color={colors.status.success}
                  />
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>

      {showBubble && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bubble,
            {
              opacity: bubbleOpacity,
              transform: [{ translateY: bubbleTranslateY }],
              backgroundColor: bubbleBg,
              borderColor: bubbleBg,
              top: TRACK_HEIGHT + 8,
            },
          ]}
        >
          <View style={[styles.bubbleArrow, { borderBottomColor: bubbleBg }]} />
          <Text style={styles.bubbleText}>
            {isOnline ? "You’re online" : "You’re offline"}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toggleArea: {
    position: "relative",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  togglePressable: {
    borderRadius: 999,
    overflow: "hidden",
  },
  toggleTrack: {
    justifyContent: "center",
    position: "relative",
  },
  measureLabel: {
    position: "absolute",
    opacity: 0,
    left: -9999,
  },
  labelAbsolute: {
    position: "absolute",
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },
  thumb: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  iconWrapper: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconAbsolute: {
    position: "absolute",
  },
  bubble: {
    position: "absolute",
    left: 0,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 8,
    zIndex: 999,
  },
  bubbleArrow: {
    position: "absolute",
    top: -7,
    left: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderLeftColor: "transparent",
    borderRightWidth: 7,
    borderRightColor: "transparent",
    borderBottomWidth: 7,
  },
  bubbleText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },
});