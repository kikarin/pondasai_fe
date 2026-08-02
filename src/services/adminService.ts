import { apiRequest } from './apiClient';

export const ADMIN_PAGE_SIZES = [10, 25, 50, 100] as const;
export const ADMIN_DEFAULT_PAGE_SIZE = 25;

export interface AdminPaged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: 'basic' | 'premium';
  isActive: boolean;
  createdAt: string;
  projectCount: number;
}

export interface AdminProject {
  id: string;
  userId: string | null;
  ownerEmail: string | null;
  currentStep: string;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  hasLocation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUser {
  projects: AdminProject[];
}

export interface AdminAuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
}

export interface AdminStats {
  usersTotal: number;
  usersAdmin: number;
  usersActive: number;
  usersSuspended: number;
  usersBasic: number;
  usersPremium: number;
  signupsLast7Days: number;
  projectsTotal: number;
  projectsWithLocation: number;
  projectsEmpty: number;
  projectsGuest: number;
}

export type AdminUserRole = 'user' | 'admin';
export type AdminUserPlan = 'basic' | 'premium';

export interface AdminUserCreatePayload {
  email: string;
  password: string;
  name?: string | null;
  role?: AdminUserRole;
  plan?: AdminUserPlan;
  isActive?: boolean;
}

export interface AdminUserUpdatePayload {
  email?: string;
  password?: string;
  name?: string | null;
  role?: AdminUserRole;
  plan?: AdminUserPlan;
  isActive?: boolean;
}

export interface AdminBulkDeleteResult {
  deleted: number;
  skipped: number;
}

export interface AdminUserListParams {
  q?: string | null;
  role?: AdminUserRole | null;
  plan?: AdminUserPlan | null;
  page?: number;
  pageSize?: number;
}

export interface AdminProjectListParams {
  q?: string | null;
  userId?: string | null;
  hasLocation?: boolean | null;
  page?: number;
  pageSize?: number;
}

export interface AdminAuditListParams {
  q?: string | null;
  page?: number;
  pageSize?: number;
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const asString = typeof value === 'string' ? value.trim() : String(value);
    if (!asString) continue;
    search.set(key, asString);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/api/admin/stats');
}

export async function fetchAdminUsers(params: AdminUserListParams = {}): Promise<AdminPaged<AdminUser>> {
  const qs = buildQuery({
    q: params.q,
    role: params.role,
    plan: params.plan,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiRequest<AdminPaged<AdminUser>>(`/api/admin/users${qs}`);
}

export async function fetchAdminUser(userId: string): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}`);
}

export async function createAdminUser(payload: AdminUserCreatePayload): Promise<AdminUser> {
  return apiRequest<AdminUser>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUser(
  userId: string,
  payload: AdminUserUpdatePayload,
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await apiRequest<void>(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

export async function bulkDeleteAdminUsers(ids: string[]): Promise<AdminBulkDeleteResult> {
  return apiRequest<AdminBulkDeleteResult>('/api/admin/users/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function fetchAdminProjects(
  params: AdminProjectListParams = {},
): Promise<AdminPaged<AdminProject>> {
  const qs = buildQuery({
    q: params.q,
    userId: params.userId,
    hasLocation: params.hasLocation,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiRequest<AdminPaged<AdminProject>>(`/api/admin/projects${qs}`);
}

export async function fetchAdminProject(projectId: string): Promise<AdminProject> {
  return apiRequest<AdminProject>(`/api/admin/projects/${projectId}`);
}

export async function deleteAdminProject(projectId: string): Promise<void> {
  await apiRequest<void>(`/api/admin/projects/${projectId}`, { method: 'DELETE' });
}

export async function bulkDeleteAdminProjects(ids: string[]): Promise<AdminBulkDeleteResult> {
  return apiRequest<AdminBulkDeleteResult>('/api/admin/projects/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function purgeEmptyProjects(): Promise<{ deleted: number }> {
  return apiRequest<{ deleted: number }>('/api/admin/projects/purge-empty', {
    method: 'POST',
  });
}

export async function fetchAdminAudit(
  params: AdminAuditListParams = {},
): Promise<AdminPaged<AdminAuditLog>> {
  const qs = buildQuery({
    q: params.q,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiRequest<AdminPaged<AdminAuditLog>>(`/api/admin/audit${qs}`);
}
