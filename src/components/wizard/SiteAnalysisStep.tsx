import { useCallback, useEffect, useState, type FC } from 'react';
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
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { analyzeRisiko } from '../../services/analysisService';
import type {
  BmkgEarthquakeEvent,
  ConfidenceResult,
  DisasterHistory,
  HazardConfidence,
  HazardEntry,
  HazardNarrative,
  HazardRisikoEntry,
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

function scoreBarColor(value: number) {
  if (value >= 67) return 'bg-red-500';
  if (value >= 34) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function scoreTextColor(value: number) {
  if (value >= 67) return 'text-red-400';
  if (value >= 34) return 'text-amber-400';
  return 'text-emerald-400';
}

function categoryBadgeClass(category: string | null | undefined) {
  if (category === 'Tinggi') return 'text-red-400 bg-red-500/10 border-red-500/30';
  if (category === 'Sedang') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
}

function confidenceToneClass(score: number) {
  if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  return 'text-red-400 bg-red-500/10 border-red-500/30';
}

function evidenceLevelBadgeClass(level: string | undefined) {
  if (!level || level === 'Tidak ada bukti') {
    return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  }
  if (level === 'Sangat tinggi' || level === 'Tinggi') {
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  }
  if (level === 'Sedang') {
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }
  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
}

function levelBadgeClass(level: RiskFactor['level']) {
  if (level === 'Tinggi') return 'text-red-400 bg-red-500/10 border-red-500/30';
  if (level === 'Sedang') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
}

function HistoryBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{title}</p>
      <p className="text-[11px] text-blue-200/80 leading-relaxed">{content}</p>
    </div>
  );
}

