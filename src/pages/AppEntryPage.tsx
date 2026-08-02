import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderOpen, Loader2, Plus } from 'lucide-react';
import { PageMeta } from '../components/seo/PageMeta';
import { AppLogo } from '../components/layout/AppLogo';
import { AuthGate } from '../components/AuthGate';
import { useAuth } from '../context/AuthContext';
import { listMyProjects, type ProjectResponse } from '../services/projectService';

function formatUpdatedAt(value?: string): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

export function AppEntryPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectResponse[] | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    async function run() {
      setError(null);
      try {
        const mine = await listMyProjects();
        if (!cancelled) setProjects(mine);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat daftar proyek');
          setProjects([]);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center gap-4">
        <PageMeta path="/app" noIndex />
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-sm text-ink-muted">Memeriksa sesi…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <PageMeta path="/app" noIndex />
        <AuthGate nextPath="/app" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageMeta path="/app" noIndex />
      <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <AppLogo to="/" tone="light" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-secondary hidden sm:inline truncate max-w-[200px]">
            {user.name || user.email}
          </span>
          <button
            type="button"
            onClick={() => void logout().then(() => navigate('/'))}
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">Proyek saya</h1>
            <p className="text-sm text-ink-muted mt-1">
              Hanya proyek dengan pin lokasi tersimpan yang ditampilkan.
            </p>
          </div>
          <Link
            to="/app/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-[#2450d1] text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Proyek baru
          </Link>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {projects === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center space-y-4">
            <FolderOpen className="w-8 h-8 text-ink-muted mx-auto" />
            <p className="text-sm text-ink-muted">Belum ada proyek tersimpan. Kunci pin lokasi untuk memulai.</p>
            <Link to="/app/new" className="inline-flex text-sm font-semibold text-accent hover:underline">
              Pilih lokasi di peta
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  to={`/app/project/${project.id}`}
                  className="block rounded-xl border border-border bg-surface hover:border-accent/40 px-5 py-4 transition"
                >
                  <div className="font-medium text-ink truncate">
                    {project.locationName?.trim() || 'Lokasi tersimpan'}
                  </div>
                  <div className="text-xs text-ink-muted mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Step: {project.currentStep}</span>
                    {project.updatedAt ? <span>Update: {formatUpdatedAt(project.updatedAt)}</span> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
