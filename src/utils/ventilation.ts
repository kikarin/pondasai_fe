/**
 * Ventilation analysis V2 — mirror BE (konsep, bukan CFD).
 * @see docs/task-v2.md Fase 4
 */

import type { FacadeId } from './sunlight';
import { angularDistanceDeg, facadeNormals } from './sunlight';

export type VentilationLabel = 'buruk' | 'cukup' | 'baik' | 'sangat_baik';
export type OpenLayout = 'satu_sisi' | 'bersebelahan' | 'berlawanan' | 'tiga_plus';

export const VENTILATION_NOTE =
  'Ventilasi alami konsep pra-desain — bukan CFD / simulasi aliran akurat. Tidak mengubah skor hazard InaRISK.';

export interface VentilationResult {
  openSides: number;
  openLayout: OpenLayout;
  buildingAzimuthDeg: number;
  morningFacade: FacadeId;
  afternoonFacade: FacadeId;
  crossVentPossible: boolean;
  score: number;
  label: VentilationLabel;
  cuacaEkstremScore: number | null;
  recommendations: string[];
  informational: boolean;
  note: string;
}

function labelFromScore(score: number): VentilationLabel {
  if (score >= 80) return 'sangat_baik';
  if (score >= 65) return 'baik';
  if (score >= 45) return 'cukup';
  return 'buruk';
}

export function resolveOpenLayout(
  openSides: number,
  preferredPairOpposite: boolean,
): OpenLayout {
  const n = Math.max(0, Math.min(4, openSides));
  if (n <= 1) return 'satu_sisi';
  if (n >= 3) return 'tiga_plus';
  return preferredPairOpposite ? 'berlawanan' : 'bersebelahan';
}

export function evaluateVentilation(args: {
  buildingAzimuthDeg?: number;
  openSides?: number;
  morningFacade?: FacadeId;
  afternoonFacade?: FacadeId;
  openPairOpposite?: boolean | null;
  cuacaEkstremScore?: number | null;
}): VentilationResult {
  const buildingAzimuthDeg = ((args.buildingAzimuthDeg ?? 0) % 360 + 360) % 360;
  const n = Math.max(0, Math.min(4, args.openSides ?? 2));
  const morningFacade = args.morningFacade ?? 'kanan';
  const afternoonFacade = args.afternoonFacade ?? 'kiri';
  const normals = facadeNormals(buildingAzimuthDeg);
  const oppositeSun =
    angularDistanceDeg(normals[morningFacade], normals[afternoonFacade]) >= 150;

  const openPairOpposite =
    args.openPairOpposite == null ? (n === 2 ? oppositeSun : n >= 3) : args.openPairOpposite;

  const openLayout = resolveOpenLayout(n, openPairOpposite);
  const crossVentPossible =
    (openLayout === 'berlawanan' || openLayout === 'tiga_plus') && oppositeSun;

  let score = ({ 0: 10, 1: 35, 2: 55, 3: 78, 4: 88 } as Record<number, number>)[n] ?? 55;
  if (openLayout === 'berlawanan') score += 18;
  else if (openLayout === 'tiga_plus') score += 12;
  else if (openLayout === 'bersebelahan') score += 4;
  if (crossVentPossible) score += 8;
  if (args.cuacaEkstremScore != null && args.cuacaEkstremScore >= 67) score -= 8;
  score = Math.max(0, Math.min(100, score));

  const recommendations: string[] = [];
  if (crossVentPossible) {
    recommendations.push(
      `Ventilasi silang feasible: tempatkan bukaan pada sisi ${morningFacade} (pagi/inlet) dan ${afternoonFacade} (outlet) — jalur udara menembus denah.`,
    );
  } else if (n >= 2) {
    recommendations.push(
      'Dua bukaan bersebelahan kurang ideal untuk silang — geser salah satu jendela ke dinding berlawanan.',
    );
  } else {
    recommendations.push(
      'Satu sisi terbuka → udara terjebak. Tambah lubang keluar di dinding berlawanan (klesten / roster).',
    );
  }

  recommendations.push(
    `Utamakan jendela operasional / roster di sisi ${morningFacade}; di sisi ${afternoonFacade} gunakan kisi + overhang agar panas sore tidak masuk penuh.`,
  );

  if (args.cuacaEkstremScore != null && args.cuacaEkstremScore >= 67) {
    recommendations.push(
      `Cuaca ekstrem InaRISK skor ${args.cuacaEkstremScore} (informational): tetap sediakan ventilasi silang, tapi lengkapi dengan sunshade, kosen kuat, dan opsi penutup saat angin kencang — tidak menaikkan skor kelayakan lahan.`,
    );
  } else if (args.cuacaEkstremScore != null && args.cuacaEkstremScore >= 34) {
    recommendations.push(
      `Cuaca ekstrem sedang (${args.cuacaEkstremScore}): pertimbangkan kisi digeser & talang cukup — informational.`,
    );
  }

  if (n >= 3) {
    recommendations.push(
      'Tiga+ sisi terbuka: jaga privasi/keamanan dengan roster tinggi + vegetasi tanpa menutup aliran.',
    );
  }

  return {
    openSides: n,
    openLayout,
    buildingAzimuthDeg,
    morningFacade,
    afternoonFacade,
    crossVentPossible,
    score,
    label: labelFromScore(score),
    cuacaEkstremScore: args.cuacaEkstremScore ?? null,
    recommendations,
    informational: true,
    note: VENTILATION_NOTE,
  };
}
