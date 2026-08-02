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
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
      <div className="max-w-2xl w-full bg-surface border border-border rounded-2xl p-8 space-y-8 shadow-sm">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto border border-amber-100">
            <Home className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-ink tracking-tight">Kebutuhan Rumah</h2>
          <p className="text-xs text-ink-muted">
            Rekomendasi struktur dan denah berdasarkan kebutuhan penghuni (analisis desain).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" /> Jumlah Penghuni
            </label>
            <div className="flex items-center bg-surface-muted border border-border rounded-lg p-1">
              <input
                type="range"
                min="1"
                max="10"
                value={requirements.residents}
                onChange={(e) => setHouseRequirements((prev) => ({ ...prev, residents: Number(e.target.value) }))}
                className="w-full mx-3"
              />
              <span className="w-12 text-center text-ink font-mono text-sm">{requirements.residents}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-success" /> Jumlah Kamar Tidur
            </label>
            <div className="flex items-center bg-surface-muted border border-border rounded-lg p-1">
              <input
                type="range"
                min="1"
                max="6"
                value={requirements.rooms}
                onChange={(e) => setHouseRequirements((prev) => ({ ...prev, rooms: Number(e.target.value) }))}
                className="w-full mx-3"
              />
              <span className="w-12 text-center text-ink font-mono text-sm">{requirements.rooms}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-violet-600" /> Jumlah Lantai
            </label>
            <p className="text-[10px] text-ink-muted">
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
                      ? 'bg-violet-50 border-violet-400 text-violet-700'
                      : 'bg-surface-muted border-border text-ink-muted hover:text-ink'
                  }`}
                >
                  {floorCount} Lantai
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" /> Budget Tersedia (Opsional)
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
              className="w-full bg-surface-muted border border-border focus:border-amber-500 focus:outline-none px-4 py-3 rounded-lg text-ink font-mono text-sm"
            />
            <p className="text-[10px] text-ink-muted">
              Budget memengaruhi coverage bangunan (luas footprint) saat analisis desain.
            </p>
          </div>
        </div>

        {analysisError ? <p className="text-xs text-danger text-center">{analysisError}</p> : null}

        <div className="pt-6 border-t border-border">
          <button
            onClick={handleNext}
            disabled={!isValid || isPending}
            className="w-full py-4 bg-accent hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Jalankan Analisis Desain
          </button>
        </div>
      </div>
    </div>
  );
}
