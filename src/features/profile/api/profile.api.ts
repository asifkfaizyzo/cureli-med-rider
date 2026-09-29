// cureli-rider-app/src/features/profile/api/profile.api.ts

import { api } from "../../../services/api";

export interface DocumentItem {
  group: string;
  label: string;
  has_back: boolean;
  front_url: string | null;
  back_url: string | null;
}

export interface DocumentsResponse {
  documents: DocumentItem[];
}

export async function fetchRiderDocuments(): Promise<DocumentsResponse> {
  const res = await api.get("/rider/profile/documents");
  return res.data.data;
}