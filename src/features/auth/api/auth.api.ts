import { api } from '../../../services/api';
import type {
  CheckPhoneResponse,
  VerifyOtpResponse,
  LoginResponse,
  SetPasswordResponse,
  ResetPasswordResponse,
  RiderProfile,
} from '../../../types/auth';

export type OtpPurpose = "login" | "register" | "reset";

export const authApi = {
  checkPhone: async (phone: string): Promise<CheckPhoneResponse> => {
    const raw = phone.replace(/^\+?91/, '');
    const { data } = await api.post('/rider/auth/check-phone', { phone: raw });
    return data.data;
  },

  sendOtp: async (
    phone: string,
    purpose: OtpPurpose = "register",
  ): Promise<{ timeout: number }> => {
    const raw = phone.replace(/^\+?91/, '');
    const { data } = await api.post('/rider/auth/send-otp', {
      phone: raw,
      purpose,
    });
    return data.data;
  },

  verifyOtp: async (
    phone: string,
    otp: string,
    purpose: OtpPurpose = "register",
  ): Promise<VerifyOtpResponse> => {
    const raw = phone.replace(/^\+?91/, '');
    const { data } = await api.post('/rider/auth/verify-otp', {
      phone: raw,
      otp,
      purpose,
    });
    return data.data;
  },

  login: async (phone: string, password: string): Promise<LoginResponse> => {
    const raw = phone.replace(/^\+?91/, '');
    const { data } = await api.post('/rider/auth/login', {
      phone: raw,
      password,
    });
    return data.data;
  },

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

  resetPassword: async (
    resetToken: string,
    password: string,
  ): Promise<ResetPasswordResponse> => {
    const { data } = await api.post('/rider/auth/reset-password', {
      reset_token: resetToken,
      password,
    });
    return data.data;
  },

  refreshToken: async (
    refresh_token: string,
  ): Promise<{ accessToken: string; expiresIn: number }> => {
    const { data } = await api.post('/rider/auth/refresh', { refresh_token });
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/rider/auth/logout');
  },

  getMe: async (): Promise<RiderProfile> => {
    const { data } = await api.get('/rider/auth/me');
    return data.data;
  },
};