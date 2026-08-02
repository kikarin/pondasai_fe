import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirm } from '../../lib/confirm';
import { deleteAdminProject, fetchAdminProject, type AdminProject } from '../../services/adminService';
import { errorMessage, formatDate, shortId } from './adminFormat';

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="text-sm text-ink-secondary">{children}</dd>
    </div>
  );
}

export function AdminProjectDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<AdminProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const next = await fetchAdminProject(id);
        if (!cancelled) {
          setProject(next);
          setNotFound(false);
        }
      } catch (err) {
        if (!cancelled) {
          setNotFound(true);
          toast.error(errorMessage(err, 'Gagal memuat proyek'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    if (!project) return;
    const label = project.locationName?.trim() || shortId(project.id);
    const ok = await confirm({
      title: 'Hapus proyek',
      message: `Hapus proyek "${label}"? Tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus proyek',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAdminProject(project.id);
      toast.success('Proyek dihapus');
      navigate('/admin/projects', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal hapus proyek'));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">Proyek tidak ditemukan.</p>
        <Link to="/admin/projects" className="text-sm font-semibold text-accent hover:underline">
          Kembali ke daftar proyek
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Projects
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold">
            {project.locationName?.trim() || 'Draft tanpa lokasi'}
          </h1>
          <p className="mt-1 font-mono text-xs text-ink-muted">{project.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.hasLocation ? (
            <Link
              to={`/app/project/${project.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-ink-secondary hover:border-accent/40"
            >
              <ExternalLink className="h-4 w-4" />
              Buka wizard
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Hapus
          </button>
        </div>
      </div>

      <dl className="rounded-xl border border-border bg-surface px-5 py-2">
        <MetaRow label="Owner">
          {project.userId ? (
            <Link to={`/admin/users/${project.userId}`} className="text-accent hover:underline">
              {project.ownerEmail || shortId(project.userId)}
            </Link>
          ) : (
            <span className="text-ink-muted">guest</span>
          )}
        </MetaRow>
        <MetaRow label="Step">
          <span className="font-mono text-xs">{project.currentStep}</span>
        </MetaRow>
        <MetaRow label="Lokasi">
          {project.hasLocation ? (
            project.locationName?.trim() || '—'
          ) : (
            <span className="font-semibold uppercase tracking-wide text-warning">draft kosong</span>
          )}
        </MetaRow>
        <MetaRow label="Koordinat">
          <span className="font-mono text-xs">
            {project.latitude != null && project.longitude != null
              ? `${project.latitude.toFixed(6)}, ${project.longitude.toFixed(6)}`
              : '—'}
          </span>
        </MetaRow>
        <MetaRow label="Dibuat">{formatDate(project.createdAt)}</MetaRow>
        <MetaRow label="Update terakhir">{formatDate(project.updatedAt)}</MetaRow>
      </dl>
    </div>
  );
}
