/**
 * Flood scenario V2 — fungsi murni (view layer di FE).
 * Mirror logika `be/app/services/scenario/flood_scenario.py`.
 * @see docs/v2-scenario-contract.md
 */

import type {
  FloodScenarioCm,
  FloodScenarioInputs,
  FloodScenarioStatus,
  FloodScenarioView,
} from '../types/scenario';
import { FLOOD_SCENARIO_DISCLAIMER } from '../types/scenario';

const SCORE_TINGGI = 67;
const SCORE_SEDANG = 34;

const GREEN_ADVISORY =
  'Bahaya resmi InaRISK banjir rendah/hijau — skenario tetap bisa disimulasikan secara ilustratif, bukan prediksi kejadian.';

function categoryNorm(banjirCategory: string | null | undefined): string {
  return (banjirCategory || '').trim().toLowerCase();
}

export function isOfficialFloodLow(
  banjirScore: number | null | undefined,
  banjirCategory: string | null | undefined,
): boolean {
  const cat = categoryNorm(banjirCategory);
  if (banjirScore === 0) return true;
  if (cat === 'rendah') return true;
  if (banjirScore != null && banjirScore < SCORE_SEDANG && (cat === '' || cat === 'rendah')) {
    return true;
  }
  return false;
}

export function defaultFloodScenarioCm(
  banjirScore: number | null | undefined,
  banjirCategory?: string | null,
): FloodScenarioCm {
  const cat = categoryNorm(banjirCategory);
  if (cat === 'tinggi' || (banjirScore != null && banjirScore >= SCORE_TINGGI)) return 50;
  if (cat === 'sedang' || (banjirScore != null && banjirScore >= SCORE_SEDANG)) return 20;
  return 0;
}

export function evaluateFloodScenario(args: {
  banjirScore: number | null;
  floorElevationCm: number;
  scenarioCm: FloodScenarioCm;
  banjirCategory?: string | null;
  siteBlocked?: boolean;
}): FloodScenarioView {
  const floorCm = Math.max(0, Number(args.floorElevationCm) || 0);
  const scenarioCm = args.scenarioCm;
  const reasons: string[] = [];
  let waterAbovePlinthCm: number;
  let status: FloodScenarioStatus;

  if (scenarioCm === 0) {
    waterAbovePlinthCm = floorCm > 0 ? -floorCm : 0;
    status = 'aman';
    reasons.push('Skenario Normal (0 cm): baseline kering, tanpa genangan tersimulasi.');
    if (floorCm > 0) {
      reasons.push(`Elevasi lantai rekomendasi +${floorCm} cm di atas tanah.`);
    }
  } else {
    waterAbovePlinthCm = scenarioCm - floorCm;
    if (waterAbovePlinthCm < 0) {
      status = 'aman';
      reasons.push(
        `Air skenario ${scenarioCm} cm masih ${Math.abs(waterAbovePlinthCm)} cm di bawah lantai (+${floorCm} cm).`,
      );
    } else if (waterAbovePlinthCm === 0) {
      status = 'tergenang_plinth';
      reasons.push(
        `Air skenario ${scenarioCm} cm tepat menyentuh elevasi lantai (+${floorCm} cm) — plinth tergenang.`,
      );
    } else {
      status = 'masuk_lantai';
      reasons.push(
        `Air skenario ${scenarioCm} cm masuk ${waterAbovePlinthCm} cm di atas lantai (+${floorCm} cm).`,
      );
    }
  }

  if (isOfficialFloodLow(args.banjirScore, args.banjirCategory)) {
    reasons.push(GREEN_ADVISORY);
  } else if (args.banjirCategory) {
    reasons.push(
      `Kategori bahaya banjir InaRISK: ${args.banjirCategory} (skor ${args.banjirScore ?? '—'}) — tidak diubah slider.`,
    );
  } else if (args.banjirScore != null) {
    reasons.push(`Skor bahaya banjir InaRISK: ${args.banjirScore}/100 — tidak diubah slider.`);
  }

  if (args.siteBlocked) {
    reasons.push('Site guard aktif — simulasi bersifat advisory, bukan penilaian layak bangun.');
  }

  return {
    scenarioCm,
    waterAbovePlinthCm,
    status,
    reasons,
    disclaimer: FLOOD_SCENARIO_DISCLAIMER,
  };
}

export function evaluateFloodScenarioFromInputs(
  inputs: FloodScenarioInputs,
  scenarioCm: FloodScenarioCm,
): FloodScenarioView {
  return evaluateFloodScenario({
    banjirScore: inputs.banjirScore,
    floorElevationCm: inputs.floorElevationCm,
    scenarioCm,
    banjirCategory: inputs.banjirCategory,
    siteBlocked: inputs.siteBlocked,
  });
}
