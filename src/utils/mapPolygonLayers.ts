import type maplibregl from 'maplibre-gl';
import type { Feature, Polygon } from 'geojson';

export const POLYGON_SOURCE_ID = 'pondasi-polygon-source';
export const POLYGON_FILL_LAYER_ID = 'pondasi-polygon-fill';
export const POLYGON_LINE_LAYER_ID = 'pondasi-polygon-line';

export function upsertPolygonLayers(map: maplibregl.Map, feature: Feature<Polygon> | null) {
  const existingSource = map.getSource(POLYGON_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

  if (!feature) {
    if (existingSource) {
      existingSource.setData({ type: 'FeatureCollection', features: [] });
    }
    return;
  }

  const data: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [feature],
  };

  if (existingSource) {
    existingSource.setData(data);
    return;
  }

  map.addSource(POLYGON_SOURCE_ID, { type: 'geojson', data });
  map.addLayer({
    id: POLYGON_FILL_LAYER_ID,
    type: 'fill',
    source: POLYGON_SOURCE_ID,
    paint: {
      'fill-color': '#3B82F6',
      'fill-opacity': 0.35,
    },
  });
  map.addLayer({
    id: POLYGON_LINE_LAYER_ID,
    type: 'line',
    source: POLYGON_SOURCE_ID,
    paint: {
      'line-color': '#60A5FA',
      'line-width': 2,
    },
  });
}

export function removePolygonLayers(map: maplibregl.Map) {
  if (map.getLayer(POLYGON_LINE_LAYER_ID)) map.removeLayer(POLYGON_LINE_LAYER_ID);
  if (map.getLayer(POLYGON_FILL_LAYER_ID)) map.removeLayer(POLYGON_FILL_LAYER_ID);
  if (map.getSource(POLYGON_SOURCE_ID)) map.removeSource(POLYGON_SOURCE_ID);
}
