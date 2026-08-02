import type {
  HouseLayout,
  MaterialItem,
  RisikoResponse,
  SiteAnalysisData,
  StructuralRecommendation,
} from '../types';
import { apiRequest } from './apiClient';

export interface AnalysisResponse {
  siteAnalysis: SiteAnalysisData;
  recommendations: StructuralRecommendation;
  houseLayout: HouseLayout;
  materials: MaterialItem[];
  aiExplanation: string;
}

export interface SiteAnalysisResponse {
  siteAnalysis: SiteAnalysisData;
}

export interface DesignAnalysisResponse {
  recommendations: StructuralRecommendation;
  houseLayout: HouseLayout;
  materials: MaterialItem[];
  aiExplanation: string;
}

export async function analyzeSite(projectId: string): Promise<SiteAnalysisResponse> {
  return apiRequest<SiteAnalysisResponse>(`/api/projects/${projectId}/analyze/site`, {
    method: 'POST',
  });
}

export async function analyzeDesign(projectId: string): Promise<DesignAnalysisResponse> {
  return apiRequest<DesignAnalysisResponse>(`/api/projects/${projectId}/analyze/design`, {
    method: 'POST',
  });
}

export async function analyzeRisiko(projectId: string): Promise<RisikoResponse> {
  return apiRequest<RisikoResponse>(`/api/projects/${projectId}/analyze/site/risiko`, {
    method: 'POST',
  });
}

export async function analyzeProject(projectId: string): Promise<AnalysisResponse> {
  return apiRequest<AnalysisResponse>(`/api/projects/${projectId}/analyze`, {
    method: 'POST',
  });
}
