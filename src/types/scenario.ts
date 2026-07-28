/**
 * Kontrak skenario V2 (view layer).
 * Baca RiskEngineResult + recommendations — jangan hitung ulang skor hazard.
 * @see docs/v2-scenario-contract.md
 */

import type { RiskEngineResult, SiteClass, StructuralRecommendation } from './index';

export type FloodScenarioCm = 0 | 20 | 50 | 100;
export type EarthquakeMagnitudeScenario = 5 | 6 | 7;
export type FloodScenarioStatus = 'aman' | 'tergenang_plinth' | 'masuk_lantai' | 'unknown';
export type EarthquakeImpactBand = 'ringan' | 'sedang' | 'berat' | 'unknown';
export type StructureEmphasis = 'focus' | 'recommended' | 'baseline';

export const FLOOD_SCENARIO_OPTIONS: FloodScenarioCm[] = [0, 20, 50, 100];
export const EARTHQUAKE_SCENARIO_OPTIONS: EarthquakeMagnitudeScenario[] = [5, 6, 7];

export const FLOOD_SCENARIO_DISCLAIMER =
  'Simulasi ilustratif berdasarkan rekomendasi elevasi lantai & skor banjir — bukan prediksi banjir resmi.';

export const EARTHQUAKE_SCENARIO_DISCLAIMER =
  'Skenario edukasi dari skor InaRISK + rule engine — bukan MMI resmi di titik pin.';

export interface FloodScenarioInputs {
  banjirScore: number | null;
  banjirCategory: string | null;
  elevationM: number | null;
  floorElevationCm: number;
  siteClass: SiteClass | string | null;
  gateStatus: string | null;
  coastal: boolean;
  siteBlocked: boolean;
}

export interface EarthquakeScenarioInputs {
  gempaScore: number | null;
  gempaCategory: string | null;
  structureType: string | null;
  foundationType: string | null;
  bmkgEventCount: number | null;
  siteBlocked: boolean;
}

export interface FloodScenarioView {
  scenarioCm: FloodScenarioCm;
  waterAbovePlinthCm: number | null;
  status: FloodScenarioStatus;
  reasons: string[];
  disclaimer: string;
}

export interface StructureHighlight {
  id: string;
  label: string;
  emphasis: StructureEmphasis;
}

export interface EarthquakeScenarioView {
  magnitude: EarthquakeMagnitudeScenario;
  impactBand: EarthquakeImpactBand;
  illustrativeIntensity: string;
  structureHighlights: StructureHighlight[];
  reasons: string[];
  disclaimer: string;
}

export function buildFloodScenarioInputs(
  engine: RiskEngineResult,
  recommendations: StructuralRecommendation | null | undefined,
): FloodScenarioInputs {
  const banjir = engine.hazards.banjir;
  const profile = engine.siteProfile;
  return {
    banjirScore: banjir?.score ?? null,
    banjirCategory: banjir?.category ?? null,
    elevationM: profile?.elevationM ?? null,
    floorElevationCm: recommendations?.floorElevation ?? 0,
    siteClass: profile?.class ?? null,
    gateStatus: profile?.gateStatus ?? null,
    coastal: profile?.coastal ?? false,
    siteBlocked: engine.overall.blocked,
  };
}

export function buildEarthquakeScenarioInputs(
  engine: RiskEngineResult,
  recommendations: StructuralRecommendation | null | undefined,
  bmkgEventCount?: number | null,
): EarthquakeScenarioInputs {
  const gempa = engine.hazards.gempa;
  return {
    gempaScore: gempa?.score ?? null,
    gempaCategory: gempa?.category ?? null,
    structureType: recommendations?.structureType ?? null,
    foundationType: recommendations?.foundationType ?? null,
    bmkgEventCount: bmkgEventCount ?? null,
    siteBlocked: engine.overall.blocked,
  };
}
