import type { EarthquakeImpactBand, FloodScenarioStatus } from './scenario';

export const DIGITAL_TWIN_DISCLAIMER =
  'Disaster Digital Twin ilustratif — dampak visual terhadap massa rumah berdasarkan skor InaRISK + rule skenario V2. Bukan simulasi hidrologi/seismik resmi.';

export const TWIN_FLOOD_OVERLAY_READY = true;
export const TWIN_EARTHQUAKE_OVERLAY_READY = true;
export const TWIN_3D_OVERLAY_READY = TWIN_FLOOD_OVERLAY_READY || TWIN_EARTHQUAKE_OVERLAY_READY;

export interface FloodTwinVisual {
  enabled: boolean;
  waterHeightM: number;
  floorElevationM: number;
  status: FloodScenarioStatus;
  color: string;
  opacity: number;
}

export interface EarthquakeTwinVisual {
  enabled: boolean;
  shakeAmplitude: number;
  tint: string;
  highlightIds: string[];
}

export interface TwinVisualParams {
  flood: FloodTwinVisual;
  earthquake: EarthquakeTwinVisual;
  disclaimer: string;
}

export type EarthquakeTwinBand = Exclude<EarthquakeImpactBand, 'unknown'>;
