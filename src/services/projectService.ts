import type {
  Coordinates,
  HouseLayout,
  HouseRequirements,
  LandDimensions,
  MaterialItem,
  SiteAnalysisData,
  StructuralRecommendation,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface ProjectResponse {
  id: string;
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
}

export interface ProjectUpdatePayload {
  currentStep?: string;
  locationName?: string;
  coordinates?: Coordinates;
  dimensions?: LandDimensions;
  polygonGeoJson?: unknown;
  requirements?: HouseRequirements;
}

export async function createProject(): Promise<ProjectResponse> {
  return request<ProjectResponse>('/api/projects', { method: 'POST', body: '{}' });
}

export async function getProject(projectId: string): Promise<ProjectResponse> {
  return request<ProjectResponse>(`/api/projects/${projectId}`);
}

export async function updateProject(
  projectId: string,
  payload: ProjectUpdatePayload,
): Promise<ProjectResponse> {
  return request<ProjectResponse>(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function resetProject(projectId: string): Promise<ProjectResponse> {
  return request<ProjectResponse>(`/api/projects/${projectId}/reset`, {
    method: 'POST',
    body: '{}',
  });
}
