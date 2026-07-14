import { useState } from 'react';
import { Loader2, Ruler } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { createInitialPolygon } from '../../utils/polygon';
import { LandPolygonPreview } from './LandPolygonPreview';

export function LandDimensionsStep() {
  const {
    coordinates,
    dimensions,
    setLandDimensions,
    setPolygonGeoJson,
    syncProject,
    nextStep,
  } = usePondasiWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasValidInput = Boolean((dimensions.width && dimensions.length) || dimensions.area);

  const handleNext = async () => {
    if (!hasValidInput) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const initialPolygon = createInitialPolygon(coordinates, dimensions);
      setPolygonGeoJson(initialPolygon);
      await syncProject('INPUT_LAND_DIMENSIONS', {
        dimensions,
        polygonGeoJson: initialPolygon,
      });
      nextStep();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan dimensi tanah');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-[#0F1423] border border-[#1F293D] rounded-2xl p-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <Ruler className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Input Data Tanah</h2>
            <p className="text-xs text-gray-400">
              Masukkan estimasi ukuran atau luas tanah. Preview polygon di sebelah kanan akan
              diperbarui otomatis.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3 border-b border-[#1F293D] pb-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Opsi 1: Dimensi (Meter)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Lebar Lahan</label>
                  <input
                    type="number"
                    min="0"
                    value={dimensions.width || ''}
                    onChange={(e) =>
                      setLandDimensions((prev) => ({
                        ...prev,
                        width: Number(e.target.value),
                        area: undefined,
                      }))
                    }
                    className="w-full bg-[#141A2D] border border-[#23324E] focus:border-blue-500 focus:outline-none px-3 py-2 rounded-lg text-white font-mono"
                    placeholder="mis. 10"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Panjang Lahan</label>
                  <input
                    type="number"
                    min="0"
                    value={dimensions.length || ''}
                    onChange={(e) =>
                      setLandDimensions((prev) => ({
                        ...prev,
                        length: Number(e.target.value),
                        area: undefined,
                      }))
                    }
                    className="w-full bg-[#141A2D] border border-[#23324E] focus:border-blue-500 focus:outline-none px-3 py-2 rounded-lg text-white font-mono"
                    placeholder="mis. 15"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Opsi 2: Total Luas (m²)
              </label>
              <input
                type="number"
                min="0"
                value={dimensions.area || ''}
                onChange={(e) =>
                  setLandDimensions({
                    area: Number(e.target.value),
                    width: undefined,
                    length: undefined,
                  })
                }
                className="w-full bg-[#141A2D] border border-[#23324E] focus:border-emerald-500 focus:outline-none px-3 py-2 rounded-lg text-white font-mono"
                placeholder="mis. 150"
              />
            </div>

            {error ? <p className="text-xs text-red-400">{error}</p> : null}

            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={!hasValidInput || isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Buat Polygon
            </button>
          </div>
        </div>

        <LandPolygonPreview
          coordinates={coordinates}
          dimensions={dimensions}
          hasValidInput={hasValidInput}
        />
      </div>
    </div>
  );
}
