import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "../store/authStore";
import {
  connectSSE,
  disconnectSSE,
  onSSEEvent,
} from "../services/sseManager";

/**
 * Custom hook to manage SSE connection lifecycle.
 * Connects when authenticated, disconnects on logout.
 * Handles app background/foreground transitions.
 */
export function useSSEConnection() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "authenticated") {
      // Connect SSE when authenticated
      connectSSE();

      // Listen for app state changes
      const subscription = AppState.addEventListener(
        "change",
        (nextAppState: AppStateStatus) => {
          if (nextAppState === "active") {
            // Reconnect when app comes to foreground
            connectSSE();
          } else if (nextAppState === "background") {
            // Disconnect when app goes to background (Phase 1)
            disconnectSSE();
          }
        },
      );

      return () => {
        subscription.remove();
        disconnectSSE();
      };
    } else {
      // Disconnect when logged out
      disconnectSSE();
    }
  }, [status]);

  // Example: Listen for connected event
  useEffect(() => {
    const unsubscribe = onSSEEvent("connected", (data) => {
      console.log("[SSE] Rider connected:", data);
    });

    return unsubscribe;
  }, []);
}