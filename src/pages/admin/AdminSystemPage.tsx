import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirm } from '../../lib/confirm';
import { fetchAdminStats, purgeEmptyProjects, type AdminStats } from '../../services/adminService';
import { errorMessage } from './adminFormat';

export function AdminSystemPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await fetchAdminStats());
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal memuat statistik'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePurge() {
    const emptyCount = stats?.projectsEmpty ?? 0;
    if (emptyCount === 0) return;
    const ok = await confirm({
      title: 'Bersihkan draft kosong',
      message: `Hapus ${emptyCount} draft kosong (tanpa pin lokasi)? Tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus draft',
      tone: 'danger',
    });
    if (!ok) return;
    setPurging(true);
    try {
      const result = await purgeEmptyProjects();
      await load();
      toast.success(`Terhapus ${result.deleted} draft kosong`);
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal membersihkan draft'));
    } finally {
      setPurging(false);
    }
  }

  const emptyCount = stats?.projectsEmpty ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">System</h1>
          <p className="mt-1 text-sm text-ink-muted">Aksi maintenance database proyek.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-2 text-sm font-semibold text-ink-secondary hover:border-accent/40 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Bersihkan draft kosong</h2>
        <p className="text-sm text-ink-secondary">
          Draft kosong adalah proyek tanpa pin lokasi — biasanya sisa user yang keluar sebelum memilih
          lokasi. Menghapusnya tidak memengaruhi proyek yang sudah punya lokasi.
        </p>
        <p className="text-sm">
          Saat ini:{' '}
          {loading ? (
            <span className="text-ink-muted">memuat…</span>
          ) : (
            <span className="font-display text-lg font-semibold">{emptyCount} draft kosong</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => void handlePurge()}
          disabled={purging || loading || emptyCount === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-40"
        >
          {purging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {emptyCount === 0 ? 'Tidak ada draft kosong' : `Hapus ${emptyCount} draft kosong`}
        </button>
      </section>
    </div>
  );
}
