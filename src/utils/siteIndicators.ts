import type { SiteAnalysisData } from '../types';
import { scoreCategoryFromValue } from './riskUi';

export function formatRiverDistanceM(riverDistance: SiteAnalysisData['riverDistance']): string {
  const isAvailable =
    riverDistance.available !== false &&
    riverDistance.value !== null &&
    riverDistance.value !== undefined;

  if (isAvailable) {
    return `${riverDistance.value} meter`;
  }
  return 'Tidak tersedia';
}

export function elevationIndicatorSubtitle(
  elevation: SiteAnalysisData['elevation'],
  score: number,
): string {
  const value = elevation.value;
  const base = `${value} mdpl — ${elevation.description}`;

  if (score <= 33) {
    return `${base} DPL di lokasi ini tergolong tinggi — konteks fisik relatif aman terhadap genangan banjir.`;
  }
  if (score <= 66) {
    return `${base} DPL menengah — tetap pertimbangkan elevasi lantai dan drainase perimeter.`;
  }
  return `${base} DPL rendah — risiko genangan relatif lebih tinggi; prioritaskan elevasi bangunan dan saluran.`;
}

export function riverIndicatorSubtitle(
  riverDistance: SiteAnalysisData['riverDistance'],
  score: number,
): string {
  const dist = formatRiverDistanceM(riverDistance);
  const desc = riverDistance.description?.trim();
  const base = desc ? `${dist} — ${desc}` : dist;

  if (riverDistance.available === false || riverDistance.value == null) {
    return `${base} Data saluran terbatas — indikator jarak sungai bersifat perkiraan.`;
  }

  const meters = riverDistance.value;
  if (score <= 33) {
    return `${base} Jarak ${meters} m ke saluran/drainase tergolong jauh — konteks banjir dari sungai relatif rendah.`;
  }
  if (score <= 66) {
    return `${base} Jarak ${meters} m ke saluran sedang — perhatikan drainase, elevasi plinth, dan genangan lokal.`;
  }
  return `${base} Hanya ${meters} m dari saluran/drainase — risiko banjir dari proximity tinggi; mitigasi drainase wajib.`;
}

export function overallCategoryLabel(
  score: number,
  engineCategory?: string | null,
): string {
  if (engineCategory === 'Tinggi' || engineCategory === 'Sedang' || engineCategory === 'Rendah') {
    return engineCategory;
  }
  return scoreCategoryFromValue(score);
}
