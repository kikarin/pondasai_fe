import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  StepId,
  Coordinates,
  LandDimensions,
  HouseRequirements,
  SiteAnalysisData,
  StructuralRecommendation,
  HouseLayout,
  MaterialItem,
} from '../types';
import type { EarthquakeMagnitudeScenario, FloodScenarioCm } from '../types/scenario';
import { analyzeDesign, analyzeSite } from '../services/analysisService';
import { reverseGeocode } from '../services/geocodeService';
import { getProject, resetProject, updateProject } from '../services/projectService';
import {
  WIZARD_STEPS,
  canProceedFromStep,
  isFaseBStep,
  isStepAccessible,
  isStepComplete,
  type WizardValidationContext,
} from '../utils/stepValidation';
import { resolveResumeStep } from '../utils/funnelResume';

export const SITE_LOADING_STEPS = [
  'Menyimpan lokasi ke sistem...',
  'Mengambil elevasi, kemiringan, & jarak sungai...',
  'Mengambil risiko multi-hazard dari BNPB InaRISK...',
  'Menghitung skor & kelayakan lokasi...',
  'Finalisasi analisis risiko lokasi...',
];

export const DESIGN_LOADING_STEPS = [
  'Menyimpan input lahan & kebutuhan...',
  'Menjalankan rule engine struktur & elevasi...',
  'Generator denah & daftar material...',
  'Menyusun penjelasan AI (narasi)...',
  'Finalisasi rekomendasi desain...',
];

export type AnalysisLoadingKind = 'site' | 'design';

const DEFAULT_REQUIREMENTS: HouseRequirements = {
  residents: 4,
  rooms: 2,
  floors: 1,
  budget: undefined,
};

const DEFAULT_DIMENSIONS: LandDimensions = {
  width: 0,
  length: 0,
  area: 0,
};

function coordsRoughlyMatch(a: Coordinates, b: Coordinates): boolean {
  return (
    Math.round(a.lat * 100000) === Math.round(b.lat * 100000) &&
    Math.round(a.lng * 100000) === Math.round(b.lng * 100000)
  );
}

function isSiteAnalysisFresh(site: SiteAnalysisData | null, coordinates: Coordinates): boolean {
  if (!site) return false;
  if (!site.metrics || typeof site.overallRiskScore !== 'number') return false;
  return coordsRoughlyMatch(site.coordinates, coordinates);
}

function hydrateProjectState(
  project: Awaited<ReturnType<typeof getProject>>,
  setters: {
    setCurrentStep: (step: StepId) => void;
    setLocationName: (value: string) => void;
    setCoordinates: (value: Coordinates) => void;
    setLandDimensions: (value: LandDimensions) => void;
    setPolygonGeoJson: (value: unknown) => void;
    setHouseRequirements: (value: HouseRequirements) => void;
    setSiteAnalysis: (value: SiteAnalysisData | null) => void;
    setRecommendations: (value: StructuralRecommendation | null) => void;
    setHouseLayout: (value: HouseLayout | null) => void;
    setMaterialList: (value: MaterialItem[]) => void;
    setAiExplanation: (value: string) => void;
    setBuildPathUnlocked: (value: boolean) => void;
  },
) {
  if (project.locationName) setters.setLocationName(project.locationName);
  if (project.coordinates) setters.setCoordinates(project.coordinates);
  if (project.dimensions) setters.setLandDimensions(project.dimensions);
  if (project.polygonGeoJson) setters.setPolygonGeoJson(project.polygonGeoJson);
  if (project.requirements) setters.setHouseRequirements(project.requirements);
  if (project.siteAnalysis) setters.setSiteAnalysis(project.siteAnalysis);
  if (project.recommendations) setters.setRecommendations(project.recommendations);
  if (project.houseLayout) setters.setHouseLayout(project.houseLayout);
  if (project.materials?.length) setters.setMaterialList(project.materials);
  if (project.aiExplanation) setters.setAiExplanation(project.aiExplanation);

  const unlocked = Boolean(project.recommendations || project.houseLayout);
  setters.setBuildPathUnlocked(unlocked);

  const step = resolveResumeStep({
    rawStep: project.currentStep,
    hasSiteAnalysis: Boolean(project.siteAnalysis),
    hasDesign: unlocked,
  });
  setters.setCurrentStep(step);
}

