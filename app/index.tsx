import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { authApi } from '@/src/features/auth/api/auth.api';
import { MMKV } from 'react-native-mmkv';
import { useTheme } from '@/src/theme/ThemeContext';

const storage = new MMKV();

export default function IndexScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, accessToken, setAuth, clearAuth } = useAuthStore();
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  useEffect(() => {
    async function determineInitialRoute() {
      try {
        // 1. First launch? → Intro
        const hasSeenIntro = storage.getBoolean('has_seen_intro');
        if (!hasSeenIntro) {
          setTargetRoute('/(app)/intro');
          return;
        }

        // 2. No tokens? → Phone auth
        if (!isAuthenticated || !accessToken) {
          setTargetRoute('/(auth)/phone');
          return;
        }

        // 3. Has tokens → validate by calling /me
        try {
          const rider = await authApi.getMe();

          // Update store with fresh profile
          setAuth(rider, accessToken, useAuthStore.getState().refreshToken!);

          // 4. Team Rider → Home
          if (rider.rider_type === 'TEAM') {
            setTargetRoute('/(app)/(tabs)/home');
            return;
          }

          // 5. Independent rider — check status & onboarding progress
          switch (rider.status) {
            case 'ACTIVE':
              if (!rider.has_bank_details) {
                setTargetRoute('/(onboarding)/bank-details');
              } else if (!rider.has_accepted_terms) {
                setTargetRoute('/(onboarding)/terms');
              } else {
                setTargetRoute('/(app)/(tabs)/home');
              }
              break;

            case 'PENDING_REVIEW':
            case 'REJECTED':
              setTargetRoute('/(onboarding)/status');
              break;

            case 'SUSPENDED':
            case 'BLOCKED':
              clearAuth();
              setTargetRoute('/(auth)/phone');
              break;

            default:
              // Incomplete onboarding
              if (!rider.has_personal_details) {
                setTargetRoute('/(onboarding)/personal-details');
              } else if (!rider.has_location) {
                setTargetRoute('/(onboarding)/location');
              } else if (!rider.has_vehicle_details) {
                setTargetRoute('/(onboarding)/vehicle-details');
              } else {
                setTargetRoute('/(onboarding)/personal-details');
              }
              break;
          }
        } catch (err) {
          // Token invalid or network error on auth check → clear and go to phone
          clearAuth();
          setTargetRoute('/(auth)/phone');
        }
      } catch (e) {
        setTargetRoute('/(auth)/phone');
      }
    }

    determineInitialRoute();
  }, [isAuthenticated, accessToken]);

  // Once target route is decided, redirect cleanly
  if (targetRoute) {
    return <Redirect href={targetRoute as any} />;
  }

  // Show loading indicator while auth check is in progress
  return (
    <View style={[styles.container, { backgroundColor: colors?.background?.page || '#090025' }]}>
      <ActivityIndicator size="large" color={colors?.brand?.primary || '#ffffff'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});