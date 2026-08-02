import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import {
  ShieldAlert,
  Zap,
  Compass,
  Map as MapIcon,
  Waves,
  ChevronDown,
  ChevronUp,
  History,
  Mountain,
  Flame,
  CloudRain,
  MapPin,
  Copy,
  Check,
  RefreshCw,
  Info,
  Layers,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_MAP_STYLE } from '../../services/geocodeService';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { analyzeRisiko } from '../../services/analysisService';
import { ScenarioVisualizationPanel } from './ScenarioVisualizationPanel';
import { FunnelGate } from './FunnelGate';
import {
  buildEarthquakeScenarioInputs,
  buildFloodScenarioInputs,
} from '../../types/scenario';
import {
  categoryBadgeClass,
  levelBadgeClass,
  scoreBarColorClass,
  scoreTextColorClass,
  SCORE_CATEGORY_HIGH,
  SCORE_CATEGORY_MEDIUM,
} from '../../utils/riskUi';
import {
  elevationIndicatorSubtitle,
  riverIndicatorSubtitle,
} from '../../utils/siteIndicators';
import type {
  BmkgEarthquakeEvent,
  ConfidenceResult,
  DisasterHistory,
  HazardConfidence,
  HazardEntry,
  HazardNarrative,
  HazardRisikoEntry,
  LocationMitigationRecommendation,
  RiskEngineResult,
  RiskFactor,
  RisikoResponse,
  SeverityItem,
  SiteAnalysisData,
  SiteClass,
  SiteProfile,
} from '../../types';

const BMKG_PLACEHOLDER =
  'Tidak ada data gempa BMKG TEWS tercatat dalam radius pengaruh lokasi pin ini.';

const PHYSICAL_INDICATOR_TOOLTIP =
  'Indikator konteks fisik — membantu menjelaskan kondisi lokasi. Tidak mempengaruhi skor risiko keseluruhan (threshold independen dari bobot riwayat banjir lokal §4).';

const HAZARD_BAR_TOOLTIP =
  'Skor hazard resmi InaRISK/BNPB untuk titik pin — tidak diubah oleh riwayat kejadian.';

const HISTORY_LAYER_TOOLTIP =
  'Lapisan bukti riwayat: kejadian banjir/gempa lokal (Gemini) dan aktivitas seismik BMKG TEWS. Masuk skor keseluruhan secara terpisah.';

const INDEKS_VS_RISIKO_TOOLTIP =
  'Indeks BAHAYA = kemungkinan & intensitas ancaman di titik ini (dipakai untuk skor). ' +
  'Indeks RISIKO = bahaya × paparan × kerentanan (penduduk/aset) — bersifat informasi/edukasi ' +
  'wilayah, TIDAK memengaruhi skor kelayakan bangun.';

const BNPB_TIMEOUT_MESSAGE =
  'API referensi (BNPB InaRISK) timeout / tidak merespons. Ini bukan berarti aman — silakan coba lagi.';

const LEGAL_DISCLAIMER =
  'Analisis ini adalah asesmen pra-konstruksi berbasis data publik (BNPB InaRISK, BMKG, spatial) ' +
  'dan bersifat indikatif. Bukan pengganti penyelidikan tanah (soil test), survei geoteknik, ' +
  'atau perizinan resmi (IMB/PBG). Keputusan membangun tetap memerlukan verifikasi ahli bersertifikat.';

const BMKG_CAPABILITY_TOOLTIP =
  'Kapabilitas: hazard ini punya sumber riwayat BMKG. Ini BUKAN status fetch aktual — ' +
  'riwayat BMKG diambil di lapisan bukti terpisah.';

type IconType = typeof ShieldAlert;

const HAZARD_META: Record<string, { label: string; icon: IconType; structural: boolean; domain: string }> = {
  banjir: { label: 'Banjir', icon: ShieldAlert, structural: true, domain: 'hidrologi' },
  gempa: { label: 'Gempa', icon: Zap, structural: true, domain: 'geologi' },
  longsor: { label: 'Tanah Longsor', icon: Mountain, structural: true, domain: 'geologi' },
  gunung_api: { label: 'Gunung Api', icon: Flame, structural: true, domain: 'geologi' },
  tsunami: { label: 'Tsunami', icon: Waves, structural: true, domain: 'hidrologi' },
  cuaca_ekstrem: { label: 'Cuaca Ekstrem', icon: CloudRain, structural: false, domain: 'klimatologi' },
};

const DOMAIN_ORDER = ['geologi', 'hidrologi', 'klimatologi'] as const;
const DOMAIN_LABELS: Record<string, string> = {
  geologi: 'Geologi',
  hidrologi: 'Hidrologi',
  klimatologi: 'Klimatologi',
};

const SITE_CLASS_META: Record<SiteClass, { label: string; tone: 'ok' | 'warn' | 'block' }> = {
  daratan_layak: { label: 'Daratan layak', tone: 'ok' },
  laut: { label: 'Perairan / laut', tone: 'block' },
  inland_water: { label: 'Badan air (sungai/danau)', tone: 'block' },
  hutan: { label: 'Kawasan hutan / lindung', tone: 'warn' },
  lereng_curam: { label: 'Lereng curam', tone: 'warn' },
};

function scoreGaugeColor(value: number): string {
  if (value >= SCORE_CATEGORY_HIGH) return '#ef4444';
  if (value >= SCORE_CATEGORY_MEDIUM) return '#f59e0b';
  return '#10b981';
}

function scoreGaugeTrailColor(value: number): string {
  if (value >= SCORE_CATEGORY_HIGH) return '#fecaca';
  if (value >= SCORE_CATEGORY_MEDIUM) return '#fde68a';
  return '#a7f3d0';
}

