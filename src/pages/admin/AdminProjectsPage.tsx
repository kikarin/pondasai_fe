import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { confirm } from '../../lib/confirm';
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  bulkDeleteAdminProjects,
  deleteAdminProject,
  fetchAdminProjects,
  type AdminProject,
} from '../../services/adminService';
import { AdminPagination } from './components/AdminPagination';
import { errorMessage, formatDate, shortId } from './adminFormat';

type ProjectFilter = 'located' | 'empty' | 'all';

const PROJECT_FILTERS: Array<[ProjectFilter, string]> = [
  ['located', 'Dengan lokasi'],
  ['empty', 'Draft kosong'],
  ['all', 'Semua'],
];

function hasLocationFor(filter: ProjectFilter): boolean | null {
  if (filter === 'located') return true;
  if (filter === 'empty') return false;
  return null;
}

export function AdminProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ownerId = searchParams.get('userId');
  const [rows, setRows] = useState<AdminProject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ADMIN_DEFAULT_PAGE_SIZE);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProjectFilter>(ownerId ? 'all' : 'located');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set<string>());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminProjects({
        q: query || null,
        userId: ownerId,
        hasLocation: hasLocationFor(filter),
        page,
        pageSize,
      });
      setRows(result.items);
      setTotal(result.total);
      setSelectedIds(new Set<string>());
      if (result.items.length === 0 && page > 1) setPage(1);
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal memuat proyek'));
    } finally {
      setLoading(false);
    }
  }, [query, ownerId, filter, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set<string>() : new Set(rows.map((row) => row.id)));
  }

  function applySearch() {
    setPage(1);
    setQuery(queryInput.trim());
  }

  function applyFilter(next: ProjectFilter) {
    setPage(1);
    setFilter(next);
  }

  function clearOwnerFilter() {
    setPage(1);
    setSearchParams({}, { replace: true });
  }

  async function handleDelete(row: AdminProject) {
    const label = row.locationName?.trim() || shortId(row.id);
    const ok = await confirm({
      title: 'Hapus proyek',
      message: `Hapus proyek "${label}"? Tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus proyek',
      tone: 'danger',
    });
    if (!ok) return;
    setDeletingId(row.id);
    try {
      await deleteAdminProject(row.id);
      await load();
      toast.success('Proyek dihapus');
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal hapus proyek'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      toast.error('Pilih minimal satu proyek');
      return;
    }
    const ok = await confirm({
      title: 'Hapus proyek terpilih',
      message: `Hapus ${ids.length} proyek terpilih? Tidak bisa dibatalkan.`,
      confirmLabel: `Hapus ${ids.length} proyek`,
      tone: 'danger',
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      const result = await bulkDeleteAdminProjects(ids);
      await load();
      if (result.skipped > 0) {
        toast.message(`Terhapus ${result.deleted} proyek`, {
          description: `${result.skipped} tidak ditemukan`,
        });
      } else {
        toast.success(`Terhapus ${result.deleted} proyek`);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal bulk hapus proyek'));
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Projects</h1>
        <p className="mt-1 text-sm text-ink-muted">{total} proyek pada filter aktif.</p>
      </div>

      {ownerId ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs">
          <span className="text-ink-secondary">
            Filter owner: <span className="font-mono font-semibold text-ink">{shortId(ownerId)}</span>
          </span>
          <button
            type="button"
            onClick={clearOwnerFilter}
            className="text-ink-muted hover:text-ink"
            aria-label="Hapus filter owner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
            placeholder="Cari lokasi / step"
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

        {PROJECT_FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyFilter(key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filter === key
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
                    disabled={rows.length === 0}
                    aria-label="Pilih semua proyek"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Step</th>
                <th className="px-4 py-3 font-medium">Koordinat</th>
                <th className="px-4 py-3 font-medium">Update</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                    {filter === 'empty'
                      ? 'Tidak ada draft kosong. Database sudah bersih.'
                      : 'Tidak ada proyek pada filter ini.'}
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
                        onChange={() => toggleSelection(row.id)}
                        aria-label={`Pilih proyek ${shortId(row.id)}`}
                      />
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <Link
                        to={`/admin/projects/${row.id}`}
                        className="block truncate font-medium text-accent hover:underline"
                      >
                        {row.locationName?.trim() || shortId(row.id)}
                      </Link>
                      <div className="font-mono text-[10px] text-ink-muted">{shortId(row.id)}</div>
                      {!row.hasLocation ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-warning">
                          draft kosong
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">
                      {row.userId ? (
                        <Link to={`/admin/users/${row.userId}`} className="hover:underline">
                          {row.ownerEmail || shortId(row.userId)}
                        </Link>
                      ) : (
                        <span className="text-ink-muted">guest</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.currentStep}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                      {row.hasLocation && row.latitude != null && row.longitude != null
                        ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(row.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/admin/projects/${row.id}`}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          Detail
                        </Link>
                        {row.hasLocation ? (
                          <Link
                            to={`/app/project/${row.id}`}
                            className="text-xs font-semibold text-ink-secondary hover:text-ink"
                          >
                            Buka
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          disabled={deletingId === row.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-danger hover:underline disabled:opacity-50"
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
    </div>
  );
}
