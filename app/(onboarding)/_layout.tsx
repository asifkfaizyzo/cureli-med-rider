import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="personal-details" />
      <Stack.Screen name="location" />
      <Stack.Screen name="vehicle-details" />
      <Stack.Screen name="doc-driving-license" />
      <Stack.Screen name="doc-aadhar" />
      <Stack.Screen name="doc-pan" />
      <Stack.Screen name="doc-live-photo" />
      <Stack.Screen name="submit-review" />
      <Stack.Screen name="status" />
      <Stack.Screen name="bank-details" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}