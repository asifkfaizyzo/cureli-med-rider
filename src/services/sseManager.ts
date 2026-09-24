// src/services/sseManager.ts (do not remove this comment)
import EventSource from "react-native-sse";
import { CONFIG } from "../constants/config";
import { useAuthStore } from "../store/authStore";

// ── Constants ────────────────────────────────────────────────
const MAX_RETRY_DELAY_MS = 30_000; // 30 seconds max backoff
const INITIAL_RETRY_DELAY_MS = 2_000; // 2 seconds initial

// ── State ────────────────────────────────────────────────────
let eventSource: EventSource<never> | null = null;
let retryCount = 0;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;

// ── Event Handlers ───────────────────────────────────────────
type SSEEventHandler = (data: any) => void;

const eventHandlers: Record<string, SSEEventHandler[]> = {};

export function onSSEEvent(eventName: string, handler: SSEEventHandler): () => void {
  if (!eventHandlers[eventName]) {
    eventHandlers[eventName] = [];
  }
  eventHandlers[eventName].push(handler);

  // Return cleanup function
  return () => {
    if (eventHandlers[eventName]) {
      eventHandlers[eventName] = eventHandlers[eventName].filter(
        (h) => h !== handler,
      );
    }
  };
}

function emitEvent(eventName: string, data: any): void {
  if (eventHandlers[eventName]) {
    eventHandlers[eventName].forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[SSE] Handler error for ${eventName}:`, error);
      }
    });
  }
}

// ── Connection Management ────────────────────────────────────

export async function connectSSE(): Promise<void> {
  if (eventSource || isConnecting) {
    console.log("[SSE] Already connected or connecting");
    return;
  }

  const token = useAuthStore.getState().accessToken;
  if (!token) {
    console.warn("[SSE] No access token, cannot connect");
    return;
  }

  isConnecting = true;

  try {
    const url = `${CONFIG.BASE_URL}/rider/sse/stream`;
    
    eventSource = new EventSource(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      pollingInterval: 0, // Disable polling, use pure SSE
    });

    eventSource.addEventListener("open", () => {
      console.log("[SSE] Connection opened");
      retryCount = 0; // Reset retry count on successful connection
      isConnecting = false;
    });

    eventSource.addEventListener("message", (event) => {
      // Default message handler (shouldn't receive these)
      console.log("[SSE] Received default message:", event.data);
    });

    // Custom event listeners — cast to any to bypass strict typing
    const es = eventSource as any;

    es.addEventListener("connected", (event: any) => {
      console.log("[SSE] Connected event:", event.data);
      try {
        const data = JSON.parse(event.data);
        emitEvent("connected", data);
      } catch {
        console.warn("[SSE] Failed to parse connected event");
      }
    });

    es.addEventListener("ping", (event: any) => {
      // Heartbeat — no need to log every ping
      try {
        const data = JSON.parse(event.data);
        emitEvent("ping", data);
      } catch {
        // Ignore parse errors on ping
      }
    });

    // Future event types (Phase 7+)
    es.addEventListener("delivery_assigned", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("delivery_assigned", data);
      } catch (error) {
        console.error("[SSE] Failed to parse delivery_assigned:", error);
      }
    });

    es.addEventListener("delivery_cancelled", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("delivery_cancelled", data);
      } catch (error) {
        console.error("[SSE] Failed to parse delivery_cancelled:", error);
      }
    });

    es.addEventListener("status_changed", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("status_changed", data);
      } catch (error) {
        console.error("[SSE] Failed to parse status_changed:", error);
      }
    });

    es.addEventListener("surge_activated", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("surge_activated", data);
      } catch (error) {
        console.error("[SSE] Failed to parse surge_activated:", error);
      }
    });

    es.addEventListener("incentive_achieved", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("incentive_achieved", data);
      } catch (error) {
        console.error("[SSE] Failed to parse incentive_achieved:", error);
      }
    });

    eventSource.addEventListener("error", (error) => {
      console.error("[SSE] Error event:", error);
      isConnecting = false;
      
      // Attempt reconnect with exponential backoff
      scheduleReconnect();
    });

    es.addEventListener("close", () => {
      console.log("[SSE] Connection closed");
      isConnecting = false;
      eventSource = null;
      
      // Attempt reconnect
      scheduleReconnect();
    });

  } catch (error) {
    console.error("[SSE] Failed to create EventSource:", error);
    isConnecting = false;
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
  }

  // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
  const delay = Math.min(
    INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount),
    MAX_RETRY_DELAY_MS,
  );

  console.log(`[SSE] Reconnecting in ${delay / 1000}s (attempt ${retryCount + 1})`);

  retryTimeout = setTimeout(async () => {
    retryCount++;
    
    // Refresh token before reconnecting (in case it expired)
    const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState();
    
    if (refreshToken) {
      try {
        const response = await fetch(`${CONFIG.BASE_URL}/rider/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        
        const { data } = await response.json();

        if (data?.accessToken) {
          setAccessToken(data.accessToken);
        }
      } catch (error) {
        console.error("[SSE] Token refresh failed before reconnect:", error);
        clearAuth();
        return;
      }
    }

    connectSSE();
  }, delay);
}

export function disconnectSSE(): void {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }

  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  retryCount = 0;
  isConnecting = false;
  console.log("[SSE] Disconnected");
}

export function isSSEConnected(): boolean {
  return eventSource !== null && !isConnecting;
}