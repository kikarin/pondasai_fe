import type {
  Coordinates,
  HouseLayout,
  HouseRequirements,
  LandDimensions,
  MaterialItem,
  SiteAnalysisData,
  StructuralRecommendation,
} from '../types';
import { apiRequest } from './apiClient';

export interface ProjectResponse {
  id: string;
  userId?: string | null;
  currentStep: string;
  locationName?: string | null;
  coordinates?: Coordinates | null;
  dimensions?: LandDimensions | null;
  polygonGeoJson?: unknown;
  requirements?: HouseRequirements | null;
  siteAnalysis?: SiteAnalysisData | null;
  recommendations?: StructuralRecommendation | null;
  houseLayout?: HouseLayout | null;
  materials?: MaterialItem[];
  aiExplanation?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectCreatePayload {
  locationName: string;
  coordinates: Coordinates;
  currentStep?: string;
}

export interface ProjectUpdatePayload {
  currentStep?: string;
  locationName?: string;
  coordinates?: Coordinates;
  dimensions?: LandDimensions;
  polygonGeoJson?: unknown;
  requirements?: HouseRequirements;
}

export async function createProject(payload: ProjectCreatePayload): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listMyProjects(): Promise<ProjectResponse[]> {
  return apiRequest<ProjectResponse[]>('/api/projects');
}

export async function getProject(projectId: string): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/api/projects/${projectId}`);
}

export async function claimProject(projectId: string): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/api/projects/${projectId}/claim`, { method: 'POST' });
}

export async function updateProject(
  projectId: string,
  payload: ProjectUpdatePayload,
): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function resetProject(projectId: string): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/api/projects/${projectId}/reset`, {
    method: 'POST',
    body: '{}',
  });
}
