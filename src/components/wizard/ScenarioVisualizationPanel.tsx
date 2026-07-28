/**
 * Simulasi skenario Step 5 — flood (Fase 1) + earthquake (Fase 2).
 * @see docs/v2-scenario-contract.md
 */

import { useMemo } from 'react';
import { Droplets, Activity } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import type {
  EarthquakeImpactBand,
  EarthquakeMagnitudeScenario,
  EarthquakeScenarioInputs,
  EarthquakeScenarioView,
  FloodScenarioCm,
  FloodScenarioInputs,
  FloodScenarioStatus,
  FloodScenarioView,
  StructureEmphasis,
} from '../../types/scenario';
import {
  EARTHQUAKE_SCENARIO_DISCLAIMER,
  EARTHQUAKE_SCENARIO_OPTIONS,
  FLOOD_SCENARIO_DISCLAIMER,
  FLOOD_SCENARIO_OPTIONS,
} from '../../types/scenario';
import {
  defaultFloodScenarioCm,
  evaluateFloodScenarioFromInputs,
} from '../../utils/floodScenario';
import {
  defaultEarthquakeMagnitude,
  evaluateEarthquakeScenarioFromInputs,
} from '../../utils/earthquakeScenario';

const FLOOD_STATUS_META: Record<
  FloodScenarioStatus,
  { label: string; tone: string; bar: string }
> = {
  aman: {
    label: 'Aman vs lantai',
    tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    bar: 'bg-sky-400/70',
  },
  tergenang_plinth: {
    label: 'Elevasi lantai tergenang',
    tone: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    bar: 'bg-sky-400/85',
  },
  masuk_lantai: {
    label: 'Masuk lantai',
    tone: 'text-red-300 border-red-500/40 bg-red-500/10',
    bar: 'bg-sky-500',
  },
  unknown: {
    label: 'Belum dihitung',
    tone: 'text-gray-400 border-[#23324E] bg-[#141A2D]',
    bar: 'bg-sky-500/40',
  },
};

const EQ_BAND_META: Record<EarthquakeImpactBand, { label: string; tone: string }> = {
  ringan: {
    label: 'Dampak konsep ringan',
    tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  },
  sedang: {
    label: 'Dampak konsep sedang',
    tone: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  },
  berat: {
    label: 'Dampak konsep berat',
    tone: 'text-red-300 border-red-500/40 bg-red-500/10',
  },
  unknown: {
    label: 'Belum dihitung',
    tone: 'text-gray-400 border-[#23324E] bg-[#141A2D]',
  },
};

const EMPHASIS_CLASS: Record<StructureEmphasis, string> = {
  focus: 'border-amber-500/50 bg-amber-500/15 text-amber-100',
  recommended: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  baseline: 'border-[#23324E] bg-[#141A2D] text-gray-400',
};

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

