/**
 * Panel ventilasi alami — Step 8 (Preview 3D).
 */

import { useMemo, useState } from 'react';
import { Wind } from 'lucide-react';
import type { FacadeId } from '../../utils/sunlight';
import {
  evaluateSunlight,
  inferBuildingAzimuthFromOutline,
} from '../../utils/sunlight';
import type { VentilationLabel } from '../../utils/ventilation';
import { VENTILATION_NOTE, evaluateVentilation } from '../../utils/ventilation';

const LABEL_META: Record<VentilationLabel, { text: string; tone: string }> = {
  buruk: { text: 'Buruk', tone: 'text-red-300 border-red-500/40 bg-red-500/10' },
  cukup: { text: 'Cukup', tone: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  baik: { text: 'Baik', tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
  sangat_baik: {
    text: 'Sangat baik',
    tone: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
  },
};

const FACADE_LABEL: Record<FacadeId, string> = {
  depan: 'Depan',
  kanan: 'Kanan',
  belakang: 'Belakang',
  kiri: 'Kiri',
};

export function VentilationAnalysisPanel({
  latitude,
  longitude,
  landOutline,
  cuacaEkstremScore,
}: {
  latitude: number;
  longitude: number;
  landOutline?: [number, number][] | null;
  cuacaEkstremScore?: number | null;
}) {
  const [openSides, setOpenSides] = useState(2);
  const [pairOpposite, setPairOpposite] = useState(true);

  const buildingAzimuthDeg = useMemo(
    () => inferBuildingAzimuthFromOutline(landOutline ?? null, 0),
    [landOutline],
  );

  const sun = useMemo(
    () =>
      evaluateSunlight({
        latitude,
        longitude,
        buildingAzimuthDeg,
        sample: 'equinox',
      }),
    [latitude, longitude, buildingAzimuthDeg],
  );

  const result = useMemo(
    () =>
      evaluateVentilation({
        buildingAzimuthDeg,
        openSides,
        morningFacade: sun.morningFacade,
        afternoonFacade: sun.afternoonFacade,
        openPairOpposite: openSides === 2 ? pairOpposite : null,
        cuacaEkstremScore: cuacaEkstremScore ?? null,
      }),
    [
      buildingAzimuthDeg,
      openSides,
      sun.morningFacade,
      sun.afternoonFacade,
      pairOpposite,
      cuacaEkstremScore,
    ],
  );

  const meta = LABEL_META[result.label];

  return (
    <div className="rounded-2xl border border-[#1F293D] bg-[#0F1423] p-5 space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <Wind className="w-4 h-4 text-teal-400" />
          Analisis Ventilasi Alami
        </h3>
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
          Konsep pra-konstruksi dari orientasi + jumlah sisi terbuka (+ cuaca ekstrem
          informational). Tidak mengubah skor Step 5.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Sisi terbuka</span>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setOpenSides(n)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
              openSides === n
                ? 'border-teal-500/50 bg-teal-500/15 text-teal-100'
                : 'border-[#23324E] bg-[#141A2D] text-gray-500 hover:text-gray-300'
            }`}
          >
            {n}
          </button>
        ))}
        {openSides === 2 ? (
          <button
            type="button"
            onClick={() => setPairOpposite((v) => !v)}
            className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition ${
              pairOpposite
                ? 'border-teal-500/40 bg-teal-500/10 text-teal-200'
                : 'border-[#23324E] bg-[#141A2D] text-gray-500'
            }`}
          >
            {pairOpposite ? 'Layout: berlawanan' : 'Layout: bersebelahan'}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#23324E] bg-[#070A12] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.tone}`}>
              {meta.text}
            </span>
            <div className="text-right leading-tight">
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                Skor konsep ventilasi
              </p>
              <span className="text-lg font-mono font-bold text-teal-200">{result.score}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[#141A2D] overflow-hidden border border-[#23324E]">
            <div
              className="h-full rounded-full bg-teal-500/80 transition-all"
              style={{ width: `${result.score}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-gray-500">
            Silang: {result.crossVentPossible ? 'ya' : 'belum'} · inlet{' '}
            {FACADE_LABEL[result.morningFacade]} · outlet {FACADE_LABEL[result.afternoonFacade]}
            {result.cuacaEkstremScore != null
              ? ` · cuaca ekstrem ${result.cuacaEkstremScore}`
              : ''}
          </p>
          {/* mini plan: 4 walls */}
          <div className="relative mx-auto w-28 h-28 border border-[#4B5563] bg-[#1E293B]/60 rounded-sm">
            {(['depan', 'kanan', 'belakang', 'kiri'] as FacadeId[]).map((id) => {
              const active =
                (id === result.morningFacade || id === result.afternoonFacade) &&
                result.crossVentPossible;
              const pos =
                id === 'depan'
                  ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
                  : id === 'belakang'
                    ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
                    : id === 'kanan'
                      ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'
                      : 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2';
              return (
                <span
                  key={id}
                  className={`absolute ${pos} text-[8px] font-bold px-1 py-0.5 rounded border ${
                    active
                      ? 'border-teal-400/50 bg-teal-500/20 text-teal-100'
                      : 'border-[#23324E] bg-[#0A0D15] text-gray-600'
                  }`}
                >
                  {FACADE_LABEL[id][0]}
                </span>
              );
            })}
            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-500 font-mono">
              denah
            </span>
          </div>
        </div>

        <ul className="space-y-1.5">
          {result.recommendations.map((rec) => (
            <li key={rec} className="text-[10px] text-teal-100/75 leading-relaxed">
              · {rec}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed">{VENTILATION_NOTE}</p>
    </div>
  );
}
