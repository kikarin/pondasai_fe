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
    tone: 'text-success border-emerald-200 bg-success-soft',
    bar: 'bg-sky-400/80',
  },
  tergenang_plinth: {
    label: 'Elevasi lantai tergenang',
    tone: 'text-warning border-amber-200 bg-warning-soft',
    bar: 'bg-sky-500/85',
  },
  masuk_lantai: {
    label: 'Masuk lantai',
    tone: 'text-danger border-red-200 bg-danger-soft',
    bar: 'bg-sky-600',
  },
  unknown: {
    label: 'Belum dihitung',
    tone: 'text-ink-muted border-border bg-surface-muted',
    bar: 'bg-sky-400/40',
  },
};

const EQ_BAND_META: Record<EarthquakeImpactBand, { label: string; tone: string }> = {
  ringan: {
    label: 'Dampak konsep ringan',
    tone: 'text-success border-emerald-200 bg-success-soft',
  },
  sedang: {
    label: 'Dampak konsep sedang',
    tone: 'text-warning border-amber-200 bg-warning-soft',
  },
  berat: {
    label: 'Dampak konsep berat',
    tone: 'text-danger border-red-200 bg-danger-soft',
  },
  unknown: {
    label: 'Belum dihitung',
    tone: 'text-ink-muted border-border bg-surface-muted',
  },
};

const EMPHASIS_CLASS: Record<StructureEmphasis, string> = {
  focus: 'border-amber-200 bg-amber-50 text-amber-900',
  recommended: 'border-sky-200 bg-sky-50 text-sky-900',
  baseline: 'border-border bg-surface-muted text-ink-secondary',
};

function chipClass(active: boolean, accent: 'sky' | 'amber', disabled: boolean): string {
  if (disabled) {
    return 'border-border bg-surface-muted text-slate-400 cursor-not-allowed opacity-60';
  }
  if (accent === 'sky') {
    return active
      ? 'border-sky-400 bg-sky-50 text-sky-800'
      : 'border-border bg-surface text-ink-muted hover:text-ink hover:border-border-strong';
  }
  return active
    ? 'border-amber-400 bg-amber-50 text-amber-900'
    : 'border-border bg-surface text-ink-muted hover:text-ink hover:border-border-strong';
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
      <div className="relative h-36 rounded-xl border border-border bg-slate-100 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-3 bg-slate-300" title="Tanah" />
        {view.scenarioCm > 0 ? (
          <div
            className={`absolute inset-x-0 bottom-3 transition-all duration-300 ${meta.bar}`}
            style={{ height: `${waterPct}%` }}
            title={`Air skenario ${view.scenarioCm} cm`}
          />
        ) : null}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-3 w-24 border border-slate-400 bg-white/95"
          style={{ height: `${Math.max(floorPct, 12)}%` }}
        >
          <div
            className="absolute inset-x-0 top-0 border-t-2 border-dashed border-violet-500"
            title={`Lantai +${floorCm} cm`}
          />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-8 border border-blue-300 bg-blue-100 rounded-sm" />
        </div>
        <div className="absolute top-2 left-2 text-[10px] text-ink-muted">
          potongan · skala {maxCm} cm
        </div>
        <div className="absolute top-2 right-2 text-[10px] text-violet-700">
          lantai +{floorCm} cm
        </div>
        <div className="absolute bottom-4 left-2 text-[10px] text-sky-800 font-medium">
          air {view.scenarioCm} cm
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.tone}`}>
          {meta.label}
        </span>
        <span className="text-[11px] text-ink-muted">
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
      <div className="rounded-xl border border-border bg-surface-muted p-3 space-y-2 min-h-[120px]">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${band.tone}`}>
            {band.label}
          </span>
          <span className="text-[11px] text-ink-muted">M{view.magnitude}</span>
        </div>
        <p className="text-[12px] text-amber-800">{view.illustrativeIntensity}</p>
        <ul className="space-y-1.5">
          {view.structureHighlights.map((item) => (
            <li
              key={item.id}
              className={`text-[12px] leading-relaxed px-2 py-1.5 rounded-lg border ${EMPHASIS_CLASS[item.emphasis]}`}
            >
              <span className="font-bold uppercase tracking-wider text-[10px] opacity-70 mr-1.5">
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
      className={`rounded-xl border border-border bg-surface p-4 space-y-3 shadow-sm ${
        interactionDisabled ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-sky-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Skenario Banjir
        </h4>
      </div>
      <p className="text-[12px] text-ink-muted">
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
              className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition ${chipClass(
                active,
                'sky',
                interactionDisabled,
              )}`}
            >
              {label}
              {isDefault && !active ? (
                <span className="ml-1 text-[10px] text-slate-400">default</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <FloodCrossSection view={view} floorCm={inputs.floorElevationCm} />
      <ul className="space-y-1">
        {view.reasons.map((reason) => (
          <li key={reason} className="text-[12px] text-ink-secondary leading-relaxed">
            · {reason}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ink-muted leading-relaxed">{FLOOD_SCENARIO_DISCLAIMER}</p>
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
      className={`rounded-xl border border-border bg-surface p-4 space-y-3 shadow-sm ${
        interactionDisabled ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-amber-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Skenario Gempa
        </h4>
      </div>
      <p className="text-[12px] text-ink-muted">
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
              className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition ${chipClass(
                active,
                'amber',
                interactionDisabled,
              )}`}
            >
              M{m}
              {isDefault && !active ? (
                <span className="ml-1 text-[10px] text-slate-400">default</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <StructureHighlightList view={view} />
      <ul className="space-y-1">
        {view.reasons.map((reason) => (
          <li key={reason} className="text-[12px] text-ink-secondary leading-relaxed">
            · {reason}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ink-muted leading-relaxed">{EARTHQUAKE_SCENARIO_DISCLAIMER}</p>
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
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5 shadow-sm">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Skenario Edukasi
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Ilustratif
          </span>
        </div>
        <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
          Diagram edukasi di atas skor InaRISK. Menggeser chip tidak mengubah skor lokasi.
        </p>
      </div>

      {siteBlocked ? (
        <p className="text-[12px] text-amber-800 leading-relaxed border border-amber-200 bg-amber-50 rounded-lg px-3 py-2">
          Lokasi tertutup site guard (laut/air) — chip skenario dinonaktifkan.
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
