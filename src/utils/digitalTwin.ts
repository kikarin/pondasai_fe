import type {
  EarthquakeScenarioView,
  FloodScenarioStatus,
  FloodScenarioView,
} from '../types/scenario';
import type {
  EarthquakeTwinVisual,
  FloodTwinVisual,
  TwinVisualParams,
} from '../types/digitalTwin';
import {
  DIGITAL_TWIN_DISCLAIMER,
  TWIN_EARTHQUAKE_OVERLAY_READY,
  TWIN_FLOOD_OVERLAY_READY,
} from '../types/digitalTwin';

const FLOOD_STATUS_VISUAL: Record<
  FloodScenarioStatus,
  { color: string; opacity: number }
> = {
  aman: { color: '#38bdf8', opacity: 0.35 },
  tergenang_plinth: { color: '#0ea5e9', opacity: 0.55 },
  masuk_lantai: { color: '#0284c7', opacity: 0.75 },
  unknown: { color: '#64748b', opacity: 0.2 },
};

const EQ_BAND_VISUAL: Record<
  'ringan' | 'sedang' | 'berat' | 'unknown',
  { shakeAmplitude: number; tint: string }
> = {
  ringan: { shakeAmplitude: 0.02, tint: '#94a3b8' },
  sedang: { shakeAmplitude: 0.05, tint: '#f59e0b' },
  berat: { shakeAmplitude: 0.1, tint: '#ef4444' },
  unknown: { shakeAmplitude: 0, tint: '#64748b' },
};

export function toFloodTwinVisual(
  view: FloodScenarioView,
  floorElevationCm: number,
  siteBlocked = false,
): FloodTwinVisual {
  const visual = FLOOD_STATUS_VISUAL[view.status];
  const floorElevationM = Math.max(0, floorElevationCm) / 100;
  const waterHeightM = view.scenarioCm / 100;

  return {
    enabled: TWIN_FLOOD_OVERLAY_READY && !siteBlocked && view.scenarioCm > 0,
    waterHeightM,
    floorElevationM,
    status: view.status,
    color: visual.color,
    opacity: visual.opacity,
  };
}

export function toEarthquakeTwinVisual(
  view: EarthquakeScenarioView,
  siteBlocked = false,
): EarthquakeTwinVisual {
  const band = view.impactBand in EQ_BAND_VISUAL ? view.impactBand : 'unknown';
  const visual = EQ_BAND_VISUAL[band];
  const highlightIds = view.structureHighlights
    .filter((item) => item.emphasis === 'focus' || item.emphasis === 'recommended')
    .map((item) => item.id);

  return {
    enabled: TWIN_EARTHQUAKE_OVERLAY_READY && !siteBlocked && band !== 'unknown',
    shakeAmplitude: visual.shakeAmplitude,
    tint: visual.tint,
    highlightIds,
  };
}

export function buildTwinVisualParams(args: {
  floodView: FloodScenarioView;
  earthquakeView: EarthquakeScenarioView;
  floorElevationCm: number;
  siteBlocked?: boolean;
}): TwinVisualParams {
  const siteBlocked = args.siteBlocked ?? false;

  return {
    flood: toFloodTwinVisual(args.floodView, args.floorElevationCm, siteBlocked),
    earthquake: toEarthquakeTwinVisual(args.earthquakeView, siteBlocked),
    disclaimer: DIGITAL_TWIN_DISCLAIMER,
  };
}
