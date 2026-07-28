import { useEffect } from 'react';
import { Users, LayoutDashboard, Home, DollarSign, Layers3 } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';

export function HouseRequirementsStep() {
  const { requirements, setHouseRequirements, runDesignAnalysis, analysisError, isPending, dimensions, polygonGeoJson } =
    usePondasiWorkspace();

  const landAreaFromPolygon = (() => {
    if (polygonGeoJson && typeof polygonGeoJson === 'object') {
      const props = (polygonGeoJson as { properties?: { area_m2?: number } }).properties;
      if (props?.area_m2) return props.area_m2;
    }
    if (dimensions.area) return dimensions.area;
    if (dimensions.width && dimensions.length) return dimensions.width * dimensions.length;
    return 0;
  })();

  const maxFloorsAllowed = landAreaFromPolygon >= 120 ? 3 : landAreaFromPolygon >= 80 ? 2 : 1;

  useEffect(() => {
    if (requirements.floors > maxFloorsAllowed) {
      setHouseRequirements((prev) => ({ ...prev, floors: maxFloorsAllowed }));
    }
  }, [maxFloorsAllowed, requirements.floors, setHouseRequirements]);

  const handleNext = () => {
    void runDesignAnalysis();
  };

  const isValid =
    requirements.residents >= 1 &&
    requirements.rooms >= 1 &&
    requirements.floors >= 1 &&
    requirements.floors <= maxFloorsAllowed;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-[#0F1423] border border-[#1F293D] rounded-2xl p-8 space-y-8 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mx-auto border border-amber-500/20">
            <Home className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Kebutuhan Rumah</h2>
          <p className="text-xs text-gray-400">
            Rekomendasi struktur dan denah berdasarkan kebutuhan penghuni (analisis desain).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Jumlah Penghuni
            </label>
            <div className="flex items-center bg-[#141A2D] border border-[#23324E] rounded-lg p-1">
              <input
                type="range"
                min="1"
                max="10"
                value={requirements.residents}
                onChange={(e) => setHouseRequirements((prev) => ({ ...prev, residents: Number(e.target.value) }))}
                className="w-full mx-3"
              />
              <span className="w-12 text-center text-white font-mono text-sm">{requirements.residents}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-emerald-400" /> Jumlah Kamar Tidur
            </label>
            <div className="flex items-center bg-[#141A2D] border border-[#23324E] rounded-lg p-1">
              <input
                type="range"
                min="1"
                max="6"
                value={requirements.rooms}
                onChange={(e) => setHouseRequirements((prev) => ({ ...prev, rooms: Number(e.target.value) }))}
                className="w-full mx-3"
              />
              <span className="w-12 text-center text-white font-mono text-sm">{requirements.rooms}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-purple-400" /> Jumlah Lantai
            </label>
            <p className="text-[10px] text-gray-500 font-mono">
              Maks {maxFloorsAllowed} lantai untuk lahan ~{Math.round(landAreaFromPolygon) || '—'} m²
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((floorCount) => (
                <button
                  key={floorCount}
                  type="button"
                  disabled={floorCount > maxFloorsAllowed}
                  onClick={() => setHouseRequirements((prev) => ({ ...prev, floors: floorCount }))}
                  className={`py-3 rounded-lg text-sm font-bold border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    requirements.floors === floorCount
                      ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                      : 'bg-[#141A2D] border-[#23324E] text-gray-400 hover:text-white'
                  }`}
                >
                  {floorCount} Lantai
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" /> Budget Tersedia (Opsional)
            </label>
            <input
              type="number"
              min="0"
              value={requirements.budget || ''}
              onChange={(e) => {
                const raw = e.target.value;
                setHouseRequirements((prev) => ({
                  ...prev,
                  budget: raw === '' ? undefined : Number(raw),
                }));
              }}
              placeholder="Rp (Kosongkan jika tidak ada)"
              className="w-full bg-[#141A2D] border border-[#23324E] focus:border-yellow-500 focus:outline-none px-4 py-3 rounded-lg text-white font-mono text-sm"
            />
            <p className="text-[10px] text-gray-500">
              Budget memengaruhi coverage bangunan (luas footprint) saat analisis desain.
            </p>
          </div>
        </div>

        {analysisError ? <p className="text-xs text-red-400 text-center">{analysisError}</p> : null}

        <div className="pt-6 border-t border-[#1F293D]">
          <button
            onClick={handleNext}
            disabled={!isValid || isPending}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition transform hover:-translate-y-0.5 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Jalankan Analisis Desain
          </button>
        </div>
      </div>
    </div>
  );
}
