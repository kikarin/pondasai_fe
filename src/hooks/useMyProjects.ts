import { useCallback, useEffect, useState } from 'react';
import { listMyProjects, type ProjectResponse } from '../services/projectService';

type CacheEntry = {
  at: number;
  projects: ProjectResponse[];
};

const CACHE_TTL_MS = 30_000;
let sessionCache: CacheEntry | null = null;
let inflight: Promise<ProjectResponse[]> | null = null;

export function invalidateMyProjectsCache(): void {
  sessionCache = null;
}

async function fetchMyProjects(force = false): Promise<ProjectResponse[]> {
  const now = Date.now();
  if (!force && sessionCache && now - sessionCache.at < CACHE_TTL_MS) {
    return sessionCache.projects;
  }
  if (!force && inflight) return inflight;

  inflight = listMyProjects()
    .then((projects) => {
      sessionCache = { at: Date.now(), projects };
      return projects;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useMyProjects(options?: { enabled?: boolean; activeProjectId?: string | null }) {
  const enabled = options?.enabled !== false;
  const [projects, setProjects] = useState<ProjectResponse[]>(() => sessionCache?.projects ?? []);
  const [loading, setLoading] = useState(enabled && !sessionCache);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchMyProjects(force);
      setProjects(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat proyek');
      if (!sessionCache) setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh(false);
  }, [enabled, refresh]);

  return {
    projects,
    loading,
    error,
    refresh,
    activeProjectId: options?.activeProjectId ?? null,
  };
}
