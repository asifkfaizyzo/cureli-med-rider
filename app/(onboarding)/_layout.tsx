import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ── Details Section ─────────────────── */}
      <Stack.Screen name="personal-details" />
      <Stack.Screen name="location" />
      <Stack.Screen name="vehicle-details" />

      {/* ── Documents Section (NEW ORDER) ───── */}
      <Stack.Screen name="doc-vehicle-rc" />
      <Stack.Screen name="doc-driving-license" />
      <Stack.Screen name="doc-aadhar" />
      <Stack.Screen name="doc-pan" />
      <Stack.Screen name="doc-live-photo" />

      {/* ── Post-Onboarding ─────────────────── */}
      <Stack.Screen name="status" />
      <Stack.Screen name="bank-details" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}