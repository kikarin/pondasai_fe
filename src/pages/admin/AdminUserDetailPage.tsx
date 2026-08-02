import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirm } from '../../lib/confirm';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminUser,
  fetchAdminUser,
  updateAdminUser,
  type AdminUserDetail,
  type AdminUserPlan,
  type AdminUserRole,
} from '../../services/adminService';
import { errorMessage, formatDate, shortId } from './adminFormat';

export function AdminUserDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminUserRole>('user');
  const [plan, setPlan] = useState<AdminUserPlan>('basic');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isSelf = currentUser?.id === id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchAdminUser(id);
      setDetail(next);
      setEmail(next.email);
      setName(next.name || '');
      setRole(next.role === 'admin' ? 'admin' : 'user');
      setPlan(next.plan === 'premium' ? 'premium' : 'basic');
      setPassword('');
      setNotFound(false);
    } catch (err) {
      setNotFound(true);
      toast.error(errorMessage(err, 'Gagal memuat user'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: {
        email: string;
        name: string | null;
        role: AdminUserRole;
        plan: AdminUserPlan;
        password?: string;
      } = {
        email: email.trim(),
        name: name.trim() || null,
        role,
        plan,
      };
      if (password.trim()) payload.password = password.trim();
      await updateAdminUser(id, payload);
      await load();
      toast.success('User diperbarui');
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal menyimpan user'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!detail) return;
    const suspending = detail.isActive;
    const ok = await confirm({
      title: suspending ? 'Suspend user' : 'Aktifkan user',
      message: suspending
        ? `Suspend ${detail.email}? User tidak akan bisa login sampai diaktifkan lagi.`
        : `Aktifkan kembali ${detail.email}? User bisa login lagi.`,
      confirmLabel: suspending ? 'Suspend' : 'Aktifkan',
      tone: suspending ? 'danger' : 'default',
    });
    if (!ok) return;
    setTogglingActive(true);
    try {
      await updateAdminUser(id, { isActive: !detail.isActive });
      await load();
      toast.success(suspending ? 'User disuspend' : 'User diaktifkan');
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal mengubah status user'));
    } finally {
      setTogglingActive(false);
    }
  }

  async function handleDelete() {
    if (!detail) return;
    if (isSelf) {
      toast.error('Tidak bisa menghapus akun sendiri');
      return;
    }
    const ok = await confirm({
      title: 'Hapus user',
      message: `Hapus user ${detail.email}? Proyek miliknya akan jadi guest (owner kosong).`,
      confirmLabel: 'Hapus user',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteAdminUser(id);
      toast.success('User dihapus');
      navigate('/admin/users', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal hapus user'));
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

  if (notFound || !detail) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">User tidak ditemukan.</p>
        <Link to="/admin/users" className="text-sm font-semibold text-accent hover:underline">
          Kembali ke daftar user
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Users
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold">{detail.email}</h1>
          <p className="mt-1 font-mono text-xs text-ink-muted">{detail.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleToggleActive()}
            disabled={togglingActive}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-60 ${
              detail.isActive
                ? 'border-warning/40 text-warning hover:bg-warning-soft'
                : 'border-success/40 text-success hover:bg-success-soft'
            }`}
          >
            {togglingActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : detail.isActive ? (
              <ShieldOff className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {detail.isActive ? 'Suspend' : 'Aktifkan'}
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting || isSelf}
            title={isSelf ? 'Tidak bisa hapus akun sendiri' : 'Hapus user'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Hapus
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <form onSubmit={(e) => void handleSave(e)} className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">Data user</h2>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Nama</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminUserRole)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Plan</span>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as AdminUserPlan)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="basic">basic</option>
              <option value="premium">premium</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Password baru (opsional)</span>
            <input
              type="password"
              minLength={password ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kosongkan jika tidak diganti"
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Simpan
            </button>
          </div>
        </form>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-5 text-sm">
          <h2 className="font-display text-lg font-semibold">Status</h2>
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Akun</dt>
              <dd>
                {detail.isActive ? (
                  <span className="text-xs font-semibold text-success">aktif</span>
                ) : (
                  <span className="inline-flex rounded-md bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                    suspended
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Role</dt>
              <dd className="font-medium">{detail.role}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Plan</dt>
              <dd>
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                    detail.plan === 'premium'
                      ? 'bg-accent-soft text-accent'
                      : 'bg-surface-muted text-ink-muted'
                  }`}
                >
                  {detail.plan}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Proyek</dt>
              <dd className="font-medium">{detail.projectCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Dibuat</dt>
              <dd className="text-ink-secondary">{formatDate(detail.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-lg font-semibold">Proyek milik user</h2>
          <Link
            to={`/admin/projects?userId=${detail.id}`}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Lihat di daftar proyek
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Step</th>
                <th className="px-4 py-3 font-medium">Update</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {detail.projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                    User ini belum punya proyek.
                  </td>
                </tr>
              ) : (
                detail.projects.map((project) => (
                  <tr key={project.id} className="border-t border-border">
                    <td className="max-w-[240px] px-4 py-3">
                      <div className="truncate font-medium">{project.locationName?.trim() || '—'}</div>
                      <div className="font-mono text-[10px] text-ink-muted">{shortId(project.id)}</div>
                      {!project.hasLocation ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-warning">
                          draft kosong
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{project.currentStep}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(project.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/projects/${project.id}`}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
