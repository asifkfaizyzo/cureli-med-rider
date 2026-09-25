// src/services/sseManager.ts (do not remove this comment)
import EventSource from "react-native-sse";
import { CONFIG } from "../constants/config";
import { useAuthStore } from "../store/authStore";

// ── Constants ────────────────────────────────────────────────
const MAX_RETRY_DELAY_MS = 30_000;
const INITIAL_RETRY_DELAY_MS = 2_000;

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
      pollingInterval: 0,
    });

    eventSource.addEventListener("open", () => {
      retryCount = 0;
      isConnecting = false;
    });

    const es = eventSource as any;

    es.addEventListener("connected", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("connected", data);
      } catch {
        console.warn("[SSE] Failed to parse connected event");
      }
    });

    es.addEventListener("ping", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("ping", data);
      } catch {}
    });

    es.addEventListener("delivery_assigned", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("delivery_assigned", data);
      } catch (error) {
        console.error("[SSE] Failed to parse delivery_assigned:", error);
      }
    });

    es.addEventListener("order_ready_for_pickup", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        emitEvent("order_ready_for_pickup", data);
      } catch (error) {
        console.error("[SSE] Failed to parse order_ready_for_pickup:", error);
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

    eventSource.addEventListener("error", (error) => {
      console.error("[SSE] Error event:", error);
      isConnecting = false;
      scheduleReconnect();
    });

    es.addEventListener("close", () => {
      isConnecting = false;
      eventSource = null;
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

  const delay = Math.min(
    INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount),
    MAX_RETRY_DELAY_MS,
  );

  retryTimeout = setTimeout(async () => {
    retryCount++;
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
      } catch {
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
}

export function isSSEConnected(): boolean {
  return eventSource !== null && !isConnecting;
}