import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { bbox } from '@turf/turf';
import type { Feature, Polygon } from 'geojson';
import type { Coordinates, LandDimensions } from '../../types';
import { DEFAULT_MAP_STYLE } from '../../services/geocodeService';
import {
  calculatePolygonMetrics,
  createInitialPolygon,
  dimensionsKey,
} from '../../utils/polygon';
import { upsertPolygonLayers } from '../../utils/mapPolygonLayers';

type LandPolygonPreviewProps = {
  coordinates: Coordinates;
  dimensions: LandDimensions;
  hasValidInput: boolean;
};

export function LandPolygonPreview({ coordinates, dimensions, hasValidInput }: LandPolygonPreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const mapLoadedRef = useRef(false);

  const previewFeature = useMemo(() => {
    if (!hasValidInput) return null;
    return createInitialPolygon(coordinates, dimensions);
  }, [coordinates, dimensions, hasValidInput]);

  const metrics = useMemo(() => {
    if (!previewFeature) return null;
    return calculatePolygonMetrics(previewFeature);
  }, [previewFeature]);

  const dimensionsSignature = dimensionsKey(dimensions);

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

    markerRef.current = new maplibregl.Marker({ color: '#3B82F6' })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map);

    const resizeMap = () => {
      map.resize();
    };

    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container);
    requestAnimationFrame(resizeMap);

    map.on('load', () => {
      mapLoadedRef.current = true;
      resizeMap();
    });

    return () => {
      mapLoadedRef.current = false;
      resizeObserver.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates.lat, coordinates.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyPreview = () => {
      upsertPolygonLayers(map, previewFeature);

      if (previewFeature) {
        const [minLng, minLat, maxLng, maxLat] = bbox(previewFeature);
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 48, maxZoom: 19, duration: previewFeature ? 600 : 0 },
        );
      } else {
        map.flyTo({ center: [coordinates.lng, coordinates.lat], zoom: 17, essential: true });
      }
    };

    if (mapLoadedRef.current && map.isStyleLoaded()) {
      applyPreview();
      return;
    }

    map.once('load', applyPreview);
  }, [coordinates.lat, coordinates.lng, dimensionsSignature, previewFeature]);

  return (
    <div className="bg-[#0F1423] border border-[#1F293D] rounded-2xl overflow-hidden flex flex-col h-full min-h-[360px]">
      <div className="px-4 py-3 border-b border-[#1F293D] flex items-center justify-between gap-3 shrink-0">
        <div>
          <p className="text-xs font-bold text-white uppercase tracking-wider">Preview Polygon Lahan</p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
            Perkiraan bentuk awal di lokasi proyek
          </p>
        </div>
        {metrics ? (
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="text-blue-400">{metrics.areaM2} m²</span>
            <span className="text-gray-600">|</span>
            <span className="text-emerald-400">{metrics.perimeterM} m</span>
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-h-[280px] relative">
        <div className="absolute inset-0 pondasi-map-host">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
        {!hasValidInput ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0E131F]/55 pointer-events-none">
            <p className="text-xs text-gray-400 text-center px-6">
              Isi lebar &amp; panjang, atau total luas, untuk melihat preview polygon.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
