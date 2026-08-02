import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectSwitcher } from './ProjectSwitcher';
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
  const { id: projectId } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
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
      className="h-[64px] bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-40 gap-3"
    >
      <div className="min-w-0 flex items-center gap-2 sm:gap-3">
        <ProjectSwitcher activeProjectId={projectId ?? null} />
        <div className="hidden sm:flex min-w-0 items-center gap-1.5 text-sm">
          <span className="text-border-strong shrink-0">/</span>
          <span
            className="font-display font-semibold text-ink truncate max-w-[140px] lg:max-w-[280px]"
            title={projectLabel}
          >
            {projectLabel}
          </span>
          <span className="text-border-strong shrink-0">/</span>
          <span className="text-ink-secondary font-medium truncate">
            {STEP_SHORT[currentStep]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {user ? (
          <div className="hidden sm:flex items-center gap-2 mr-1">
            <span className="text-xs text-ink-muted truncate max-w-[140px]" title={user.email}>
              {user.name || user.email}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="p-2 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-surface-muted"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}

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
