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
import { analyzeDesign, analyzeSite } from '../services/analysisService';
import { reverseGeocode } from '../services/geocodeService';
import { getProject, resetProject, updateProject } from '../services/projectService';
import {
  WIZARD_STEPS,
  canProceedFromStep,
  isStepAccessible,
  isStepComplete,
  type WizardValidationContext,
} from '../utils/stepValidation';

export const ANALYSIS_LOADING_STEPS = [
  'Menyimpan input proyek ke sistem...',
  'Mengambil elevasi, kemiringan, & jarak sungai...',
  'Mengambil risiko banjir & gempa dari BNPB InaRISK...',
  'Menjalankan rule engine struktur & generator denah/material...',
  'Menyusun penjelasan AI json response (untuk narasi)...',
  'Finalisasi hasil analisis geospasial...',
];

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
  },
) {
  if (project.currentStep) {
    setters.setCurrentStep(project.currentStep as StepId);
  }
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
  const [isPending, setIsPending] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const clearAnalysisResults = useCallback(() => {
    setSiteAnalysis(null);
    setRecommendations(null);
    setHouseLayout(null);
    setMaterialList([]);
    setAiExplanation('');
    setAnalysisError(null);
  }, []);

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
      console.warn('Prefetch site analysis gagal (akan dicoba ulang di Step 4)', error);
    }
  }, [projectId]);

  const confirmChooseLocation = useCallback(async () => {
    let resolvedName =
      locationName.trim() || `Lokasi ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;

    try {
      const rev = await reverseGeocode(coordinates.lat, coordinates.lng);
      if (rev.name.trim()) {
        resolvedName = rev.name.trim();
      }
    } catch {
      // Tetap pakai nama terakhir atau fallback koordinat.
    }

    setLocationName(resolvedName);

    const next: StepId = 'INPUT_LAND_DIMENSIONS';
    setCurrentStep(next);
    clearAnalysisResults();
    await syncProject(next, { locationName: resolvedName, coordinates });
    void prefetchSiteAnalysis();
  }, [coordinates, locationName, syncProject, prefetchSiteAnalysis, clearAnalysisResults, setLocationName]);

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

  const runAnalysisPipeline = useCallback(async () => {
    if (!isStepComplete('INPUT_REQUIREMENTS', validationContext)) {
      setAnalysisError('Lengkapi kebutuhan rumah terlebih dahulu.');
      return;
    }

    setAnalysisError(null);
    setIsPending(true);
    setLoadingStepIndex(0);

    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      await syncProject('INPUT_REQUIREMENTS');

      progressTimer = setInterval(() => {
        setLoadingStepIndex((prev) => Math.min(prev + 1, ANALYSIS_LOADING_STEPS.length - 2));
      }, 1400);

      setLoadingStepIndex(1);
      const siteReady = isSiteAnalysisFresh(siteAnalysis, coordinates);
      let resolvedSite = siteAnalysis;
      if (!siteReady) {
        const siteData = await analyzeSite(projectId);
        resolvedSite = siteData.siteAnalysis;
        setSiteAnalysis(resolvedSite);
      }

      setLoadingStepIndex(2);
      const designData = await analyzeDesign(projectId);

      setSiteAnalysis(resolvedSite);
      setRecommendations(designData.recommendations);
      setHouseLayout(designData.houseLayout);
      setMaterialList(designData.materials);
      setAiExplanation(designData.aiExplanation);
      setLoadingStepIndex(ANALYSIS_LOADING_STEPS.length - 1);
      setCurrentStep('SITE_ANALYSIS');
      await syncProject('SITE_ANALYSIS');
    } catch (error) {
      console.error('Gagal menjalankan analisis', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analisis gagal dijalankan');
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setTimeout(() => setIsPending(false), 400);
    }
  }, [projectId, syncProject, validationContext, siteAnalysis, coordinates]);

  const resetWorkspace = useCallback(async () => {
    setIsResetting(true);
    setAnalysisError(null);

    try {
      await resetProject(projectId);
      setCurrentStep('CHOOSE_LOCATION');
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
    setCoordinates,
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
    isPending,
    loadingStepIndex,
    analysisError,
    runAnalysisPipeline,
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
