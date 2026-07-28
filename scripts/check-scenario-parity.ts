import assert from 'node:assert/strict';
import {
  defaultFloodScenarioCm,
  evaluateFloodScenario,
  isOfficialFloodLow,
} from '../src/utils/floodScenario.ts';
import {
  defaultEarthquakeMagnitude,
  evaluateEarthquakeScenario,
  scoreTier,
} from '../src/utils/earthquakeScenario.ts';
import { evaluateSunlight } from '../src/utils/sunlight.ts';
import { evaluateVentilation } from '../src/utils/ventilation.ts';
import { toFloodTwinVisual, toEarthquakeTwinVisual } from '../src/utils/digitalTwin.ts';
import { TWIN_FLOOD_OVERLAY_READY, TWIN_EARTHQUAKE_OVERLAY_READY } from '../src/types/digitalTwin.ts';

assert.equal(defaultFloodScenarioCm(78, 'Tinggi'), 50);
assert.equal(defaultFloodScenarioCm(50, 'Sedang'), 20);
assert.equal(defaultFloodScenarioCm(0, 'Rendah'), 0);
assert.ok(isOfficialFloodLow(0, 'Rendah'));

const floodGreen = evaluateFloodScenario({
  banjirScore: 0,
  banjirCategory: 'Rendah',
  floorElevationCm: 20,
  scenarioCm: 50,
});
assert.equal(floodGreen.status, 'masuk_lantai');
assert.equal(floodGreen.waterAbovePlinthCm, 30);
assert.ok(floodGreen.reasons.some((r) => /rendah\/hijau/i.test(r)));

const floodAman = evaluateFloodScenario({
  banjirScore: 70,
  floorElevationCm: 40,
  scenarioCm: 20,
});
assert.equal(floodAman.status, 'aman');
assert.equal(floodAman.waterAbovePlinthCm, -20);

const floodA = evaluateFloodScenario({
  banjirScore: 78,
  banjirCategory: 'Tinggi',
  floorElevationCm: 40,
  scenarioCm: 50,
});
const floodB = evaluateFloodScenario({
  banjirScore: 78,
  banjirCategory: 'Tinggi',
  floorElevationCm: 40,
  scenarioCm: 50,
});
assert.deepEqual(floodA, floodB);
assert.ok(!('banjirScore' in floodA));
assert.ok(!('score' in floodA));

assert.equal(defaultEarthquakeMagnitude(80, 'Tinggi'), 6);
assert.equal(defaultEarthquakeMagnitude(20, 'Rendah'), 5);
assert.equal(scoreTier(80, 'Tinggi'), 'tinggi');

const eq = evaluateEarthquakeScenario({
  gempaScore: 80,
  gempaCategory: 'Tinggi',
  magnitude: 7,
  structureType: 'Confined Masonry',
});
assert.equal(eq.impactBand, 'berat');
assert.ok(!/%/.test(eq.illustrativeIntensity));
assert.ok(eq.reasons.some((r) => r.includes('80')));
assert.ok(!('gempaScore' in eq));

const sun = evaluateSunlight({
  latitude: -6.35,
  longitude: 106.78,
  buildingAzimuthDeg: 0,
  sample: 'equinox',
});
assert.ok(sun.sunriseAzimuthDeg > 70 && sun.sunriseAzimuthDeg < 110);
assert.ok(sun.sunsetAzimuthDeg > 250 && sun.sunsetAzimuthDeg < 290);
assert.notEqual(sun.morningFacade, sun.afternoonFacade);
assert.ok(
  sun.recommendations.some((r) => r.includes('Hindari menumpuk')),
  'FE mirrors BE non-equal facade reason',
);

const sun2 = evaluateSunlight({
  latitude: -6.35,
  longitude: 106.78,
  buildingAzimuthDeg: 0,
  sample: 'equinox',
});
assert.deepEqual(sun, sun2);

const vent = evaluateVentilation({
  buildingAzimuthDeg: 0,
  openSides: 2,
  morningFacade: sun.morningFacade,
  afternoonFacade: sun.afternoonFacade,
  openPairOpposite: true,
  cuacaEkstremScore: 90,
});
assert.ok(vent.score >= 0 && vent.score <= 100);
assert.ok(vent.crossVentPossible);
assert.equal(vent.cuacaEkstremScore, 90);

const ventAdj = evaluateVentilation({
  buildingAzimuthDeg: 0,
  openSides: 2,
  morningFacade: sun.morningFacade,
  afternoonFacade: sun.afternoonFacade,
  openPairOpposite: false,
  cuacaEkstremScore: 90,
});
assert.ok(vent.score >= ventAdj.score);

assert.equal(TWIN_FLOOD_OVERLAY_READY, true);
assert.equal(TWIN_EARTHQUAKE_OVERLAY_READY, true);

const twinFloodA = toFloodTwinVisual(floodA, 40);
const twinFloodB = toFloodTwinVisual(floodB, 40);
assert.deepEqual(twinFloodA, twinFloodB);
assert.equal(twinFloodA.waterHeightM, 0.5);
assert.equal(twinFloodA.enabled, true);
assert.equal(twinFloodA.color, '#0284c7');

const twinGreen = toFloodTwinVisual(floodGreen, 20);
assert.equal(twinGreen.enabled, true);
assert.equal(twinGreen.status, 'masuk_lantai');

const twinBlocked = toFloodTwinVisual(floodA, 40, true);
assert.equal(twinBlocked.enabled, false);

const twinEq = toEarthquakeTwinVisual(eq);
assert.equal(twinEq.enabled, true);
assert.equal(twinEq.shakeAmplitude, 0.1);
assert.ok(twinEq.highlightIds.includes('confined_masonry'));

const twinEqB = toEarthquakeTwinVisual(eq);
assert.deepEqual(twinEq, twinEqB);

const twinEqBlocked = toEarthquakeTwinVisual(eq, true);
assert.equal(twinEqBlocked.enabled, false);

const updateKeys = [
  'currentStep',
  'locationName',
  'coordinates',
  'dimensions',
  'polygonGeoJson',
  'requirements',
];
for (const forbidden of ['twinFloodCm', 'twinMagnitude', 'overall', 'riskEngine', 'site_analysis_json']) {
  assert.ok(!updateKeys.includes(forbidden));
}

console.log('check-scenario-parity: OK');
