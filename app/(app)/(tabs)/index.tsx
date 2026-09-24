// app/(app)/(tabs)/index.tsx (do not remove this comment)
import { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useTheme } from "../../../src/theme/ThemeContext";
import { useRiderOperationalStore } from "../../../src/store/riderOperationalStore";
import { useAuthStore } from "../../../src/store/authStore";
import { RiderHeader } from "../../../src/components/home/RiderHeader";
import { OnlineMapView } from "../../../src/components/home/OnlineMapView";
import { ChevronButton } from "../../../src/components/home/ChevronButton";
import { HomeBottomSheet } from "../../../src/components/home/HomeBottomSheet";
import { OfflineDashboard } from "../../../src/components/home/OfflineDashboard";

const COLLAPSE_IDLE_MS = 2200;

export default function HomeScreen() {
  const { colors } = useTheme();
  const isOnline = useRiderOperationalStore((state) => state.isOnline);
  const riderType = useAuthStore((state) => state.rider?.rider_type) || "INDEPENDENT";

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const isSheetOpenRef = useRef(false);
  useEffect(() => {
    isSheetOpenRef.current = isSheetOpen;
  }, [isSheetOpen]);

  const isInitialMount = useRef(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const scheduleExpandAfterIdle = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      if (!isSheetOpenRef.current) {
        setHeaderCollapsed(false);
      }
    }, COLLAPSE_IDLE_MS);
  }, []);

  const handleMapInteract = useCallback(() => {
    if (isSheetOpenRef.current) return;

    setHeaderCollapsed((prev) => (prev ? prev : true));
    scheduleExpandAfterIdle();
  }, [scheduleExpandAfterIdle]);

  const handleChevronPress = () => {
    if (!bottomSheetRef.current) return;

    if (!isSheetOpen) {
      bottomSheetRef.current.snapToIndex(0);
      setIsSheetOpen(true);
      setSheetIndex(0);
    } else {
      bottomSheetRef.current.close();
      setIsSheetOpen(false);
      setSheetIndex(-1);
    }
  };

  const handleSnapChange = (index: number) => {
    if (isInitialMount.current) return;

    setSheetIndex(index);
    setIsSheetOpen(index > -1);
  };

  useEffect(() => {
    if (isOnline) {
      isInitialMount.current = true;
      setIsSheetOpen(false);
      setSheetIndex(-1);

      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) {
      setSheetIndex(-1);
      setIsSheetOpen(false);
      return;
    }

    if (sheetIndex > -1) {
      clearIdleTimer();
      setHeaderCollapsed(true);
    } else {
      scheduleExpandAfterIdle();
    }
  }, [sheetIndex, isOnline, scheduleExpandAfterIdle]);

  useEffect(() => {
    return () => clearIdleTimer();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.page }]}>
      <View style={styles.container}>
        <RiderHeader
          collapsed={isOnline ? headerCollapsed : false}
          onRequestExpand={() => setHeaderCollapsed(false)}
          onHelpPress={() => console.log("Help pressed")}
          onSOSPress={() => console.log("SOS pressed")}
          onNotificationsPress={() => console.log("Notifications pressed")}
        />

        {isOnline ? (
          <>
            <View style={styles.mapContainer}>
              <OnlineMapView onUserInteract={handleMapInteract} />
            </View>

            <HomeBottomSheet
              ref={bottomSheetRef}
              onSnapChange={handleSnapChange}
              riderType={riderType}
            />

            <ChevronButton onPress={handleChevronPress} isOpen={isSheetOpen} />
          </>
        ) : (
          <OfflineDashboard />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, position: "relative" },
  mapContainer: { flex: 1, position: "relative" },
});