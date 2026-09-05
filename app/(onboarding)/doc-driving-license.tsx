import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { useTheme } from "../../src/theme/ThemeContext";

type UploadState = "empty" | "picked" | "uploading" | "done" | "error";

export default function DocDrivingLicenseScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [frontState, setFrontState] = useState<UploadState>("empty");
  const [backUri, setBackUri] = useState<string | null>(null);
  const [backState, setBackState] = useState<UploadState>("empty");
  const [error, setError] = useState<string | null>(null);

  const canContinue = frontState === "done" && backState === "done";

  async function pickImage(
    cameraOnly: boolean,
  ): Promise<{ uri: string; name: string; type: string } | null> {
    let result;

    if (cameraOnly) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
    } else {
      // Show choice
      return new Promise((resolve) => {
        Alert.alert("Choose source", "", [
          {
            text: "Camera",
            onPress: async () => {
              const r = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                quality: 0.8,
              });
              if (!r.canceled && r.assets[0]) {
                resolve({
                  uri: r.assets[0].uri,
                  name: "photo.jpg",
                  type: r.assets[0].mimeType || "image/jpeg",
                });
              } else resolve(null);
            },
          },
          {
            text: "Gallery",
            onPress: async () => {
              const r = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 0.8,
              });
              if (!r.canceled && r.assets[0]) {
                resolve({
                  uri: r.assets[0].uri,
                  name: "photo.jpg",
                  type: r.assets[0].mimeType || "image/jpeg",
                });
              } else resolve(null);
            },
          },
          { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
        ]);
      });
    }

    if (result && !result.canceled && result.assets[0]) {
      return {
        uri: result.assets[0].uri,
        name: "photo.jpg",
        type: result.assets[0].mimeType || "image/jpeg",
      };
    }
    return null;
  }

  async function handlePick(side: "front" | "back") {
    setError(null);
    const image = await pickImage(false);
    if (!image) return;

    if (side === "front") {
      setFrontUri(image.uri);
      setFrontState("uploading");
      try {
        await onboardingApi.uploadDocument(
          "DRIVING_LICENSE_FRONT",
          true,
          image.uri,
          image.name,
          image.type,
        );
        setFrontState("done");
      } catch {
        setFrontState("error");
        setError("Failed to upload front side.");
      }
    } else {
      setBackUri(image.uri);
      setBackState("uploading");
      try {
        await onboardingApi.uploadDocument(
          "DRIVING_LICENSE_FRONT",
          false,
          image.uri,
          image.name,
          image.type,
        );
        setBackState("done");
      } catch {
        setBackState("error");
        setError("Failed to upload back side.");
      }
    }
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background.page }]}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.progress}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.border.default },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.brand.primary, width: "70%" },
            ]}
          />
        </View>
        <Text style={[styles.stepText, { color: colors.text.muted }]}>
          Step 4 of 5 — Documents
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.text.primary }]}>
        Driving License
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.muted }]}>
        Upload both sides of your driving license
      </Text>

      <UploadCard
        label="Front Side"
        state={frontState}
        uri={frontUri}
        onPick={() => handlePick("front")}
        colors={colors}
      />
      <UploadCard
        label="Back Side"
        state={backState}
        uri={backUri}
        onPick={() => handlePick("back")}
        colors={colors}
      />

      {error && (
        <Text style={[styles.error, { color: colors.status.error }]}>
          {error}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: canContinue
              ? colors.brand.primary
              : colors.border.default,
          },
        ]}
        onPress={() => router.push("/(onboarding)/doc-aadhar")}
        disabled={!canContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Reusable Upload Card ──────────────────────────────────────

function UploadCard({
  label,
  state,
  uri,
  onPick,
  colors,
}: {
  label: string;
  state: UploadState;
  uri: string | null;
  onPick: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor:
            state === "done"
              ? "#22c55e"
              : state === "error"
                ? colors.status.error
                : colors.border.default,
        },
      ]}
      onPress={onPick}
      disabled={state === "uploading"}
      activeOpacity={0.7}
    >
      {uri && state !== "empty" ? (
        <Image source={{ uri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={{ fontSize: 32 }}>📄</Text>
          <Text style={[styles.placeholderText, { color: colors.text.muted }]}>
            {label}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.cardLabel, { color: colors.text.primary }]}>
          {label}
        </Text>
        {state === "uploading" && (
          <ActivityIndicator size="small" color={colors.brand.primary} />
        )}
        {state === "done" && (
          <Text style={{ color: "#22c55e", fontSize: 18 }}>✓</Text>
        )}
        {state === "error" && (
          <Text style={{ color: colors.status.error, fontSize: 13 }}>
            Retry
          </Text>
        )}
        {state === "empty" && (
          <Text style={{ color: colors.brand.primary, fontSize: 13 }}>
            Upload
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progress: { paddingTop: 60, paddingHorizontal: 24, gap: 6 },
  progressBar: { height: 4, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  stepText: { fontSize: 12, fontWeight: "500" },
  scroll: { padding: 24, gap: 12, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", marginTop: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: { borderWidth: 1.5, borderRadius: 14, overflow: "hidden" },
  preview: { width: "100%", height: 180, resizeMode: "cover" },
  placeholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeholderText: { fontSize: 14 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  cardLabel: { fontSize: 15, fontWeight: "600" },
  error: { fontSize: 13 },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
