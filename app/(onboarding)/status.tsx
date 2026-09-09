// cureli-rider-app/app/(onboarding)/status.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { documentCache } from "../../src/lib/documentCache";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";
import type { OnboardingStatus } from "../../src/types/auth";

const STEP_TO_ROUTE: Record<string, string> = {
  RC_UPLOAD: "/(onboarding)/doc-vehicle-rc",
  DL_UPLOAD: "/(onboarding)/doc-driving-license",
  AADHAAR_UPLOAD: "/(onboarding)/doc-aadhar",
  PAN_UPLOAD: "/(onboarding)/doc-pan",
  LIVE_PHOTO: "/(onboarding)/doc-live-photo",
  PERSONAL_DETAILS: "/(onboarding)/personal-details",
  LOCATION: "/(onboarding)/location",
  VEHICLE_DETAILS: "/(onboarding)/vehicle-details",
};

const DOC_GROUP_TO_STEP: Record<string, string> = {
  VEHICLE_RC: "RC_UPLOAD",
  DRIVING_LICENSE: "DL_UPLOAD",
  AADHAAR: "AADHAAR_UPLOAD",
  PAN: "PAN_UPLOAD",
  PROFILE_PHOTO: "LIVE_PHOTO",
};

export default function StatusScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { rider, updateRider, clearAuth } = useAuthStore();

  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasAutoSubmitted = useRef(false);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch status ─────────────────────────────────────────
  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const result = await onboardingApi.getStatus();
      setStatus(result);

      if (result.status === "ACTIVE") {
        updateRider({
          status: "ACTIVE",
          onboarding_step: "COMPLETED",
          submitted_for_review: true,
        });

        if (pollInterval.current) {
          clearInterval(pollInterval.current);
          pollInterval.current = null;
        }

        if (!result.bank_details?.has_bank_details) {
          router.replace("/(onboarding)/bank-details");
        } else if (!result.terms_accepted) {
          router.replace("/(onboarding)/terms");
        } else {
          router.replace("/(app)/(tabs)/home");
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    async function autoSubmit() {
      if (hasAutoSubmitted.current) return;

      const currentRider = useAuthStore.getState().rider;
      if (
        currentRider &&
        currentRider.onboarding_step === "COMPLETED" &&
        !currentRider.submitted_for_review
      ) {
        hasAutoSubmitted.current = true;
        setSubmitting(true);
        try {
          await onboardingApi.submit();
          updateRider({
            submitted_for_review: true,
            status: "PENDING_REVIEW",
          });
        } catch {
          // Non-fatal
        } finally {
          setSubmitting(false);
        }
      }
    }

    autoSubmit();
    fetchStatus();

    pollInterval.current = setInterval(() => fetchStatus(true), 30000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, []);

  const handleLogout = async () => {
    clearAuth();
    router.replace("/(auth)/login");
  };

  // ── Loading state ────────────────────────────────────────
  if (loading && !status) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.accent} />
          <Text style={[styles.loadingText, { color: colors.text.muted }]}>
            Checking your application status...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!status) return null;

  const isPending = status.status === "PENDING_REVIEW";
  const isRejected = status.status === "REJECTED";
  const isActive = status.status === "ACTIVE";

  // Format helpers
  const formatDob = (dob: string | null) => {
    if (!dob) return "—";
    try {
      const d = new Date(dob);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dob;
    }
  };

  const formatSex = (sex: string | null) => {
    if (!sex) return "—";
    return sex.charAt(0) + sex.slice(1).toLowerCase();
  };

  const formatVehicleType = (t: string | null) => {
    if (!t) return "—";
    return t.charAt(0) + t.slice(1).toLowerCase();
  };

  // Get thumbnail: prefer local cache, fall back to backend URL
  const getDocThumbnail = (
    group: string,
    side: "front" | "back",
    backendUrl: string | null,
  ): string | null => {
    const cached = documentCache.getUri(group, side);
    return cached || backendUrl;
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStatus(false)}
            tintColor={colors.brand.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Application Status
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Review your submitted information below
          </Text>
        </View>

        {/* Submitting */}
        {submitting && (
          <StatusBanner
            iconName="hourglass-empty"
            iconColor={colors.status.info}
            bg={colors.status.infoBg}
            border={colors.status.info}
            title="Submitting Application"
            body="Please wait while we process your submission..."
            colors={colors}
            showSpinner
          />
        )}

        {/* PENDING */}
        {isPending && !submitting && (
          <StatusBanner
            iconName="schedule"
            iconColor={colors.status.warning}
            bg={colors.status.warningBg}
            border={colors.status.warning}
            title="Under Review"
            body="Our team is reviewing your documents. This usually takes 2–4 hours during business hours. Pull down to refresh."
            colors={colors}
          />
        )}

        {/* REJECTED */}
        {isRejected && (
          <StatusBanner
            iconName="error-outline"
            iconColor={colors.status.error}
            bg={colors.status.errorBg}
            border={colors.status.error}
            title="Action Required"
            body="Some documents need to be re-uploaded. Tap 'Fix' on any rejected items below. Your application will resubmit automatically."
            colors={colors}
          />
        )}

        {/* APPROVED */}
        {isActive && (
          <StatusBanner
            iconName="check-circle"
            iconColor={colors.status.success}
            bg={colors.status.successBg}
            border={colors.status.success}
            title="Approved"
            body="Your application has been approved. Redirecting you to complete your setup..."
            colors={colors}
          />
        )}

        {/* ── PERSONAL DETAILS ────────────────── */}
        <SectionCard
          iconName="person-outline"
          title="Personal Details"
          colors={colors}
        >
          <DetailRow
            label="Full Name"
            value={status.personal_details?.full_name || "—"}
            colors={colors}
          />
          <DetailRow
            label="Phone"
            value={rider?.phone || "—"}
            colors={colors}
          />
          <DetailRow
            label="Email"
            value={status.personal_details?.email || "—"}
            colors={colors}
          />
          <DetailRow
            label="Date of Birth"
            value={formatDob(status.personal_details?.date_of_birth || null)}
            colors={colors}
          />
          <DetailRow
            label="Gender"
            value={formatSex(status.personal_details?.sex || null)}
            colors={colors}
            isLast
          />
        </SectionCard>

        {/* ── LOCATION ─────────────────────────── */}
        <SectionCard iconName="place" title="Location" colors={colors}>
          <DetailRow
            label="City"
            value={status.location?.current_city || "—"}
            colors={colors}
          />
          <DetailRow
            label="Address"
            value={status.location?.residential_address || "—"}
            colors={colors}
            isLast
            multiline
          />
        </SectionCard>

        {/* ── VEHICLE ──────────────────────────── */}
        <SectionCard iconName="two-wheeler" title="Vehicle" colors={colors}>
          <DetailRow
            label="Type"
            value={formatVehicleType(
              status.vehicle_details?.vehicle_type || null,
            )}
            colors={colors}
          />
          <DetailRow
            label="Registration"
            value={status.vehicle_details?.vehicle_number || "—"}
            colors={colors}
            mono
          />
          <DetailRow
            label="Make & Model"
            value={status.vehicle_details?.vehicle_make_model || "Not provided"}
            colors={colors}
            isLast
          />
        </SectionCard>

        {/* ── DOCUMENTS ────────────────────────── */}
        <View style={styles.docsSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="folder-open"
              size={18}
              color={colors.text.primary}
            />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Documents
            </Text>
          </View>

          {status.documents.map((doc) => {
            const isDocRejected =
              doc.status === "REJECTED" || doc.was_rejected_this_cycle;
            const isDocApproved = doc.status === "APPROVED";
            const isDocPending =
              doc.status === "PENDING" || doc.status === "UNDER_REVIEW";
            const isDocMissing = doc.status === "NOT_UPLOADED";

            const frontThumb = getDocThumbnail(
              doc.group,
              "front",
              doc.front_url,
            );
            const backThumb = doc.hasBack
              ? getDocThumbnail(doc.group, "back", doc.back_url)
              : null;

            let statusColor = colors.text.muted;
            let statusIcon: keyof typeof MaterialIcons.glyphMap =
              "info-outline";
            let statusText = "Unknown";
            let borderColor = colors.border.default;

            if (isDocApproved) {
              statusColor = colors.status.success;
              statusIcon = "check-circle";
              statusText = "Approved";
              borderColor = colors.status.success;
            } else if (isDocRejected) {
              statusColor = colors.status.error;
              statusIcon = "cancel";
              statusText = "Rejected";
              borderColor = colors.status.error;
            } else if (isDocPending) {
              statusColor = colors.status.warning;
              statusIcon = "schedule";
              statusText = "Pending Review";
              borderColor = colors.border.default;
            } else if (isDocMissing) {
              statusColor = colors.text.faint;
              statusIcon = "upload-file";
              statusText = "Not Uploaded";
              borderColor = colors.border.default;
            }

            return (
              <View
                key={doc.group}
                style={[
                  styles.docCard,
                  {
                    backgroundColor: colors.background.card,
                    borderColor,
                  },
                ]}
              >
                {/* Doc Header */}
                <View style={styles.docHeader}>
                  <View style={styles.docHeaderLeft}>
                    <Text
                      style={[styles.docLabel, { color: colors.text.primary }]}
                    >
                      {doc.label}
                    </Text>
                    <View style={styles.docStatusRow}>
                      <MaterialIcons
                        name={statusIcon}
                        size={13}
                        color={statusColor}
                      />
                      <Text
                        style={[styles.docStatusText, { color: statusColor }]}
                      >
                        {statusText}
                      </Text>
                    </View>
                  </View>

                  {isDocRejected && (
                    <TouchableOpacity
                      style={[
                        styles.fixBtn,
                        { backgroundColor: colors.brand.primary },
                      ]}
                      onPress={() => {
                        const step = DOC_GROUP_TO_STEP[doc.group];
                        const route = step ? STEP_TO_ROUTE[step] : null;
                        if (route) router.replace(route as any);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="edit" size={14} color="#fff" />
                      <Text style={styles.fixBtnText}>Fix</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Thumbnails */}
                {(frontThumb || backThumb) && (
                  <View style={styles.thumbnailRow}>
                    {frontThumb && (
                      <View style={styles.thumbnailWrapper}>
                        <Image
                          source={{ uri: frontThumb }}
                          style={[
                            styles.thumbnail,
                            { borderColor: colors.border.input },
                          ]}
                        />
                        <Text
                          style={[
                            styles.thumbLabel,
                            { color: colors.text.muted },
                          ]}
                        >
                          {doc.hasBack ? "Front" : "Document"}
                        </Text>
                      </View>
                    )}
                    {backThumb && (
                      <View style={styles.thumbnailWrapper}>
                        <Image
                          source={{ uri: backThumb }}
                          style={[
                            styles.thumbnail,
                            { borderColor: colors.border.input },
                          ]}
                        />
                        <Text
                          style={[
                            styles.thumbLabel,
                            { color: colors.text.muted },
                          ]}
                        >
                          Back
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Rejection reason */}
                {isDocRejected && doc.rejection_reason && (
                  <View
                    style={[
                      styles.rejectionBox,
                      {
                        backgroundColor: colors.status.errorBg,
                        borderColor: colors.status.error,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="info"
                      size={14}
                      color={colors.status.error}
                    />
                    <Text
                      style={[
                        styles.rejectionText,
                        { color: colors.status.error },
                      ]}
                    >
                      {doc.rejection_reason}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Error */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.status.errorBg,
                borderColor: colors.status.error,
              },
            ]}
          >
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

        {/* Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                borderColor: colors.border.default,
                backgroundColor: colors.background.card,
              },
            ]}
            onPress={() => fetchStatus(false)}
            disabled={loading || refreshing}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <>
                <MaterialIcons
                  name="refresh"
                  size={18}
                  color={colors.text.primary}
                />
                <Text
                  style={[
                    styles.secondaryBtnText,
                    { color: colors.text.primary },
                  ]}
                >
                  Refresh Status
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="logout"
              size={16}
              color={colors.status.error}
            />
            <Text
              style={[styles.logoutBtnText, { color: colors.status.error }]}
            >
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── SUB-COMPONENTS ──────────────────────────────────────────

interface StatusBannerProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  bg: string;
  border: string;
  title: string;
  body: string;
  colors: any;
  showSpinner?: boolean;
}

function StatusBanner({
  iconName,
  iconColor,
  bg,
  border,
  title,
  body,
  colors,
  showSpinner,
}: StatusBannerProps) {
  return (
    <View
      style={[
        styles.statusBanner,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <View
        style={[
          styles.statusIconWrapper,
          { backgroundColor: colors.background.card },
        ]}
      >
        {showSpinner ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <MaterialIcons name={iconName} size={22} color={iconColor} />
        )}
      </View>
      <View style={styles.statusTextBlock}>
        <Text style={[styles.statusTitle, { color: iconColor }]}>{title}</Text>
        <Text style={[styles.statusBody, { color: colors.text.secondary }]}>
          {body}
        </Text>
      </View>
    </View>
  );
}

interface SectionCardProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
  title: string;
  children: React.ReactNode;
  colors: any;
}

function SectionCard({ iconName, title, children, colors }: SectionCardProps) {
  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.sectionHeader,
          {
            borderBottomColor: colors.border.subtle,
            borderBottomWidth: 1,
            paddingBottom: 10,
            marginBottom: 4,
          },
        ]}
      >
        <MaterialIcons name={iconName} size={18} color={colors.text.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  colors: any;
  isLast?: boolean;
  multiline?: boolean;
  mono?: boolean;
}

function DetailRow({
  label,
  value,
  colors,
  isLast,
  multiline,
  mono,
}: DetailRowProps) {
  return (
    <View
      style={[
        styles.detailRow,
        !isLast && {
          borderBottomColor: colors.border.subtle,
          borderBottomWidth: 1,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: colors.text.muted }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.detailValue,
          { color: colors.text.primary },
          multiline && styles.detailValueMultiline,
          mono && styles.detailValueMono,
        ]}
        numberOfLines={multiline ? 3 : 1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, fontFamily: FontFamily.medium },
  scroll: {
    padding: 20,
    paddingTop: 24,
    gap: 16,
    paddingBottom: 48,
  },
  headerBlock: {
    gap: 4,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },

  // Status banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
  },
  statusIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusTextBlock: {
    flex: 1,
    gap: 4,
  },
  statusTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  statusBody: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
  },

  // Section card (details/location/vehicle)
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },

  // Detail row
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 16,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    flex: 0,
    minWidth: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    textAlign: "right",
  },
  detailValueMultiline: {
    lineHeight: 18,
  },
  detailValueMono: {
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },

  // Documents section
  docsSection: {
    gap: 10,
  },
  docCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  docHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  docHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  docLabel: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  docStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  docStatusText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  fixBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fixBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },

  // Thumbnails
  thumbnailRow: {
    flexDirection: "row",
    gap: 10,
  },
  thumbnailWrapper: {
    gap: 4,
    alignItems: "center",
  },
  thumbnail: {
    width: 90,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  thumbLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Rejection reason
  rejectionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },

  // Actions
  actionSection: {
    gap: 10,
    marginTop: 8,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  logoutBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
});
