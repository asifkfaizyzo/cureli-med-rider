// src/components/delivery/OtpModal.tsx (do not remove this comment)

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

interface OtpModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  onConfirm: (otp: string) => Promise<void>;
  onClose: () => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  visible,
  title,
  subtitle,
  onConfirm,
  onClose,
}) => {
  const { colors } = useTheme();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (otp.length !== 4) {
      setError("Please enter all 4 digits");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(otp);
      setOtp("");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.text.muted} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>{subtitle}</Text>

          <TextInput
            value={otp}
            onChangeText={(val) => {
              setOtp(val.replace(/[^0-9]/g, "").slice(0, 4));
              setError(null);
            }}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="• • • •"
            placeholderTextColor={colors.text.faint}
            style={[
              styles.input,
              {
                color: colors.text.primary,
                borderColor: error ? colors.status.error : colors.border.default,
                backgroundColor: colors.background.input,
              },
            ]}
          />

          {error && (
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || otp.length !== 4}
            style={[
              styles.submitBtn,
              {
                backgroundColor: colors.brand.primary,
                opacity: otp.length === 4 ? 1 : 0.5,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Verify & Proceed</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  input: {
    width: 180,
    height: 52,
    borderWidth: 2,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },
  submitBtn: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});