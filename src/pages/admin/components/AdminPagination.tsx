import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ADMIN_PAGE_SIZES } from '../../../services/adminService';

type AdminPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  busy?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function AdminPagination({
  page,
  pageSize,
  total,
  busy = false,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2">
        <span>Tampilkan</span>
        <select
          value={pageSize}
          disabled={busy}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-accent disabled:opacity-60"
          aria-label="Jumlah baris per halaman"
        >
          {ADMIN_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>entri</span>
      </label>

      <div className="flex items-center gap-4">
        <span>
          Menampilkan {firstRow}–{lastRow} dari {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={busy || currentPage <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-semibold text-ink-secondary hover:border-accent/40 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <span className="px-2 font-mono">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={busy || currentPage >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-semibold text-ink-secondary hover:border-accent/40 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
