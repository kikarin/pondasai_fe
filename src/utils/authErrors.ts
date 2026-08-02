import { ApiError } from '../services/apiClient';

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  const detail = error.message.toLowerCase();
  if (error.status === 409 || detail.includes('already registered')) {
    return 'Email sudah terdaftar. Silakan masuk.';
  }
  if (error.status === 401 || detail.includes('invalid email') || detail.includes('password')) {
    return 'Email atau password salah.';
  }
  if (error.status === 422) {
    return 'Data tidak valid. Periksa email dan password (min. 8 karakter).';
  }
  return error.message || fallback;
}
