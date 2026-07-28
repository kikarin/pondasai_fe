/**
 * Earthquake scenario V2 — fungsi murni + rule table (mirror BE).
 * @see docs/v2-scenario-contract.md
 */

import type {
  EarthquakeImpactBand,
  EarthquakeMagnitudeScenario,
  EarthquakeScenarioInputs,
  EarthquakeScenarioView,
  StructureEmphasis,
  StructureHighlight,
} from '../types/scenario';
import { EARTHQUAKE_SCENARIO_DISCLAIMER } from '../types/scenario';

type ScoreTier = 'rendah' | 'sedang' | 'tinggi';

const SCORE_TINGGI = 67;
const SCORE_SEDANG = 34;

const IMPACT_TABLE: Record<ScoreTier, Record<EarthquakeMagnitudeScenario, EarthquakeImpactBand>> = {
  rendah: { 5: 'ringan', 6: 'ringan', 7: 'sedang' },
  sedang: { 5: 'ringan', 6: 'sedang', 7: 'berat' },
  tinggi: { 5: 'sedang', 6: 'berat', 7: 'berat' },
};

const INTENSITY_LABEL: Record<EarthquakeImpactBand, string> = {
  ringan: 'Konsep intensitas ringan (ilustratif)',
  sedang: 'Konsep intensitas sedang (ilustratif)',
  berat: 'Konsep intensitas berat (ilustratif)',
  unknown: 'Intensitas belum dihitung',
};

const STRUCTURE_CATALOG: { id: string; label: string }[] = [
  { id: 'confined_masonry', label: 'Confined masonry / dinding terkekang' },
  { id: 'ring_beam', label: 'Ring balok & sengkang rapat' },
  { id: 'foundation_tie', label: 'Pondasi menerus / tie-beam' },
  { id: 'light_roof', label: 'Atap ringan, hindari overhang berat' },
];

function categoryNorm(category: string | null | undefined): string {
  return (category || '').trim().toLowerCase();
}

export function scoreTier(
  gempaScore: number | null | undefined,
  gempaCategory?: string | null,
): ScoreTier {
  const cat = categoryNorm(gempaCategory);
  if (cat === 'tinggi' || (gempaScore != null && gempaScore >= SCORE_TINGGI)) return 'tinggi';
  if (cat === 'sedang' || (gempaScore != null && gempaScore >= SCORE_SEDANG)) return 'sedang';
  return 'rendah';
}

/** Default chip: Tinggi/Sedang → M6 · Rendah → M5. */
export function defaultEarthquakeMagnitude(
  gempaScore: number | null | undefined,
  gempaCategory?: string | null,
): EarthquakeMagnitudeScenario {
  const tier = scoreTier(gempaScore, gempaCategory);
  return tier === 'rendah' ? 5 : 6;
}

function structureHighlights(
  impact: EarthquakeImpactBand,
  structureType: string | null | undefined,
  foundationType: string | null | undefined,
): StructureHighlight[] {
  let emphasisById: Record<string, StructureEmphasis>;
  if (impact === 'berat') {
    emphasisById = {
      confined_masonry: 'focus',
      ring_beam: 'focus',
      foundation_tie: 'focus',
      light_roof: 'recommended',
    };
  } else if (impact === 'sedang') {
    emphasisById = {
      confined_masonry: 'recommended',
      ring_beam: 'focus',
      foundation_tie: 'recommended',
      light_roof: 'baseline',
    };
  } else {
    emphasisById = {
      confined_masonry: 'baseline',
      ring_beam: 'recommended',
      foundation_tie: 'baseline',
      light_roof: 'baseline',
    };
  }

  return STRUCTURE_CATALOG.map((item) => {
    let label = item.label;
    if (item.id === 'confined_masonry' && structureType) {
      label = `${item.label} → sistem: ${structureType}`;
    }
    if (item.id === 'foundation_tie' && foundationType) {
      label = `${item.label} → ${foundationType}`;
    }
    return {
      id: item.id,
      label,
      emphasis: emphasisById[item.id] ?? 'baseline',
    };
  });
}

export function evaluateEarthquakeScenario(args: {
  gempaScore: number | null;
  magnitude: EarthquakeMagnitudeScenario;
  structureType?: string | null;
  foundationType?: string | null;
  gempaCategory?: string | null;
  bmkgEventCount?: number | null;
  siteBlocked?: boolean;
}): EarthquakeScenarioView {
  const tier = scoreTier(args.gempaScore, args.gempaCategory);
  const impact = IMPACT_TABLE[tier][args.magnitude];
  const reasons: string[] = [
    `Skenario magnitudo M${args.magnitude} × tier bahaya InaRISK “${tier}” → band dampak konsep “${impact}”.`,
    'Band dampak bersifat edukatif dari tabel rule — bukan MMI / persen kerusakan di titik pin.',
  ];

  if (args.gempaCategory || args.gempaScore != null) {
    reasons.push(
      `Skor bahaya gempa InaRISK: ${args.gempaScore ?? '—'} (${args.gempaCategory ?? 'n/a'}) — tidak diubah slider.`,
    );
  }

  if (args.structureType) {
    reasons.push(`Rekomendasi struktur desain: ${args.structureType}.`);
  } else {
    reasons.push('Struktur desain belum tersedia — highlight memakai katalog mitigasi generik.');
  }

  if (args.bmkgEventCount != null && args.bmkgEventCount > 0) {
    reasons.push(
      `Konteks BMKG TEWS: ${args.bmkgEventCount} event dekat pin (informatif, tidak mengubah band).`,
    );
  }

  if (args.siteBlocked) {
    reasons.push('Site guard aktif — simulasi bersifat advisory, bukan penilaian layak bangun.');
  }

  return {
    magnitude: args.magnitude,
    impactBand: impact,
    illustrativeIntensity: INTENSITY_LABEL[impact],
    structureHighlights: structureHighlights(impact, args.structureType, args.foundationType),
    reasons,
    disclaimer: EARTHQUAKE_SCENARIO_DISCLAIMER,
  };
}

export function evaluateEarthquakeScenarioFromInputs(
  inputs: EarthquakeScenarioInputs,
  magnitude: EarthquakeMagnitudeScenario,
): EarthquakeScenarioView {
  return evaluateEarthquakeScenario({
    gempaScore: inputs.gempaScore,
    magnitude,
    structureType: inputs.structureType,
    foundationType: inputs.foundationType,
    gempaCategory: inputs.gempaCategory,
    bmkgEventCount: inputs.bmkgEventCount,
    siteBlocked: inputs.siteBlocked,
  });
}
