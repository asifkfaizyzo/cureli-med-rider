// src/hooks/useIncentivePins.ts (do not remove this comment)

import { useState, useEffect, useCallback } from "react";
import { appStorage } from "../lib/mmkvStorage";

const STORAGE_KEY = "rider_pinned_incentives";

/** Maps period type to a single pinned schedule_id */
type PinMap = Record<string, string>;

function loadPins(): PinMap {
  try {
    const raw = appStorage.getString(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function savePins(pins: PinMap): void {
  appStorage.setString(STORAGE_KEY, JSON.stringify(pins));
}

export function useIncentivePins() {
  const [pins, setPins] = useState<PinMap>(loadPins);

  const togglePin = useCallback(
    (scheduleId: string, periodType: string) => {
      setPins((prev) => {
        const next = { ...prev };
        if (next[periodType] === scheduleId) {
          delete next[periodType];
        } else {
          next[periodType] = scheduleId;
        }
        savePins(next);
        return next;
      });
    },
    [],
  );

  const isPinned = useCallback(
    (scheduleId: string) => Object.values(pins).includes(scheduleId),
    [pins],
  );

  const getPinnedId = useCallback(
    (periodType: string) => pins[periodType] ?? null,
    [pins],
  );

  return { pins, togglePin, isPinned, getPinnedId };
}