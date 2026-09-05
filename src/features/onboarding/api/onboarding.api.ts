import { api } from '../../../services/api';
import type { OnboardingStatus } from '../../../types/auth';

export const onboardingApi = {
  // ── Status ──────────────────────────────────────────────────
  getStatus: async (): Promise<OnboardingStatus> => {
    const { data } = await api.get('/rider/onboarding/status');
    return data.data;
  },

  // ── Personal Details ────────────────────────────────────────
  savePersonalDetails: async (payload: {
    full_name: string;
    email: string;
    date_of_birth: string;
    sex?: string;
  }) => {
    const { data } = await api.put('/rider/onboarding/personal-details', payload);
    return data.data;
  },

  // ── Location ────────────────────────────────────────────────
  saveLocation: async (payload: {
    current_city: string;
    residential_address: string;
    preferred_lat?: number;
    preferred_lng?: number;
    preferred_address?: string;
  }) => {
    const { data } = await api.put('/rider/onboarding/location', payload);
    return data.data;
  },

  // ── Vehicle Details ─────────────────────────────────────────
  saveVehicleDetails: async (payload: {
    vehicle_type: string;
    vehicle_number: string;
    vehicle_make_model?: string;
  }) => {
    const { data } = await api.put('/rider/onboarding/vehicle-details', payload);
    return data.data;
  },

  // ── Document Upload (multipart) ─────────────────────────────
  uploadDocument: async (
    documentType: string,
    isFront: boolean,
    fileUri: string,
    fileName: string,
    mimeType: string,
  ) => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('is_front', String(isFront));
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    const { data } = await api.post(
      '/rider/onboarding/documents/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data.data;
  },

  // ── Get Documents ───────────────────────────────────────────
  getDocuments: async () => {
    const { data } = await api.get('/rider/onboarding/documents');
    return data.data;
  },

  // ── Submit ──────────────────────────────────────────────────
  submit: async () => {
    const { data } = await api.post('/rider/onboarding/submit');
    return data.data;
  },

  // ── Resubmit ────────────────────────────────────────────────
  resubmit: async () => {
    const { data } = await api.post('/rider/onboarding/resubmit');
    return data.data;
  },

  // ── Bank Details ────────────────────────────────────────────
  saveBankDetails: async (payload: {
    bank_account_number: string;
    bank_ifsc: string;
    bank_holder_name: string;
    bank_name: string;
  }) => {
    const { data } = await api.put('/rider/onboarding/bank-details', payload);
    return data.data;
  },

  // ── Accept Terms ────────────────────────────────────────────
  acceptTerms: async () => {
    const { data } = await api.post('/rider/onboarding/accept-terms');
    return data.data;
  },
};