import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Droplets, Activity, Play, Square } from 'lucide-react';
import type { RiskEngineResult, StructuralRecommendation } from '../../types';
import type {
  EarthquakeMagnitudeScenario,
  FloodScenarioCm,
  StructureEmphasis,
} from '../../types/scenario';
import {
  buildEarthquakeScenarioInputs,
  buildFloodScenarioInputs,
  EARTHQUAKE_SCENARIO_OPTIONS,
  FLOOD_SCENARIO_OPTIONS,
} from '../../types/scenario';
import { defaultFloodScenarioCm, evaluateFloodScenarioFromInputs } from '../../utils/floodScenario';
import {
  defaultEarthquakeMagnitude,
  evaluateEarthquakeScenarioFromInputs,
} from '../../utils/earthquakeScenario';
import { buildTwinVisualParams } from '../../utils/digitalTwin';
import type { EarthquakeTwinVisual, FloodTwinVisual } from '../../types/digitalTwin';
import {
  DIGITAL_TWIN_DISCLAIMER,
  TWIN_EARTHQUAKE_OVERLAY_READY,
  TWIN_FLOOD_OVERLAY_READY,
} from '../../types/digitalTwin';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';

function chipClass(active: boolean, accent: 'sky' | 'amber', disabled: boolean): string {
  if (disabled) {
    return 'border-border bg-surface-muted text-slate-400 cursor-not-allowed opacity-60';
  }
  if (accent === 'sky') {
    return active
      ? 'border-sky-400 bg-sky-50 text-sky-800'
      : 'border-border bg-surface text-ink-muted hover:text-ink';
  }
  return active
    ? 'border-amber-400 bg-amber-50 text-amber-900'
    : 'border-border bg-surface text-ink-muted hover:text-ink';
}

const EMPHASIS_CLASS: Record<StructureEmphasis, string> = {
  focus: 'border-amber-200 bg-amber-50 text-amber-900',
  recommended: 'border-sky-200 bg-sky-50 text-sky-900',
  baseline: 'border-border bg-surface-muted text-ink-secondary',
};

type DigitalTwinPanelProps = {
  riskEngine: RiskEngineResult;
  recommendations: StructuralRecommendation | null;
  bmkgEventCount?: number | null;
  onFloodVisualChange?: (visual: FloodTwinVisual) => void;
  onEarthquakeVisualChange?: (visual: EarthquakeTwinVisual) => void;
};

