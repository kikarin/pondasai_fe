import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Feature, Polygon } from 'geojson';
import { Loader2, MousePointer2, MousePointerSquareDashed, RotateCcw } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import {
  calculatePolygonMetrics,
  createInitialPolygon,
  dimensionsKey,
  polygonMatchesDimensions,
  withPolygonMetrics,
} from '../../utils/polygon';
import { PolygonEditorMap } from './PolygonEditorMap';

export function PolygonEditorStep() {
  const {
    coordinates,
    dimensions,
    polygonGeoJson,
    setPolygonGeoJson,
    syncProject,
    nextStep,
  } = usePondasiWorkspace();

  const dimensionsSignature = useMemo(() => dimensionsKey(dimensions), [dimensions]);

  const initialFeature = useMemo(() => {
    const existing = polygonGeoJson as Feature<Polygon> | null;
    if (existing && polygonMatchesDimensions(existing, dimensions)) {
      return existing;
    }
    return createInitialPolygon(coordinates, dimensions);
  }, [coordinates, dimensions, polygonGeoJson, dimensionsSignature]);

  const [feature, setFeature] = useState<Feature<Polygon>>(initialFeature);
  const [isReady, setIsReady] = useState(false);

  const metrics = useMemo(() => calculatePolygonMetrics(feature), [feature]);

  // Reset polygon hanya saat dimensi/lokasi berubah — bukan setiap edit vertex.
  useEffect(() => {
    setFeature(initialFeature);
  }, [dimensionsSignature, coordinates.lat, coordinates.lng]);

  const handleFeatureChange = useCallback(
    (next: Feature<Polygon>) => {
      const withMetrics = withPolygonMetrics(next);
      setFeature(withMetrics);
      setPolygonGeoJson(withMetrics);
    },
    [setPolygonGeoJson],
  );

  const handleResetToDimensions = () => {
    const reset = createInitialPolygon(coordinates, dimensions);
    handleFeatureChange(reset);
  };

  const handleContinue = async () => {
    await syncProject('EDIT_POLYGON', { polygonGeoJson: feature });
    nextStep();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-canvas">
      <div className="p-4 bg-surface border-b border-border flex flex-wrap items-center justify-between z-10 gap-4 shrink-0">
        <div className="space-y-1 min-w-[220px]">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <MousePointerSquareDashed className="w-4 h-4 text-accent" />
            Edit Polygon Lahan
          </h2>
          <p className="text-[10px] text-ink-muted max-w-md">
            Tarik titik biru sudut lahan. Klik titik hijau di tengah sisi untuk menambah vertex.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!isReady}
            className="px-3 py-2 rounded-lg text-[10px] font-bold border bg-accent border-accent text-white flex items-center gap-1.5 disabled:opacity-50"
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            Edit Titik
          </button>
          <button
            type="button"
            onClick={handleResetToDimensions}
            disabled={!isReady}
            className="px-3 py-2 rounded-lg text-[10px] font-bold border bg-surface-muted border-border text-ink-secondary hover:border-accent transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset dari Dimensi
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-surface-muted border border-border px-4 py-2 rounded-lg text-center">
            <span className="text-[10px] text-ink-muted font-bold uppercase tracking-widest block">Luas</span>
            <span className="text-sm font-bold text-accent font-mono">{metrics.areaM2} m²</span>
          </div>
          <div className="bg-surface-muted border border-border px-4 py-2 rounded-lg text-center">
            <span className="text-[10px] text-ink-muted font-bold uppercase tracking-widest block">Keliling</span>
            <span className="text-sm font-bold text-success font-mono">{metrics.perimeterM} m</span>
          </div>
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={!isReady || metrics.areaM2 <= 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-900/30 disabled:opacity-50"
          >
            Kunci Area & Lanjut
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[420px] relative">
        {!isReady ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/50">
            <div className="text-center space-y-2 bg-surface border border-border rounded-xl px-5 py-4 shadow-sm">
              <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto" />
              <p className="text-xs text-ink-muted">Memuat peta &amp; polygon lahan...</p>
            </div>
          </div>
        ) : null}
        <PolygonEditorMap
          coordinates={coordinates}
          feature={feature}
          onFeatureChange={handleFeatureChange}
          onReadyChange={setIsReady}
        />
      </div>
    </div>
  );
}
