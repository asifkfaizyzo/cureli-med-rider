// src/components/delivery/DeliveryDetailsPanel.tsx (do not remove this comment)

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../theme/ThemeContext";

const PEEK_HEIGHT = 220; // "short" collapsed state
const HEADER_HEIGHT = 46; // handle row height
const MAX_HEIGHT_RATIO = 0.85; // never take up more than 85% of screen

interface DeliveryDetailsPanelProps {
  children: React.ReactNode;
}

export function DeliveryDetailsPanel({ children }: DeliveryDetailsPanelProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [isExpanded, setIsExpanded] = useState(true); // default: full content
  const [contentHeight, setContentHeight] = useState(PEEK_HEIGHT);

  const paddingBottom = Math.max(16, insets.bottom);
  const maxHeight = windowHeight * MAX_HEIGHT_RATIO;

  const expandedHeight = Math.min(
    contentHeight + HEADER_HEIGHT + paddingBottom,
    maxHeight
  );
  const collapsedHeight = Math.min(PEEK_HEIGHT, expandedHeight);

  const heightAnim = useRef(new Animated.Value(expandedHeight)).current;
  const startDragHeight = useRef(expandedHeight);
  const hasMeasuredOnce = useRef(false);

  // Measure the *true* content height off-screen
  const onMeasureLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setContentHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
  }, []);

  // Whenever content height (or expanded/collapsed target) changes,
  // re-snap to the correct height if not mid-drag.
  useEffect(() => {
    const target = isExpanded ? expandedHeight : collapsedHeight;
    Animated.spring(heightAnim, {
      toValue: target,
      useNativeDriver: false,
      tension: 45,
      friction: 8,
    }).start();
    hasMeasuredOnce.current = true;
  }, [isExpanded, expandedHeight, collapsedHeight, heightAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        startDragHeight.current = (heightAnim as any)._value;
      },
      onPanResponderMove: (_, gestureState) => {
        const targetHeight = startDragHeight.current - gestureState.dy;
        const clampedHeight = Math.max(
          collapsedHeight - 20,
          Math.min(expandedHeight + 30, targetHeight)
        );
        heightAnim.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentHeight = (heightAnim as any)._value;
        let snapTarget = collapsedHeight;

        if (Math.abs(gestureState.vy) > 0.3) {
          snapTarget = gestureState.vy < 0 ? expandedHeight : collapsedHeight;
        } else {
          snapTarget =
            currentHeight > (collapsedHeight + expandedHeight) / 2
              ? expandedHeight
              : collapsedHeight;
        }

        const stateWillChange = (snapTarget === expandedHeight) !== isExpanded;
        setIsExpanded(snapTarget === expandedHeight);

        if (stateWillChange) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
        }

        Animated.spring(heightAnim, {
          toValue: snapTarget,
          useNativeDriver: false,
          tension: 40,
          friction: 7,
        }).start();
      },
    })
  ).current;

  const arrowRotation = heightAnim.interpolate({
    inputRange: [collapsedHeight, expandedHeight],
    outputRange: ["0deg", "180deg"],
    extrapolate: "clamp",
  });

  return (
    <>
      {/* Hidden measurement clone — never visible, just used to size the sheet */}
      <View
        style={styles.measureWrapper}
        pointerEvents="none"
        collapsable={false}
      >
        <View onLayout={onMeasureLayout} style={styles.measureContent}>
          {children}
        </View>
      </View>

      <Animated.View
        style={[
          styles.container,
          {
            height: heightAnim,
            backgroundColor: colors.background.card,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <View {...panResponder.panHandlers}>
          <TouchableOpacity
            style={styles.handleRow}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setIsExpanded((prev) => !prev);
            }}
            activeOpacity={0.9}
            hitSlop={{ top: 12, bottom: 12, left: 60, right: 60 }}
          >
            <View style={[styles.handleBar, { backgroundColor: colors.border.default }]} />
            <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
              <Ionicons name="chevron-up" size={18} color={colors.text.muted} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={[styles.content, { paddingBottom }]}>{children}</View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  measureWrapper: {
    position: "absolute",
    opacity: 0,
    left: 0,
    right: 0,
    top: -9999, // push off-screen so it never flashes
  },
  measureContent: {
    paddingHorizontal: 22,
  },
  container: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 24,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
    width: "100%",
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
  },
});