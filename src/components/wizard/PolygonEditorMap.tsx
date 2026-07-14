import { useEffect, useRef, type MutableRefObject } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { bbox } from '@turf/turf';
import type { Feature, Polygon } from 'geojson';
import type { Coordinates } from '../../types';
import { DEFAULT_MAP_STYLE } from '../../services/geocodeService';
import { upsertPolygonLayers, removePolygonLayers } from '../../utils/mapPolygonLayers';
import {
  getEditableRing,
  insertPolygonVertexAfter,
  midpoint,
  updatePolygonVertex,
} from '../../utils/polygonEdit';

type PolygonEditorMapProps = {
  coordinates: Coordinates;
  feature: Feature<Polygon>;
  onFeatureChange: (feature: Feature<Polygon>) => void;
  onReadyChange?: (ready: boolean) => void;
};

function createVertexElement(isMidpoint = false) {
  const el = document.createElement('div');
  el.className = isMidpoint
    ? 'w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow cursor-pointer'
    : 'w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow cursor-grab active:cursor-grabbing';
  el.style.zIndex = isMidpoint ? '12' : '11';
  el.style.pointerEvents = 'auto';
  return el;
}

function applyFeatureChange(
  featureRef: MutableRefObject<Feature<Polygon>>,
  onFeatureChangeRef: MutableRefObject<(feature: Feature<Polygon>) => void>,
  next: Feature<Polygon>,
) {
  featureRef.current = next;
  onFeatureChangeRef.current(next);
}

export function PolygonEditorMap({
  coordinates,
  feature,
  onFeatureChange,
  onReadyChange,
}: PolygonEditorMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vertexMarkersRef = useRef<maplibregl.Marker[]>([]);
  const midpointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const featureRef = useRef(feature);
  const onFeatureChangeRef = useRef(onFeatureChange);

  featureRef.current = feature;
  onFeatureChangeRef.current = onFeatureChange;

  const clearMarkers = () => {
    vertexMarkersRef.current.forEach((marker) => marker.remove());
    midpointMarkersRef.current.forEach((marker) => marker.remove());
    vertexMarkersRef.current = [];
    midpointMarkersRef.current = [];
  };

  const syncVertexMarkers = (map: maplibregl.Map, current: Feature<Polygon>) => {
    clearMarkers();

    const ring = getEditableRing(current);
    ring.forEach((coord, index) => {
      const marker = new maplibregl.Marker({ element: createVertexElement(false), draggable: true })
        .setLngLat([coord[0], coord[1]])
        .addTo(map);

      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        const updated = updatePolygonVertex(featureRef.current, index, lng, lat);
        applyFeatureChange(featureRef, onFeatureChangeRef, updated);
      });

      vertexMarkersRef.current.push(marker);
    });

    ring.forEach((coord, index) => {
      const next = ring[(index + 1) % ring.length];
      const mid = midpoint(coord, next);
      const marker = new maplibregl.Marker({ element: createVertexElement(true), draggable: false })
        .setLngLat([mid[0], mid[1]])
        .addTo(map);

      const onMidpointClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const updated = insertPolygonVertexAfter(featureRef.current, index, mid[0], mid[1]);
        applyFeatureChange(featureRef, onFeatureChangeRef, updated);
      };

      marker.getElement().addEventListener('click', onMidpointClick);

      midpointMarkersRef.current.push(marker);
    });
  };

  useEffect(() => {
    const container = mapContainer.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: DEFAULT_MAP_STYLE,
      center: [coordinates.lng, coordinates.lat],
      zoom: 18,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const resizeMap = () => map.resize();
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container);
    requestAnimationFrame(resizeMap);

    map.on('load', () => {
      resizeMap();
      upsertPolygonLayers(map, featureRef.current);
      syncVertexMarkers(map, featureRef.current);

      const [minLng, minLat, maxLng, maxLat] = bbox(featureRef.current);
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 80, maxZoom: 19, duration: 0 },
      );

      onReadyChange?.(true);
    });

    return () => {
      onReadyChange?.(false);
      resizeObserver.disconnect();
      clearMarkers();
      if (mapRef.current) {
        removePolygonLayers(mapRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates.lat, coordinates.lng, onReadyChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    upsertPolygonLayers(map, feature);
    syncVertexMarkers(map, feature);
  }, [feature]);

  return (
    <div className="absolute inset-0 pondasi-map-host">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
