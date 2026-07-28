import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Lock } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import type { StepId } from '../../types';
import { FASE_A_STEPS, FASE_B_STEPS } from '../../utils/stepValidation';

const STEP_LABELS: Record<StepId, string> = {
  CHOOSE_LOCATION: 'Pilih Lokasi',
  SITE_ANALYSIS: 'Analisis Risiko',
  INPUT_LAND_DIMENSIONS: 'Input Data Tanah',
  EDIT_POLYGON: 'Area Bangunan',
  INPUT_REQUIREMENTS: 'Kebutuhan Rumah',
  RECOMMENDATIONS: 'Rekomendasi Desain',
  FLOOR_PLAN: 'Denah 2D (Beta)',
  PREVIEW_3D: 'Preview 3D (Beta)',
  MATERIAL_LIST: 'Material List',
  PDF_REPORT: 'PDF Report',
};

function renderStepButton(
  step: StepId,
  args: {
    isActive: boolean;
    completed: boolean;
    accessible: boolean;
    onSelect: (step: StepId) => void;
  },
) {
  const isLocked = !args.accessible;

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={() => args.onSelect(step)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
        args.isActive
          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          : args.completed
            ? 'text-gray-300 hover:bg-[#151D30] border border-transparent'
            : isLocked
              ? 'text-gray-600 border border-transparent opacity-50 cursor-not-allowed'
              : 'text-gray-500 border border-transparent hover:bg-[#151D30]'
      }`}
    >
      {args.completed && !args.isActive ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : isLocked ? (
        <Lock className="w-4 h-4 text-gray-600 shrink-0" />
      ) : args.isActive ? (
        <Circle className="w-4 h-4 text-blue-400 fill-blue-500/20 shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-gray-600 shrink-0" />
      )}
      <span className="text-left leading-tight">{STEP_LABELS[step]}</span>
    </button>
  );
}

export function Sidebar() {
  const {
    currentStep,
    goToStep,
    isStepAccessible,
    isStepComplete,
    buildPathUnlocked,
  } = usePondasiWorkspace();

  const [faseBOpen, setFaseBOpen] = useState(buildPathUnlocked || FASE_B_STEPS.includes(currentStep));

  useEffect(() => {
    if (buildPathUnlocked || FASE_B_STEPS.includes(currentStep)) {
      setFaseBOpen(true);
    } else {
      setFaseBOpen(false);
    }
  }, [buildPathUnlocked, currentStep]);

  return (
    <aside
      id="sidebar-rail"
      className="w-[280px] bg-[#0E131F] border-r border-[#1F293D] flex flex-col shrink-0"
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-[#1F293D] shrink-0">
          <AppLogo to="/" showTagline />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider block mb-2">
              Cek risiko
            </span>
            {FASE_A_STEPS.map((step) => (
              <div key={step}>
                {renderStepButton(step, {
                  isActive: currentStep === step,
                  completed: isStepComplete(step),
                  accessible: isStepAccessible(step),
                  onSelect: goToStep,
                })}
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-[#1F293D] pt-3">
            <button
              type="button"
              onClick={() => {
                if (buildPathUnlocked) setFaseBOpen((open) => !open);
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left"
            >
              <span className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider">
                Konsep rumah
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                {!buildPathUnlocked ? <Lock className="w-3 h-3" /> : null}
                {faseBOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {!buildPathUnlocked ? (
              <p className="px-3 pb-1 text-[10px] text-amber-400/90 leading-relaxed">
                Terkunci — pilih Lanjut konsep rumah di hasil risiko.
              </p>
            ) : null}

            {faseBOpen
              ? FASE_B_STEPS.map((step) => (
                  <div key={step}>
                    {renderStepButton(step, {
                      isActive: currentStep === step,
                      completed: isStepComplete(step),
                      accessible: isStepAccessible(step),
                      onSelect: goToStep,
                    })}
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
