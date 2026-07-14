import type { Coordinates } from '../types';

export interface GeocodeResult {
  name: string;
  lat: number;
  lng: number;
  source: string;
  fullAddress?: string;
  adminName?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function readGeocodeError(response: Response): Promise<never> {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { detail?: string };
    throw new Error(parsed.detail || 'Geocode gagal');
  } catch (error) {
    if (error instanceof Error && error.message !== 'Geocode gagal') {
      throw error;
    }
    throw new Error(body || 'Geocode gagal');
  }
}

export async function resolveLocation(query: string): Promise<GeocodeResult> {
  const response = await fetch(`${API_BASE}/api/geocode/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    await readGeocodeError(response);
  }

  return response.json() as Promise<GeocodeResult>;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const response = await fetch(`${API_BASE}/api/geocode/reverse?${params.toString()}`);

  if (!response.ok) {
    await readGeocodeError(response);
  }

  return response.json() as Promise<GeocodeResult>;
}

export function isGoogleMapsUrl(value: string): boolean {
  const lowered = value.toLowerCase();
  return lowered.includes('google.com/maps') || lowered.includes('maps.app.goo.gl') || lowered.includes('goo.gl/maps');
}

export const DEFAULT_MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ||
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export const DEFAULT_CENTER: Coordinates = { lat: -6.2088, lng: 106.8456 };
