// app/(onboarding)/submit-review.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { documentCache } from "../../src/lib/documentCache";
import { api } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

interface NormalizedDocument {
  group: string;
  label: string;
  hasBack: boolean;
  status: string;
  rejection_reason: string | null;
  has_front: boolean;
  has_back: boolean | null;
  storage_key: string | null;
  back_storage_key: string | null;
}

// Fixed metadata mappings for document normalization
const DOCUMENT_GROUPS_METADATA = [
  {
    group: "DRIVING_LICENSE",
    dbType: "DRIVING_LICENSE_FRONT",
    label: "Driving License",
    hasBack: true,
  },
  {
    group: "VEHICLE_RC",
    dbType: "VEHICLE_RC",
    label: "Vehicle RC",
    hasBack: false,
  },
  {
    group: "AADHAAR",
    dbType: "AADHAAR_FRONT",
    label: "Aadhaar Card",
    hasBack: true,
  },
  { group: "PAN", dbType: "PAN_FRONT", label: "PAN Card", hasBack: false },
  {
    group: "PROFILE_PHOTO",
    dbType: "PROFILE_PHOTO",
    label: "Live Photo",
    hasBack: false,
  },
];

export default function SubmitReviewScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { rider, updateRider } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<NormalizedDocument[]>([]);
  const [fetchingDocs, setFetchingDocs] = useState(true);

  // Safe Stack-Aware Back Navigation
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(onboarding)/doc-live-photo");
    }
  };

  // Normalization Mapper: Converts any API/DB response format into a uniform UI Schema
  const normalizeDocuments = (rawDocs: any[]): NormalizedDocument[] => {
    if (!Array.isArray(rawDocs)) return [];

    const rawMap = new Map<string, any>();
    rawDocs.forEach((d) => {
      if (d.group) {
        rawMap.set(d.group, d);
      } else if (d.type) {
        const groupKey = d.type.replace("_FRONT", "");
        rawMap.set(groupKey, d);
      }
    });

    return DOCUMENT_GROUPS_METADATA.map((meta) => {
      const matchingRaw = rawMap.get(meta.group);
      return {
        group: meta.group,
        label: meta.label,
        hasBack: meta.hasBack,
        status: matchingRaw?.status || "NOT_UPLOADED",
        rejection_reason: matchingRaw?.rejection_reason || null,
        has_front: matchingRaw?.has_front ?? !!matchingRaw?.storage_key,
        has_back: meta.hasBack
          ? (matchingRaw?.has_back ?? !!matchingRaw?.back_storage_key)
          : null,
        storage_key: matchingRaw?.storage_key || null,
        back_storage_key: matchingRaw?.back_storage_key || null,
      };
    });
  };

  // Load documents on mount
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const data = await onboardingApi.getDocuments();
        setDocuments(normalizeDocuments(data));
      } catch {
        if (rider?.documents) {
          setDocuments(normalizeDocuments(rider.documents));
        } else {
          // Initialize empty defaults if offline / direct entry
          setDocuments(normalizeDocuments([]));
        }
      } finally {
        setFetchingDocs(false);
      }
    }
    fetchDocuments();
  }, [rider]);

  // Get thumbnail URI: prioritize local cache, fallback to API storage key
  const getThumbnailUri = (
    docGroup: string,
    side: "front" | "back",
    storageKey?: string | null,
  ): string | null => {
    const cached = documentCache.getUri(docGroup, side);
    if (cached) return cached;

    if (storageKey) {
      const base = api.defaults.baseURL || "";
      const cleanKey = storageKey.replace("rider_documents/", "");
      return `${base}/files/staticAssets/rider_documents/${cleanKey}`;
    }
    return null;
  };

  // Determine if a doc is uploaded (checks both sides for 2-sided documents)
  const isDocUploaded = (doc: NormalizedDocument) => {
    if (doc.status && doc.status !== "NOT_UPLOADED") return true;

    if (doc.hasBack) {
      return (
        documentCache.has(doc.group, "front") &&
        documentCache.has(doc.group, "back")
      );
    }
    return documentCache.has(doc.group, "front");
  };

  const allDocsUploaded =
    documents.length > 0 && documents.every((d) => isDocUploaded(d));

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      await onboardingApi.submit();
      documentCache.clearAll(); // Flush temporary local images cache
      updateRider({ status: "PENDING_REVIEW" });
      router.replace("/(onboarding)/status");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Submission failed. Check your documents and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const getDocEditRoute = (group: string) => {
    const routes: Record<string, string> = {
      DRIVING_LICENSE: "/(onboarding)/doc-driving-license",
      VEHICLE_RC: "/(onboarding)/doc-vehicle-rc",
      AADHAAR: "/(onboarding)/doc-aadhar",
      PAN: "/(onboarding)/doc-pan",
      PROFILE_PHOTO: "/(onboarding)/doc-live-photo",
    };
    return routes[group] || "/(onboarding)/doc-driving-license";
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      {/* Header with Safe Back Button */}
      <View style={styles.progressContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={loading}
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
                    index <= 4 ? colors.brand.accent : colors.border.input,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepText, { color: colors.text.muted }]}>
          Step 5 of 5: Review Application
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Review & Submit
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Verify your information. Once submitted, your profile cannot be
            changed during the review process.
          </Text>
        </View>

        {/* Section: Personal Info */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.background.input,
              borderColor: colors.border.input,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Personal Info
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/personal-details")}
              style={styles.editBtn}
            >
              <MaterialIcons
                name="edit"
                size={14}
                color={colors.brand.accent}
              />
              <Text
                style={[styles.editBtnText, { color: colors.brand.accent }]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>
          <Row
            label="Full Name"
            value={rider?.full_name ?? "—"}
            colors={colors}
          />
          <Row
            label="Email Address"
            value={rider?.email ?? "—"}
            colors={colors}
          />
          <Row
            label="Date of Birth"
            value={rider?.date_of_birth ?? "—"}
            colors={colors}
          />
          <Row label="Gender" value={rider?.sex ?? "—"} colors={colors} />
        </View>

        {/* Section: Location */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.background.input,
              borderColor: colors.border.input,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Service City & Address
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/location")}
              style={styles.editBtn}
            >
              <MaterialIcons
                name="edit"
                size={14}
                color={colors.brand.accent}
              />
              <Text
                style={[styles.editBtnText, { color: colors.brand.accent }]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>
          <Row
            label="Operating City"
            value={rider?.current_city ?? "—"}
            colors={colors}
          />
          <Row
            label="Residential Address"
            value={rider?.residential_address ?? "—"}
            colors={colors}
          />
        </View>

        {/* Section: Vehicle Info */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.background.input,
              borderColor: colors.border.input,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Vehicle Info
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/vehicle-details")}
              style={styles.editBtn}
            >
              <MaterialIcons
                name="edit"
                size={14}
                color={colors.brand.accent}
              />
              <Text
                style={[styles.editBtnText, { color: colors.brand.accent }]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>
          <Row
            label="Vehicle Type"
            value={rider?.vehicle_type ?? "—"}
            colors={colors}
          />
          <Row
            label="Registration Plate"
            value={rider?.vehicle_number ?? "—"}
            colors={colors}
          />
          <Row
            label="Make & Model"
            value={rider?.vehicle_make_model ?? "Optional"}
            colors={colors}
          />
        </View>

        {/* Section: Documents Summary & Image Previews */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.background.input,
              borderColor: colors.border.input,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.primary, marginBottom: 4 },
            ]}
          >
            Verification Documents
          </Text>

          {fetchingDocs ? (
            <ActivityIndicator
              size="small"
              color={colors.brand.accent}
              style={{ marginVertical: 12 }}
            />
          ) : (
            <View style={styles.docsList}>
              {documents.map((doc) => {
                const uploaded = isDocUploaded(doc);
                const isRejected = doc.status === "REJECTED";
                const isApproved = doc.status === "APPROVED";
                const editRoute = getDocEditRoute(doc.group);

                const frontUri = getThumbnailUri(
                  doc.group,
                  "front",
                  doc.storage_key,
                );
                const backUri = doc.hasBack
                  ? getThumbnailUri(doc.group, "back", doc.back_storage_key)
                  : null;

                return (
                  <View
                    key={doc.group}
                    style={[
                      styles.docRowItem,
                      { borderBottomColor: colors.border.input },
                    ]}
                  >
                    <View style={styles.docDetailsCol}>
                      <View style={styles.docHeaderRow}>
                        <Text
                          style={[
                            styles.docLabelText,
                            { color: colors.text.primary },
                          ]}
                        >
                          {doc.label}
                        </Text>
                        <TouchableOpacity
                          onPress={() => router.push(editRoute as any)}
                          style={styles.docEditIcon}
                        >
                          <MaterialIcons
                            name="edit"
                            size={12}
                            color={colors.brand.accent}
                          />
                        </TouchableOpacity>
                      </View>

                      {isRejected && doc.rejection_reason && (
                        <Text
                          style={[
                            styles.rejectionReasonText,
                            { color: colors.status.error },
                          ]}
                        >
                          Rejected: {doc.rejection_reason}
                        </Text>
                      )}

                      {/* Cached or Fetched Thumbnail Previews */}
                      {uploaded && (
                        <View style={styles.thumbnailRow}>
                          {frontUri && (
                            <View style={styles.thumbnailWrapper}>
                              <Image
                                source={{ uri: frontUri }}
                                style={styles.thumbnailImg}
                              />
                              <Text
                                style={[
                                  styles.thumbnailSub,
                                  { color: colors.text.faint },
                                ]}
                              >
                                Front
                              </Text>
                            </View>
                          )}
                          {backUri && (
                            <View style={styles.thumbnailWrapper}>
                              <Image
                                source={{ uri: backUri }}
                                style={styles.thumbnailImg}
                              />
                              <Text
                                style={[
                                  styles.thumbnailSub,
                                  { color: colors.text.faint },
                                ]}
                              >
                                Back
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Status Badge */}
                    <View style={styles.docStatusColumn}>
                      {!uploaded ? (
                        <View style={[styles.badge, styles.badgeMissing]}>
                          <MaterialIcons
                            name="warning"
                            size={10}
                            color={colors.status.error}
                          />
                          <Text
                            style={[
                              styles.badgeTextError,
                              { color: colors.status.error },
                            ]}
                          >
                            Missing
                          </Text>
                        </View>
                      ) : isApproved ? (
                        <View style={[styles.badge, styles.badgeSuccess]}>
                          <MaterialIcons
                            name="check"
                            size={10}
                            color="#22c55e"
                          />
                          <Text style={styles.badgeTextSuccess}>Approved</Text>
                        </View>
                      ) : isRejected ? (
                        <View style={[styles.badge, styles.badgeError]}>
                          <MaterialIcons
                            name="close"
                            size={10}
                            color={colors.status.error}
                          />
                          <Text
                            style={[
                              styles.badgeTextError,
                              { color: colors.status.error },
                            ]}
                          >
                            Rejected
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.badge,
                            styles.badgePending,
                            { backgroundColor: colors.background.tint },
                          ]}
                        >
                          <MaterialIcons
                            name="hourglass-empty"
                            size={10}
                            color={colors.brand.accent}
                          />
                          <Text
                            style={[
                              styles.badgeTextPending,
                              { color: colors.brand.accent },
                            ]}
                          >
                            Pending
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isDark
                ? colors.brand.accent
                : colors.brand.primary,
            },
            (loading || fetchingDocs || !allDocsUploaded) &&
              styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading || fetchingDocs || !allDocsUploaded}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.buttonText}>Submit for Verification</Text>
              <MaterialIcons
                name="assignment-turned-in"
                size={18}
                color="#ffffff"
              />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── RENDER ROW ITEM ────────────────────────────────────────────────

interface RowProps {
  label: string;
  value: string;
  colors: any;
}

function Row({ label, value, colors }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.text.muted }]}>
        {label}
      </Text>
      <Text
        style={[styles.rowValue, { color: colors.text.primary }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ── DESIGN STYLES ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  backText: { fontSize: 14, fontFamily: FontFamily.medium },
  stepTracker: { flexDirection: "row", gap: 6 },
  stepBar: { flex: 1, height: 4, borderRadius: 2 },
  stepText: { fontSize: 12, fontFamily: FontFamily.semiBold },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },
  headerBlock: { gap: 4 },
  title: { fontSize: 26, fontFamily: FontFamily.bold, lineHeight: 32 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22 },
  section: { borderWidth: 1.5, borderRadius: 16, padding: 16, gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.bold },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  editBtnText: { fontSize: 12, fontFamily: FontFamily.bold },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
  },
  rowLabel: { fontSize: 13, fontFamily: FontFamily.medium },
  rowValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    textAlign: "right",
  },
  docsList: { gap: 12, marginTop: 4 },
  docRowItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  docDetailsCol: { flex: 1, gap: 6 },
  docHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  docLabelText: { fontSize: 13, fontFamily: FontFamily.bold },
  docEditIcon: { padding: 2 },
  rejectionReasonText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    lineHeight: 14,
  },
  thumbnailRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  thumbnailWrapper: { alignItems: "center", gap: 2 },
  thumbnailImg: {
    width: 64,
    height: 44,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  thumbnailSub: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    textTransform: "uppercase",
  },
  docStatusColumn: { alignItems: "flex-end", paddingTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.2)",
  },
  badgeError: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.2)",
  },
  badgePending: { borderColor: "transparent" },
  badgeMissing: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.2)",
  },
  badgeTextSuccess: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: "#22c55e",
  },
  badgeTextError: { fontSize: 10, fontFamily: FontFamily.bold },
  badgeTextPending: { fontSize: 10, fontFamily: FontFamily.bold },
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
