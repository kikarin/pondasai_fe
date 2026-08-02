/**
 * Panel analisis matahari — Step 8 (Preview 3D).
 * Angka dari evaluateSunlight (murni), AI tidak ikut hitung.
 */

import { useMemo, useState } from 'react';
import { Sun } from 'lucide-react';
import type { SampleDateKey, SunlightResult } from '../../utils/sunlight';
import {
  SAMPLE_DATE_OPTIONS,
  SUNLIGHT_NOTE,
  evaluateSunlight,
  inferBuildingAzimuthFromOutline,
} from '../../utils/sunlight';

const FACADE_LABEL: Record<string, string> = {
  depan: 'Depan',
  kanan: 'Kanan',
  belakang: 'Belakang',
  kiri: 'Kiri',
};

function polar(cx: number, cy: number, r: number, azDeg: number) {
  const rad = ((azDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function SunCompass({ result }: { result: SunlightResult }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 58;
  const rise = polar(cx, cy, r, result.sunriseAzimuthDeg);
  const set = polar(cx, cy, r, result.sunsetAzimuthDeg);
  const front = polar(cx, cy, r * 0.55, result.buildingAzimuthDeg);

  return (
    <svg width={size} height={size} className="mx-auto block" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r * 0.35} fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
      <text x={cx} y={18} textAnchor="middle" fill="#64748b" fontSize="11">
        U
      </text>
      <text x={size - 12} y={cy + 4} textAnchor="middle" fill="#64748b" fontSize="11">
        T
      </text>
      <text x={cx} y={size - 8} textAnchor="middle" fill="#64748b" fontSize="11">
        S
      </text>
      <text x={12} y={cy + 4} textAnchor="middle" fill="#64748b" fontSize="11">
        B
      </text>
      <line x1={cx} y1={cy} x2={front.x} y2={front.y} stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx={front.x} cy={front.y} r={3} fill="#8b5cf6" />
      <line x1={cx} y1={cy} x2={rise.x} y2={rise.y} stroke="#d97706" strokeWidth="2.5" />
      <circle cx={rise.x} cy={rise.y} r={5} fill="#f59e0b" />
      <line x1={cx} y1={cy} x2={set.x} y2={set.y} stroke="#ea580c" strokeWidth="2.5" />
      <circle cx={set.x} cy={set.y} r={5} fill="#c2410c" />
    </svg>
  );
}

export function SunlightAnalysisPanel({
  latitude,
  longitude,
  landOutline,
}: {
  latitude: number;
  longitude: number;
  landOutline?: [number, number][] | null;
}) {
  const [sample, setSample] = useState<SampleDateKey>('equinox');

  const buildingAzimuthDeg = useMemo(
    () => inferBuildingAzimuthFromOutline(landOutline ?? null, 0),
    [landOutline],
  );

  const result = useMemo(
    () =>
      evaluateSunlight({
        latitude,
        longitude,
        buildingAzimuthDeg,
        sample,
      }),
    [latitude, longitude, buildingAzimuthDeg, sample],
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-600" />
            Analisis Matahari
          </h3>
          <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
            Orientasi denah vs terbit/terbenam — tidak mengubah skor lokasi.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_DATE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSample(opt.key)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition ${
                sample === opt.key
                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                  : 'border-border bg-surface-muted text-ink-muted hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <SunCompass result={result} />
          <p className="text-[11px] text-center text-ink-muted mt-1">
            Ungu = arah depan denah ({result.buildingAzimuthDeg.toFixed(0)}°)
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <div className="rounded-lg border border-border bg-surface px-3 py-2">
              <div className="text-ink-muted uppercase tracking-wider text-[10px]">Terbit</div>
              <div className="font-semibold text-amber-800">{result.sunriseAzimuthDeg.toFixed(1)}°</div>
            </div>
            <div className="rounded-lg border border-border bg-surface px-3 py-2">
              <div className="text-ink-muted uppercase tracking-wider text-[10px]">Terbenam</div>
              <div className="font-semibold text-orange-800">{result.sunsetAzimuthDeg.toFixed(1)}°</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="text-ink-muted uppercase tracking-wider text-[10px]">Pagi →</div>
              <div className="font-semibold text-emerald-800">{FACADE_LABEL[result.morningFacade]}</div>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
              <div className="text-ink-muted uppercase tracking-wider text-[10px]">Sore →</div>
              <div className="font-semibold text-orange-800">{FACADE_LABEL[result.afternoonFacade]}</div>
            </div>
          </div>

          <ul className="space-y-1.5">
            {result.recommendations.slice(0, 3).map((rec) => (
              <li key={rec} className="text-[12px] text-ink-secondary leading-relaxed">
                · {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[11px] text-ink-muted leading-relaxed">{SUNLIGHT_NOTE}</p>
    </div>
  );
}
