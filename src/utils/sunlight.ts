/**
 * Sunlight analysis V2 — mirror BE (deterministic, no AI math).
 * @see docs/task-v2.md Fase 3
 */

export type SampleDateKey = 'equinox' | 'june_solstice' | 'december_solstice';
export type FacadeId = 'depan' | 'kanan' | 'belakang' | 'kiri';

export const SAMPLE_DATE_OPTIONS: { key: SampleDateKey; label: string }[] = [
  { key: 'equinox', label: 'Equinox (~21 Mar)' },
  { key: 'june_solstice', label: 'Solstice (~21 Jun)' },
  { key: 'december_solstice', label: 'Solstice (~21 Des)' },
];

const SAMPLE_DOY: Record<SampleDateKey, number> = {
  equinox: 80,
  june_solstice: 172,
  december_solstice: 355,
};

export const SUNLIGHT_NOTE =
  'Analisis matahari konsep pra-desain — azimuth dari rumus astronomi sederhana, bukan simulasi bayangan akurat / CFD.';

export interface SunlightResult {
  sampleKey: SampleDateKey;
  sampleLabel: string;
  dayOfYear: number;
  latitude: number;
  longitude: number;
  buildingAzimuthDeg: number;
  declinationDeg: number;
  sunriseAzimuthDeg: number;
  sunsetAzimuthDeg: number;
  morningFacade: FacadeId;
  afternoonFacade: FacadeId;
  recommendations: string[];
  note: string;
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

export function solarDeclinationDeg(dayOfYear: number): number {
  return 23.45 * Math.sin(toRad((360 / 365) * (dayOfYear - 81)));
}

export function angularDistanceDeg(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

export function solarAzimuthDeg(latDeg: number, declDeg: number, hourAngleDeg: number): number {
  const phi = toRad(latDeg);
  const delta = toRad(declDeg);
  const h = toRad(hourAngleDeg);
  const x = -Math.cos(delta) * Math.sin(h);
  const y = Math.sin(delta) * Math.cos(phi) - Math.cos(delta) * Math.sin(phi) * Math.cos(h);
  return ((toDeg(Math.atan2(x, y)) % 360) + 360) % 360;
}

function sunriseHourAngleDeg(latDeg: number, declDeg: number): number {
  const phi = toRad(latDeg);
  const delta = toRad(declDeg);
  let cosW = -Math.tan(phi) * Math.tan(delta);
  cosW = Math.max(-1, Math.min(1, cosW));
  return toDeg(Math.acos(cosW));
}

export function facadeNormals(buildingAzimuthDeg: number): Record<FacadeId, number> {
  const a = ((buildingAzimuthDeg % 360) + 360) % 360;
  return {
    depan: a,
    kanan: (a + 90) % 360,
    belakang: (a + 180) % 360,
    kiri: (a + 270) % 360,
  };
}

export function closestFacade(targetAz: number, normals: Record<FacadeId, number>): FacadeId {
  const keys = Object.keys(normals) as FacadeId[];
  return keys.reduce((best, key) =>
    angularDistanceDeg(normals[key], targetAz) < angularDistanceDeg(normals[best], targetAz)
      ? key
      : best,
  );
}

function recommendations(morning: FacadeId, afternoon: FacadeId, latDeg: number): string[] {
  const recs = [
    `Sisi ${morning}: pencahayaan pagi lembut — cocok untuk ruang tamu / ruang makan / bukaan utama.`,
    `Sisi ${afternoon}: paparan sore lebih keras di lintang tropis — kurangi kaca lebar, pertimbangkan sunshade/kisi.`,
  ];
  if (Math.abs(latDeg) < 23.5) {
    recs.push(
      'Lintang tropis: atap overhang + ventilasi silang membantu; utamakan naungan sisi barat (sore).',
    );
  }
  if (morning === afternoon) {
    recs.push('Orientasi ekstrem (kutub/eksotis) — verifikasi ulang azimuth denah.');
  } else {
    recs.push(`Hindari menumpuk ruang istirahat di sisi ${afternoon} tanpa pelindung matahari.`);
  }
  return recs;
}

export function inferBuildingAzimuthFromOutline(
  outline: [number, number][] | undefined | null,
  fallback = 0,
): number {
  if (!outline || outline.length < 2) return fallback;
  let bestLen = -1;
  let bestBearing = fallback;
  for (let i = 0; i < outline.length; i++) {
    const [x1, y1] = outline[i];
    const [x2, y2] = outline[(i + 1) % outline.length];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length > bestLen) {
      bestLen = length;
      bestBearing = ((toDeg(Math.atan2(dx, dy)) % 360) + 360) % 360;
    }
  }
  return (bestBearing + 90) % 360;
}

export function evaluateSunlight(args: {
  latitude: number;
  longitude: number;
  buildingAzimuthDeg?: number;
  sample?: SampleDateKey;
}): SunlightResult {
  const sample = args.sample ?? 'equinox';
  const buildingAzimuthDeg = ((args.buildingAzimuthDeg ?? 0) % 360 + 360) % 360;
  const dayOfYear = SAMPLE_DOY[sample];
  const declinationDeg = solarDeclinationDeg(dayOfYear);
  const omega = sunriseHourAngleDeg(args.latitude, declinationDeg);
  const sunriseAzimuthDeg = Math.round(solarAzimuthDeg(args.latitude, declinationDeg, -omega) * 100) / 100;
  const sunsetAzimuthDeg = Math.round(solarAzimuthDeg(args.latitude, declinationDeg, omega) * 100) / 100;
  const normals = facadeNormals(buildingAzimuthDeg);
  const morningFacade = closestFacade(sunriseAzimuthDeg, normals);
  const afternoonFacade = closestFacade(sunsetAzimuthDeg, normals);
  const label = SAMPLE_DATE_OPTIONS.find((o) => o.key === sample)?.label ?? sample;

  return {
    sampleKey: sample,
    sampleLabel: label,
    dayOfYear,
    latitude: args.latitude,
    longitude: args.longitude,
    buildingAzimuthDeg,
    declinationDeg: Math.round(declinationDeg * 10000) / 10000,
    sunriseAzimuthDeg,
    sunsetAzimuthDeg,
    morningFacade,
    afternoonFacade,
    recommendations: recommendations(morningFacade, afternoonFacade, args.latitude),
    note: SUNLIGHT_NOTE,
  };
}
