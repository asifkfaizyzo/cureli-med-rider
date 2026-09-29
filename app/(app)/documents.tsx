// app/(app)/documents.tsx (do not remove this comment)

import React, { useCallback, useEffect, useState } from "react";
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
  Share,
  Linking,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";
import { useDialog } from "../../src/components/Dialog/DialogProvider";
import {
  fetchRiderDocuments,
  DocumentItem,
} from "../../src/features/profile/api/profile.api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { alert } = useDialog();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // Full-screen viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLabel, setViewerLabel] = useState("");
  const [sharing, setSharing] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRiderDocuments();
      setDocuments(data.documents);
    } catch (err: any) {
      console.error("[DocumentsScreen] load failed", err);
      await alert({
        title: "Failed to Load",
        message: err?.response?.data?.message || "Could not load documents.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [alert]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const openViewer = (url: string, label: string) => {
    setViewerUrl(url);
    setViewerLabel(label);
    setViewerVisible(true);
  };

  const closeViewer = () => {
    setViewerVisible(false);
    setViewerUrl(null);
  };

  const handleShare = async () => {
    if (!viewerUrl || sharing) return;

    try {
      setSharing(true);
      await Share.share({
        message: `Secure Link to view ${viewerLabel}: ${viewerUrl}`,
        url: viewerUrl, // iOS fallback
      });
    } catch (err) {
      console.error("[DocumentsScreen] share failed", err);
    } finally {
      setSharing(false);
    }
  };

  const handleOpenBrowser = async () => {
    if (!viewerUrl) return;

    try {
      const canOpen = await Linking.canOpenURL(viewerUrl);
      if (canOpen) {
        await Linking.openURL(viewerUrl);
      } else {
        await alert({
          title: "Error",
          message: "Cannot open browser on this device.",
          icon: "error",
        });
      }
    } catch (err) {
      console.error("[DocumentsScreen] browser redirection failed", err);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background.page, paddingTop: insets.top },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          My Documents
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {documents.map((doc) => (
          <DocumentCard
            key={doc.group}
            doc={doc}
            colors={colors}
            onOpenViewer={openViewer}
          />
        ))}
      </ScrollView>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <View style={[styles.viewerContainer, { backgroundColor: "#000" }]}>
          {/* Viewer Header */}
          <View style={[styles.viewerHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={closeViewer}
              style={styles.viewerCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.viewerLabel} numberOfLines={1}>
              {viewerLabel}
            </Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleShare}
                disabled={sharing}
                style={styles.viewerActionBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="share-social-outline" size={24} color="#fff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenBrowser}
                style={styles.viewerActionBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="open-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Zoomable Image */}
          <ScrollView
            style={styles.viewerScroll}
            contentContainerStyle={styles.viewerScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            bouncesZoom={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {viewerUrl && (
              <Image
                source={{ uri: viewerUrl }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── Document Card Component ──────────────────────────────────

function DocumentCard({
  doc,
  colors,
  onOpenViewer,
}: {
  doc: DocumentItem;
  colors: any;
  onOpenViewer: (url: string, label: string) => void;
}) {
  const hasFront = !!doc.front_url;
  const hasBack = doc.has_back && !!doc.back_url;

  const groupIcon = (() => {
    switch (doc.group) {
      case "DRIVING_LICENSE": return "car-outline";
      case "AADHAAR":         return "card-outline";
      case "PAN":             return "document-text-outline";
      case "VEHICLE_RC":      return "bicycle-outline";
      case "PROFILE_PHOTO":   return "person-circle-outline";
      default:                return "document-outline";
    }
  })();

  return (
    <View
      style={[
        styles.docCard,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {/* Card Header */}
      <View style={styles.docHeader}>
        <Ionicons name={groupIcon} size={20} color={colors.brand.primary} />
        <Text style={[styles.docTitle, { color: colors.text.primary }]}>
          {doc.label}
        </Text>
      </View>

      {/* Thumbnails Row */}
      <View style={styles.thumbRow}>
        {hasFront ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenViewer(doc.front_url!, `${doc.label} — Front`)}
            style={styles.thumbContainer}
          >
            <Image
              source={{ uri: doc.front_url! }}
              style={styles.thumbImage}
              resizeMode="cover"
            />
            <View style={styles.thumbOverlay}>
              <Text style={styles.thumbLabel}>
                {doc.has_back ? "Front" : "View"}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.thumbPlaceholder,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons name="image-outline" size={24} color={colors.text.faint} />
            <Text style={[styles.placeholderText, { color: colors.text.faint }]}>
              Not uploaded
            </Text>
          </View>
        )}

        {doc.has_back && (
          hasBack ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onOpenViewer(doc.back_url!, `${doc.label} — Back`)}
              style={styles.thumbContainer}
            >
              <Image
                source={{ uri: doc.back_url! }}
                style={styles.thumbImage}
                resizeMode="cover"
              />
              <View style={styles.thumbOverlay}>
                <Text style={styles.thumbLabel}>Back</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.thumbPlaceholder,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons name="image-outline" size={24} color={colors.text.faint} />
              <Text style={[styles.placeholderText, { color: colors.text.faint }]}>
                Back not uploaded
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    elevation: 2,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  scrollContent: { padding: 16 },

  // Document Card
  docCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  docHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  thumbRow: {
    flexDirection: "row",
    gap: 10,
  },
  thumbContainer: {
    flex: 1,
    aspectRatio: 1.5,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 4,
    alignItems: "center",
  },
  thumbLabel: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  thumbPlaceholder: {
    flex: 1,
    aspectRatio: 1.5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  placeholderText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },

  // Full-Screen Viewer
  viewerContainer: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  viewerCloseBtn: { padding: 4 },
  viewerLabel: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontFamily: FontFamily.bold,
    textAlign: "left",
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  viewerActionBtn: { padding: 4 },
  viewerScroll: {
    flex: 1,
  },
  viewerScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.3,
  },
});