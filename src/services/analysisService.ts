import type {
  HouseLayout,
  MaterialItem,
  RisikoResponse,
  SiteAnalysisData,
  StructuralRecommendation,
} from '../types';

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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function postJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function analyzeSite(projectId: string): Promise<SiteAnalysisResponse> {
  return postJson(`${API_BASE}/api/projects/${projectId}/analyze/site`);
}

export async function analyzeDesign(projectId: string): Promise<DesignAnalysisResponse> {
  return postJson(`${API_BASE}/api/projects/${projectId}/analyze/design`);
}

export async function analyzeRisiko(projectId: string): Promise<RisikoResponse> {
  return postJson(`${API_BASE}/api/projects/${projectId}/analyze/site/risiko`);
}

export async function analyzeProject(projectId: string): Promise<AnalysisResponse> {
  return postJson(`${API_BASE}/api/projects/${projectId}/analyze`);
}