export function usePondasiWorkspaceState(projectId: string) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepId>('CHOOSE_LOCATION');

  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: -6.2088, lng: 106.8456 });
  const [locationName, setLocationName] = useState<string>('Jakarta Pusat');
  const [dimensions, setLandDimensions] = useState<LandDimensions>(DEFAULT_DIMENSIONS);
  const [polygonGeoJson, setPolygonGeoJson] = useState<unknown>(null);
  const [requirements, setHouseRequirements] = useState<HouseRequirements>(DEFAULT_REQUIREMENTS);

  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysisData | null>(null);
  const [recommendations, setRecommendations] = useState<StructuralRecommendation | null>(null);
  const [houseLayout, setHouseLayout] = useState<HouseLayout | null>(null);
  const [materials, setMaterialList] = useState<MaterialItem[]>([]);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [twinFloodCm, setTwinFloodCm] = useState<FloodScenarioCm | null>(null);
  const [twinMagnitude, setTwinMagnitude] = useState<EarthquakeMagnitudeScenario | null>(null);
  const [buildPathUnlocked, setBuildPathUnlocked] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [loadingKind, setLoadingKind] = useState<AnalysisLoadingKind | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const clearDesignResults = useCallback(() => {
    setRecommendations(null);
    setHouseLayout(null);
    setMaterialList([]);
    setAiExplanation('');
    setTwinFloodCm(null);
    setTwinMagnitude(null);
  }, []);

  const clearAnalysisResults = useCallback(() => {
    setSiteAnalysis(null);
    clearDesignResults();
    setAnalysisError(null);
  }, [clearDesignResults]);

  const setCoordinatesSafe = useCallback(
    (value: Coordinates) => {
      if (coordsRoughlyMatch(coordinates, value)) {
        setCoordinates(value);
        return;
      }

      setCoordinates(value);
      setBuildPathUnlocked(false);
      clearDesignResults();

      if (siteAnalysis && !coordsRoughlyMatch(siteAnalysis.coordinates, value)) {
        setSiteAnalysis(null);
        setAnalysisError(null);
      }

      if (isFaseBStep(currentStep)) {
        setCurrentStep('CHOOSE_LOCATION');
      }
    },
    [coordinates, siteAnalysis, clearDesignResults, currentStep],
  );

  const validationContext = useMemo<WizardValidationContext>(
    () => ({
      locationName,
      coordinates,
      dimensions,
      polygonGeoJson,
      requirements,
      siteAnalysis,
      recommendations,
      houseLayout,
      materials,
      buildPathUnlocked,
    }),
    [
      locationName,
      coordinates,
      dimensions,
      polygonGeoJson,
      requirements,
      siteAnalysis,
      recommendations,
      houseLayout,
      materials,
      buildPathUnlocked,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrapProject() {
      setIsBootstrapping(true);
      try {
        const project = await getProject(projectId);
        if (cancelled) return;

        hydrateProjectState(project, {
          setCurrentStep,
          setLocationName,
          setCoordinates,
          setLandDimensions,
          setPolygonGeoJson,
          setHouseRequirements,
          setSiteAnalysis,
          setRecommendations,
          setHouseLayout,
          setMaterialList,
          setAiExplanation,
          setBuildPathUnlocked,
        });
      } catch (error) {
        console.error('Gagal memuat proyek dari backend', error);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    void bootstrapProject();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const syncProject = useCallback(
    async (stepOverride?: StepId, overrides?: Partial<{
      locationName: string;
      coordinates: Coordinates;
      dimensions: LandDimensions;
      polygonGeoJson: unknown;
      requirements: HouseRequirements;
    }>) => {
      await updateProject(projectId, {
        currentStep: stepOverride ?? currentStep,
        locationName: overrides?.locationName ?? locationName,
        coordinates: overrides?.coordinates ?? coordinates,
        dimensions: overrides?.dimensions ?? dimensions,
        polygonGeoJson: overrides?.polygonGeoJson ?? polygonGeoJson,
        requirements: overrides?.requirements ?? requirements,
      });
    },
    [projectId, currentStep, locationName, coordinates, dimensions, polygonGeoJson, requirements],
  );

  const prefetchSiteAnalysis = useCallback(async () => {
    try {
      const data = await analyzeSite(projectId);
      setSiteAnalysis(data.siteAnalysis);
    } catch (error) {
      console.warn('Prefetch site analysis gagal (akan dicoba ulang di hasil risiko)', error);
    }
  }, [projectId]);

  const runSiteAnalysis = useCallback(async () => {
    if (isSiteAnalysisFresh(siteAnalysis, coordinates)) {
      return;
    }

    setAnalysisError(null);
    setLoadingKind('site');
    setIsPending(true);
    setLoadingStepIndex(0);

    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      progressTimer = setInterval(() => {
        setLoadingStepIndex((prev) => Math.min(prev + 1, SITE_LOADING_STEPS.length - 2));
      }, 1200);

      setLoadingStepIndex(1);
      const data = await analyzeSite(projectId);
      setSiteAnalysis(data.siteAnalysis);
      setLoadingStepIndex(SITE_LOADING_STEPS.length - 1);
    } catch (error) {
      console.error('Gagal menjalankan analisis situs', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analisis risiko lokasi gagal');
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setTimeout(() => {
        setIsPending(false);
        setLoadingKind(null);
      }, 400);
    }
  }, [projectId, siteAnalysis, coordinates]);

  const confirmChooseLocation = useCallback(async () => {
    let resolvedName =
      locationName.trim() || `Lokasi ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;

    try {
      const rev = await reverseGeocode(coordinates.lat, coordinates.lng);
      if (rev.name.trim()) {
        resolvedName = rev.name.trim();
      }
    } catch {
    }

    setLocationName(resolvedName);

    const siteFresh = isSiteAnalysisFresh(siteAnalysis, coordinates);
    if (!siteFresh) {
      setBuildPathUnlocked(false);
      clearDesignResults();
      setSiteAnalysis(null);
      setAnalysisError(null);
    }

    const next: StepId = 'SITE_ANALYSIS';
    setCurrentStep(next);
    await syncProject(next, { locationName: resolvedName, coordinates });

    if (siteFresh) {
      return;
    }

    setAnalysisError(null);
    setLoadingKind('site');
    setIsPending(true);
    setLoadingStepIndex(0);

    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      progressTimer = setInterval(() => {
        setLoadingStepIndex((prev) => Math.min(prev + 1, SITE_LOADING_STEPS.length - 2));
      }, 1200);

      setLoadingStepIndex(1);
      const data = await analyzeSite(projectId);
      setSiteAnalysis(data.siteAnalysis);
      setLoadingStepIndex(SITE_LOADING_STEPS.length - 1);
    } catch (error) {
      console.error('Gagal menjalankan analisis situs', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analisis risiko lokasi gagal');
      void prefetchSiteAnalysis();
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setTimeout(() => {
        setIsPending(false);
        setLoadingKind(null);
      }, 400);
    }
  }, [
    coordinates,
    locationName,
    syncProject,
    siteAnalysis,
    clearDesignResults,
    projectId,
    prefetchSiteAnalysis,
  ]);

  const nextStep = useCallback(() => {
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentIndex < 0 || currentIndex >= WIZARD_STEPS.length - 1) return;
    if (!canProceedFromStep(currentStep, validationContext)) return;

    const next = WIZARD_STEPS[currentIndex + 1];
    if (!isStepAccessible(next, validationContext)) return;

    setCurrentStep(next);
    void syncProject(next);
  }, [currentStep, validationContext, syncProject]);

  const prevStep = useCallback(() => {
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      const prev = WIZARD_STEPS[currentIndex - 1];
      setCurrentStep(prev);
      void syncProject(prev);
    }
  }, [currentStep, syncProject]);

  const goToStep = useCallback(
    (stepId: StepId) => {
      if (!isStepAccessible(stepId, validationContext)) return;
      setCurrentStep(stepId);
      void syncProject(stepId);
    },
    [validationContext, syncProject],
  );

  const runDesignAnalysis = useCallback(async () => {
    if (!buildPathUnlocked) {
      setAnalysisError('Buka jalur konsep rumah dari hasil risiko terlebih dahulu.');
      return;
    }
    if (!isStepComplete('INPUT_REQUIREMENTS', validationContext)) {
      setAnalysisError('Lengkapi kebutuhan rumah terlebih dahulu.');
      return;
    }

    setAnalysisError(null);
    setLoadingKind('design');
    setIsPending(true);
    setLoadingStepIndex(0);

    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      await syncProject('INPUT_REQUIREMENTS');

      progressTimer = setInterval(() => {
        setLoadingStepIndex((prev) => Math.min(prev + 1, DESIGN_LOADING_STEPS.length - 2));
      }, 1400);

      if (!isSiteAnalysisFresh(siteAnalysis, coordinates)) {
        const siteData = await analyzeSite(projectId);
        setSiteAnalysis(siteData.siteAnalysis);
      }

      setLoadingStepIndex(1);
      const designData = await analyzeDesign(projectId);

      setRecommendations(designData.recommendations);
      setHouseLayout(designData.houseLayout);
      setMaterialList(designData.materials);
      setAiExplanation(designData.aiExplanation);
      setLoadingStepIndex(DESIGN_LOADING_STEPS.length - 1);
      setCurrentStep('RECOMMENDATIONS');
      await syncProject('RECOMMENDATIONS');
    } catch (error) {
      console.error('Gagal menjalankan analisis desain', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analisis desain gagal dijalankan');
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setTimeout(() => {
        setIsPending(false);
        setLoadingKind(null);
      }, 400);
    }
  }, [projectId, syncProject, validationContext, siteAnalysis, coordinates, buildPathUnlocked]);

  const resetWorkspace = useCallback(async () => {
    setIsResetting(true);
    setAnalysisError(null);

    try {
      await resetProject(projectId);
      setCurrentStep('CHOOSE_LOCATION');
      setBuildPathUnlocked(false);
      clearAnalysisResults();
      setLandDimensions(DEFAULT_DIMENSIONS);
      setPolygonGeoJson(null);
      setHouseRequirements(DEFAULT_REQUIREMENTS);
    } catch (error) {
      console.error('Gagal reset proyek', error);
      setAnalysisError(error instanceof Error ? error.message : 'Reset proyek gagal');
      throw error;
    } finally {
      setIsResetting(false);
    }
  }, [projectId, clearAnalysisResults]);

  const finishRiskOnly = useCallback(() => {
    setCurrentStep('SITE_ANALYSIS');
    void syncProject('SITE_ANALYSIS');
  }, [syncProject]);

  const unlockBuildPath = useCallback(() => {
    setBuildPathUnlocked(true);
    const next: StepId = 'INPUT_LAND_DIMENSIONS';
    setCurrentStep(next);
    void syncProject(next);
  }, [syncProject]);

  const funnelPhase = buildPathUnlocked ? 'build' : 'risk_only';
  const canProceed = canProceedFromStep(currentStep, validationContext);

  return {
    projectId,
    isBootstrapping,
    currentStep,
    steps: WIZARD_STEPS,
    nextStep,
    prevStep,
    goToStep,
    coordinates,
    setCoordinates: setCoordinatesSafe,
    locationName,
    setLocationName,
    dimensions,
    setLandDimensions,
    polygonGeoJson,
    setPolygonGeoJson,
    requirements,
    setHouseRequirements,
    siteAnalysis,
    recommendations,
    houseLayout,
    materials,
    aiExplanation,
    twinFloodCm,
    setTwinFloodCm,
    twinMagnitude,
    setTwinMagnitude,
    buildPathUnlocked,
    setBuildPathUnlocked,
    funnelPhase,
    finishRiskOnly,
    unlockBuildPath,
    isPending,
    loadingKind,
    loadingStepIndex,
    analysisError,
    runSiteAnalysis,
    runDesignAnalysis,
    resetWorkspace,
    isResetting,
    syncProject,
    confirmChooseLocation,
    validationContext,
    canProceed,
    isStepAccessible: (stepId: StepId) => isStepAccessible(stepId, validationContext),
    isStepComplete: (stepId: StepId) => isStepComplete(stepId, validationContext),
  };
}

export type PondasiWorkspaceState = ReturnType<typeof usePondasiWorkspaceState>;
