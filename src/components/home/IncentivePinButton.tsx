// src/components/home/IncentivePinButton.tsx (do not remove this comment)

import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

interface IncentivePinButtonProps {
  isPinned: boolean;
  onToggle: () => void;
  accentColor: string;
}

export function IncentivePinButton({
  isPinned,
  onToggle,
  accentColor,
}: IncentivePinButtonProps) {
  const { colors } = useTheme();
  const rotation = useRef(new Animated.Value(isPinned ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: isPinned ? 1 : 0,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [isPinned, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "40deg"],
  });

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: isPinned ? accentColor : "transparent",
          borderColor: isPinned ? accentColor : colors.border.default,
        },
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <FontAwesome5
          name="thumbtack"
          size={13}
          color={isPinned ? "#fff" : colors.text.muted}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});