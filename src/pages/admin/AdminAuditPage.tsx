import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  fetchAdminAudit,
  type AdminAuditLog,
} from '../../services/adminService';
import { AdminPagination } from './components/AdminPagination';
import { errorMessage, formatDate, shortId } from './adminFormat';

export function AdminAuditPage() {
  const [rows, setRows] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ADMIN_DEFAULT_PAGE_SIZE);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminAudit({ q: query || null, page, pageSize });
      setRows(result.items);
      setTotal(result.total);
      if (result.items.length === 0 && page > 1) setPage(1);
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal memuat audit log'));
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  function applySearch() {
    setPage(1);
    setQuery(queryInput.trim());
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Audit</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Catatan aksi admin (append-only). {total} entri.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applySearch();
          }}
          placeholder="Cari aksi / aktor / target"
          className="min-w-[220px] rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
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

      <div className="rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Aktor</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                    Belum ada catatan audit.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{row.actorEmail}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-surface-muted px-2 py-0.5 font-mono text-xs font-semibold text-ink-secondary">
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {row.targetType ? (
                        <div>
                          <div className="text-xs font-medium text-ink-secondary">{row.targetType}</div>
                          {row.targetId ? (
                            <div className="font-mono text-[10px]">{shortId(row.targetId)}</div>
                          ) : null}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="max-w-[320px] px-4 py-3 text-ink-secondary">
                      {row.detail || <span className="text-ink-muted">—</span>}
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
