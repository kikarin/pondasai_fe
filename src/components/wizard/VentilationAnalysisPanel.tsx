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
  buruk: { text: 'Buruk', tone: 'text-danger border-red-200 bg-danger-soft' },
  cukup: { text: 'Cukup', tone: 'text-warning border-amber-200 bg-warning-soft' },
  baik: { text: 'Baik', tone: 'text-success border-emerald-200 bg-success-soft' },
  sangat_baik: {
    text: 'Sangat baik',
    tone: 'text-sky-800 border-sky-200 bg-sky-50',
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
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-2">
          <Wind className="w-4 h-4 text-teal-600" />
          Analisis Ventilasi Alami
        </h3>
        <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
          Konsep dari orientasi + sisi terbuka. Tidak mengubah skor lokasi.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-ink-muted uppercase tracking-wider font-bold">Sisi terbuka</span>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setOpenSides(n)}
            className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg border transition ${
              openSides === n
                ? 'border-teal-400 bg-teal-50 text-teal-900'
                : 'border-border bg-surface-muted text-ink-muted hover:text-ink'
            }`}
          >
            {n}
          </button>
        ))}
        {openSides === 2 ? (
          <button
            type="button"
            onClick={() => setPairOpposite((v) => !v)}
            className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition ${
              pairOpposite
                ? 'border-teal-300 bg-teal-50 text-teal-800'
                : 'border-border bg-surface-muted text-ink-muted'
            }`}
          >
            {pairOpposite ? 'Layout: berlawanan' : 'Layout: bersebelahan'}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface-muted p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.tone}`}>
              {meta.text}
            </span>
            <div className="text-right leading-tight">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                Skor ventilasi
              </p>
              <span className="text-lg font-bold text-teal-800">{result.score}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white overflow-hidden border border-border">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${result.score}%` }}
            />
          </div>
          <p className="text-[12px] text-ink-muted">
            Silang: {result.crossVentPossible ? 'ya' : 'belum'} · inlet{' '}
            {FACADE_LABEL[result.morningFacade]} · outlet {FACADE_LABEL[result.afternoonFacade]}
          </p>
        </div>

        <ul className="space-y-1.5">
          {result.recommendations.slice(0, 4).map((rec) => (
            <li key={rec} className="text-[12px] text-ink-secondary leading-relaxed">
              · {rec}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-ink-muted leading-relaxed">{VENTILATION_NOTE}</p>
    </div>
  );
}
