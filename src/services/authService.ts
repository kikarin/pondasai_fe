import { ApiError, apiRequest } from './apiClient';

export type UserPlan = 'basic' | 'premium';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: UserPlan;
  canAccessBuildPath: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    return await apiRequest<AuthUser>('/api/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/api/auth/logout', { method: 'POST' });
}
