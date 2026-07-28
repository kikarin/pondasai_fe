import type {
  HouseLayout,
  HouseRequirements,
  LandDimensions,
  MaterialItem,
  SiteAnalysisData,
  StepId,
  StructuralRecommendation,
  Coordinates,
} from '../types';

export const WIZARD_STEPS: StepId[] = [
  'CHOOSE_LOCATION',
  'SITE_ANALYSIS',
  'INPUT_LAND_DIMENSIONS',
  'EDIT_POLYGON',
  'INPUT_REQUIREMENTS',
  'RECOMMENDATIONS',
  'FLOOR_PLAN',
  'PREVIEW_3D',
  'MATERIAL_LIST',
  'PDF_REPORT',
];

export const FASE_A_STEPS: StepId[] = ['CHOOSE_LOCATION', 'SITE_ANALYSIS'];

export const FASE_B_STEPS: StepId[] = [
  'INPUT_LAND_DIMENSIONS',
  'EDIT_POLYGON',
  'INPUT_REQUIREMENTS',
  'RECOMMENDATIONS',
  'FLOOR_PLAN',
  'PREVIEW_3D',
  'MATERIAL_LIST',
  'PDF_REPORT',
];

export const ANALYSIS_STEP_INDEX = WIZARD_STEPS.indexOf('SITE_ANALYSIS');

export interface WizardValidationContext {
  locationName: string;
  coordinates: Coordinates;
  dimensions: LandDimensions;
  polygonGeoJson: unknown;
  requirements: HouseRequirements;
  siteAnalysis: SiteAnalysisData | null;
  recommendations: StructuralRecommendation | null;
  houseLayout: HouseLayout | null;
  materials: MaterialItem[];
  buildPathUnlocked: boolean;
}

function hasPolygon(ctx: WizardValidationContext): boolean {
  if (!ctx.polygonGeoJson || typeof ctx.polygonGeoJson !== 'object') return false;
  const value = ctx.polygonGeoJson as { type?: string; geometry?: { type?: string } };
  if (value.type === 'Polygon') return true;
  if (value.type === 'Feature' && value.geometry?.type === 'Polygon') return true;
  return false;
}

export function isFaseBStep(step: StepId): boolean {
  return FASE_B_STEPS.includes(step);
}

export function isStepComplete(step: StepId, ctx: WizardValidationContext): boolean {
  switch (step) {
    case 'CHOOSE_LOCATION':
      return Boolean(ctx.locationName.trim() && Number.isFinite(ctx.coordinates.lat) && Number.isFinite(ctx.coordinates.lng));
    case 'SITE_ANALYSIS':
      return Boolean(ctx.siteAnalysis);
    case 'INPUT_LAND_DIMENSIONS':
      return Boolean((ctx.dimensions.width && ctx.dimensions.length) || ctx.dimensions.area);
    case 'EDIT_POLYGON':
      return hasPolygon(ctx);
    case 'INPUT_REQUIREMENTS':
      return ctx.requirements.residents >= 1 && ctx.requirements.rooms >= 1 && ctx.requirements.floors >= 1;
    case 'RECOMMENDATIONS':
      return Boolean(ctx.recommendations);
    case 'FLOOR_PLAN':
      return Boolean(ctx.houseLayout?.rooms?.length);
    case 'PREVIEW_3D':
      return Boolean(ctx.houseLayout);
    case 'MATERIAL_LIST':
      return ctx.materials.length > 0;
    case 'PDF_REPORT':
      return Boolean(ctx.siteAnalysis && ctx.recommendations && ctx.materials.length > 0);
    default:
      return false;
  }
}

export function isStepAccessible(step: StepId, ctx: WizardValidationContext): boolean {
  const stepIndex = WIZARD_STEPS.indexOf(step);
  if (stepIndex < 0) return false;

  if (isFaseBStep(step) && !ctx.buildPathUnlocked) {
    return false;
  }

  if (step === 'SITE_ANALYSIS') {
    return isStepComplete('CHOOSE_LOCATION', ctx);
  }

  if (stepIndex > ANALYSIS_STEP_INDEX && !ctx.siteAnalysis) {
    return false;
  }

  for (let index = 0; index < stepIndex; index += 1) {
    if (!isStepComplete(WIZARD_STEPS[index], ctx)) {
      return false;
    }
  }

  return true;
}

export function canProceedFromStep(step: StepId, ctx: WizardValidationContext): boolean {
  if (step === 'INPUT_REQUIREMENTS' || step === 'CHOOSE_LOCATION' || step === 'SITE_ANALYSIS') {
    return false;
  }
  return isStepComplete(step, ctx);
}

export function getValidationContext(state: WizardValidationContext): WizardValidationContext {
  return state;
}
