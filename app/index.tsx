import { Redirect } from "expo-router";

/**
 * Root entry point.
 * Immediately redirects to /splash which handles:
 *   - Intro check (first-time users)
 *   - Auth check (returning users)
 *   - Onboarding step routing (in-progress users)
 */
export default function Index() {
  return <Redirect href="/splash" />;
}