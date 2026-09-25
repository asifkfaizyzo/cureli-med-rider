// app/(app)/(tabs)/index.tsx (do not remove this comment)

import { Redirect } from "expo-router";

/**
 * Lightweight Route Gateway.
 * Instantly forwards incoming root calls to the semantically 
 * correct home route. Acts as a silent, non-blocking redirect.
 */
export default function TabIndexRedirect() {
  return <Redirect href="/(app)/(tabs)/home" />;
}