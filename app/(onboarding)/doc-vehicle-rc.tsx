// cureli-rider-app/app/(onboarding)/doc-vehicle-rc.tsx

import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { OnboardingWrapper } from "../../src/components/OnboardingWrapper";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { documentCache } from "../../src/lib/documentCache";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

type UploadState = "empty" | "uploading" | "done" | "error";

export default function DocVehicleRcScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { rider, updateRider } = useAuthStore();

  const [uri, setUri] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("empty");
  const [error, setError] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);

  const canContinue = state === "done";

  // ── Load existing document + handle resubmission skip ────
  useEffect(() => {
    async function loadDoc() {
      try {
        const status = await onboardingApi.getStatus();
        const doc = status.documents.find((d) => d.group === "VEHICLE_RC");

        // Resubmission skip: if in resubmission mode AND this doc wasn't rejected → skip forward
        if (status.is_resubmission && doc && !doc.was_rejected_this_cycle) {
          router.replace("/(onboarding)/doc-driving-license");
          return;
        }

        if (doc && doc.has_front) {
          // Prefer local cache (for immediate display), fallback to backend URL
          const cached = documentCache.getUri("VEHICLE_RC", "front");
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

  async function launchSource(source: "camera" | "gallery") {
    setPickerVisible(false);
    let result;

    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          setError("Camera permission is required to capture Vehicle RC.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        });
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          setError("Gallery permission is required to choose photos.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const image = {
          uri: result.assets[0].uri,
          name: "vehicle_rc.jpg",
          type: result.assets[0].mimeType || "image/jpeg",
        };
        await uploadSelectedImage(image);
      }
    } catch {
      setError("Failed to select image source.");
    }
  }

  async function uploadSelectedImage(image: {
    uri: string;
    name: string;
    type: string;
  }) {
    setError(null);
    setUri(image.uri);
    setState("uploading");

    try {
      await onboardingApi.uploadDocument(
        "VEHICLE_RC",
        true,
        image.uri,
        image.name,
        image.type,
      );

      documentCache.setUri("VEHICLE_RC", "front", image.uri);
      setState("done");

      // Sync store step if this was first upload
      if (rider && rider.onboarding_step === "RC_UPLOAD") {
        updateRider({ onboarding_step: "DL_UPLOAD" });
      }
    } catch {
      setState("error");
      setError("Failed to upload Vehicle RC.");
    }
  }

  function handleContinue() {
    router.replace("/(onboarding)/doc-driving-license");
  }

  if (initialLoading) {
    return (
      <OnboardingWrapper currentStep="RC_UPLOAD">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.accent} />
        </View>
      </OnboardingWrapper>
    );
  }

  return (
    <OnboardingWrapper currentStep="RC_UPLOAD">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Vehicle RC
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Upload a clear photo of your Registration Certificate (RC) card.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <UploadCard
            label="Vehicle RC Photo"
            state={state}
            uri={uri}
            onPick={() => setPickerVisible(true)}
            colors={colors}
          />
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
          <Text style={styles.buttonText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
      </ScrollView>

      <PhotoPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={launchSource}
      />
    </OnboardingWrapper>
  );
}

// ── UPLOAD CARD ────────────────────────────────────────────

interface UploadCardProps {
  label: string;
  state: UploadState;
  uri: string | null;
  onPick: () => void;
  colors: any;
}

function UploadCard({ label, state, uri, onPick, colors }: UploadCardProps) {
  const isDone = state === "done";
  const isError = state === "error";
  const isUploading = state === "uploading";

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.background.input,
            borderColor: isDone
              ? colors.status.success
              : isError
                ? colors.status.error
                : colors.border.input,
          },
        ]}
        onPress={onPick}
        disabled={isUploading}
        activeOpacity={0.8}
      >
        {uri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri }} style={styles.preview} />
            {isUploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.overlayText}>Uploading image...</Text>
              </View>
            )}
            {isDone && !isUploading && (
              <View style={styles.replaceOverlay}>
                <MaterialIcons name="edit" size={16} color="#ffffff" />
                <Text style={styles.overlayText}>Tap to replace</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name="assignment"
                size={28}
                color={colors.brand.accent}
              />
            </View>
            <Text
              style={[styles.placeholderTitle, { color: colors.text.primary }]}
            >
              {label}
            </Text>
            <Text style={[styles.placeholderSub, { color: colors.text.faint }]}>
              Supports PNG, JPG up to 5MB
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
              name="description"
              size={18}
              color={colors.text.muted}
            />
            <Text style={[styles.cardLabel, { color: colors.text.primary }]}>
              {label}
            </Text>
          </View>

          {isDone && (
            <View style={styles.statusBadge}>
              <MaterialIcons
                name="check-circle"
                size={18}
                color={colors.status.success}
              />
              <Text
                style={[styles.statusText, { color: colors.status.success }]}
              >
                Uploaded
              </Text>
            </View>
          )}

          {isError && (
            <View style={styles.statusBadge}>
              <MaterialIcons
                name="error"
                size={18}
                color={colors.status.error}
              />
              <Text style={[styles.statusText, { color: colors.status.error }]}>
                Retry
              </Text>
            </View>
          )}

          {state === "empty" && (
            <View style={styles.actionBadge}>
              <Text style={[styles.actionText, { color: colors.brand.accent }]}>
                Upload
              </Text>
              <MaterialIcons
                name="add-a-photo"
                size={14}
                color={colors.brand.accent}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── PHOTO PICKER SHEET ─────────────────────────────────────

interface PhotoPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: "camera" | "gallery") => void;
}

function PhotoPickerSheet({
  visible,
  onClose,
  onSelect,
}: PhotoPickerSheetProps) {
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background.elevated },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border.input },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Choose Image Source
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <MaterialIcons name="close" size={22} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsWrapper}>
            <TouchableOpacity
              style={[
                styles.optionBtn,
                {
                  backgroundColor: colors.background.input,
                  borderColor: colors.border.input,
                },
              ]}
              onPress={() => onSelect("camera")}
            >
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <MaterialIcons
                  name="photo-camera"
                  size={24}
                  color={colors.brand.accent}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text
                  style={[styles.optionTitle, { color: colors.text.primary }]}
                >
                  Snap using Camera
                </Text>
                <Text style={[styles.optionDesc, { color: colors.text.muted }]}>
                  Take a live clear photo of the document
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionBtn,
                {
                  backgroundColor: colors.background.input,
                  borderColor: colors.border.input,
                },
              ]}
              onPress={() => onSelect("gallery")}
            >
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <MaterialIcons
                  name="photo-library"
                  size={24}
                  color={colors.brand.accent}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text
                  style={[styles.optionTitle, { color: colors.text.primary }]}
                >
                  Select from Gallery
                </Text>
                <Text style={[styles.optionDesc, { color: colors.text.muted }]}>
                  Choose a document photo from library
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.modalFooterBtn,
                { borderColor: colors.border.input, borderWidth: 1 },
              ]}
            >
              <Text
                style={[
                  styles.modalFooterBtnText,
                  { color: colors.text.muted },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 24,
  },
  headerBlock: { gap: 4 },
  title: { fontSize: 24, fontFamily: FontFamily.bold, lineHeight: 30 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22 },
  formGroup: { gap: 16 },
  cardContainer: { width: "100%" },
  card: { borderWidth: 1.5, borderRadius: 16, overflow: "hidden" },
  placeholder: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  placeholderTitle: { fontSize: 14, fontFamily: FontFamily.bold },
  placeholderSub: { fontSize: 11, fontFamily: FontFamily.regular },
  previewContainer: { position: "relative", width: "100%", height: 180 },
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
  overlayText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1.5,
  },
  modalTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  closeBtn: { padding: 4 },
  optionsWrapper: { paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 14, fontFamily: FontFamily.bold },
  optionDesc: { fontSize: 11, fontFamily: FontFamily.regular },
  modalFooter: { paddingHorizontal: 24 },
  modalFooterBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooterBtnText: { fontSize: 15, fontFamily: FontFamily.bold },
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
});
