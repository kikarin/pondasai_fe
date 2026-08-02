import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, FolderOpen, Loader2, Plus } from 'lucide-react';
import { useMyProjects } from '../../hooks/useMyProjects';
import type { StepId } from '../../types';

const STEP_SHORT: Partial<Record<string, string>> = {
  CHOOSE_LOCATION: 'Pilih Lokasi',
  SITE_ANALYSIS: 'Analisis Risiko',
  INPUT_LAND_DIMENSIONS: 'Data Tanah',
  EDIT_POLYGON: 'Area Bangunan',
  INPUT_REQUIREMENTS: 'Kebutuhan',
  RECOMMENDATIONS: 'Rekomendasi',
  FLOOR_PLAN: 'Denah 2D',
  PREVIEW_3D: 'Preview 3D',
  MATERIAL_LIST: 'Material',
  PDF_REPORT: 'PDF Report',
};

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

function stepLabel(step: string): string {
  return STEP_SHORT[step as StepId] || step;
}

type ProjectSwitcherProps = {
  activeProjectId?: string | null;
  className?: string;
};

export function ProjectSwitcher({ activeProjectId = null, className = '' }: ProjectSwitcherProps) {
  const navigate = useNavigate();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { projects, loading, error, refresh } = useMyProjects({
    enabled: true,
    activeProjectId,
  });

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) void refresh(false);
  }, [open, refresh]);

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 max-w-[200px] sm:max-w-[240px] px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-sm font-medium text-ink transition"
      >
        <FolderOpen className="w-4 h-4 text-accent shrink-0" />
        <span className="truncate">Proyek saya</span>
        <ChevronDown className={`w-3.5 h-3.5 text-ink-muted shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,320px)] rounded-xl border border-border bg-surface shadow-lg overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Proyek tersimpan
            </span>
            <button
              type="button"
              onClick={() => void refresh(true)}
              className="text-[11px] font-medium text-accent hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-[min(50vh,320px)] overflow-y-auto">
            {loading && projects.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat…
              </div>
            ) : error && projects.length === 0 ? (
              <div className="px-3 py-6 text-center space-y-2">
                <p className="text-sm text-danger">{error}</p>
                <button
                  type="button"
                  onClick={() => void refresh(true)}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="px-3 py-6 text-center space-y-2">
                <p className="text-sm text-ink-muted">Belum ada proyek tersimpan.</p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    navigate('/app/new');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat proyek baru
                </button>
              </div>
            ) : (
              <ul className="py-1">
                {projects.map((project) => {
                  const active = activeProjectId === project.id;
                  const label = project.locationName?.trim() || 'Lokasi tersimpan';
                  return (
                    <li key={project.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/app/project/${project.id}`);
                        }}
                        className={`w-full text-left px-3 py-2.5 hover:bg-surface-muted transition ${
                          active ? 'bg-accent-soft/50' : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-ink truncate flex items-center gap-2">
                          <span className="truncate">{label}</span>
                          {active ? (
                            <span className="shrink-0 text-[10px] uppercase tracking-wide font-semibold text-accent">
                              Aktif
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-ink-muted mt-0.5 flex flex-wrap gap-x-2">
                          <span>{stepLabel(project.currentStep)}</span>
                          {project.updatedAt ? <span>{formatUpdatedAt(project.updatedAt)}</span> : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border p-2 grid grid-cols-2 gap-1.5">
            <Link
              to="/app/new"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-accent hover:bg-accent-soft"
            >
              <Plus className="w-3.5 h-3.5" />
              Proyek baru
            </Link>
            <Link
              to="/app"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold text-ink-secondary hover:bg-surface-muted"
            >
              Lihat semua
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
