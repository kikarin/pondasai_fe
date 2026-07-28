import type { StepId } from '../types';
import { FASE_A_STEPS, WIZARD_STEPS, isFaseBStep } from './stepValidation';

export function isValidStepId(step: string | null | undefined): step is StepId {
  return Boolean(step && (WIZARD_STEPS as string[]).includes(step));
}

export function resolveResumeStep(args: {
  rawStep: string | null | undefined;
  hasSiteAnalysis: boolean;
  hasDesign: boolean;
}): StepId {
  const unlocked = args.hasDesign;
  const mapped = isValidStepId(args.rawStep) ? args.rawStep : 'CHOOSE_LOCATION';

  if (!unlocked) {
    if (args.hasSiteAnalysis) return 'SITE_ANALYSIS';
    return 'CHOOSE_LOCATION';
  }

  if (isFaseBStep(mapped) || FASE_A_STEPS.includes(mapped)) {
    return mapped;
  }

  return 'RECOMMENDATIONS';
}
