import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import type { StepId } from '../../types';

const STEP_SHORT: Record<StepId, string> = {
  CHOOSE_LOCATION: 'Pilih Lokasi',
  SITE_ANALYSIS: 'Analisis Risiko',
  INPUT_LAND_DIMENSIONS: 'Data Tanah',
  EDIT_POLYGON: 'Area Bangunan',
  INPUT_REQUIREMENTS: 'Kebutuhan',
  RECOMMENDATIONS: 'Rekomendasi',
  FLOOR_PLAN: 'Denah 2D',
  PREVIEW_3D: 'Preview 3D',
  MATERIAL_LIST: 'Material',
  PDF_REPORT: 'PDF Report',
};

export function DashboardHeader() {
  const { currentStep, steps, prevStep, nextStep, locationName, canProceed, isPending } =
    usePondasiWorkspace();

  const currentIndex = steps.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;
  const isBeforeAnalysis = currentStep === 'INPUT_REQUIREMENTS';
  const projectLabel = locationName?.trim() || 'Lokasi Baru';

  return (
    <header
      id="dashboard-header"
      className="h-[64px] bg-surface border-b border-border px-6 flex items-center justify-between shrink-0 sticky top-0 z-40"
    >
      <div className="min-w-0 flex items-center gap-3">
        <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
          <span className="font-mono text-[11px] text-ink-muted uppercase tracking-wide shrink-0">
            Proyek
          </span>
          <span className="text-border-strong shrink-0">/</span>
          <span
            className="font-display font-semibold text-ink truncate max-w-[200px] sm:max-w-[320px] lg:max-w-[480px]"
            title={projectLabel}
          >
            {projectLabel}
          </span>
          <span className="text-border-strong shrink-0 hidden sm:inline">/</span>
          <span className="text-ink-secondary font-medium truncate hidden sm:inline">
            {STEP_SHORT[currentStep]}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isFirstStep && (
          <button
            type="button"
            onClick={prevStep}
            disabled={isPending}
            className="px-3.5 py-2 bg-surface hover:bg-surface-muted border border-border hover:border-border-strong rounded-lg text-xs font-medium text-ink-secondary hover:text-ink flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        )}

        {!isLastStep && !isBeforeAnalysis && (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceed || isPending}
            className="px-3.5 py-2 bg-[var(--color-accent)] hover:bg-[#2450d1] text-white rounded-lg text-xs font-semibold shadow-sm shadow-[var(--color-accent)]/25 flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}