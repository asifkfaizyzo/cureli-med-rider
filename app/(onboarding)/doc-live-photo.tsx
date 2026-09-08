// app/(onboarding)/doc-live-photo.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { documentCache } from "../../src/lib/documentCache";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type UploadState = "empty" | "picked" | "uploading" | "done" | "error";

export default function DocLivePhotoScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Document State with Cache Integration
  const [uri, setUri] = useState<string | null>(
    documentCache.getUri("PROFILE_PHOTO", "front"),
  );
  const [state, setState] = useState<UploadState>(
    documentCache.has("PROFILE_PHOTO", "front") ? "done" : "empty",
  );
  const [error, setError] = useState<string | null>(null);

  // Custom Camera States
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [capturing, setCapturing] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const canContinue = state === "done";

  // Safe Stack-Aware Back Navigation
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(onboarding)/doc-pan");
    }
  };

  // Request Camera Permissions & Open Custom Camera
  async function handleStartCamera() {
    setError(null);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
        setCameraVisible(true);
      } else {
        setPermissionGranted(false);
        setError("Camera permission is required to capture your live selfie.");
      }
    } catch {
      setError("Failed to request camera permissions.");
    }
  }

  // Handle Capture from Custom Camera with Cache Integration
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

        // Cache local URI for immediate restore
        documentCache.setUri("PROFILE_PHOTO", "front", photo.uri);

        setState("done");
      }
    } catch (err) {
      setState("error");
      setError("Failed to upload selfie. Please try again.");
    } finally {
      setCapturing(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.flex}>
        {/* Step Header */}
        <View style={styles.progressContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={state === "uploading"}
            hitSlop={12}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={colors.text.muted}
            />
            <Text style={[styles.backText, { color: colors.text.muted }]}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.stepTracker}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepBar,
                  {
                    backgroundColor:
                      index <= 3 ? colors.brand.accent : colors.border.input,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepText, { color: colors.text.muted }]}>
            Step 4 of 5: Documents
          </Text>
        </View>

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

          {/* Clean Segmented Tips Container */}
          <View
            style={[
              styles.tipsRowContainer,
              {
                backgroundColor: colors.background.input,
                borderColor: colors.border.input,
              },
            ]}
          >
            {/* Tip 1 */}
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

            {/* Divider */}
            <View
              style={[
                styles.tipDivider,
                { backgroundColor: colors.border.input },
              ]}
            />

            {/* Tip 2 */}
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

            {/* Divider */}
            <View
              style={[
                styles.tipDivider,
                { backgroundColor: colors.border.input },
              ]}
            />

            {/* Tip 3 */}
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

          {/* Live Photo Upload Card */}
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
                      <Text style={styles.loadingText}>
                        Uploading selfie...
                      </Text>
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
                    style={[
                      styles.placeholderSub,
                      { color: colors.text.faint },
                    ]}
                  >
                    Live capture only
                  </Text>
                </View>
              )}

              {/* Card Footer */}
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
                      Verified
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
                      style={[
                        styles.statusText,
                        { color: colors.status.error },
                      ]}
                    >
                      Retake
                    </Text>
                  </View>
                )}

                {state === "empty" && (
                  <View style={styles.actionBadge}>
                    <Text
                      style={[
                        styles.actionText,
                        { color: colors.brand.accent },
                      ]}
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

          {/* Error Row */}
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

          {/* Continue Button */}
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
            onPress={() => router.push("/(onboarding)/submit-review")}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Continue to Review</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* CUSTOM CAMERA MODAL WITH SCANNING OVAL GUIDE */}
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

          {/* Bio-scanner Oval Overlay Cutout */}
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

          {/* Custom Camera Interface Buttons */}
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
    </SafeAreaView>
  );
}

// ── DESIGN STYLES ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  stepTracker: {
    flexDirection: "row",
    gap: 6,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },
  headerBlock: {
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  formGroup: {
    width: "100%",
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: "hidden",
  },
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
  tipColumn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
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
  tipDivider: {
    width: 1.5,
    height: 32,
    borderRadius: 1,
  },
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
  placeholderTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  placeholderSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    height: 300,
  },
  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  footerLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  overlayMiddleRow: {
    flexDirection: "row",
    height: 360,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
  cameraCloseBtnPlaceholder: {
    width: 48,
    height: 48,
  },
  captureTrigger: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
