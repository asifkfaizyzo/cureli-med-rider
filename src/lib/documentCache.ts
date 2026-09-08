// src/lib/documentCache.ts

import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "rider-doc-cache" });

/**
 * Cache keys follow the pattern: `doc:{type}:{side}`
 * Examples:
 *   doc:DRIVING_LICENSE:front
 *   doc:DRIVING_LICENSE:back
 *   doc:VEHICLE_RC:front
 *   doc:AADHAAR:front
 *   doc:AADHAAR:back
 *   doc:PAN:front
 *   doc:PROFILE_PHOTO:front
 */

export const documentCache = {
  /** Store a local file URI after successful upload */
  setUri(docType: string, side: "front" | "back", uri: string): void {
    storage.set(`doc:${docType}:${side}`, uri);
  },

  /** Retrieve cached local URI */
  getUri(docType: string, side: "front" | "back"): string | null {
    return storage.getString(`doc:${docType}:${side}`) ?? null;
  },

  /** Check if a document has been cached */
  has(docType: string, side: "front" | "back"): boolean {
    return storage.contains(`doc:${docType}:${side}`);
  },

  /** Remove a specific cached document */
  remove(docType: string, side: "front" | "back"): void {
    storage.delete(`doc:${docType}:${side}`);
  },

  /** Clear ALL cached document URIs (call after successful submission) */
  clearAll(): void {
    const keys = storage.getAllKeys();
    for (const key of keys) {
      if (key.startsWith("doc:")) {
        storage.delete(key);
      }
    }
  },

  /** Get all cached document URIs as a map */
  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    const keys = storage.getAllKeys();
    for (const key of keys) {
      if (key.startsWith("doc:")) {
        const uri = storage.getString(key);
        if (uri) result[key] = uri;
      }
    }
    return result;
  },
};