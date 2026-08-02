import type { ReactNode } from 'react';
import { Droplets, MapPin, Mountain, TrendingUp, Zap } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';

import { categoryBadgeClass, scoreCategoryFromValue } from '../../utils/riskUi';

function riskTone(level?: string, score?: number) {
  const normalized = (level || '').toLowerCase();
  let category: string | undefined;
  if (normalized.includes('tinggi')) category = 'Tinggi';
  else if (normalized.includes('sedang') || normalized.includes('menengah')) category = 'Sedang';
  else if (normalized.includes('rendah')) category = 'Rendah';
  else if (score != null) category = scoreCategoryFromValue(score);

  const pill = categoryBadgeClass(category);
  const edgeColor =
    category === 'Tinggi'
      ? 'var(--color-danger)'
      : category === 'Sedang'
        ? 'var(--color-warning)'
        : category === 'Rendah'
          ? 'var(--color-success)'
          : undefined;

  return { pill, edge: edgeColor };
}

function MetricCard({
  icon,
  label,
  value,
  toneClass,
  pill,
  edgeColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  toneClass?: string;
  pill?: boolean;
  edgeColor?: string;
}) {
  return (
    <div
      className="bg-surface border border-border rounded-xl px-3.5 py-2.5 flex items-center gap-3 min-w-0 shadow-sm relative overflow-hidden"
      style={edgeColor ? { boxShadow: `inset 0 2px 0 0 ${edgeColor}` } : undefined}
    >
      <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-ink-muted shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">{label}</p>
        {pill ? (
          <span className={`inline-flex mt-0.5 ${toneClass}`}>
            {value}
          </span>
        ) : (
          <p className={`text-sm font-semibold truncate ${toneClass || 'text-ink'}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

export function MetricsStrip() {
  const { siteAnalysis, locationName, coordinates } = usePondasiWorkspace();

  if (!siteAnalysis) return null;

  const flood = siteAnalysis.floodRisk;
  const quake = siteAnalysis.earthquakeRisk;
  const floodTone = riskTone(flood.level, flood.score);
  const quakeTone = riskTone(quake.level, quake.score);
  const place = locationName?.trim() || siteAnalysis.locationName || 'Lokasi';
  const slopeLabel =
    siteAnalysis.slope?.degrees != null
      ? `${siteAnalysis.slope.degrees.toFixed(0)}% · ${siteAnalysis.slope.level}`
      : siteAnalysis.slope?.level || '—';
  const elevationLabel =
    siteAnalysis.elevation?.value != null ? `${Math.round(siteAnalysis.elevation.value)} m` : '—';

  return (
    <section
      id="metrics-strip"
      className="shrink-0 px-5 pt-4 pb-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5"
    >
      <MetricCard
        icon={<MapPin className="w-4 h-4" />}
        label="Lokasi"
        value={place}
        toneClass="text-ink"
      />
      <MetricCard
        icon={<Droplets className="w-4 h-4" />}
        label="Risiko Banjir"
        value={flood.level || (flood.score != null ? String(flood.score) : '—')}
        toneClass={floodTone.pill}
        edgeColor={floodTone.edge}
        pill
      />
      <MetricCard
        icon={<Zap className="w-4 h-4" />}
        label="Risiko Gempa"
        value={quake.level || (quake.score != null ? String(quake.score) : '—')}
        toneClass={quakeTone.pill}
        edgeColor={quakeTone.edge}
        pill
      />
      <MetricCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="Kemiringan"
        value={slopeLabel}
      />
      <MetricCard
        icon={<Mountain className="w-4 h-4" />}
        label="Elevasi"
        value={elevationLabel}
      />
      <span className="sr-only">
        Koordinat {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
      </span>
    </section>
  );
}