import type { Feature, Polygon, Position } from 'geojson';
import { withPolygonMetrics } from './polygon';

export function getEditableRing(feature: Feature<Polygon>): Position[] {
  const ring = feature.geometry.coordinates[0];
  if (ring.length <= 1) return [...ring];
  const last = ring[ring.length - 1];
  const first = ring[0];
  if (last[0] === first[0] && last[1] === first[1]) {
    return ring.slice(0, -1);
  }
  return [...ring];
}

export function ringToPolygonCoordinates(ring: Position[]): Position[][] {
  if (ring.length < 3) return [ring];
  const first = ring[0];
  const last = ring[ring.length - 1];
  const closed =
    first[0] === last[0] && first[1] === last[1] ? ring : [...ring, [first[0], first[1]]];
  return [closed];
}

export function updatePolygonVertex(
  feature: Feature<Polygon>,
  vertexIndex: number,
  lng: number,
  lat: number,
): Feature<Polygon> {
  const editable = getEditableRing(feature);
  if (vertexIndex < 0 || vertexIndex >= editable.length) return feature;

  const nextRing = editable.map((coord, index) =>
    index === vertexIndex ? [lng, lat] satisfies Position : coord,
  );

  return withPolygonMetrics({
    ...feature,
    geometry: {
      type: 'Polygon',
      coordinates: ringToPolygonCoordinates(nextRing),
    },
  });
}

export function insertPolygonVertexAfter(
  feature: Feature<Polygon>,
  afterIndex: number,
  lng: number,
  lat: number,
): Feature<Polygon> {
  const editable = getEditableRing(feature);
  const insertAt = Math.min(afterIndex + 1, editable.length);
  const nextRing = [
    ...editable.slice(0, insertAt),
    [lng, lat] satisfies Position,
    ...editable.slice(insertAt),
  ];

  return withPolygonMetrics({
    ...feature,
    geometry: {
      type: 'Polygon',
      coordinates: ringToPolygonCoordinates(nextRing),
    },
  });
}

export function removePolygonVertex(feature: Feature<Polygon>, vertexIndex: number): Feature<Polygon> | null {
  const editable = getEditableRing(feature);
  if (editable.length <= 3) return null;

  const nextRing = editable.filter((_, index) => index !== vertexIndex);
  return withPolygonMetrics({
    ...feature,
    geometry: {
      type: 'Polygon',
      coordinates: ringToPolygonCoordinates(nextRing),
    },
  });
}

export function midpoint(a: Position, b: Position): Position {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
