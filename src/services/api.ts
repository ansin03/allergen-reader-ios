import AsyncStorage from '@react-native-async-storage/async-storage';
import { Allergen, HistoryItem, ScanResult } from '../types';
import { API_URL } from '../constants';

// ── Token storage ──────────────────────────────────────────────────────────────
export async function getToken()          { return AsyncStorage.getItem('as_token'); }
export async function setToken(t: string) { return AsyncStorage.setItem('as_token', t); }
export async function clearToken()        { return AsyncStorage.removeItem('as_token'); }

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
