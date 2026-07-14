import { Loader2 } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { ChooseLocationStep } from '../wizard/ChooseLocationStep';
import { LandDimensionsStep } from '../wizard/LandDimensionsStep';
import { PolygonEditorStep } from '../wizard/PolygonEditorStep';
import { HouseRequirementsStep } from '../wizard/HouseRequirementsStep';
import { SiteAnalysisStep } from '../wizard/SiteAnalysisStep';
import { RecommendationsStep } from '../wizard/RecommendationsStep';
import { FloorPlanStep } from '../wizard/FloorPlanStep';
import { ThreeDPreviewStep } from '../wizard/ThreeDPreviewStep';
import { MaterialListStep } from '../wizard/MaterialListStep';
import { PdfReportStep } from '../wizard/PdfReportStep';

export function DashboardWorkspace() {
  const { currentStep, isBootstrapping } = usePondasiWorkspace();

  if (isBootstrapping) {
    return (
      <section className="flex-1 flex items-center justify-center bg-[#080B10]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Memuat proyek dari URL...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 overflow-hidden flex flex-col bg-[#080B10]">
      {currentStep === 'CHOOSE_LOCATION' && <ChooseLocationStep />}
      {currentStep === 'INPUT_LAND_DIMENSIONS' && <LandDimensionsStep />}
      {currentStep === 'EDIT_POLYGON' && <PolygonEditorStep />}
      {currentStep === 'INPUT_REQUIREMENTS' && <HouseRequirementsStep />}
      {currentStep === 'SITE_ANALYSIS' && <SiteAnalysisStep />}
      {currentStep === 'RECOMMENDATIONS' && <RecommendationsStep />}
      {currentStep === 'FLOOR_PLAN' && <FloorPlanStep />}
      {currentStep === 'PREVIEW_3D' && <ThreeDPreviewStep />}
      {currentStep === 'MATERIAL_LIST' && <MaterialListStep />}
      {currentStep === 'PDF_REPORT' && <PdfReportStep />}
    </section>
  );
}
