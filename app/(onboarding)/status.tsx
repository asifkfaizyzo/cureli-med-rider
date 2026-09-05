import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { onboardingApi } from "../../src/features/onboarding/api/onboarding.api";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import type { OnboardingStatus } from "../../src/types/auth";

export default function StatusScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { updateRider } = useAuthStore();

  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const result = await onboardingApi.getStatus();
      setStatus(result);

      // If status changed to ACTIVE, route accordingly
      if (result.status === "ACTIVE") {
        updateRider({ status: "ACTIVE" });
        if (!result.steps.bank_details) {
          router.replace("/(onboarding)/bank-details");
        } else if (!result.steps.terms_accepted) {
          router.replace("/(onboarding)/terms");
        } else {
          router.replace("/(app)/home");
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
    fetchStatus();
    // Auto-refresh every 30s
    const interval = setInterval(() => fetchStatus(true), 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleResubmit() {
    setError(null);
    setLoading(true);
    try {
      await onboardingApi.resubmit();
      await fetchStatus();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? err?.message ?? "Resubmit failed.",
      );
      setLoading(false);
    }
  }

  if (loading && !status) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background.page }]}
      >
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  const isRejected = status?.status === "REJECTED";
  const isPending = status?.status === "PENDING_REVIEW";
  const rejectedDocs =
    status?.documents.filter((d) => d.status === "REJECTED") ?? [];
  const canResubmit = isRejected && rejectedDocs.length === 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background.page }]}
      contentContainerStyle={styles.scroll}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Application Status
      </Text>

      {isPending && (
        <View
          style={[
            styles.statusCard,
            { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
          ]}
        >
          <Text style={styles.statusEmoji}>⏳</Text>
          <Text style={[styles.statusTitle, { color: "#92400e" }]}>
            Under Review
          </Text>
          <Text style={[styles.statusBody, { color: "#a16207" }]}>
            Our team is reviewing your documents. This usually takes 2–4 hours
            during business hours.
          </Text>
        </View>
      )}

      {isRejected && (
        <View
          style={[
            styles.statusCard,
            { backgroundColor: "#fee2e2", borderColor: "#ef4444" },
          ]}
        >
          <Text style={styles.statusEmoji}>❌</Text>
          <Text style={[styles.statusTitle, { color: "#991b1b" }]}>
            Application Rejected
          </Text>
          <Text style={[styles.statusBody, { color: "#b91c1c" }]}>
            Some of your documents were not approved. Please fix the issues
            below and resubmit.
          </Text>
        </View>
      )}

      {/* Document statuses */}
      {status?.documents.map((doc) => (
        <View
          key={doc.group}
          style={[
            styles.docRow,
            {
              backgroundColor: colors.background.card,
              borderColor:
                doc.status === "REJECTED"
                  ? "#ef4444"
                  : doc.status === "APPROVED"
                    ? "#22c55e"
                    : colors.border.default,
            },
          ]}
        >
          <View style={styles.docInfo}>
            <Text style={[styles.docLabel, { color: colors.text.primary }]}>
              {doc.label}
            </Text>
            {doc.status === "REJECTED" && doc.rejection_reason && (
              <Text style={[styles.rejectionNote, { color: "#ef4444" }]}>
                ⚠ {doc.rejection_reason}
              </Text>
            )}
            {doc.status === "PENDING" && (
              <Text style={[styles.docStatus, { color: colors.text.muted }]}>
                Pending review
              </Text>
            )}
            {doc.status === "APPROVED" && (
              <Text style={[styles.docStatus, { color: "#22c55e" }]}>
                ✓ Approved
              </Text>
            )}
            {doc.status === "NOT_UPLOADED" && (
              <Text style={[styles.docStatus, { color: colors.text.faint }]}>
                Not uploaded
              </Text>
            )}
          </View>

          {doc.status === "REJECTED" && (
            <TouchableOpacity
              style={[styles.fixBtn, { backgroundColor: colors.brand.primary }]}
              onPress={() => {
                // Navigate to the specific doc screen
                const routeMap: Record<string, string> = {
                  DRIVING_LICENSE: "/(onboarding)/doc-driving-license",
                  AADHAAR: "/(onboarding)/doc-aadhar",
                  PAN: "/(onboarding)/doc-pan",
                  PROFILE_PHOTO: "/(onboarding)/doc-live-photo",
                  VEHICLE_RC: "/(onboarding)/vehicle-details",
                };
                const route = routeMap[doc.group];
                if (route) router.push(route as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.fixBtnText}>Fix</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {error && (
        <Text style={[styles.errorText, { color: colors.status.error }]}>
          {error}
        </Text>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {isRejected && (
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor: canResubmit
                  ? colors.brand.primary
                  : colors.border.default,
              },
            ]}
            onPress={handleResubmit}
            disabled={!canResubmit || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Resubmit Application</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border.default }]}
          onPress={() => fetchStatus(false)}
          disabled={loading || refreshing}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <Text
              style={[styles.secondaryBtnText, { color: colors.text.primary }]}
            >
              🔄 Refresh Status
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            const { useAuthStore } = require("../../src/store/authStore");
            useAuthStore.getState().clearAuth();
            router.replace("/(auth)/phone");
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutBtnText, { color: colors.status.error }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 24,
    paddingTop: 64,
    gap: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  docInfo: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  docLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  docStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  rejectionNote: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 2,
  },
  fixBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fixBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  actionSection: {
    gap: 12,
    marginTop: 24,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  logoutBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