export function DigitalTwinPanel({
  riskEngine,
  recommendations,
  bmkgEventCount = null,
  onFloodVisualChange,
  onEarthquakeVisualChange,
}: DigitalTwinPanelProps) {
  const { twinFloodCm, setTwinFloodCm, twinMagnitude, setTwinMagnitude } = usePondasiWorkspace();

  const floodInputs = useMemo(
    () => buildFloodScenarioInputs(riskEngine, recommendations),
    [riskEngine, recommendations],
  );
  const earthquakeInputs = useMemo(
    () => buildEarthquakeScenarioInputs(riskEngine, recommendations, bmkgEventCount),
    [riskEngine, recommendations, bmkgEventCount],
  );

  const defaultFloodCm = useMemo(
    () => defaultFloodScenarioCm(floodInputs.banjirScore, floodInputs.banjirCategory),
    [floodInputs.banjirScore, floodInputs.banjirCategory],
  );
  const defaultEqMag = useMemo(
    () => defaultEarthquakeMagnitude(earthquakeInputs.gempaScore, earthquakeInputs.gempaCategory),
    [earthquakeInputs.gempaScore, earthquakeInputs.gempaCategory],
  );

  const scenarioCm = twinFloodCm ?? defaultFloodCm;
  const magnitude = twinMagnitude ?? defaultEqMag;

  const [isPlaying, setIsPlaying] = useState(false);
  const playIndexRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;
    const floodSteps = FLOOD_SCENARIO_OPTIONS;
    const eqSteps = EARTHQUAKE_SCENARIO_OPTIONS;
    const total = floodSteps.length + eqSteps.length;

    const timer = window.setInterval(() => {
      const i = playIndexRef.current % total;
      if (i < floodSteps.length) {
        setTwinFloodCm(floodSteps[i]);
      } else {
        setTwinMagnitude(eqSteps[i - floodSteps.length]);
      }
      playIndexRef.current += 1;
    }, 900);

    return () => window.clearInterval(timer);
  }, [isPlaying, setTwinFloodCm, setTwinMagnitude]);

  const floodView = useMemo(
    () => evaluateFloodScenarioFromInputs(floodInputs, scenarioCm),
    [floodInputs, scenarioCm],
  );
  const earthquakeView = useMemo(
    () => evaluateEarthquakeScenarioFromInputs(earthquakeInputs, magnitude),
    [earthquakeInputs, magnitude],
  );
  const twinParams = useMemo(
    () =>
      buildTwinVisualParams({
        floodView,
        earthquakeView,
        floorElevationCm: floodInputs.floorElevationCm,
        siteBlocked: floodInputs.siteBlocked,
      }),
    [floodView, earthquakeView, floodInputs.floorElevationCm, floodInputs.siteBlocked],
  );

  useEffect(() => {
    onFloodVisualChange?.(twinParams.flood);
  }, [twinParams.flood, onFloodVisualChange]);

  useEffect(() => {
    onEarthquakeVisualChange?.(twinParams.earthquake);
  }, [twinParams.earthquake, onEarthquakeVisualChange]);

  const siteBlocked = floodInputs.siteBlocked || earthquakeInputs.siteBlocked;
  const floodDisabled = siteBlocked || !TWIN_FLOOD_OVERLAY_READY;
  const eqDisabled = siteBlocked || !TWIN_EARTHQUAKE_OVERLAY_READY;
  const playDisabled = siteBlocked || floodDisabled || eqDisabled;

  const statusLabel =
    floodView.status === 'aman'
      ? 'Aman vs lantai'
      : floodView.status === 'tergenang_plinth'
        ? 'Elevasi lantai tergenang'
        : floodView.status === 'masuk_lantai'
          ? 'Masuk lantai'
          : 'Belum dihitung';

  const bandLabel =
    earthquakeView.impactBand === 'ringan'
      ? 'Dampak konsep ringan'
      : earthquakeView.impactBand === 'sedang'
        ? 'Dampak konsep sedang'
        : earthquakeView.impactBand === 'berat'
          ? 'Dampak konsep berat'
          : 'Belum dihitung';

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Box className="w-4 h-4 text-success" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Disaster Digital Twin
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              Ilustratif
            </span>
          </div>
          <p className="text-[12px] text-ink-muted mt-1 leading-relaxed max-w-xl">
            Overlay 3D ilustratif pada massa rumah. Menggeser kontrol tidak mengubah skor lokasi.
          </p>
        </div>
        <button
          type="button"
          disabled={playDisabled}
          onClick={() => {
            if (playDisabled) return;
            if (!isPlaying) playIndexRef.current = 0;
            setIsPlaying((v) => !v);
          }}
          className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border transition ${
            playDisabled
              ? 'border-border text-slate-400 cursor-not-allowed opacity-50'
              : isPlaying
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-border bg-surface-muted text-ink-secondary hover:text-ink'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? 'Stop' : 'Putar'}
        </button>
      </div>

      {siteBlocked ? (
        <p className="text-[12px] text-amber-800 leading-relaxed border border-amber-200 bg-amber-50 rounded-lg px-3 py-2">
          Lokasi tertutup site guard — twin dinonaktifkan.
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-surface-muted p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Twin Banjir</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {FLOOD_SCENARIO_OPTIONS.map((cm) => {
              const label = cm === 0 ? 'Normal' : `${cm} cm`;
              const active = scenarioCm === cm;
              return (
                <button
                  key={cm}
                  type="button"
                  disabled={floodDisabled}
                  aria-disabled={floodDisabled}
                  onClick={() => {
                    if (!floodDisabled) {
                      setIsPlaying(false);
                      setTwinFloodCm(cm);
                    }
                  }}
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition ${chipClass(
                    active,
                    'sky',
                    floodDisabled,
                  )}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-ink-muted">
            {statusLabel} · air {twinParams.flood.waterHeightM.toFixed(2)} m · plinth{' '}
            {twinParams.flood.floorElevationM.toFixed(2)} m
            {twinParams.flood.enabled ? ' · overlay ON' : ' · overlay OFF'}
          </p>
          <ul className="space-y-1">
            {floodView.reasons.slice(0, 2).map((reason) => (
              <li key={reason} className="text-[12px] text-ink-secondary leading-relaxed">
                · {reason}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface-muted p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Twin Gempa</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {EARTHQUAKE_SCENARIO_OPTIONS.map((m) => {
              const active = magnitude === m;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={eqDisabled}
                  aria-disabled={eqDisabled}
                  onClick={() => {
                    if (!eqDisabled) {
                      setIsPlaying(false);
                      setTwinMagnitude(m);
                    }
                  }}
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition ${chipClass(
                    active,
                    'amber',
                    eqDisabled,
                  )}`}
                >
                  M{m}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-ink-muted">
            {bandLabel} · goyang {twinParams.earthquake.shakeAmplitude.toFixed(2)}
            {twinParams.earthquake.enabled ? ' · shake ON' : ' · shake OFF'}
          </p>
          <ul className="space-y-1.5">
            {earthquakeView.structureHighlights.map((item) => (
              <li
                key={item.id}
                className={`text-[12px] leading-relaxed px-2 py-1 rounded-md border ${EMPHASIS_CLASS[item.emphasis]}`}
              >
                <span className="uppercase tracking-wider text-[10px] opacity-70 mr-1.5">
                  {item.emphasis}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="text-[11px] text-ink-muted leading-relaxed">{DIGITAL_TWIN_DISCLAIMER}</p>
    </div>
  );
}
