// src/components/delivery/InlineOtpInput.tsx (do not remove this comment)

import React, { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface InlineOtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

/**
 * 4-box inline OTP entry, embedded directly in the leg panel (Phase 3/4)
 * instead of the popup OtpModal used by today's ActiveDeliveryView.
 * Not yet consumed anywhere (Phase 2).
 */
export function InlineOtpInput({ length = 4, value, onChange, error }: InlineOtpInputProps) {
  const { colors } = useTheme();
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const handleChangeDigit = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, "");

    if (!clean) {
      const chars = value.split("");
      chars[index] = "";
      onChange(chars.join(""));
      return;
    }

    const char = clean[clean.length - 1];
    const chars = value.split("");
    while (chars.length < length) chars.push("");
    chars[index] = char;
    onChange(chars.join("").slice(0, length));

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const chars = value.split("");
      chars[index - 1] = "";
      onChange(chars.join(""));
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(r) => {
            inputRefs.current[index] = r;
          }}
          value={digit}
          onChangeText={(t) => handleChangeDigit(t, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          style={[
            styles.box,
            {
              borderColor: error
                ? colors.status.error
                : digit
                ? colors.brand.primary
                : colors.border.input,
              color: colors.text.primary,
              backgroundColor: colors.background.input,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, justifyContent: "center" },
  box: {
    width: 48,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: "800",
  },
});