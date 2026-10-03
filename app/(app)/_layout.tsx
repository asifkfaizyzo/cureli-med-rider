// app/(app)/_layout.tsx (do not remove this comment)
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Redirect, Stack } from "expo-router";
import {
  BackgroundLocationDisclosure,
  DisclosureType,
} from "../../src/components/BackgroundLocationDisclosure";
import { setLocationDisclosureHandler } from "../../src/services/locationService";
import { useLocationTracking } from "../../src/hooks/useLocationTracking";
import { useSSEConnection } from "../../src/hooks/useSSEConnection";
import { useDeliveryEvents } from "../../src/hooks/useDeliveryEvents";
import { IncomingOrderOverlay } from "../../src/components/delivery/IncomingOrderOverlay";
import { ActiveDeliveryScreen } from "../../src/components/delivery/ActiveDeliveryScreen";
import { DeliveryHydrationGate } from "../../src/components/delivery/DeliveryHydrationGate";
import { useAuthStore } from "../../src/store/authStore";
import { useDeliveryStore } from "../../src/store/deliveryStore";
import { isDeliveryLocked } from "../../src/utils/deliveryStatus";

/**
 * Nested Protected Boundary.
 * Persists hooks and overlays globally across all screens and tabs.
 *
 * ── Navigation lock ──────────────────────────────────────────────────
 * While the rider has an active (accepted, not yet delivered/cancelled)
 * delivery, the (tabs) navigator is not mounted AT ALL — this is a
 * structural guarantee, not a UI overlay sitting on top of it. There is
 * no route in the tree for any navigation action (tab press, router.push
 * from anywhere in the app, a deep link, a notification tap) to land on,
 * so the rider cannot leave ActiveDeliveryScreen by any means while
 * locked. Once the delivery completes/cancels, isDeliveryLocked flips to
 * false and (tabs) mounts fresh at its own default route.
 * ─────────────────────────────────────────────────────────────────────
 */
function ProtectedLayout() {
  // ── Dynamic Location Disclosure State ────────────────────────
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [disclosureType, setDisclosureType] = useState<DisclosureType>("background");
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    setLocationDisclosureHandler((type: DisclosureType) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setDisclosureType(type);
        setShowDisclosure(true);
      });
    });

    return () => setLocationDisclosureHandler(null);
  }, []);

  const handleAccept = useCallback(() => {
    setShowDisclosure(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleDecline = useCallback(() => {
    setShowDisclosure(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);
  // ────────────────────────────────────────────────────────────

  useLocationTracking();
  useSSEConnection();
  useDeliveryEvents();

  const hasSyncedDelivery = useDeliveryStore((s) => s.hasSyncedDelivery);
  const activeDelivery = useDeliveryStore((s) => s.activeDelivery);

  // Fail-closed hydration gate — see DeliveryHydrationGate for rationale.
  if (!hasSyncedDelivery) {
    return (
      <>
        <DeliveryHydrationGate />
        <BackgroundLocationDisclosure
          visible={showDisclosure}
          type={disclosureType}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      </>
    );
  }

  if (isDeliveryLocked(activeDelivery)) {
    return (
      <>
        <ActiveDeliveryScreen />
        <BackgroundLocationDisclosure
          visible={showDisclosure}
          type={disclosureType}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* Global incoming order alert popup */}
      <IncomingOrderOverlay />

      {/* Prominent Location Disclosure Modal (Dynamic FG & BG) */}
      <BackgroundLocationDisclosure
        visible={showDisclosure}
        type={disclosureType}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </>
  );
}

export default function AppLayout() {
  const status = useAuthStore((state) => state.status);
  const rider = useAuthStore((state) => state.rider);

  if (status === "unauthenticated" || !rider) {
    return <Redirect href="/(auth)/login" />;
  }

  if (status === "checking" || status === "unknown") {
    return null;
  }

  return <ProtectedLayout />;
}