import type { ReportResponse } from '../types';
import { apiRequest } from './apiClient';

export async function fetchProjectReport(projectId: string): Promise<ReportResponse> {
  return apiRequest<ReportResponse>(`/api/projects/${projectId}/report`);
}
