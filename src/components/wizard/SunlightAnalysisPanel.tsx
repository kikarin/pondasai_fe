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
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  const rise = polar(cx, cy, r, result.sunriseAzimuthDeg);
  const set = polar(cx, cy, r, result.sunsetAzimuthDeg);
  const front = polar(cx, cy, r * 0.55, result.buildingAzimuthDeg);

  return (
    <svg width={size} height={size} className="mx-auto block" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="#070A12" stroke="#23324E" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r * 0.35} fill="#0F1423" stroke="#1F293D" strokeWidth="1" />
      {/* cardinal */}
      <text x={cx} y={18} textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="monospace">
        U
      </text>
      <text x={size - 12} y={cy + 3} textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="monospace">
        T
      </text>
      <text x={cx} y={size - 8} textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="monospace">
        S
      </text>
      <text x={12} y={cy + 3} textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="monospace">
        B
      </text>
      {/* facade arrow */}
      <line x1={cx} y1={cy} x2={front.x} y2={front.y} stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx={front.x} cy={front.y} r={3} fill="#A78BFA" />
      {/* sunrise / sunset */}
      <line x1={cx} y1={cy} x2={rise.x} y2={rise.y} stroke="#FBBF24" strokeWidth="2.5" />
      <circle cx={rise.x} cy={rise.y} r={5} fill="#F59E0B" />
      <line x1={cx} y1={cy} x2={set.x} y2={set.y} stroke="#FB923C" strokeWidth="2.5" />
      <circle cx={set.x} cy={set.y} r={5} fill="#EA580C" />
      <text x={rise.x} y={rise.y - 8} textAnchor="middle" fill="#FCD34D" fontSize="9">
        terbit
      </text>
      <text x={set.x} y={set.y - 8} textAnchor="middle" fill="#FDBA74" fontSize="9">
        terbenam
      </text>
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
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            Analisis Matahari
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            Orientasi denah vs terbit/terbenam — independent dari skor hazard. Tidak mengubah skor Step 5.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_DATE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSample(opt.key)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition ${
                sample === opt.key
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-100'
                  : 'border-[#23324E] bg-[#141A2D] text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="rounded-xl border border-[#23324E] bg-[#070A12] p-3">
          <SunCompass result={result} />
          <p className="text-[9px] font-mono text-center text-gray-500 mt-1">
            ungu putus-putus = arah depan denah ({result.buildingAzimuthDeg.toFixed(0)}°)
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="rounded-lg border border-[#23324E] bg-[#0A0D15] px-2.5 py-2">
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Terbit</div>
              <div className="text-amber-200">{result.sunriseAzimuthDeg.toFixed(1)}°</div>
            </div>
            <div className="rounded-lg border border-[#23324E] bg-[#0A0D15] px-2.5 py-2">
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Terbenam</div>
              <div className="text-orange-200">{result.sunsetAzimuthDeg.toFixed(1)}°</div>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-2">
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Pagi →</div>
              <div className="text-emerald-200">{FACADE_LABEL[result.morningFacade]}</div>
            </div>
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-2.5 py-2">
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Sore →</div>
              <div className="text-orange-200">{FACADE_LABEL[result.afternoonFacade]}</div>
            </div>
          </div>

          <ul className="space-y-1.5">
            {result.recommendations.map((rec) => (
              <li key={rec} className="text-[10px] text-amber-100/75 leading-relaxed">
                · {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed">{SUNLIGHT_NOTE}</p>
    </div>
  );
}
