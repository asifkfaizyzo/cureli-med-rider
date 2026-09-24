// src/hooks/useMarkerBitmap.ts (do not remove this comment)
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { captureRef } from "react-native-view-shot";

/**
 * Captures a hidden View into a real bitmap file once (and again whenever
 * `deps` changes, e.g. theme colors). Returns a ref to attach to the
 * hidden template view, and the resulting file `uri` once ready.
 */
export function useMarkerBitmap(deps: React.DependencyList) {
  const viewRef = useRef<View>(null);
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (!viewRef.current) return;
      try {
        const result = await captureRef(viewRef, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        });
        if (!cancelled) setUri(result);
      } catch (err) {
        console.warn("useMarkerBitmap: capture failed", err);
      }
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { viewRef, uri };
}