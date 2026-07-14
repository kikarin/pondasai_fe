import area from '@turf/area';
import length from '@turf/length';
import { lineString, polygon } from '@turf/helpers';
import type { Feature, Polygon } from 'geojson';
import type { Coordinates, LandDimensions } from '../types';

export interface PolygonMetrics {
  areaM2: number;
  perimeterM: number;
}

export function dimensionsKey(dimensions: LandDimensions): string {
  return `${dimensions.width ?? ''}:${dimensions.length ?? ''}:${dimensions.area ?? ''}`;
}

export function polygonMatchesDimensions(
  feature: Feature<Polygon> | null | undefined,
  dimensions: LandDimensions,
): boolean {
  if (!feature?.properties) return false;
  const storedKey = feature.properties.sourceDimensionsKey;
  if (typeof storedKey !== 'string') return false;
  return storedKey === dimensionsKey(dimensions);
}

export function createInitialPolygon(
  center: Coordinates,
  dimensions: LandDimensions,
): Feature<Polygon> {
  const widthM = dimensions.width ?? (dimensions.area ? Math.sqrt(dimensions.area) : 10);
  const lengthM = dimensions.length ?? (dimensions.area ? Math.sqrt(dimensions.area) : 15);

  const latRad = (center.lat * Math.PI) / 180;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos(latRad);

  const halfWidthDeg = widthM / 2 / metersPerDegreeLng;
  const halfLengthDeg = lengthM / 2 / metersPerDegreeLat;

  const ring = [
    [center.lng - halfWidthDeg, center.lat - halfLengthDeg],
    [center.lng + halfWidthDeg, center.lat - halfLengthDeg],
    [center.lng + halfWidthDeg, center.lat + halfLengthDeg],
    [center.lng - halfWidthDeg, center.lat + halfLengthDeg],
    [center.lng - halfWidthDeg, center.lat - halfLengthDeg],
  ];

  const feature = polygon([ring]);
  return withPolygonMetrics({
    ...feature,
    id: crypto.randomUUID(),
    properties: {
      mode: 'polygon',
      sourceDimensionsKey: dimensionsKey(dimensions),
      ...(feature.properties ?? {}),
    },
  });
}

export function withPolygonMetrics(feature: Feature<Polygon>): Feature<Polygon> {
  const metrics = calculatePolygonMetrics(feature);
  return {
    ...feature,
    properties: {
      ...(feature.properties ?? {}),
      area_m2: metrics.areaM2,
      perimeter_m: metrics.perimeterM,
    },
  };
}

export function calculatePolygonMetrics(feature: Feature<Polygon>): PolygonMetrics {
  const areaM2 = Math.round(area(feature));
  const ring = feature.geometry.coordinates[0];
  const perimeterM = Math.round(length(lineString(ring), { units: 'meters' }));
  return { areaM2, perimeterM };
}
