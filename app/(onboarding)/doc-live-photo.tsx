// cureli-rider-app/app/(onboarding)/doc-live-photo.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingWrapper } from "../../src/components/OnboardingWrapper";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { documentCache } from "../../src/lib/documentCache";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

type UploadState = "empty" | "uploading" | "done" | "error";

export default function DocLivePhotoScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { rider, updateRider } = useAuthStore();

  const [uri, setUri] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("empty");
  const [error, setError] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const canContinue = state === "done";

  useEffect(() => {
    async function loadDoc() {
      try {
        const status = await onboardingApi.getStatus();
        const doc = status.documents.find((d) => d.group === "PROFILE_PHOTO");

        // Live Photo is the LAST doc. If in resubmission mode and not rejected,
        // there's nothing after — just go to status page.
        if (status.is_resubmission && doc && !doc.was_rejected_this_cycle) {
          router.replace("/(onboarding)/status");
          return;
        }

        if (doc && doc.has_front) {
          const cached = documentCache.getUri("PROFILE_PHOTO", "front");
          setUri(cached || doc.front_url);
          setState("done");
        }
      } catch {
        // silent fail
      } finally {
        setInitialLoading(false);
      }
    }
    loadDoc();
  }, []);

  async function handleStartCamera() {
    setError(null);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === "granted") {
        setCameraVisible(true);
      } else {
        setError("Camera permission is required to capture your live selfie.");
      }
    } catch {
      setError("Failed to request camera permissions.");
    }
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        shutterSound: true,
      });

      if (photo?.uri) {
        setCameraVisible(false);
        setUri(photo.uri);
        setState("uploading");

        await onboardingApi.uploadDocument(
          "PROFILE_PHOTO",
          true,
          photo.uri,
          "selfie.jpg",
          "image/jpeg",
        );

        documentCache.setUri("PROFILE_PHOTO", "front", photo.uri);
        setState("done");

        // Backend auto-flips submitted_for_review = true and status = PENDING_REVIEW
        // when this last doc completes the flow. Sync local store.
        if (rider && rider.onboarding_step === "LIVE_PHOTO") {
          updateRider({
            onboarding_step: "COMPLETED",
            submitted_for_review: true,
            status: "PENDING_REVIEW",
          });
        }
      }
    } catch {
      setState("error");
      setError("Failed to upload selfie. Please try again.");
    } finally {
      setCapturing(false);
    }
  }

  function handleContinue() {
    // Clear local doc cache since submission is complete
    documentCache.clearAll();
    router.replace("/(onboarding)/status");
  }

  if (initialLoading) {
    return (
      <OnboardingWrapper currentStep="LIVE_PHOTO">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.accent} />
        </View>
      </OnboardingWrapper>
    );
  }

  return (
    <OnboardingWrapper currentStep="LIVE_PHOTO">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Live Selfie
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Take a clear photo of your face right now. Gallery uploads are
            disabled for identity verification.
          </Text>
        </View>

        {/* Tips */}
        <View
          style={[
            styles.tipsRowContainer,
            {
              backgroundColor: colors.background.input,
              borderColor: colors.border.input,
            },
          ]}
        >
          <View style={styles.tipColumn}>
            <View
              style={[
                styles.tipIconBadge,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name="light-mode"
                size={18}
                color={colors.brand.accent}
              />
            </View>
            <Text
              style={[styles.tipColumnText, { color: colors.text.secondary }]}
            >
              Good{"\n"}Lighting
            </Text>
          </View>
          <View
            style={[
              styles.tipDivider,
              { backgroundColor: colors.border.input },
            ]}
          />
          <View style={styles.tipColumn}>
            <View
              style={[
                styles.tipIconBadge,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name="visibility-off"
                size={18}
                color={colors.brand.accent}
              />
            </View>
            <Text
              style={[styles.tipColumnText, { color: colors.text.secondary }]}
            >
              No Caps{"\n"}/ Masks
            </Text>
          </View>
          <View
            style={[
              styles.tipDivider,
              { backgroundColor: colors.border.input },
            ]}
          />
          <View style={styles.tipColumn}>
            <View
              style={[
                styles.tipIconBadge,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name="face"
                size={18}
                color={colors.brand.accent}
              />
            </View>
            <Text
              style={[styles.tipColumnText, { color: colors.text.secondary }]}
            >
              Look{"\n"}Straight
            </Text>
          </View>
        </View>

        {/* Live Photo Card */}
        <View style={styles.formGroup}>
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: colors.background.input,
                borderColor:
                  state === "done"
                    ? colors.status.success
                    : state === "error"
                      ? colors.status.error
                      : colors.border.input,
              },
            ]}
            onPress={handleStartCamera}
            disabled={state === "uploading"}
            activeOpacity={0.8}
          >
            {uri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri }} style={styles.preview} />
                {state === "uploading" && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.overlayText}>Uploading selfie...</Text>
                  </View>
                )}
                {state === "done" && (
                  <View style={styles.replaceOverlay}>
                    <MaterialIcons
                      name="camera-alt"
                      size={16}
                      color="#ffffff"
                    />
                    <Text style={styles.overlayText}>Tap to retake</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.placeholder}>
                <View
                  style={[
                    styles.faceGuidePlaceholder,
                    {
                      borderColor: colors.brand.accent,
                      backgroundColor: colors.background.tint,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="photo-camera-front"
                    size={48}
                    color={colors.brand.accent}
                  />
                </View>
                <Text
                  style={[
                    styles.placeholderTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  Tap to Open Camera
                </Text>
                <Text
                  style={[styles.placeholderSub, { color: colors.text.faint }]}
                >
                  Live capture only
                </Text>
              </View>
            )}

            <View
              style={[
                styles.cardFooter,
                {
                  borderTopColor: colors.border.input,
                  borderTopWidth: uri ? 1 : 0,
                },
              ]}
            >
              <View style={styles.footerLabelGroup}>
                <MaterialIcons
                  name="portrait"
                  size={18}
                  color={colors.text.muted}
                />
                <Text
                  style={[styles.cardLabel, { color: colors.text.primary }]}
                >
                  Partner Profile Photo
                </Text>
              </View>

              {state === "done" && (
                <View style={styles.statusBadge}>
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={colors.status.success}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: colors.status.success },
                    ]}
                  >
                    Uploaded
                  </Text>
                </View>
              )}

              {state === "error" && (
                <View style={styles.statusBadge}>
                  <MaterialIcons
                    name="error"
                    size={18}
                    color={colors.status.error}
                  />
                  <Text
                    style={[styles.statusText, { color: colors.status.error }]}
                  >
                    Retake
                  </Text>
                </View>
              )}

              {state === "empty" && (
                <View style={styles.actionBadge}>
                  <Text
                    style={[styles.actionText, { color: colors.brand.accent }]}
                  >
                    Capture
                  </Text>
                  <MaterialIcons
                    name="photo-camera"
                    size={14}
                    color={colors.brand.accent}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorRow}>
            <MaterialIcons
              name="error-outline"
              size={16}
              color={colors.status.error}
            />
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {error}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isDark
                ? colors.brand.accent
                : colors.brand.primary,
            },
            !canContinue && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Submit for Verification</Text>
          <MaterialIcons name="check-circle" size={18} color="#ffffff" />
        </TouchableOpacity>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={cameraVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="front"
          />

          <View style={styles.cameraOverlay} pointerEvents="none">
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddleRow}>
              <View style={styles.overlaySide} />
              <View
                style={[
                  styles.ovalScanner,
                  { borderColor: colors.brand.accent },
                ]}
              >
                <View
                  style={[
                    styles.scannerCorner,
                    styles.topLeft,
                    { borderColor: colors.brand.accent },
                  ]}
                />
                <View
                  style={[
                    styles.scannerCorner,
                    styles.topRight,
                    { borderColor: colors.brand.accent },
                  ]}
                />
                <View
                  style={[
                    styles.scannerCorner,
                    styles.bottomLeft,
                    { borderColor: colors.brand.accent },
                  ]}
                />
                <View
                  style={[
                    styles.scannerCorner,
                    styles.bottomRight,
                    { borderColor: colors.brand.accent },
                  ]}
                />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom}>
              <Text style={styles.scannerInstructions}>
                Align your face within the frame
              </Text>
            </View>
          </View>

          <SafeAreaView style={styles.cameraControls} edges={["bottom"]}>
            <TouchableOpacity
              style={[
                styles.cameraCloseBtn,
                { backgroundColor: "rgba(0,0,0,0.6)" },
              ]}
              onPress={() => setCameraVisible(false)}
              disabled={capturing}
            >
              <MaterialIcons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureTrigger,
                { borderColor: colors.brand.accent },
              ]}
              onPress={handleCapture}
              disabled={capturing}
              activeOpacity={0.85}
            >
              {capturing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View
                  style={[styles.captureInner, { backgroundColor: "#ffffff" }]}
                />
              )}
            </TouchableOpacity>

            <View style={styles.cameraCloseBtnPlaceholder} />
          </SafeAreaView>
        </View>
      </Modal>
    </OnboardingWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 20,
  },
  headerBlock: { gap: 4 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, lineHeight: 30 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22 },
  formGroup: { width: "100%" },
  card: { borderWidth: 1.5, borderRadius: 16, overflow: "hidden" },
  placeholder: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  tipsRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  tipColumn: { alignItems: "center", justifyContent: "center", gap: 8 },
  tipIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tipColumnText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    lineHeight: 14,
  },
  tipDivider: { width: 1.5, height: 32, borderRadius: 1 },
  faceGuidePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  placeholderTitle: { fontSize: 15, fontFamily: FontFamily.bold },
  placeholderSub: { fontSize: 11, fontFamily: FontFamily.regular },
  previewContainer: { position: "relative", width: "100%", height: 300 },
  preview: { width: "100%", height: "100%", resizeMode: "cover" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  replaceOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overlayText: { color: "#ffffff", fontSize: 11, fontFamily: FontFamily.bold },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  footerLabelGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabel: { fontSize: 14, fontFamily: FontFamily.semiBold },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusText: { fontSize: 12, fontFamily: FontFamily.bold },
  actionBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 12, fontFamily: FontFamily.bold },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: FontFamily.medium },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#ffffff", fontSize: 16, fontFamily: FontFamily.bold },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: "#000000" },
  cameraOverlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  overlayMiddleRow: { flexDirection: "row", height: 360 },
  overlaySide: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  ovalScanner: {
    width: 260,
    height: 360,
    borderRadius: 130,
    borderWidth: 2,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  overlayBottom: {
    flex: 1.3,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    paddingTop: 24,
  },
  scannerInstructions: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scannerCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderWidth: 4,
  },
  topLeft: {
    top: 30,
    left: 30,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 30,
    right: 30,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 30,
    left: 30,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 30,
    right: 30,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  cameraControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  cameraCloseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraCloseBtnPlaceholder: { width: 48, height: 48 },
  captureTrigger: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  captureInner: { width: 56, height: 56, borderRadius: 28 },
});
