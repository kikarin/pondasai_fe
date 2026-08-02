import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  Cuboid,
  FileText,
  Home,
  LayoutGrid,
  Lock,
  MapPin,
  Ruler,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import { AppLogo } from './AppLogo';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { PremiumUpsellModal } from '../billing/PremiumUpsellModal';
import type { StepId } from '../../types';
import { FASE_A_STEPS, FASE_B_STEPS } from '../../utils/stepValidation';

const STEP_LABELS: Record<StepId, string> = {
  CHOOSE_LOCATION: 'Pilih Lokasi',
  SITE_ANALYSIS: 'Analisis Risiko',
  INPUT_LAND_DIMENSIONS: 'Input Data Tanah',
  EDIT_POLYGON: 'Area Bangunan',
  INPUT_REQUIREMENTS: 'Kebutuhan Rumah',
  RECOMMENDATIONS: 'Rekomendasi Desain',
  FLOOR_PLAN: 'Denah 2D',
  PREVIEW_3D: 'Preview 3D',
  MATERIAL_LIST: 'Material List',
  PDF_REPORT: 'PDF Report',
};

const STEP_ICONS: Record<StepId, ComponentType<{ className?: string }>> = {
  CHOOSE_LOCATION: MapPin,
  SITE_ANALYSIS: ShieldAlert,
  INPUT_LAND_DIMENSIONS: Ruler,
  EDIT_POLYGON: LayoutGrid,
  INPUT_REQUIREMENTS: Home,
  RECOMMENDATIONS: Sparkles,
  FLOOR_PLAN: LayoutGrid,
  PREVIEW_3D: Cuboid,
  MATERIAL_LIST: ClipboardList,
  PDF_REPORT: FileText,
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
  const Icon = STEP_ICONS[step];

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={() => args.onSelect(step)}
      className={`group relative w-full flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
        args.isActive
          ? 'bg-white/[0.08] text-white'
          : args.completed
            ? 'text-slate-300 hover:bg-nav-hover'
            : isLocked
              ? 'text-slate-600 opacity-60 cursor-not-allowed'
              : 'text-nav-muted hover:bg-nav-hover hover:text-slate-200'
      }`}
    >
      {args.isActive ? (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--color-accent)]" />
      ) : null}
      <Icon
        className={`w-4 h-4 shrink-0 ${
          args.isActive
            ? 'text-[var(--color-nav-active)]'
            : args.completed
              ? 'text-[var(--color-success)]'
              : 'text-slate-500'
        }`}
      />
      <span className="text-left leading-tight flex-1">{STEP_LABELS[step]}</span>
      {args.completed && !args.isActive ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
      ) : isLocked ? (
        <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
      ) : args.isActive ? (
        <Circle className="w-2.5 h-2.5 text-[var(--color-nav-active)] fill-[var(--color-nav-active)] shrink-0" />
      ) : null}
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
  const { canAccessBuildPath } = useAuth();
  const [faseBOpen, setFaseBOpen] = useState(buildPathUnlocked || FASE_B_STEPS.includes(currentStep));
  const [upsellOpen, setUpsellOpen] = useState(false);

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
      className="w-[260px] bg-nav text-slate-200 border-r border-nav-border flex flex-col shrink-0"
    >
      <div className="flex flex-col h-full">
        <div className="px-5 py-5 border-b border-nav-border shrink-0">
          <AppLogo to="/" showTagline size="sm" />
          <p className="mt-2 font-mono text-[10px] text-slate-500 tracking-wider uppercase">
            GIS Platform
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-nav">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
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

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (buildPathUnlocked) {
                  setFaseBOpen((open) => !open);
                  return;
                }
                if (!canAccessBuildPath) {
                  setUpsellOpen(true);
                }
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Konsep rumah
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                {!buildPathUnlocked ? <Lock className="w-3 h-3" /> : null}
                {faseBOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {!buildPathUnlocked ? (
              <p className="px-3 pb-1 text-[10px] text-[var(--color-warning)] opacity-90 leading-relaxed">
                {canAccessBuildPath
                  ? 'Terkunci — pilih Lanjut konsep rumah di hasil risiko.'
                  : 'Premium diperlukan — upgrade untuk membuka konsep rumah.'}
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
      <PremiumUpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </aside>
  );
}
