import type { Coordinates } from '../types';
import { apiRequest } from './apiClient';

export interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
  source: string;
  fullAddress?: string;
  adminName?: string;
}

export async function resolveLocation(query: string): Promise<GeocodeResult> {
  return apiRequest<GeocodeResult>('/api/geocode/resolve', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  return apiRequest<GeocodeResult>(`/api/geocode/reverse?${params.toString()}`);
}

export function isGoogleMapsUrl(value: string): boolean {
  const lowered = value.toLowerCase();
  return lowered.includes('google.com/maps') || lowered.includes('maps.app.goo.gl') || lowered.includes('goo.gl/maps');
}

export const DEFAULT_MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ||
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export const DEFAULT_CENTER: Coordinates = { lat: -6.2088, lng: 106.8456 };
