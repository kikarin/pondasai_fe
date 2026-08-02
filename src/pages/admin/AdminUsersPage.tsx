import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirm } from '../../lib/confirm';
import { useAuth } from '../../context/AuthContext';
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  bulkDeleteAdminUsers,
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  type AdminUser,
  type AdminUserPlan,
  type AdminUserRole,
} from '../../services/adminService';
import { AdminPagination } from './components/AdminPagination';
import { UserFormModal, type UserFormMode, type UserFormValues } from './components/UserFormModal';
import { errorMessage, formatDate, shortId } from './adminFormat';

type RoleFilter = 'all' | AdminUserRole;
type PlanFilter = 'all' | AdminUserPlan;

const ROLE_FILTERS: Array<[RoleFilter, string]> = [
  ['all', 'Semua role'],
  ['user', 'User'],
  ['admin', 'Admin'],
];

const PLAN_FILTERS: Array<[PlanFilter, string]> = [
  ['all', 'Semua plan'],
  ['basic', 'Basic'],
  ['premium', 'Premium'],
];

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ADMIN_DEFAULT_PAGE_SIZE);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set<string>());
  const [modal, setModal] = useState<UserFormMode | null>(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminUsers({
        q: query || null,
        role: roleFilter === 'all' ? null : roleFilter,
        plan: planFilter === 'all' ? null : planFilter,
        page,
        pageSize,
      });
      setRows(result.items);
      setTotal(result.total);
      setSelectedIds(new Set<string>());
      if (result.items.length === 0 && page > 1) setPage(1);
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal memuat user'));
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter, planFilter, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectableIds = useMemo(
    () => rows.filter((row) => row.id !== currentUser?.id).map((row) => row.id),
    [rows, currentUser?.id],
  );

  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set<string>() : new Set(selectableIds));
  }

  function applySearch() {
    setPage(1);
    setQuery(queryInput.trim());
  }

  function applyRoleFilter(next: RoleFilter) {
    setPage(1);
    setRoleFilter(next);
  }

  function applyPlanFilter(next: PlanFilter) {
    setPage(1);
    setPlanFilter(next);
  }

  async function handleSubmit(values: UserFormValues) {
    if (!modal) return;
    setModalBusy(true);
    setModalError(null);
    try {
      if (modal.type === 'create') {
        await createAdminUser({
          email: values.email.trim(),
          password: values.password,
          name: values.name.trim() || null,
          role: values.role,
          plan: values.plan,
        });
      } else {
        const payload: {
          email: string;
          name: string | null;
          role: AdminUserRole;
          plan: AdminUserPlan;
          password?: string;
        } = {
          email: values.email.trim(),
          name: values.name.trim() || null,
          role: values.role,
          plan: values.plan,
        };
        if (values.password.trim()) payload.password = values.password.trim();
        await updateAdminUser(modal.user.id, payload);
      }
      setModal(null);
      await load();
      toast.success(modal.type === 'create' ? 'User ditambahkan' : 'User diperbarui');
    } catch (err) {
      setModalError(errorMessage(err, 'Gagal menyimpan user'));
    } finally {
      setModalBusy(false);
    }
  }

  async function handleDelete(row: AdminUser) {
    if (currentUser?.id === row.id) {
      toast.error('Tidak bisa menghapus akun sendiri');
      return;
    }
    const ok = await confirm({
      title: 'Hapus user',
      message: `Hapus user ${row.email}? Proyek miliknya akan jadi guest (owner kosong).`,
      confirmLabel: 'Hapus user',
      tone: 'danger',
    });
    if (!ok) return;
    setDeletingId(row.id);
    try {
      await deleteAdminUser(row.id);
      await load();
      toast.success(`User ${row.email} dihapus`);
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal hapus user'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds].filter((id) => id !== currentUser?.id);
    if (ids.length === 0) {
      toast.error('Pilih minimal satu user (selain akun sendiri)');
      return;
    }
    const ok = await confirm({
      title: 'Hapus user terpilih',
      message: `Hapus ${ids.length} user terpilih? Proyek milik mereka akan jadi guest.`,
      confirmLabel: `Hapus ${ids.length} user`,
      tone: 'danger',
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      const result = await bulkDeleteAdminUsers(ids);
      await load();
      if (result.skipped > 0) {
        toast.message(`Terhapus ${result.deleted} user`, {
          description: `${result.skipped} dilewati (akun sendiri / admin terakhir / tidak ditemukan)`,
        });
      } else {
        toast.success(`Terhapus ${result.deleted} user`);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal bulk hapus user'));
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-ink-muted">{total} user terdaftar.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setModal({ type: 'create' });
          }}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah user
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
            placeholder="Cari email / nama"
            className="min-w-[200px] rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={applySearch}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-ink-secondary hover:border-accent/40"
          >
            <Search className="h-3.5 w-3.5" />
            Cari
          </button>
        </div>

        {ROLE_FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyRoleFilter(key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              roleFilter === key
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-surface text-ink-muted hover:border-accent/40'
            }`}
          >
            {label}
          </button>
        ))}

        {PLAN_FILTERS.map(([key, label]) => (
          <button
            key={`plan-${key}`}
            type="button"
            onClick={() => applyPlanFilter(key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              planFilter === key
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-surface text-ink-muted hover:border-accent/40'
            }`}
          >
            {label}
          </button>
        ))}

        {selectedIds.size > 0 ? (
          <button
            type="button"
            onClick={() => void handleBulkDelete()}
            disabled={bulkDeleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft disabled:opacity-60"
          >
            {bulkDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Hapus {selectedIds.size} terpilih
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-ink-muted">
              <tr>
                <th className="w-10 px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={selectableIds.length === 0}
                    aria-label="Pilih semua user"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Proyek</th>
                <th className="px-4 py-3 font-medium">Dibuat</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink-muted">
                    Tidak ada user pada filter ini.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-border ${
                      selectedIds.has(row.id) ? 'bg-accent-soft/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        disabled={currentUser?.id === row.id}
                        onChange={() => toggleSelection(row.id)}
                        aria-label={`Pilih ${row.email}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/users/${row.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {row.email}
                      </Link>
                      <div className="font-mono text-[10px] text-ink-muted">{shortId(row.id)}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{row.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                          row.role === 'admin'
                            ? 'bg-accent-soft text-accent'
                            : 'bg-surface-muted text-ink-muted'
                        }`}
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                          row.plan === 'premium'
                            ? 'bg-accent-soft text-accent'
                            : 'bg-surface-muted text-ink-muted'
                        }`}
                      >
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.isActive ? (
                        <span className="text-xs font-semibold text-success">aktif</span>
                      ) : (
                        <span className="inline-flex rounded-md bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                          suspended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={row.projectCount === 0 ? 'text-ink-muted' : 'font-medium'}>
                        {row.projectCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/admin/users/${row.id}`}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          Detail
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setModalError(null);
                            setModal({ type: 'edit', user: row });
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-ink-secondary hover:text-ink"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          disabled={deletingId === row.id || currentUser?.id === row.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-danger hover:underline disabled:opacity-40"
                          title={
                            currentUser?.id === row.id ? 'Tidak bisa hapus akun sendiri' : 'Hapus'
                          }
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={total}
          busy={loading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1);
            setPageSize(size);
          }}
        />
      </div>

      {modal ? (
        <UserFormModal
          mode={modal}
          busy={modalBusy}
          error={modalError}
          onClose={() => {
            if (!modalBusy) setModal(null);
          }}
          onSubmit={(values) => void handleSubmit(values)}
        />
      ) : null}
    </div>
  );
}
