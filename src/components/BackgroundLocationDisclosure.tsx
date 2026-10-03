// src/components/BackgroundLocationDisclosure.tsx (do not remove this comment)
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type DisclosureType = "foreground" | "background";

interface Props {
  visible: boolean;
  type?: DisclosureType;
  onAccept: () => void;
  onDecline: () => void;
}

export function BackgroundLocationDisclosure({
  visible,
  type = "background",
  onAccept,
  onDecline,
}: Props) {
  const isForeground = type === "foreground";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={isForeground ? "my-location" : "location-on"}
                size={38}
                color="#000060"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {isForeground
                ? "Location Access Required"
                : "Background Location Access Required"}
            </Text>

            {/* Primary Google-Mandated Disclosure Box */}
            <View style={styles.primaryBox}>
              <Text style={styles.primaryText}>
                {isForeground ? (
                  <>
                    <Text style={styles.bold}>Cureli Rider collects and transmits location data</Text> to show nearby pharmacy partners, display your live position on the map, and match you with available medicine delivery orders.
                  </>
                ) : (
                  <>
                    <Text style={styles.bold}>Cureli Rider collects and transmits location data</Text> to enable live order assignment, delivery navigation, and real-time ETA sharing with pharmacies and customers <Text style={styles.boldHighlight}>even when the app is closed or not in use.</Text>
                  </>
                )}
              </Text>
            </View>

            {/* Feature Bullets */}
            <View style={styles.bulletList}>
              {isForeground ? (
                <>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color="#000060" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>
                      Discover and list nearby partner pharmacies.
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color="#000060" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>
                      Auto-fill your base city and preferred delivery area.
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color="#000060" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>
                      Render active delivery pickup points on the map.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color="#000060" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>
                      Receive delivery order dispatches while running in background.
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color="#000060" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>
                      Turn-by-turn navigation & geofenced arrival at pharmacies.
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <MaterialIcons name="check-circle" size={16} color="#000060" style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>
                      Share live ETA updates with customers while screen is locked.
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Swiggy-Style Instruction Box */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionHeading}>
                How to set permissions on next step:
              </Text>
              {isForeground ? (
                <Text style={styles.instructionStep}>
                  Select <Text style={styles.boldBlue}>"While using the app"</Text> (or <Text style={styles.boldBlue}>"Only this time"</Text>) in the system permission prompt.
                </Text>
              ) : (
                <Text style={styles.instructionStep}>
                  Select <Text style={styles.boldBlue}>"Allow all the time"</Text> in location permissions to keep tracking continuous during deliveries.
                </Text>
              )}
            </View>

            <Text style={styles.footerNote}>
              Location tracking operates only while you are Online or completing an active delivery. Tracking stops immediately when you toggle Offline.
            </Text>

            {/* Buttons */}
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#EEF2FF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#000060",
    textAlign: "center",
    marginBottom: 12,
  },
  primaryBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#000060",
    marginBottom: 12,
  },
  primaryText: {
    fontSize: 13.5,
    color: "#1F2937",
    lineHeight: 21,
  },
  bold: {
    fontWeight: "700",
    color: "#111827",
  },
  boldHighlight: {
    fontWeight: "700",
    color: "#000060",
  },
  bulletList: {
    gap: 8,
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  instructionBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  instructionHeading: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  instructionStep: {
    fontSize: 13,
    color: "#1E3A8A",
    lineHeight: 19,
  },
  boldBlue: {
    fontWeight: "800",
    color: "#000060",
  },
  footerNote: {
    fontSize: 11.5,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
  },
  acceptBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#000060",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});