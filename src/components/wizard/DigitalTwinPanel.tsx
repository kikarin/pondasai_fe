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
  FLOOD_SCENARIO_DISCLAIMER,
  FLOOD_SCENARIO_OPTIONS,
  EARTHQUAKE_SCENARIO_DISCLAIMER,
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
    return active
      ? 'border-gray-600 bg-[#0A0D15] text-gray-500 cursor-not-allowed opacity-60'
      : 'border-[#23324E] bg-[#0A0D15] text-gray-600 cursor-not-allowed opacity-50';
  }
  if (accent === 'sky') {
    return active
      ? 'border-sky-500/50 bg-sky-500/15 text-sky-200'
      : 'border-[#23324E] bg-[#141A2D] text-gray-400 hover:text-gray-200';
  }
  return active
    ? 'border-amber-500/50 bg-amber-500/15 text-amber-100'
    : 'border-[#23324E] bg-[#141A2D] text-gray-400 hover:text-gray-200';
}

const EMPHASIS_CLASS: Record<StructureEmphasis, string> = {
  focus: 'border-amber-500/50 bg-amber-500/15 text-amber-100',
  recommended: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  baseline: 'border-[#23324E] bg-[#141A2D] text-gray-500',
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
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Box className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Disaster Digital Twin
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Step 8 · Ilustratif
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed max-w-xl">
            Digital Twin ilustratif (overlay 3D pada massa rumah) — berbeda dari{' '}
            <span className="text-gray-400">skenario edukasi</span> di Step 5. Menggeser kontrol{' '}
            <span className="text-gray-400">tidak</span> mengubah skor hazard / overall. Chip tersinkron
            dengan Step 5 via state lokal workspace.
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
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition ${
            playDisabled
              ? 'border-[#23324E] text-gray-600 cursor-not-allowed opacity-50'
              : isPlaying
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-100'
                : 'border-[#23324E] bg-[#141A2D] text-gray-300 hover:text-white'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? 'Stop' : 'Putar'}
        </button>
      </div>

      {siteBlocked ? (
        <p className="text-[10px] text-amber-200/90 leading-relaxed border border-amber-500/25 bg-amber-500/10 rounded-lg px-3 py-2">
          Lokasi tertutup site guard — twin dinonaktifkan. Overlay air & goyang mati; panel bersifat
          advisory saja.
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-[#1F293D] bg-[#0A0D15]/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-400" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Twin Banjir</h4>
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
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${chipClass(
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
          <p className="text-[10px] font-mono text-gray-500">
            {statusLabel} · air {twinParams.flood.waterHeightM.toFixed(2)} m · plinth{' '}
            {twinParams.flood.floorElevationM.toFixed(2)} m
            {twinParams.flood.enabled ? ' · overlay ON' : ' · overlay OFF'}
          </p>
          <ul className="space-y-1">
            {floodView.reasons.slice(0, 2).map((reason) => (
              <li key={reason} className="text-[10px] text-sky-200/70 leading-relaxed">
                · {reason}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-500 leading-relaxed">{FLOOD_SCENARIO_DISCLAIMER}</p>
        </section>

        <section className="rounded-xl border border-[#1F293D] bg-[#0A0D15]/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Twin Gempa</h4>
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
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${chipClass(
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
          <p className="text-[10px] font-mono text-gray-500">
            {bandLabel} · goyang {twinParams.earthquake.shakeAmplitude.toFixed(2)}
            {twinParams.earthquake.enabled ? ' · shake ON' : ' · shake OFF'}
          </p>
          <ul className="space-y-1.5">
            {earthquakeView.structureHighlights.map((item) => (
              <li
                key={item.id}
                className={`text-[10px] leading-relaxed px-2 py-1 rounded-md border ${EMPHASIS_CLASS[item.emphasis]}`}
              >
                <span className="font-mono uppercase tracking-wider text-[9px] opacity-70 mr-1.5">
                  {item.emphasis}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
          <ul className="space-y-1">
            {earthquakeView.reasons.slice(0, 2).map((reason) => (
              <li key={reason} className="text-[10px] text-amber-100/70 leading-relaxed">
                · {reason}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-500 leading-relaxed">{EARTHQUAKE_SCENARIO_DISCLAIMER}</p>
        </section>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed">{DIGITAL_TWIN_DISCLAIMER}</p>
    </div>
  );
}
