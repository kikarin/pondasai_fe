import { ChevronLeft, ChevronRight, Layers3 } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';

export function DashboardHeader() {
  const { currentStep, steps, prevStep, nextStep, locationName, canProceed, isPending } = usePondasiWorkspace();

  const currentIndex = steps.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;
  const isBeforeAnalysis = currentStep === 'INPUT_REQUIREMENTS';

  return (
    <header
      id="dashboard-header"
      className="h-[76px] bg-[#0E131F]/80 backdrop-blur-md border-b border-[#1F293D] px-8 flex items-center justify-between shrink-0 sticky top-0 z-40"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Layers3 className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold text-white shrink-0">Proyek Aktif:</span>
          <span
            className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md font-bold inline-block max-w-[240px] sm:max-w-[420px] lg:max-w-[560px] truncate align-middle"
            title={locationName || 'Lokasi Baru'}
          >
            {locationName || 'Lokasi Baru'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isFirstStep && (
          <button
            type="button"
            onClick={prevStep}
            disabled={isPending}
            className="px-4 py-2 bg-[#121A2D] hover:bg-[#1A253E] border border-[#2E3C5C] hover:border-[#3E4F76] rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center gap-2 transition disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        )}

        {!isLastStep && !isBeforeAnalysis && (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceed || isPending}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-900/30 flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
