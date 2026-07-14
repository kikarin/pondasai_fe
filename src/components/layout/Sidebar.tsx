import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import type { StepId } from '../../types';

const STEP_LABELS: Record<StepId, string> = {
  CHOOSE_LOCATION: '1. Pilih Lokasi Lahan',
  INPUT_LAND_DIMENSIONS: '2. Input Data Tanah',
  EDIT_POLYGON: '3. Area Bangunan',
  INPUT_REQUIREMENTS: '4. Kebutuhan Rumah',
  SITE_ANALYSIS: '5. Site Analysis',
  RECOMMENDATIONS: '6. Rekomendasi Teknis',
  FLOOR_PLAN: '7. Denah 2D (Beta)',
  PREVIEW_3D: '8. Preview 3D (Beta)',
  MATERIAL_LIST: '9. Material List',
  PDF_REPORT: '10. PDF Report',
};

export function Sidebar() {
  const { currentStep, steps, goToStep, isStepAccessible, isStepComplete, siteAnalysis } = usePondasiWorkspace();
  const currentIndex = steps.indexOf(currentStep);

  return (
    <aside
      id="sidebar-rail"
      className="w-[280px] bg-[#0E131F] border-r border-[#1F293D] flex flex-col shrink-0"
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-[#1F293D] shrink-0">
          <AppLogo to="/" showTagline />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <span className="px-3 text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider block mb-4">
            Alur Perencanaan
          </span>

          {!siteAnalysis ? (
            <p className="px-3 mb-3 text-[10px] text-amber-400/90 leading-relaxed">
              Step 5–10 terkunci sampai analisis lahan selesai di Step 4.
            </p>
          ) : null}

          {steps.map((step, idx) => {
            const completed = isStepComplete(step);
            const isActive = idx === currentIndex;
            const accessible = isStepAccessible(step);
            const isLocked = !accessible;

            return (
              <button
                key={step}
                type="button"
                disabled={isLocked}
                onClick={() => goToStep(step)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : completed
                      ? 'text-gray-300 hover:bg-[#151D30] border border-transparent'
                      : isLocked
                        ? 'text-gray-600 border border-transparent opacity-50 cursor-not-allowed'
                        : 'text-gray-500 border border-transparent hover:bg-[#151D30]'
                }`}
              >
                {completed && !isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 text-gray-600 shrink-0" />
                ) : isActive ? (
                  <Circle className="w-4 h-4 text-blue-400 fill-blue-500/20 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-600 shrink-0" />
                )}
                <span className="text-left leading-tight">{STEP_LABELS[step]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