function BmkgEventsTable({ events }: { events: BmkgEarthquakeEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-[#23324E]">
      <table className="w-full text-[10px] font-mono text-left">
        <thead>
          <tr className="bg-[#141A2D] text-gray-500 uppercase tracking-wider">
            <th className="px-2 py-1.5 font-bold">#</th>
            <th className="px-2 py-1.5 font-bold">M</th>
            <th className="px-2 py-1.5 font-bold">Jarak (km)</th>
            <th className="px-2 py-1.5 font-bold">Tanggal</th>
            <th className="px-2 py-1.5 font-bold hidden sm:table-cell">Wilayah</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={`${event.date}-${event.magnitude}-${event.distanceKm}-${index}`} className="border-t border-[#1F293D]">
              <td className="px-2 py-1.5 text-gray-400">{index + 1}</td>
              <td className="px-2 py-1.5 text-amber-300/90">{event.magnitude}</td>
              <td className="px-2 py-1.5 text-sky-300/90">{event.distanceKm}</td>
              <td className="px-2 py-1.5 text-gray-300 whitespace-nowrap">{event.date || '—'}</td>
              <td className="px-2 py-1.5 text-gray-400 hidden sm:table-cell max-w-[200px] truncate" title={event.region}>
                {event.region || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-2 py-1 text-[9px] text-gray-500 border-t border-[#1F293D]">
        Semua event di tabel ini masuk perhitungan skor BMKG (selaras sheet Excel B2).
      </p>
    </div>
  );
}

function EventNoteTable({
  title,
  note,
  events,
}: {
  title: string;
  note?: string;
  events: { date: string; description: string }[];
}) {
  const hasNote = Boolean(note && note.trim());
  if (!hasNote && events.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{title}</p>
      {hasNote ? <p className="text-[11px] text-blue-200/80 leading-relaxed">{note}</p> : null}
      {events.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-[#23324E]">
          <table className="w-full text-[10px] font-mono text-left">
            <thead>
              <tr className="bg-[#141A2D] text-gray-500 uppercase tracking-wider">
                <th className="px-2 py-1.5 font-bold">#</th>
                <th className="px-2 py-1.5 font-bold whitespace-nowrap">Tanggal</th>
                <th className="px-2 py-1.5 font-bold">Kejadian</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={`${event.date}-${index}`} className="border-t border-[#1F293D]">
                  <td className="px-2 py-1.5 text-gray-400 align-top">{index + 1}</td>
                  <td className="px-2 py-1.5 text-gray-300 whitespace-nowrap align-top">{event.date || '—'}</td>
                  <td className="px-2 py-1.5 text-blue-200/80 leading-relaxed">{event.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
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

  return (
    <div className="pt-1 border-t border-[#1F293D]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-2 py-1 text-left group"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-300">
          Riwayat {hazard}
          <span className="ml-2 font-mono normal-case tracking-normal text-gray-500">
            {showBmkg ? `· BMKG ${bmkgCount} ` : ''}
            · Kota {cityCount} · Kelurahan {localCount}
          </span>
        </span>
        <span className="text-gray-500 shrink-0" aria-hidden>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open ? (
        <div className="mt-2 space-y-3 pl-0.5">
          {showBmkg ? (
            <div className="space-y-2">
              <HistoryBlock
                title={`BMKG TEWS (dekat lokasi pin) · ${bmkgCount} event`}
                content={bmkgNote}
              />
              {history.bmkgEarthquakes?.length ? (
                <BmkgEventsTable events={history.bmkgEarthquakes} />
              ) : null}
            </div>
          ) : null}
          <EventNoteTable
            title={`Kelurahan / kecamatan${history.localArea ? ` — ${history.localArea}` : ''}`}
            note={localNote || `Tidak ada riwayat ${hazard} lokal tercatat.`}
            events={localEvents}
          />
          <EventNoteTable
            title={`Kota / kabupaten (informasi)${history.city ? ` — ${history.city}` : ''}`}
            note={cityNote || `Tidak ada riwayat ${hazard} tingkat kota/kabupaten.`}
            events={cityEvents}
          />
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
    <div className="p-5 rounded-xl border border-[#1F293D] bg-[#0F1423] space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
          {physicalIndicator ? (
            <span
              className="text-[9px] font-bold uppercase tracking-wide text-sky-400/90 bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 rounded shrink-0 cursor-help"
              title={indicatorTooltip}
            >
              Indikator
            </span>
          ) : null}
          {hazardOfficial ? (
            <span
              className="text-[9px] font-bold uppercase tracking-wide text-violet-400/90 bg-violet-500/10 border border-violet-500/25 px-1.5 py-0.5 rounded shrink-0 cursor-help"
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
            <span className={`text-lg font-bold font-mono ${scoreTextColor(clamped)}`}>{clamped}</span>
          </div>
          {hazardOfficial && historyBonus != null && historyBonus > 0 ? (
            <span className="text-[9px] text-gray-500 font-mono text-right leading-snug">
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

      <div className="h-2.5 rounded-full bg-[#141A2D] overflow-hidden border border-[#23324E]">
        <div
          className={`h-full rounded-full transition-all ${scoreBarColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">{subtitle}</p>

      {history && hazard ? (
        <CollapsibleHistoryPanel hazard={hazard} history={history} showBmkg={showBmkg} />
      ) : null}
    </div>
  );
}

function formatRiverDistance(riverDistance: SiteAnalysisData['riverDistance']) {
  const isAvailable =
    riverDistance.available !== false &&
    riverDistance.value !== null &&
    riverDistance.value !== undefined;

  if (isAvailable) {
    return `${riverDistance.value} meter`;
  }
  return 'Tidak tersedia';
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
      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-gray-300 hover:text-white bg-[#141A2D] border border-[#23324E] rounded-lg px-2 py-1 transition"
    >
      <MapPin className="w-3 h-3 text-sky-400" />
      {text}
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
    </button>
  );
}

function SiteClassBadge({ profile }: { profile: SiteProfile }) {
  const meta = SITE_CLASS_META[profile.class] ?? { label: profile.class, tone: 'warn' as const };
  const toneClass =
    meta.tone === 'ok'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : meta.tone === 'block'
        ? 'text-red-400 bg-red-500/10 border-red-500/30'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${toneClass}`}>
      {meta.tone === 'ok' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {meta.label}
    </span>
  );
}

function SeverityChips({ severity }: { severity: SeverityItem[] }) {
  const top = severity.filter((item) => HAZARD_META[item.key]?.structural !== false).slice(0, 3);
  if (top.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Ancaman Teratas</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {top.map((item, index) => {
          const meta = HAZARD_META[item.key];
          return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${categoryBadgeClass(item.category)}`}
            >
              <span className="text-gray-500 font-mono">#{index + 1}</span>
              {meta?.label ?? item.label}
              <span className="font-mono">{item.score}</span>
            </span>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed">
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
    <div className="p-4 rounded-xl border border-[#1F293D] bg-[#0F1423] space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{meta.label}</span>
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
          <span className={`text-base font-bold font-mono ${scoreTextColor(value)}`}>{value}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-[#141A2D] overflow-hidden border border-[#23324E]">
        <div className={`h-full rounded-full transition-all ${scoreBarColor(value)}`} style={{ width: `${value}%` }} />
      </div>
      {risiko ? (
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#1F293D]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Indeks Risiko wilayah</span>
          {risiko.fetchStatus === 'SUCCESS' ? (
            <span className="flex items-center gap-1.5">
              {risiko.category ? (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${categoryBadgeClass(risiko.category)}`}>
                  {risiko.category}
                </span>
              ) : null}
              <span className={`text-xs font-bold font-mono ${scoreTextColor(risiko.score ?? 0)}`}>{risiko.score}</span>
            </span>
          ) : (
            <span className="text-[9px] font-bold text-amber-400">TIMEOUT</span>
          )}
        </div>
      ) : null}
    </div>
  );
};

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
    <div className="rounded-2xl border border-[#1F293D] bg-[#0B0F1C] p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Profil Multi-Hazard (InaRISK)
          </h3>
        </div>
        <span
          className="inline-flex items-center gap-1 text-[10px] text-gray-500 cursor-help"
          title={INDEKS_VS_RISIKO_TOOLTIP}
        >
          <Info className="w-3 h-3" /> Indeks Bahaya vs Risiko
        </span>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {DOMAIN_LABELS[domain] ?? domain}
            </p>
            {visible.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300/80 bg-emerald-500/5 border border-emerald-500/20 px-2 py-1 rounded-lg"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {HAZARD_META[h.key]?.label ?? h.key}
                        <span className="font-mono text-emerald-400/70">0 · aman</span>
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
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 hover:text-gray-300 transition"
        >
          {showGreen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showGreen ? 'Sembunyikan hazard aman' : 'Tampilkan hazard aman (skor 0) yang sudah dicek'}
        </button>
      ) : null}
    </div>
  );
}

function DesignConsiderationsSection({ engine }: { engine: RiskEngineResult }) {
  const cuaca = engine.hazards['cuaca_ekstrem'];
  if (!cuaca || cuaca.fetchStatus !== 'SUCCESS') return null;

  const score = Math.min(100, Math.max(0, cuaca.score ?? 0));
  return (
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <CloudRain className="w-4 h-4 text-sky-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
          Pertimbangan Desain &amp; Material
        </h3>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Faktor di bawah memengaruhi <span className="text-gray-400 font-semibold">bagaimana</span> bangunan
        dirancang (atap, material, drainase) — bukan{' '}
        <span className="text-gray-400 font-semibold">apakah</span> lahan aman dibangun. Tidak masuk skor
        kelayakan keseluruhan.
      </p>
      <div className="p-4 rounded-xl border border-[#1F293D] bg-[#0B0F1C] space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <CloudRain className="w-4 h-4 shrink-0" />
            {HAZARD_META['cuaca_ekstrem']?.label ?? 'Cuaca Ekstrem'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {cuaca.category ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryBadgeClass(cuaca.category)}`}>
                {cuaca.category}
              </span>
            ) : null}
            <span className={`text-base font-bold font-mono ${scoreTextColor(score)}`}>{score}</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[#141A2D] overflow-hidden border border-[#23324E]">
          <div className={`h-full rounded-full transition-all ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed">
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
      className={`inline-flex items-center gap-1 ${active ? 'text-gray-400' : 'text-gray-600'} ${suffix ? 'cursor-help' : ''}`}
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
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Keyakinan Data</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceToneClass(confidence.overall)}`}>
            {confidence.overall}% · {confidence.overallLevel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-gray-500 hover:text-gray-300 shrink-0"
          aria-label="Detail keyakinan data"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{confidence.confidenceReason}</p>

      {open ? (
        <div className="space-y-2 pt-1 border-t border-[#1F293D]">
          {perHazard.map((hc) => (
            <div key={hc.key} className="flex items-center justify-between gap-3 py-1">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-300">
                  {HAZARD_META[hc.key]?.label ?? hc.key}
                  <span className="ml-2 text-[9px] font-normal text-gray-500">{hc.reason}</span>
                </p>
                <DataQualityDots dq={hc.dataQuality} />
              </div>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border shrink-0 ${confidenceToneClass(hc.score)}`}>
                {hc.score}%
              </span>
            </div>
          ))}
          <p className="text-[9px] text-gray-600 leading-relaxed pt-1">
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

function risikoStorageKey(projectId: string) {
  return `${RISIKO_STORAGE_PREFIX}${projectId}`;
}

function loadCachedRisiko(projectId: string): RisikoResponse | null {
  if (!projectId || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(risikoStorageKey(projectId));
    return raw ? (JSON.parse(raw) as RisikoResponse) : null;
  } catch {
    return null;
  }
}

function saveCachedRisiko(projectId: string, data: RisikoResponse) {
  if (!projectId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(risikoStorageKey(projectId), JSON.stringify(data));
  } catch {
    /* storage penuh / disabled — abaikan, data tetap ada di state */
  }
}

// Gabungkan hasil generate baru dengan yang lama: skor SUCCESS/green sebelumnya dipertahankan
// bila fetch baru timeout/error, supaya "Coba Lagi" tak menghapus skor yang sudah tampil.
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

function useRisiko(projectId: string): RisikoState {
  const [data, setData] = useState<RisikoResponse | null>(() => loadCachedRisiko(projectId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(loadCachedRisiko(projectId));
    setError(null);
  }, [projectId]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRisiko(projectId);
      setData((prev) => {
        const merged = mergeRisiko(prev, result);
        saveCachedRisiko(projectId, merged);
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
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-gray-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Indeks Risiko (On-Demand)</h3>
          <span
            className="inline-flex items-center gap-1 text-[10px] text-gray-500 cursor-help"
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

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Indeks risiko (bahaya × paparan × kerentanan) bersifat informasi/edukasi wilayah dan{' '}
        <span className="text-gray-400 font-semibold">tidak memengaruhi skor kelayakan bangun</span>.
        {data ? ' Nilai risiko juga ditampilkan berdampingan dengan indeks bahaya di panel Multi-Hazard di atas.' : ''}
      </p>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <p className="text-[11px] text-red-300/90 leading-relaxed">{error}</p>
          <button type="button" onClick={generate} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-red-200 hover:text-white">
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
              <button type="button" onClick={generate} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-200 hover:text-white shrink-0">
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
                  <div key={entry.key} className="p-3 rounded-lg border border-[#23324E] bg-[#0B0F1C] space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 min-w-0">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {meta?.label ?? entry.label}
                      </span>
                      {unavailable ? (
                        <span className="text-[9px] font-bold text-amber-400">TIMEOUT</span>
                      ) : (
                        <span className={`text-sm font-bold font-mono ${scoreTextColor(entry.score ?? 0)}`}>
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
                    className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300/80 bg-emerald-500/5 border border-emerald-500/20 px-2 py-1 rounded-lg"
                    title="Indeks bahaya hijau (0) → risiko wilayah 0 tanpa perlu tembak layer (§8.7)."
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {meta?.label ?? entry.label}
                    <span className="font-mono text-emerald-400/70">risiko 0 · bahaya hijau</span>
                  </span>
                );
              })}
            </div>
          ) : null}

          {fetchedEntries.length === 0 && greenEntries.length === 0 && bahayaUnavailable.length === 0 ? (
            <p className="text-[11px] text-gray-500">Tidak ada indeks bahaya aktif untuk dihitung risikonya.</p>
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
    <div className="pt-1 border-t border-[#1F293D]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-2 py-1 text-left group"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-300">
          <Icon className="w-3.5 h-3.5 shrink-0" />
          Riwayat {label}
          <span className="font-mono normal-case tracking-normal text-gray-500">
            · narasi · {count} kejadian
          </span>
        </span>
        <span className="text-gray-500 shrink-0" aria-hidden>
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
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-orange-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
          Riwayat Kejadian (Lapisan Bukti)
        </h3>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Riwayat bersifat <span className="text-gray-400 font-semibold">konteks regional</span>{' '}
        (kelurahan/kecamatan, kota/kabupaten, dan BMKG TEWS) — belum tentu tepat di titik pin. Masuk skor
        keseluruhan lewat lapisan <span className="text-orange-400/90">Bukti Riwayat</span>, terpisah dari
        hazard resmi InaRISK.
      </p>
      <div className="space-y-2">
        <CollapsibleHistoryPanel hazard="gempa" history={history} showBmkg />
        {showBanjir ? <CollapsibleHistoryPanel hazard="banjir" history={history} /> : null}
      </div>

      {narrativeKeys.length > 0 ? (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Riwayat hazard lain di bawah bersifat <span className="text-gray-400 font-semibold">narasi/konteks</span>{' '}
            (hasil riset Gemini) dan <span className="text-gray-400 font-semibold">tidak menambah skor</span> —
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
  const { siteAnalysis, nextStep, projectId } = usePondasiWorkspace();
  const risiko = useRisiko(projectId);

  if (!siteAnalysis) return null;

  const history = siteAnalysis.disasterHistory;
  const overall = siteAnalysis.overallRiskScore;
  const suitability = siteAnalysis.buildSuitability;
  const engine = siteAnalysis.riskEngine;
  const profile = siteAnalysis.siteProfile ?? engine?.siteProfile;
  const retryRequired = engine?.overall.retryRequired ?? false;
  const risikoMap: Record<string, HazardRisikoEntry> | undefined = risiko.data?.risiko;

  const suitabilityBannerClass =
    suitability?.level === 'tidak_disarankan'
      ? 'border-red-500/40 bg-red-500/10'
      : suitability?.level === 'sangat_hati_hati'
        ? 'border-orange-500/40 bg-orange-500/10'
        : suitability?.level === 'hati_hati'
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-emerald-500/30 bg-emerald-500/10';

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {suitability ? (
          <div className={`rounded-2xl border p-5 ${suitabilityBannerClass}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-2">{suitability.label}</p>
            <p className="text-sm text-gray-200 leading-relaxed">{suitability.advisory}</p>
            {suitability.reasons && suitability.reasons.length > 0 ? (
              <p className="text-[10px] text-gray-500 font-mono mt-2 leading-relaxed">
                Alasan sistem: {suitability.reasons.join(' · ')}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="bg-[#0F1423] border border-[#1F293D] p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white">Hasil Analisis Geospasial</h2>
              <p className="text-gray-400 text-sm">{siteAnalysis.locationName}</p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {profile ? <SiteClassBadge profile={profile} /> : null}
                <CopyCoords lat={siteAnalysis.coordinates.lat} lng={siteAnalysis.coordinates.lng} />
              </div>

              {history?.historyStatus === 'search_failed' ? (
                <p className="text-[10px] text-amber-500/90 mt-1 leading-relaxed max-w-xl">
                  Pencarian riwayat Gemini gagal (error API/timeout) — bukan berarti wilayah bebas bencana.
                  Skor bar tetap dari BNPB/spatial + BMKG.
                </p>
              ) : null}
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed max-w-xl">
                Model 3 lapisan: bar <span className="text-violet-400/90">InaRISK</span> = hazard resmi BNPB
                (tidak diubah). <span className="text-orange-400/90">Bukti riwayat</span> = kejadian lokal +
                BMKG TEWS — masuk skor keseluruhan secara terpisah. Bar <span className="text-sky-400/90">Indikator</span>{' '}
                (elevasi &amp; sungai) hanya konteks fisik.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">
                Skor Risiko Keseluruhan
              </span>
              {engine?.overall.blocked ? (
                <span className="text-2xl font-extrabold text-red-400">Tidak Dinilai</span>
              ) : (
                <span className={`text-3xl font-extrabold font-mono ${scoreTextColor(overall)}`}>
                  {overall} <span className="text-lg text-gray-500">/ 100</span>
                </span>
              )}
              {engine?.overall.category ? (
                <span className="block text-[11px] font-bold text-gray-400 mt-0.5">{engine.overall.category}</span>
              ) : null}
            </div>
          </div>

          {!engine?.overall.blocked ? (
            <div>
              <div className="h-3 rounded-full bg-[#141A2D] overflow-hidden border border-[#23324E]">
                <div
                  className={`h-full rounded-full ${scoreBarColor(overall)}`}
                  style={{ width: `${Math.min(100, overall)}%` }}
                />
              </div>
            </div>
          ) : null}

          {retryRequired ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Sebagian data hazard dominan gagal diambil — skor bisa kurang lengkap. {BNPB_TIMEOUT_MESSAGE}
              </p>
            </div>
          ) : null}
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
            subtitle={`${siteAnalysis.elevation.value} mdpl — ${siteAnalysis.elevation.description} DPL rendah = risiko banjir lebih tinggi.`}
            icon={MapIcon}
            physicalIndicator
            indicatorTooltip={PHYSICAL_INDICATOR_TOOLTIP}
          />

          <RiskProgressBar
            label="Indikator Jarak Sungai"
            value={metricValue(siteAnalysis, 'riverScore', 30)}
            subtitle={`${formatRiverDistance(siteAnalysis.riverDistance)} — ${siteAnalysis.riverDistance.description} Dekat sungai = risiko banjir lebih tinggi.`}
            icon={Waves}
            physicalIndicator
            indicatorTooltip={PHYSICAL_INDICATOR_TOOLTIP}
          />
        </div>

        {engine ? <RisikoPanel risiko={risiko} /> : null}

        <div className="rounded-2xl border border-[#1F293D] bg-[#0B0F1C] p-4">
          <p className="text-[10px] text-gray-500 leading-relaxed flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
            <span>
              <span className="font-bold text-gray-400 uppercase tracking-wider">Disclaimer.</span> {LEGAL_DISCLAIMER}
              {siteAnalysis.engineVersion ? (
                <span className="block mt-1 font-mono text-gray-600">
                  Engine v{siteAnalysis.engineVersion.riskEngine} · rule v{siteAnalysis.engineVersion.ruleEngine} · pipeline v{siteAnalysis.engineVersion.analysisPipeline}
                </span>
              ) : null}
            </span>
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition"
          >
            Lanjut ke Rekomendasi Teknis
          </button>
        </div>
      </div>
    </div>
  );
}
