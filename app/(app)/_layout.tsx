//app\(app)\_layout.tsx
import { Stack } from "expo-router";
import { useLocationTracking } from "../../src/hooks/useLocationTracking";
import { useSSEConnection } from "../../src/hooks/useSSEConnection";

export default function AppLayout() {
  // Initialize location tracking
  useLocationTracking();

  // Initialize SSE connection
  useSSEConnection();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}