function FloodCrossSection({
  view,
  floorCm,
}: {
  view: FloodScenarioView;
  floorCm: number;
}) {
  const maxCm = Math.max(100, floorCm, view.scenarioCm, 1);
  const waterPct = Math.min(100, (view.scenarioCm / maxCm) * 100);
  const floorPct = Math.min(100, (Math.max(floorCm, 8) / maxCm) * 100);
  const meta = FLOOD_STATUS_META[view.status];

  return (
    <div className="space-y-2">
      <div className="relative h-36 rounded-xl border border-[#23324E] bg-[#070A12] overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-3 bg-[#1F293D]" title="Tanah" />
        {view.scenarioCm > 0 ? (
          <div
            className={`absolute inset-x-0 bottom-3 transition-all duration-300 ${meta.bar}`}
            style={{ height: `${waterPct}%` }}
            title={`Air skenario ${view.scenarioCm} cm`}
          />
        ) : null}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-3 w-24 border border-[#4B5563] bg-[#1E293B]/95"
          style={{ height: `${Math.max(floorPct, 12)}%` }}
        >
          <div
            className="absolute inset-x-0 top-0 border-t-2 border-dashed border-violet-400/80"
            title={`Lantai +${floorCm} cm`}
          />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-8 border border-blue-500/40 bg-blue-500/20 rounded-sm" />
        </div>
        <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-500">
          potongan · skala {maxCm} cm
        </div>
        <div className="absolute top-2 right-2 text-[9px] font-mono text-violet-300/80">
          lantai +{floorCm} cm
        </div>
        <div className="absolute bottom-4 left-2 text-[9px] font-mono text-sky-200/80">
          air {view.scenarioCm} cm
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.tone}`}>
          {meta.label}
        </span>
        <span className="text-[10px] font-mono text-gray-500">
          air − lantai = {view.waterAbovePlinthCm == null ? '—' : `${view.waterAbovePlinthCm} cm`}
        </span>
      </div>
    </div>
  );
}

function StructureHighlightList({ view }: { view: EarthquakeScenarioView }) {
  const band = EQ_BAND_META[view.impactBand];
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-[#23324E] bg-[#070A12] p-3 space-y-2 min-h-[120px]">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${band.tone}`}>
            {band.label}
          </span>
          <span className="text-[9px] font-mono text-gray-500">M{view.magnitude}</span>
        </div>
        <p className="text-[10px] text-amber-200/70">{view.illustrativeIntensity}</p>
        <ul className="space-y-1.5">
          {view.structureHighlights.map((item) => (
            <li
              key={item.id}
              className={`text-[10px] leading-relaxed px-2 py-1.5 rounded-lg border ${EMPHASIS_CLASS[item.emphasis]}`}
            >
              <span className="font-bold uppercase tracking-wider text-[9px] opacity-70 mr-1.5">
                {item.emphasis === 'focus'
                  ? 'fokus'
                  : item.emphasis === 'recommended'
                    ? 'saran'
                    : 'dasar'}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FloodScenarioPanel({
  inputs,
  interactionDisabled,
  scenarioCm,
  onScenarioCmChange,
}: {
  inputs: FloodScenarioInputs;
  interactionDisabled: boolean;
  scenarioCm: FloodScenarioCm;
  onScenarioCmChange: (cm: FloodScenarioCm) => void;
}) {
  const initial = useMemo(
    () => defaultFloodScenarioCm(inputs.banjirScore, inputs.banjirCategory),
    [inputs.banjirScore, inputs.banjirCategory],
  );

  const view = useMemo(
    () => evaluateFloodScenarioFromInputs(inputs, scenarioCm),
    [inputs, scenarioCm],
  );

  const floorLabel =
    inputs.floorElevationCm > 0
      ? `Elevasi lantai rekomendasi +${inputs.floorElevationCm} cm`
      : 'Elevasi lantai belum dihitung — simulasi memakai 0 cm';

  return (
    <section
      className={`rounded-xl border border-[#1F293D] bg-[#0A0D15]/50 p-4 space-y-3 ${
        interactionDisabled ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-sky-400" />
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Skenario Banjir
        </h4>
      </div>
      <p className="text-[10px] font-mono text-gray-500">
        Bahaya {inputs.banjirScore ?? '—'} ({inputs.banjirCategory ?? 'n/a'}) · {floorLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        {FLOOD_SCENARIO_OPTIONS.map((cm) => {
          const label = cm === 0 ? 'Normal' : `${cm} cm`;
          const active = scenarioCm === cm;
          const isDefault = initial === cm;
          return (
            <button
              key={cm}
              type="button"
              disabled={interactionDisabled}
              aria-disabled={interactionDisabled}
              onClick={() => {
                if (!interactionDisabled) onScenarioCmChange(cm);
              }}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${chipClass(
                active,
                'sky',
                interactionDisabled,
              )}`}
            >
              {label}
              {isDefault && !active ? (
                <span className="ml-1 text-[9px] text-gray-600">default</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <FloodCrossSection view={view} floorCm={inputs.floorElevationCm} />
      <ul className="space-y-1">
        {view.reasons.map((reason) => (
          <li key={reason} className="text-[10px] text-blue-200/75 leading-relaxed">
            · {reason}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-gray-500 leading-relaxed">{FLOOD_SCENARIO_DISCLAIMER}</p>
    </section>
  );
}

function EarthquakeScenarioPanel({
  inputs,
  interactionDisabled,
  magnitude,
  onMagnitudeChange,
}: {
  inputs: EarthquakeScenarioInputs;
  interactionDisabled: boolean;
  magnitude: EarthquakeMagnitudeScenario;
  onMagnitudeChange: (m: EarthquakeMagnitudeScenario) => void;
}) {
  const initial = useMemo(
    () => defaultEarthquakeMagnitude(inputs.gempaScore, inputs.gempaCategory),
    [inputs.gempaScore, inputs.gempaCategory],
  );

  const view = useMemo(
    () => evaluateEarthquakeScenarioFromInputs(inputs, magnitude),
    [inputs, magnitude],
  );

  return (
    <section
      className={`rounded-xl border border-[#1F293D] bg-[#0A0D15]/50 p-4 space-y-3 ${
        interactionDisabled ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-amber-400" />
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Skenario Gempa
        </h4>
      </div>
      <p className="text-[10px] font-mono text-gray-500">
        Bahaya {inputs.gempaScore ?? '—'} ({inputs.gempaCategory ?? 'n/a'})
        {inputs.structureType ? ` · struktur ${inputs.structureType}` : ' · struktur belum tersedia'}
      </p>
      <div className="flex flex-wrap gap-2">
        {EARTHQUAKE_SCENARIO_OPTIONS.map((m) => {
          const active = magnitude === m;
          const isDefault = initial === m;
          return (
            <button
              key={m}
              type="button"
              disabled={interactionDisabled}
              aria-disabled={interactionDisabled}
              onClick={() => {
                if (!interactionDisabled) onMagnitudeChange(m);
              }}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${chipClass(
                active,
                'amber',
                interactionDisabled,
              )}`}
            >
              M{m}
              {isDefault && !active ? (
                <span className="ml-1 text-[9px] text-gray-600">default</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <StructureHighlightList view={view} />
      <ul className="space-y-1">
        {view.reasons.map((reason) => (
          <li key={reason} className="text-[10px] text-amber-100/70 leading-relaxed">
            · {reason}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-gray-500 leading-relaxed">{EARTHQUAKE_SCENARIO_DISCLAIMER}</p>
    </section>
  );
}

export function ScenarioVisualizationPanel({
  floodInputs,
  earthquakeInputs,
}: {
  floodInputs: FloodScenarioInputs;
  earthquakeInputs: EarthquakeScenarioInputs;
}) {
  const { twinFloodCm, setTwinFloodCm, twinMagnitude, setTwinMagnitude } = usePondasiWorkspace();
  const siteBlocked = floodInputs.siteBlocked || earthquakeInputs.siteBlocked;

  const defaultFlood = useMemo(
    () => defaultFloodScenarioCm(floodInputs.banjirScore, floodInputs.banjirCategory),
    [floodInputs.banjirScore, floodInputs.banjirCategory],
  );
  const defaultEq = useMemo(
    () => defaultEarthquakeMagnitude(earthquakeInputs.gempaScore, earthquakeInputs.gempaCategory),
    [earthquakeInputs.gempaScore, earthquakeInputs.gempaCategory],
  );

  const scenarioCm = twinFloodCm ?? defaultFlood;
  const magnitude = twinMagnitude ?? defaultEq;

  return (
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Skenario Edukasi
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25">
            Step 5
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
          Skenario edukasi (diagram 2D) di atas skor InaRISK — berbeda dari{' '}
          <span className="text-gray-400">Digital Twin ilustratif</span> di Step 8 Preview 3D. Menggeser
          chip <span className="text-gray-400">tidak</span> mengubah skor keseluruhan / kategori hazard.
          Nilai chip tersinkron dengan twin Step 8 (state lokal, bukan skor).
        </p>
      </div>

      {siteBlocked ? (
        <p className="text-[10px] text-amber-200/90 leading-relaxed border border-amber-500/25 bg-amber-500/10 rounded-lg px-3 py-2">
          Lokasi tertutup site guard (laut/air) — chip skenario dinonaktifkan. Tampilan di bawah
          bersifat advisory saja, bukan penilaian layak bangun.
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloodScenarioPanel
          inputs={floodInputs}
          interactionDisabled={siteBlocked}
          scenarioCm={scenarioCm}
          onScenarioCmChange={setTwinFloodCm}
        />
        <EarthquakeScenarioPanel
          inputs={earthquakeInputs}
          interactionDisabled={siteBlocked}
          magnitude={magnitude}
          onMagnitudeChange={setTwinMagnitude}
        />
      </div>
    </div>
  );
}

export const ScenarioVisualizationSkeleton = ScenarioVisualizationPanel;