function RiskGauge({ score, blocked }: { score: number; blocked?: boolean }) {
  const size = 150;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = blocked ? 0 : Math.min(100, score) / 100;
  const offset = circumference * (1 - pct);
  const color = scoreGaugeColor(score);
  const trail = scoreGaugeTrailColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Indeks Risiko</span>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trail} strokeWidth={stroke} />
          {!blocked && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={color} strokeWidth={stroke}
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {blocked ? (
            <span className="text-lg font-extrabold text-red-400">N/A</span>
          ) : (
            <>
              <span className="text-4xl font-extrabold font-mono" style={{ color }}>{score}</span>
              <span className="text-xs text-ink-muted">/ 100</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniMapPreview({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = new maplibregl.Map({
      container: el,
      style: DEFAULT_MAP_STYLE,
      center: [lng, lat],
      zoom: 15,
      interactive: false,
      attributionControl: false,
    });

    new maplibregl.Marker({ color: '#ef4444' })
      .setLngLat([lng, lat])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-44 rounded-lg overflow-hidden" />;
}

function confidenceToneClass(score: number) {
  const base = 'inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold';
  if (score >= 85) return `${base} text-emerald-800 bg-emerald-100 border-emerald-300`;
  if (score >= 60) return `${base} text-amber-800 bg-amber-100 border-amber-300`;
  return `${base} text-red-800 bg-red-100 border-red-300`;
}

function evidenceLevelBadgeClass(level: string | undefined) {
  const base = 'inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold';
  if (!level || level === 'Tidak ada bukti') {
    return `${base} text-slate-600 bg-slate-100 border-slate-300`;
  }
  if (level === 'Sangat tinggi' || level === 'Tinggi') {
    return `${base} text-red-800 bg-red-100 border-red-300`;
  }
  if (level === 'Sedang') {
    return `${base} text-amber-800 bg-amber-100 border-amber-300`;
  }
  return `${base} text-emerald-800 bg-emerald-100 border-emerald-300`;
}

function HistoryBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{title}</p>
      <p className="text-[12px] text-ink-secondary leading-relaxed">{content}</p>
    </div>
  );
}

function BmkgEventsTable({ events }: { events: BmkgEarthquakeEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-[10px] font-mono text-left">
        <thead>
          <tr className="bg-surface-muted text-ink-muted uppercase tracking-wider">
            <th className="px-2 py-1.5 font-bold">#</th>
            <th className="px-2 py-1.5 font-bold">M</th>
            <th className="px-2 py-1.5 font-bold">Jarak (km)</th>
            <th className="px-2 py-1.5 font-bold">Tanggal</th>
            <th className="px-2 py-1.5 font-bold hidden sm:table-cell">Wilayah</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={`${event.date}-${event.magnitude}-${event.distanceKm}-${index}`} className="border-t border-border">
              <td className="px-2 py-1.5 text-ink-muted">{index + 1}</td>
              <td className="px-2 py-1.5 text-amber-700 font-semibold">{event.magnitude}</td>
              <td className="px-2 py-1.5 text-ink-secondary">{event.distanceKm}</td>
              <td className="px-2 py-1.5 text-ink-secondary whitespace-nowrap">{event.date || '—'}</td>
              <td className="px-2 py-1.5 text-ink-muted hidden sm:table-cell max-w-[800px] truncate" title={event.region}>
                {event.region || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-2 py-1 text-[9px] text-ink-muted border-t border-border">
        Semua event di tabel ini masuk perhitungan skor BMKG.
      </p>
    </div>
  );
}

function EventNoteTable({
  hazard,
  title,
  note,
  events,
  showTitle = true,
}: {
  hazard: 'banjir' | 'gempa';
  title: string;
  note?: string;
  events: { date: string; description: string }[];
  showTitle?: boolean;
}) {
  const hasEvents = events.length > 0;
  const noteText = (note ?? '').trim();
  const noDataText = noteText || (hazard === 'gempa' ? 'Tidak ada riwayat gempa lokal.' : 'Tidak ada riwayat banjir lokal.');

  const Icon = hazard === 'gempa' ? Zap : Waves;
  const accent = hazard === 'gempa' ? 'border-orange-500/40' : 'border-sky-500/40';
  const headerText = 'text-ink-muted';

  const shortKejadian = (desc: string) => {
    const cleaned = desc.replace(/\s+/g, ' ').trim();
    const words = cleaned.split(' ');
    return words.slice(0, 5).join(' ');
  };

  return (
    <div className="space-y-2">
      {showTitle ? (
        <div className={`pb-2 border-b-2 ${accent}`}>
          <p className={`text-[12px] font-extrabold uppercase tracking-widest ${headerText} text-center`}>{title}</p>
        </div>
      ) : null}

      {!hasEvents ? (
        <div className="rounded-xl border border-border bg-surface-muted p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-ink-muted" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">NO DATA</p>
          </div>
          <p className="text-[12px] text-ink-secondary leading-relaxed">{noDataText}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-muted">
          <table className="w-full text-[10px] font-mono text-left">
            <thead>
              <tr className="bg-surface-muted text-ink-muted uppercase tracking-wider">
                <th className="px-2 py-1.5 font-bold w-[34px]">#</th>
                <th className="px-2 py-1.5 font-bold whitespace-nowrap">Tanggal</th>
                {hazard === 'banjir' ? (
                  <th className="px-2 py-1.5 font-bold">Kejadian</th>
                ) : null}
                <th className="px-2 py-1.5 font-bold">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={`${event.date}-${index}`} className="border-t border-border">
                  <td className="px-2 py-1.5 text-ink-muted align-top">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span>{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-ink-secondary whitespace-nowrap align-top">{event.date || '—'}</td>
                  {hazard === 'banjir' ? (
                    <td className="px-2 py-1.5 text-ink-secondary whitespace-nowrap align-top">{shortKejadian(event.description)}</td>
                  ) : null}
                  <td className="px-2 py-1.5 text-ink-secondary leading-relaxed">{event.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CollapsibleHistoryPanel({
  hazard,
  history,
  showBmkg = false,
}: {
  hazard: 'banjir' | 'gempa';
  history: DisasterHistory;
  showBmkg?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lokal' | 'regional'>('lokal');

  const localEventsAll = history.localEvents ?? history.cityEvents ?? [];
  const cityEventsAll = history.cityContextEvents ?? [];
  const localEvents = localEventsAll.filter((event) => event.type === hazard);
  const cityEvents = cityEventsAll.filter((event) => event.type === hazard);
  const localCount = localEvents.length;
  const cityCount = cityEvents.length;
  const bmkgCount = history.bmkgEarthquakes?.length ?? 0;

  const localNote =
    hazard === 'banjir'
      ? history.floodHistoryNoteLocal || history.floodHistoryNote || ''
      : history.earthquakeHistoryNoteLocal || history.earthquakeHistoryNote || '';

  const cityNote =
    hazard === 'banjir'
      ? history.floodHistoryNoteCity || ''
      : history.earthquakeHistoryNoteCity || '';

  const bmkgNote = history.bmkgEarthquakeNote || BMKG_PLACEHOLDER;

  const hasRealContent = Boolean(
    localNote.trim() || cityNote.trim() || localCount > 0 || cityCount > 0,
  );
  if (!showBmkg && !hasRealContent) return null;

  const Icon = hazard === 'gempa' ? Zap : Waves;
  const hazardLabel = hazard === 'gempa' ? 'GEMPA' : 'BANJIR';
  const headerBg = hazard === 'gempa' ? 'bg-orange-600' : 'bg-sky-700';

  const localTitle = `LOKAL (${history.localArea ?? '—'})`;
  const cityTitle = `REGIONAL (${history.city ?? '—'})`;

  useEffect(() => {
    if (open) setActiveTab('lokal');
  }, [open]);

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`w-full flex items-center justify-between gap-2 px-5 py-3 text-left ${headerBg}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-white shrink-0" />
          <span className="text-sm font-extrabold uppercase tracking-wider text-white truncate">{hazardLabel}</span>
        </div>
        <span className="text-white shrink-0" aria-hidden>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open ? (
        <div className="bg-surface p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab('lokal')}
                className={`flex-1 text-[11px] font-bold uppercase tracking-widest rounded-lg px-3 py-2 transition ${
                  activeTab === 'lokal' ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                {localTitle}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('regional')}
                className={`flex-1 text-[11px] font-bold uppercase tracking-widest rounded-lg px-3 py-2 transition ${
                  activeTab === 'regional' ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                {cityTitle}
              </button>
            </div>

            {activeTab === 'lokal' ? (
              <EventNoteTable
                hazard={hazard}
                title={localTitle}
                note={localNote || `Tidak ada riwayat ${hazard} lokal.`}
                events={localEvents}
                showTitle={false}
              />
            ) : (
              <EventNoteTable
                hazard={hazard}
                title={cityTitle}
                note={cityNote || `Tidak ada riwayat ${hazard} regional.`}
                events={cityEvents}
                showTitle={false}
              />
            )}
          </div>

          {showBmkg ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-border bg-surface-muted p-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-ink-muted" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                    BMKG TEWS
                  </p>
                </div>

                {bmkgCount > 0 ? (
                  <div className="mt-2">
                    {history.bmkgEarthquakes?.length ? (
                      <BmkgEventsTable events={history.bmkgEarthquakes} />
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-border bg-surface-muted p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-ink-muted" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                        NO DATA
                      </p>
                    </div>
                    <p className="text-[12px] text-ink-secondary leading-relaxed">{bmkgNote}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RiskProgressBar({
  label,
  value,
  level,
  subtitle,
  icon: Icon,
  history,
  historyBonus,
  bmkgBonus,
  localBonus,
  hazard,
  showBmkg = false,
  physicalIndicator = false,
  hazardOfficial = false,
  evidenceLevel = false,
  indicatorTooltip = PHYSICAL_INDICATOR_TOOLTIP,
}: {
  label: string;
  value: number;
  level?: string;
  subtitle: string;
  icon: IconType;
  history?: DisasterHistory;
  historyBonus?: number;
  bmkgBonus?: number;
  localBonus?: number;
  hazard?: 'banjir' | 'gempa';
  showBmkg?: boolean;
  physicalIndicator?: boolean;
  hazardOfficial?: boolean;
  evidenceLevel?: boolean;
  indicatorTooltip?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="p-5 rounded-xl border border-border bg-surface shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-ink-muted shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</span>
          {physicalIndicator ? (
            <span
              className="text-[10px] font-bold uppercase tracking-wide text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded shrink-0 cursor-help"
              title={indicatorTooltip}
            >
              Indikator
            </span>
          ) : null}
          {hazardOfficial ? (
            <span
              className="text-[10px] font-bold uppercase tracking-wide text-violet-800 bg-violet-100 border border-violet-300 px-2 py-0.5 rounded shrink-0 cursor-help"
              title={HAZARD_BAR_TOOLTIP}
            >
              InaRISK
            </span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <div className="flex items-center gap-2">
            {level ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${evidenceLevel ? evidenceLevelBadgeClass(level) : levelBadgeClass(level as RiskFactor['level'])}`}>
                {level}
              </span>
            ) : null}
            <span className={`text-lg font-bold font-mono ${scoreTextColorClass(clamped)}`}>{clamped}</span>
          </div>
          {hazardOfficial && historyBonus != null && historyBonus > 0 ? (
            <span className="text-[9px] text-ink-muted font-mono text-right leading-snug">
              Bukti riwayat terpisah
              {hazard === 'gempa' && (bmkgBonus != null || localBonus != null) ? (
                <> · BMKG {bmkgBonus ?? 0} · lokal {localBonus ?? 0}</>
              ) : localBonus != null && localBonus > 0 ? (
                <> · lokal {localBonus}</>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>

      <div className="h-2.5 rounded-full bg-surface-muted overflow-hidden border border-border">
        <div
          className={`h-full rounded-full transition-all ${scoreBarColorClass(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <p className="text-xs text-ink-muted leading-relaxed">{subtitle}</p>

      {history && hazard ? (
        <CollapsibleHistoryPanel hazard={hazard} history={history} showBmkg={showBmkg} />
      ) : null}
    </div>
  );
}

function metricValue(
  siteAnalysis: SiteAnalysisData,
  key: keyof NonNullable<SiteAnalysisData['metrics']>,
  fallback: number,
): number {
  const value = siteAnalysis.metrics?.[key];
  return typeof value === 'number' ? value : fallback;
}

function CopyCoords({ lat, lng }: { lat: number; lng: number }) {
  const [copied, setCopied] = useState(false);
  const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const onCopy = useCallback(() => {
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => undefined,
    );
  }, [text]);

  return (
    <button
      type="button"
      onClick={onCopy}
      title="Salin koordinat"
      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-secondary hover:text-ink bg-surface-muted border border-border rounded-lg px-2 py-1 transition"
    >
      <MapPin className="w-3 h-3 text-sky-400" />
      {text}
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-ink-muted" />}
    </button>
  );
}

function SiteClassBadge({ profile }: { profile: SiteProfile }) {
  const meta = SITE_CLASS_META[profile.class] ?? { label: profile.class, tone: 'warn' as const };
  const toneClass =
    meta.tone === 'ok'
      ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
      : meta.tone === 'block'
        ? 'text-red-800 bg-red-100 border-red-300'
        : 'text-amber-800 bg-amber-100 border-amber-300';

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${toneClass}`}>
      {meta.tone === 'ok' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {meta.label}
    </span>
  );
}

function SeverityChips({ severity }: { severity: SeverityItem[] }) {
  const top = severity.filter((item) => HAZARD_META[item.key]?.structural !== false).slice(0, 3);
  if (top.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-ink-muted" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Ancaman Teratas</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {top.map((item, index) => {
          const meta = HAZARD_META[item.key];
          return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${categoryBadgeClass(item.category)}`}
            >
              <span className="text-ink-muted font-mono">#{index + 1}</span>
              {meta?.label ?? item.label}
              <span className="font-mono">{item.score}</span>
            </span>
          );
        })}
      </div>
      <p className="text-[10px] text-ink-muted leading-relaxed">
        Ancaman struktural teratas untuk menentukan kelayakan bangun. Cuaca ekstrem dipisah ke{' '}
        <span className="text-sky-300/90">Pertimbangan Desain &amp; Material</span> (memengaruhi desain, bukan kelayakan lahan).
      </p>
    </div>
  );
}

const HazardBar: FC<{ hazard: HazardEntry; risiko?: HazardRisikoEntry }> = ({ hazard, risiko }) => {
  const meta = HAZARD_META[hazard.key] ?? { label: hazard.key, icon: ShieldAlert, structural: true };
  const Icon = meta.icon;

  if (hazard.fetchStatus !== 'SUCCESS') {
    return (
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">{meta.label}</span>
        </div>
        <p className="text-[11px] text-amber-200/80 leading-relaxed">{BNPB_TIMEOUT_MESSAGE}</p>
      </div>
    );
  }

  const value = Math.min(100, Math.max(0, hazard.score ?? 0));
  return (
    <div className="p-4 rounded-xl border border-border bg-surface shadow-sm space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-ink-muted shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{meta.label}</span>
          {!meta.structural ? (
            <span
              className="text-[8px] font-bold uppercase tracking-wide text-sky-300/90 bg-sky-500/10 border border-sky-500/25 px-1 py-0.5 rounded cursor-help"
              title="Informational — bobot kecil, bukan penentu (floor) skor keseluruhan."
            >
              Info
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hazard.category ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryBadgeClass(hazard.category)}`}>
              {hazard.category}
            </span>
          ) : null}
          <span className={`text-base font-bold font-mono ${scoreTextColorClass(value)}`}>{value}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-surface-muted overflow-hidden border border-border">
        <div className={`h-full rounded-full transition-all ${scoreBarColorClass(value)}`} style={{ width: `${value}%` }} />
      </div>
      {risiko ? (
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border">
          <span className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Indeks Risiko wilayah</span>
          {risiko.fetchStatus === 'SUCCESS' ? (
            <span className="flex items-center gap-1.5">
              {risiko.category ? (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${categoryBadgeClass(risiko.category)}`}>
                  {risiko.category}
                </span>
              ) : null}
              <span className={`text-xs font-bold font-mono ${scoreTextColorClass(risiko.score ?? 0)}`}>{risiko.score}</span>
            </span>
          ) : (
            <span className="text-[9px] font-bold text-amber-400">TIMEOUT</span>
          )}
        </div>
      ) : null}
    </div>
  );
};

function HazardListCard({
  hazards,
  risikoMap,
  showGreen,
  setShowGreen,
}: {
  hazards: HazardEntry[];
  risikoMap?: Record<string, HazardRisikoEntry>;
  showGreen: boolean;
  setShowGreen: (fn: (v: boolean) => boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-4 flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-violet-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Daftar Bahaya
        </h3>
      </div>

      {DOMAIN_ORDER.map((domain) => {
        const inDomain = hazards.filter((h) => (HAZARD_META[h.key]?.domain ?? h.domain) === domain);
        if (inDomain.length === 0) return null;

        const visible = inDomain.filter(
          (h) => h.fetchStatus !== 'SUCCESS' || (h.score ?? 0) > 0,
        );
        const green = inDomain.filter((h) => h.fetchStatus === 'SUCCESS' && (h.score ?? 0) === 0);

        return (
          <div key={domain} className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              {DOMAIN_LABELS[domain] ?? domain}
            </p>
            {visible.length > 0 ? (
              <div className="space-y-3">
                {visible.map((h) => (
                  <HazardBar key={h.key} hazard={h} risiko={risikoMap?.[h.key]} />
                ))}
              </div>
            ) : null}
            {green.length > 0 ? (
              <div className="space-y-2">
                {showGreen ? (
                  <div className="flex flex-wrap gap-2">
                    {green.map((h) => (
                      <span
                        key={h.key}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border text-emerald-800 bg-emerald-100 border-emerald-300"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        {HAZARD_META[h.key]?.label ?? h.key}
                        <span className="font-mono text-emerald-700/90">0 · aman</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-400/70 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" />
                    {green.length} hazard {DOMAIN_LABELS[domain] ?? domain} sudah dicek & aman (skor 0)
                  </p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      {hazards.some((h) => h.fetchStatus === 'SUCCESS' && (h.score ?? 0) === 0) ? (
        <button
          type="button"
          onClick={() => setShowGreen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink-muted hover:text-ink-secondary transition"
        >
          {showGreen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showGreen ? 'Sembunyikan hazard aman' : 'Tampilkan hazard aman (skor 0) yang sudah dicek'}
        </button>
      ) : null}
    </div>
  );
}

function HazardChartCard({
  hazards,
  risikoMap,
}: {
  hazards: HazardEntry[];
  risikoMap?: Record<string, HazardRisikoEntry>;
}) {
  const chartData = hazards
    .filter((h) => h.fetchStatus === 'SUCCESS')
    .map((h) => ({
      name: HAZARD_META[h.key]?.label ?? h.key,
      bahaya: h.score ?? 0,
      risiko: risikoMap?.[h.key]?.score ?? 0,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-4 flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Profil Multi-Hazard (InaRISK)
          </h3>
        </div>
        <span
          className="inline-flex items-center gap-1 text-[10px] text-ink-muted cursor-help"
          title={INDEKS_VS_RISIKO_TOOLTIP}
        >
          <Info className="w-3 h-3" /> Indeks Bahaya vs Risiko
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-amber-400 inline-block" /> Indeks Bahaya
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-red-500 inline-block" /> Indeks Risiko
        </span>
      </div>

      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradBahaya" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradRisiko" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="var(--color-ink-muted, #9ca3af)"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="var(--color-ink-muted, #9ca3af)"
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface, #fff)',
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="bahaya"
              name="Indeks Bahaya"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gradBahaya)"
              dot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="risiko"
              name="Indeks Risiko"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gradRisiko)"
              dot={{ r: 3, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {chartData.map((d) => {
        const bahayaCat = d.bahaya >= 67 ? 'Tinggi' : d.bahaya >= 34 ? 'Sedang' : 'Rendah';
        const risikoCat = d.risiko >= 67 ? 'Tinggi' : d.risiko >= 34 ? 'Sedang' : 'Rendah';
        return (
          <div key={d.name} className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium text-ink-secondary">{d.name}</span>
            <div className="flex items-center gap-3">
              <span className={categoryBadgeClass(bahayaCat)}>{bahayaCat}</span>
              <span className={categoryBadgeClass(risikoCat)}>{risikoCat}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MultiHazardSection({
  engine,
  risikoMap,
}: {
  engine: RiskEngineResult;
  risikoMap?: Record<string, HazardRisikoEntry>;
}) {
  const hazards = Object.values(engine.hazards).filter(
    (h) => HAZARD_META[h.key]?.structural !== false,
  );
  const [showGreen, setShowGreen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <HazardListCard
        hazards={hazards}
        risikoMap={risikoMap}
        showGreen={showGreen}
        setShowGreen={setShowGreen}
      />
      <HazardChartCard hazards={hazards} risikoMap={risikoMap} />
    </div>
  );
}

function DesignConsiderationsSection({ engine }: { engine: RiskEngineResult }) {
  const cuaca = engine.hazards['cuaca_ekstrem'];
  if (!cuaca || cuaca.fetchStatus !== 'SUCCESS') return null;

  const score = Math.min(100, Math.max(0, cuaca.score ?? 0));
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <CloudRain className="w-4 h-4 text-sky-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Pertimbangan Desain &amp; Material
        </h3>
      </div>
      <p className="text-[11px] text-ink-muted leading-relaxed">
        Faktor di bawah memengaruhi <span className="text-ink-muted font-semibold">bagaimana</span> bangunan
        dirancang (atap, material, drainase) — bukan{' '}
        <span className="text-ink-muted font-semibold">apakah</span> lahan aman dibangun. Tidak masuk skor
        kelayakan keseluruhan.
      </p>
      <div className="p-4 rounded-xl border border-border bg-surface-muted space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            <CloudRain className="w-4 h-4 shrink-0" />
            {HAZARD_META['cuaca_ekstrem']?.label ?? 'Cuaca Ekstrem'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {cuaca.category ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryBadgeClass(cuaca.category)}`}>
                {cuaca.category}
              </span>
            ) : null}
            <span className={`text-base font-bold font-mono ${scoreTextColorClass(score)}`}>{score}</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-surface-muted overflow-hidden border border-border">
          <div className={`h-full rounded-full transition-all ${scoreBarColorClass(score)}`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-[10px] text-ink-muted leading-relaxed">
          Intensitas cuaca ekstrem (angin/hujan) InaRISK — arahkan ke pilihan atap tahan angin, sudut kemiringan
          atap, dan sistem drainase, bukan penentu kelayakan lahan.
        </p>
      </div>
    </div>
  );
}

function DataQualityChip({
  active,
  activeDot,
  label,
  title,
  suffix,
}: {
  active: boolean;
  activeDot: string;
  label: string;
  title: string;
  suffix?: string;
}) {

  return (
    <span
      className={`inline-flex items-center gap-1 ${active ? 'text-ink-muted' : 'text-slate-400'} ${suffix ? 'cursor-help' : ''}`}
      title={title}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? activeDot : 'bg-gray-700'}`} />
      {label}
      {suffix}
    </span>
  );
}

function DataQualityDots({ dq }: { dq: HazardConfidence['dataQuality'] }) {
  return (
    <span className="inline-flex items-center gap-2 text-[9px] font-mono">
      <DataQualityChip
        active={dq.bnpb}
        activeDot="bg-emerald-400"
        label="BNPB"
        title={dq.bnpb ? 'BNPB InaRISK: indeks resmi terambil.' : 'BNPB nonaktif — hazard ini tidak dari indeks utama (timeout/fallback).'}
      />
      {dq.bmkgCapable ? (
        <DataQualityChip
          active
          activeDot="bg-sky-400"
          label="BMKG"
          suffix="*"
          title={BMKG_CAPABILITY_TOOLTIP}
        />
      ) : null}
      <DataQualityChip
        active={dq.spatial}
        activeDot="bg-emerald-400"
        label="spatial"
        title={dq.spatial ? 'Data spasial/koordinat tersedia.' : 'Data spasial tidak tersedia.'}
      />
    </span>
  );
}

function ConfidencePanel({ confidence }: { confidence: ConfidenceResult }) {
  const [open, setOpen] = useState(false);
  const perHazard = Object.values(confidence.perHazard);

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-ink-muted shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Keyakinan Data</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceToneClass(confidence.overall)}`}>
            {confidence.overall}% · {confidence.overallLevel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-ink-muted hover:text-ink-secondary shrink-0"
          aria-label="Detail keyakinan data"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-xs text-ink-muted leading-relaxed">{confidence.confidenceReason}</p>

      {open ? (
        <div className="space-y-2 pt-1 border-t border-border">
          {perHazard.map((hc) => (
            <div key={hc.key} className="flex items-center justify-between gap-3 py-1">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-ink-secondary">
                  {HAZARD_META[hc.key]?.label ?? hc.key}
                  <span className="ml-2 text-[9px] font-normal text-ink-muted">{hc.reason}</span>
                </p>
                <DataQualityDots dq={hc.dataQuality} />
              </div>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border shrink-0 ${confidenceToneClass(hc.score)}`}>
                {hc.score}%
              </span>
            </div>
          ))}
          <p className="text-[9px] text-slate-400 leading-relaxed pt-1">
            *BMKG = kapabilitas hazard (bukan status fetch). Riwayat BMKG diambil di lapisan bukti terpisah.
          </p>
        </div>
      ) : null}
    </div>
  );
}

type RisikoState = {
  data: RisikoResponse | null;
  loading: boolean;
  error: string | null;
  generate: () => Promise<void>;
};

const RISIKO_STORAGE_PREFIX = 'pondasi:risiko:';

function risikoStorageKey(projectId: string, coordsKey: string) {
  return `${RISIKO_STORAGE_PREFIX}${projectId}:${coordsKey}`;
}

function loadCachedRisiko(projectId: string, coordsKey: string): RisikoResponse | null {
  if (!projectId || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(risikoStorageKey(projectId, coordsKey));
    return raw ? (JSON.parse(raw) as RisikoResponse) : null;
  } catch {
    return null;
  }
}

function saveCachedRisiko(projectId: string, coordsKey: string, data: RisikoResponse) {
  if (!projectId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(risikoStorageKey(projectId, coordsKey), JSON.stringify(data));
  } catch {
    /* storage penuh / disabled — abaikan, data tetap ada di state */
  }
}

function mergeRisiko(prev: RisikoResponse | null, next: RisikoResponse): RisikoResponse {
  if (!prev) return next;

  const merged: Record<string, HazardRisikoEntry> = { ...next.risiko };
  for (const [key, prevEntry] of Object.entries(prev.risiko)) {
    const nextEntry = merged[key];
    const prevGood = prevEntry.state === 'green' || prevEntry.fetchStatus === 'SUCCESS';
    const nextGood = nextEntry && (nextEntry.state === 'green' || nextEntry.fetchStatus === 'SUCCESS');
    if (prevGood && !nextGood) {
      merged[key] = prevEntry;
    }
  }

  const unavailableCount = Object.values(merged).filter(
    (entry) => entry.state !== 'green' && entry.fetchStatus !== 'SUCCESS',
  ).length;

  return { ...next, risiko: merged, unavailableCount };
}

function useRisiko(projectId: string, coordsKey: string): RisikoState {
  const [data, setData] = useState<RisikoResponse | null>(() => loadCachedRisiko(projectId, coordsKey));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(loadCachedRisiko(projectId, coordsKey));
    setError(null);
  }, [projectId, coordsKey]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRisiko(projectId);
      setData((prev) => {
        const merged = mergeRisiko(prev, result);
        saveCachedRisiko(projectId, coordsKey, merged);
        return merged;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil indeks risiko.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return { data, loading, error, generate };
}

function RisikoPanel({ risiko }: { risiko: RisikoState }) {
  const { data, loading, error, generate } = risiko;

  const allEntries: HazardRisikoEntry[] = data ? Object.values(data.risiko) : [];
  const fetchedEntries = allEntries.filter((entry) => entry.state !== 'green');
  const greenEntries = allEntries.filter((entry) => entry.state === 'green');
  const bahayaUnavailable = data?.bahayaUnavailable ?? [];
  const hasTimeout = (data?.unavailableCount ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-ink-muted shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Indeks Risiko (On-Demand)</h3>
          <span
            className="inline-flex items-center gap-1 text-[10px] text-ink-muted cursor-help"
            title={INDEKS_VS_RISIKO_TOOLTIP}
          >
            <Info className="w-3 h-3" />
          </span>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-60 rounded-lg px-3 py-1.5 transition"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
          {data ? 'Muat Ulang' : 'Generate Risiko'}
        </button>
      </div>

      <p className="text-[11px] text-ink-muted leading-relaxed">
        Card ini menampilkan dua konsep yang berbeda:
      </p>

      <div className="rounded-lg border border-border bg-surface-muted p-3 space-y-2">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex w-2.5 h-2.5 rounded-full bg-sky-400" aria-hidden />
          <p className="text-[11px] leading-relaxed">
            <span className="font-semibold text-ink-secondary">Indeks Bahaya (Hazard Index)</span>: ukuran potensi/kemungkinan ancaman alam
            (intensitas sumber). <span className="font-semibold">Murni melihat bahaya</span> tanpa mempertimbangkan kerentanan
            penduduk/aset dan kapasitas mitigasi daerah.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden />
          <p className="text-[11px] leading-relaxed">
            <span className="font-semibold text-ink-secondary">Indeks Risiko (Risk Index)</span>: hasil gabungan{' '}
            <span className="font-semibold">Bahaya</span> + <span className="font-semibold">Kerentanan</span> (paparan
            penduduk/aset) dan mempertimbangkan <span className="font-semibold">Kapasitas</span> daerah dalam menghadapi bencana.
            Jadi, <span className="font-semibold">hazard tinggi</span> tidak selalu berarti <span className="font-semibold">risk</span> tinggi
            jika kesiagaan/kapasitas sangat baik.
          </p>
        </div>

        <p className="text-[11px] text-ink-muted leading-relaxed">
          Nilai pada card ini bersifat <span className="font-semibold">informasi/edukasi wilayah</span> dan{' '}
          <span className="font-semibold">tidak memengaruhi skor kelayakan bangun</span>.
          {data ? ' Nilai risiko juga ditampilkan berdampingan dengan indeks bahaya pada panel Multi-Hazard di atas.' : ''}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <p className="text-[11px] text-red-300/90 leading-relaxed">{error}</p>
          <button type="button" onClick={generate} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-red-200 hover:text-ink">
            <RefreshCw className="w-3 h-3" /> Coba Lagi
          </button>
        </div>
      ) : null}

      {data ? (
        <div className="space-y-3">
          {hasTimeout ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start justify-between gap-3">
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                {data.unavailableCount} layer risiko timeout — {BNPB_TIMEOUT_MESSAGE}
              </p>
              <button type="button" onClick={generate} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-200 hover:text-ink shrink-0">
                <RefreshCw className="w-3 h-3" /> Coba Lagi
              </button>
            </div>
          ) : null}

          {bahayaUnavailable.length > 0 ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Indeks bahaya belum tersedia untuk:{' '}
                <span className="font-semibold">
                  {bahayaUnavailable.map((key) => HAZARD_META[key]?.label ?? key).join(', ')}
                </span>
                . Risiko tak dihitung dulu — indeks bahaya adalah prioritas. Coba jalankan ulang analisis site.
              </p>
            </div>
          ) : null}

          {fetchedEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fetchedEntries.map((entry) => {
                const meta = HAZARD_META[entry.key];
                const Icon = meta?.icon ?? Layers;
                const unavailable = entry.fetchStatus !== 'SUCCESS';
                return (
                  <div key={entry.key} className="p-3 rounded-lg border border-border bg-surface-muted space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted min-w-0">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {meta?.label ?? entry.label}
                      </span>
                      {unavailable ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          TIMEOUT
                        </span>
                      ) : (
                        <span className={`text-sm font-bold font-mono ${scoreTextColorClass(entry.score ?? 0)}`}>
                          {entry.score}
                        </span>
                      )}
                    </div>
                    {!unavailable && entry.category ? (
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${categoryBadgeClass(entry.category)}`}>
                        {entry.category}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {greenEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {greenEntries.map((entry) => {
                const meta = HAZARD_META[entry.key];
                return (
                  <span
                    key={entry.key}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border text-emerald-800 bg-emerald-100 border-emerald-300"
                    title="Indeks bahaya hijau (0) → risiko wilayah 0 tanpa perlu tembak layer (§8.7)."
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    {meta?.label ?? entry.label}
                    <span className="font-mono text-emerald-700/90">risiko 0 · bahaya hijau</span>
                  </span>
                );
              })}
            </div>
          ) : null}

          {fetchedEntries.length === 0 && greenEntries.length === 0 && bahayaUnavailable.length === 0 ? (
            <p className="text-[11px] text-ink-muted">Tidak ada indeks bahaya aktif untuk dihitung risikonya.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const HazardNarrativeBlock: FC<{ hazardKey: string; narrative: HazardNarrative }> = ({
  hazardKey,
  narrative,
}) => {
  const [open, setOpen] = useState(false);
  const meta = HAZARD_META[hazardKey];
  const Icon = meta?.icon ?? History;
  const label = meta?.label ?? hazardKey;
  const count = narrative.events?.length ?? 0;

  return (
    <div className="pt-1 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-2 py-1 text-left group"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted group-hover:text-ink-secondary">
          <Icon className="w-3.5 h-3.5 shrink-0" />
          Riwayat {label}
          <span className="font-mono normal-case tracking-normal text-ink-muted">
            · narasi · {count} kejadian
          </span>
        </span>
        <span className="text-ink-muted shrink-0" aria-hidden>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open ? (
        <div className="mt-2 space-y-2 pl-0.5">
          {narrative.volcano ? (
            <p className="text-[10px] font-mono text-orange-300/80">
              Gunung terdekat: {narrative.volcano}
            </p>
          ) : null}
          <EventNoteTable
            title="Narasi / konteks (tidak menambah skor)"
            note={narrative.note || `Tidak ada riwayat ${label.toLowerCase()} yang tercatat.`}
            events={narrative.events ?? []}
          />
        </div>
      ) : null}
    </div>
  );
};

function LocationMitigationPanel({ items }: { items: LocationMitigationRecommendation[] }) {
  if (items.length === 0) return null;

  const structural = items.filter((item) => !item.informational);
  const informational = items.filter((item) => item.informational);
  const ordered = [...structural, ...informational];

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Mitigasi Lokasi
        </h3>
      </div>
      <p className="text-[11px] text-ink-muted leading-relaxed">
        Saran mitigasi dari Risk Engine untuk titik pin —{' '}
        <span className="text-ink-muted font-semibold">bukan</span> rekomendasi denah/struktur desain
        (itu muncul setelah konsep rumah).
      </p>
      <ul className="space-y-3">
        {ordered.map((item) => {
          const hazardLabel = HAZARD_META[item.sourceHazard]?.label ?? item.sourceHazard;
          return (
            <li
              key={`${item.priority}-${item.sourceHazard}-${item.title}`}
              className="rounded-xl border border-border bg-surface-muted p-4 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-ink-muted">#{item.priority}</span>
                <span className="text-sm font-bold text-ink">{item.title}</span>
                {item.informational ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded">
                    Info
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                    Mitigasi
                  </span>
                )}
                <span className="text-[10px] text-ink-muted">{hazardLabel}</span>
              </div>
              <p className="text-[12px] text-ink-secondary leading-relaxed">{item.description}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DisasterHistoryPanel({
  history,
  floodScore,
}: {
  history: DisasterHistory;
  floodScore: number;
}) {
  const narratives = history.hazardNarratives ?? {};
  const narrativeKeys = Object.keys(narratives);
  const showBanjir = floodScore > 0;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-orange-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Riwayat Kejadian (Lapisan Bukti)
        </h3>
      </div>
      <p className="text-[11px] text-ink-muted leading-relaxed">
        Riwayat bersifat <span className="text-ink-muted font-semibold">konteks regional</span>{' '}
        (kelurahan/kecamatan, kota/kabupaten, dan BMKG TEWS) — belum tentu tepat di titik pin. Masuk skor
        keseluruhan lewat lapisan <span className="text-orange-700 font-semibold">Bukti Riwayat</span>, terpisah dari
        hazard resmi InaRISK.
      </p>
      <div className="space-y-2">
        <CollapsibleHistoryPanel hazard="gempa" history={history} showBmkg />
        {showBanjir ? <CollapsibleHistoryPanel hazard="banjir" history={history} /> : null}
      </div>

      {narrativeKeys.length > 0 ? (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] text-ink-muted leading-relaxed">
            Riwayat hazard lain di bawah bersifat <span className="text-ink-muted font-semibold">narasi/konteks</span>{' '}
            (hasil riset Gemini) dan <span className="text-ink-muted font-semibold">tidak menambah skor</span> —
            hanya muncul untuk hazard dengan indeks bahaya &gt; 0.
          </p>
          {narrativeKeys.map((key) => (
            <HazardNarrativeBlock key={key} hazardKey={key} narrative={narratives[key]} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SiteAnalysisStep() {
  const {
    siteAnalysis,
    projectId,
    recommendations,
    analysisError,
    isPending,
    runSiteAnalysis,
    buildPathUnlocked,
    unlockBuildPath,
    coordinates,
  } = usePondasiWorkspace();
  const coordsKey = `${Math.round(coordinates.lat * 100000)}:${Math.round(coordinates.lng * 100000)}`;
  const risiko = useRisiko(projectId, coordsKey);

  const handleContinue = useCallback(() => {
    unlockBuildPath();
  }, [unlockBuildPath]);

  if (!siteAnalysis) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-lg mx-auto rounded-2xl border border-border bg-surface shadow-sm p-6 space-y-4 text-center">
          <h2 className="text-xl font-bold text-ink">Analisis risiko lokasi</h2>
          {isPending ? (
            <p className="text-sm text-ink-muted">Menunggu hasil analisis situs…</p>
          ) : (
            <>
              <p className="text-sm text-ink-muted leading-relaxed">
                {analysisError ||
                  'Hasil risiko belum tersedia. Jalankan ulang analisis untuk lokasi yang dipilih.'}
              </p>
              <button
                type="button"
                onClick={() => void runSiteAnalysis()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-accent hover:bg-blue-600 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Jalankan analisis risiko
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const history = siteAnalysis.disasterHistory;
  const overall = siteAnalysis.overallRiskScore;
  const suitability = siteAnalysis.buildSuitability;
  const engine = siteAnalysis.riskEngine;
  const profile = siteAnalysis.siteProfile ?? engine?.siteProfile;
  const retryRequired = engine?.overall.retryRequired ?? false;
  const risikoMap: Record<string, HazardRisikoEntry> | undefined = risiko.data?.risiko;
  const mitigationItems = engine?.recommendation ?? [];

  const suitabilityBorderColor =
    suitability?.level === 'tidak_disarankan'
      ? 'border-l-red-500'
      : suitability?.level === 'sangat_hati_hati'
        ? 'border-l-orange-500'
        : suitability?.level === 'hati_hati'
          ? 'border-l-amber-500'
          : 'border-l-emerald-500';

  const suitabilityBgColor =
    suitability?.level === 'tidak_disarankan'
      ? '#fde2e2'
      : suitability?.level === 'sangat_hati_hati'
        ? '#fde8d0'
        : suitability?.level === 'hati_hati'
          ? '#fef1d1'
          : '#d4edda';
  const suitabilityBgStyle = { backgroundColor: suitabilityBgColor };

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {suitability ? (
          <div className={`rounded-xl border-l-4 px-5 py-4 ${suitabilityBorderColor}`} style={suitabilityBgStyle}>
            <p className="text-sm font-bold text-ink mb-1.5">{suitability.label}</p>
            <p className="text-sm text-ink-secondary leading-relaxed">{suitability.advisory}</p>
            {suitability.reasons && suitability.reasons.length > 0 ? (
              <p className="text-xs text-ink-muted mt-3 leading-relaxed">
                {suitability.reasons.join(' · ')}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row gap-0">
            <div className="flex-1 p-6 space-y-3 min-w-0">
              <div>
                <h2 className="text-xl font-bold text-ink">Analisis Risiko Lokasi</h2>
                <p className="text-ink-muted text-sm mt-0.5">{siteAnalysis.locationName}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {profile ? <SiteClassBadge profile={profile} /> : null}
                <CopyCoords lat={siteAnalysis.coordinates.lat} lng={siteAnalysis.coordinates.lng} />
              </div>

              <p className="text-xs text-ink-muted leading-relaxed">
                Model 3 lapisan: bar <span className="text-violet-700 font-semibold">InaRISK</span> = hazard resmi BNPB
                (tidak diubah). <span className="text-orange-700 font-semibold">Bukti riwayat</span> = kejadian lokal +
                BMKG TEWS — masuk skor keseluruhan secara terpisah. Bar <span className="text-sky-700 font-semibold">Indikator</span>{' '}
                (elevasi &amp; sungai) hanya konteks fisik.
              </p>

              {history?.historyStatus === 'search_failed' ? (
                <p className="text-[10px] text-amber-500/90 leading-relaxed">
                  Pencarian riwayat Gemini gagal (error API/timeout) — bukan berarti wilayah bebas bencana.
                  Skor bar tetap dari BNPB/spatial + BMKG.
                </p>
              ) : null}

              <MiniMapPreview lat={siteAnalysis.coordinates.lat} lng={siteAnalysis.coordinates.lng} />

              {retryRequired ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Sebagian data hazard dominan gagal diambil — skor bisa kurang lengkap. {BNPB_TIMEOUT_MESSAGE}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-center p-6 md:border-l md:border-border shrink-0">
              <RiskGauge score={overall} blocked={engine?.overall.blocked} />
              {engine?.overall.category ? (
                <span className="block text-[11px] font-bold text-ink-muted mt-1 text-center">{engine.overall.category}</span>
              ) : null}
            </div>
          </div>
        </div>

        {engine ? <SeverityChips severity={engine.severity} /> : null}

        {engine ? (
          <MultiHazardSection engine={engine} risikoMap={risikoMap} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RiskProgressBar
              label="Hazard Banjir (InaRISK)"
              value={metricValue(siteAnalysis, 'floodScore', siteAnalysis.floodRisk.score ?? 0)}
              level={siteAnalysis.floodRisk.level}
              subtitle={siteAnalysis.floodRisk.description}
              icon={ShieldAlert}
              history={history}
              historyBonus={siteAnalysis.metrics?.floodHistoryBonus}
              localBonus={siteAnalysis.metrics?.floodLocalHistoryBonus}
              hazard="banjir"
              hazardOfficial
            />
            <RiskProgressBar
              label="Hazard Gempa (InaRISK)"
              value={metricValue(siteAnalysis, 'earthquakeScore', siteAnalysis.earthquakeRisk.score ?? 0)}
              level={siteAnalysis.earthquakeRisk.level}
              subtitle={siteAnalysis.earthquakeRisk.description}
              icon={Zap}
              history={history}
              historyBonus={siteAnalysis.metrics?.earthquakeHistoryBonus}
              bmkgBonus={siteAnalysis.metrics?.bmkgHistoryBonus}
              localBonus={siteAnalysis.metrics?.earthquakeLocalBonus}
              hazard="gempa"
              showBmkg
              hazardOfficial
            />
          </div>
        )}

        {engine ? (
          <ScenarioVisualizationPanel
            floodInputs={buildFloodScenarioInputs(engine, recommendations)}
            earthquakeInputs={buildEarthquakeScenarioInputs(
              engine,
              recommendations,
              history?.bmkgEarthquakes?.length ?? null,
            )}
          />
        ) : null}

        {engine ? <LocationMitigationPanel items={mitigationItems} /> : null}

        {engine ? <DesignConsiderationsSection engine={engine} /> : null}

        {engine ? <ConfidencePanel confidence={engine.confidence} /> : null}

        {engine && history ? (
          <DisasterHistoryPanel history={history} floodScore={engine.hazards.banjir?.score ?? 0} />
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RiskProgressBar
            label="Bukti Riwayat Kejadian"
            value={metricValue(siteAnalysis, 'historyEvidenceScore', 0)}
            level={siteAnalysis.metrics?.historyEvidenceLevel}
            subtitle="Gabungan riwayat banjir/gempa lokal (Gemini) dan aktivitas seismik BMKG TEWS — lapisan terpisah dari hazard resmi."
            icon={History}
            evidenceLevel
            indicatorTooltip={HISTORY_LAYER_TOOLTIP}
          />

          <RiskProgressBar
            label="Kemiringan Lahan"
            value={metricValue(siteAnalysis, 'slopeScore', Math.min(100, Math.round(siteAnalysis.slope.degrees / 35 * 100)))}
            level={siteAnalysis.slope.level}
            subtitle={`${siteAnalysis.slope.degrees}° — ${siteAnalysis.slope.description}`}
            icon={Compass}
          />

          <RiskProgressBar
            label="Indikator Elevasi (DPL)"
            value={metricValue(siteAnalysis, 'elevationScore', 58)}
            subtitle={elevationIndicatorSubtitle(
              siteAnalysis.elevation,
              metricValue(siteAnalysis, 'elevationScore', 58),
            )}
            icon={MapIcon}
            physicalIndicator
            indicatorTooltip={PHYSICAL_INDICATOR_TOOLTIP}
          />

          <RiskProgressBar
            label="Indikator Jarak Sungai"
            value={metricValue(siteAnalysis, 'riverScore', 30)}
            subtitle={riverIndicatorSubtitle(
              siteAnalysis.riverDistance,
              metricValue(siteAnalysis, 'riverScore', 30),
            )}
            icon={Waves}
            physicalIndicator
            indicatorTooltip={PHYSICAL_INDICATOR_TOOLTIP}
          />
        </div>

        {engine ? <RisikoPanel risiko={risiko} /> : null}

        <div className="rounded-2xl border border-border bg-surface-muted p-4">
          <p className="text-[10px] text-ink-muted leading-relaxed flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <span className="font-bold text-ink-muted uppercase tracking-wider">Disclaimer.</span> {LEGAL_DISCLAIMER}
              {siteAnalysis.engineVersion ? (
                <span className="block mt-1 font-mono text-slate-400">
                  Engine v{siteAnalysis.engineVersion.riskEngine} · rule v{siteAnalysis.engineVersion.ruleEngine} · pipeline v{siteAnalysis.engineVersion.analysisPipeline}
                </span>
              ) : null}
            </span>
          </p>
        </div>

        <FunnelGate
          variant="full"
          buildPathUnlocked={buildPathUnlocked}
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
}
