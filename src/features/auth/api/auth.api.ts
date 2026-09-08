//src\features\auth\api\auth.api.ts
import { api } from '../../../services/api';
import type {
  CheckPhoneResponse,
  VerifyOtpResponse,
  LoginResponse,
  SetPasswordResponse,
  RiderProfile,
} from '../../../types/auth';

export const authApi = {
  // ── Check if phone exists ───────────────────────────────────
  checkPhone: async (phone: string): Promise<CheckPhoneResponse> => {
    const raw = phone.replace(/^\+?91/, '');
    const { data } = await api.post('/rider/auth/check-phone', { phone: raw });
    return data.data;
  },

  // ── Send OTP ────────────────────────────────────────────────
  sendOtp: async (phone: string): Promise<{ timeout: number }> => {
    const raw = phone.replace(/^\+?91/, '');
    const { data } = await api.post('/rider/auth/send-otp', { phone: raw });
    return data.data;
  },

  // ── Verify OTP ──────────────────────────────────────────────
  verifyOtp: async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
    const raw = phone.replace(/^\+?91/, '');
    const { data } = await api.post('/rider/auth/verify-otp', { phone: raw, otp });
    return data.data;
  },

  // ── Password login ──────────────────────────────────────────
  login: async (phone: string, password: string): Promise<LoginResponse> => {
    const raw = phone.replace(/^\+?91/, '');
    const { data } = await api.post('/rider/auth/login', { phone: raw, password });
    return data.data;
  },

  // ── Set password (new rider) ────────────────────────────────
  setPassword: async (
    tempToken: string,
    password: string,
  ): Promise<SetPasswordResponse> => {
    const { data } = await api.post('/rider/auth/set-password', {
      temp_token: tempToken,
      password,
    });
    return data.data;
  },

  // ── Refresh token ───────────────────────────────────────────
  refreshToken: async (
    refresh_token: string,
  ): Promise<{ accessToken: string; expiresIn: number }> => {
    const { data } = await api.post('/rider/auth/refresh', { refresh_token });
    return data.data;
  },

  // ── Logout ──────────────────────────────────────────────────
  logout: async (): Promise<void> => {
    await api.post('/rider/auth/logout');
  },

  // ── Get profile ─────────────────────────────────────────────
  getMe: async (): Promise<RiderProfile> => {
    const { data } = await api.get('/rider/auth/me');
    return data.data;
  },
};