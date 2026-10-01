import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function BackgroundLocationDisclosure({
  visible,
  onAccept,
  onDecline,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <MaterialIcons
            name="location-on"
            size={48}
            color="#000060"
            style={styles.icon}
          />

          <Text style={styles.title}>Background Location Access</Text>

          <Text style={styles.body}>
            Cureli Rider collects and transmits location data to assign and
            track medicine deliveries{" "}
            <Text style={styles.bold}>
              even when the app is closed or not in use.
            </Text>
          </Text>

          {/* Swiggy-style explicit instruction */}
          <View style={styles.instructionBox}>
            <MaterialIcons
              name="info-outline"
              size={18}
              color="#1e40af"
              style={styles.instructionIcon}
            />
            <Text style={styles.instructionText}>
              To ensure that orders are tracked and ETAs stay accurate while you
              navigate, please select{" "}
              <Text style={styles.highlight}>"Allow all the time"</Text> in the
              location permission prompt that follows.
            </Text>
          </View>

          <Text style={styles.body}>
            Your location is shared only with the assigned pharmacy and customer
            during an active delivery. Tracking stops completely when you toggle
            Offline.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={onDecline}
              activeOpacity={0.7}
            >
              <Text style={styles.declineText}>Deny</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={onAccept}
              activeOpacity={0.7}
            >
              <Text style={styles.acceptText}>Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 8,
  },
  icon: { alignSelf: "center", marginBottom: 12 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000060",
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: { fontWeight: "700", color: "#111827" },
  instructionBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  instructionIcon: { marginTop: 2 },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 20,
  },
  highlight: {
    fontWeight: "800",
    color: "#1e3a8a",
  },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  declineText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  acceptBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#000060",
    alignItems: "center",
  },
  acceptText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});