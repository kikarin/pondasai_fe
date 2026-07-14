import type { ReportResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function fetchProjectReport(projectId: string): Promise<ReportResponse> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/report`);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Report request failed: ${response.status}`);
  }

  return response.json() as Promise<ReportResponse>;
}
