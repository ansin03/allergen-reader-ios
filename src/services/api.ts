import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Allergen, HistoryItem, ScanResult } from '../types';
import { API_URL } from '../constants';

// ── Token storage (SecureStore with AsyncStorage fallback) ─────────────────────
const TOKEN_KEY = 'as_token';
export async function getToken()          { return SecureStore.getItemAsync(TOKEN_KEY); }
export async function setToken(t: string) { return SecureStore.setItemAsync(TOKEN_KEY, t); }
export async function clearToken()        { return SecureStore.deleteItemAsync(TOKEN_KEY); }

// ── Base fetch wrapper ─────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || 'Request failed');
  return data as T;
}

// ── Health ─────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => request<{ ok: boolean; ts: number }>('/health'),
};

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; hasOnboarded: boolean };
}

export const authApi = {
  login:   (email: string, password: string) =>
    request<AuthResponse>('/auth/login',  { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup:  (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  onboard: () =>
    request<{ ok: boolean }>('/auth/onboard', { method: 'POST' }),
  deleteAccount: () =>
    request<{ ok: boolean }>('/auth/account', { method: 'DELETE' }),
  forgotPassword: (email: string) =>
    request<{ ok: boolean }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
};

// ── Analyze ────────────────────────────────────────────────────────────────────
export const analyzeApi = {
  analyze: (base64Image: string, userAllergens: string[]) =>
    request<ScanResult>('/analyze', { method: 'POST', body: JSON.stringify({ base64Image, userAllergens }) }),
};

// ── Allergens ──────────────────────────────────────────────────────────────────
export const allergensApi = {
  get:    ()                      => request<Allergen[]>('/allergens'),
  update: (allergens: Allergen[]) => request<Allergen[]>('/allergens', { method: 'PUT', body: JSON.stringify({ allergens }) }),
};

// ── History ────────────────────────────────────────────────────────────────────
export const historyApi = {
  get:   ()                  => request<HistoryItem[]>('/history'),
  add:   (item: HistoryItem) => request<{ id: string }>('/history', { method: 'POST', body: JSON.stringify(item) }),
  clear: ()                  => request<{ ok: boolean }>('/history', { method: 'DELETE' }),
};
