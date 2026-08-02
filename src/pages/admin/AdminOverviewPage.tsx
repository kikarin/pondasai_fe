import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  FolderKanban,
  Loader2,
  MapPin,
  RefreshCw,
  Shield,
  TrendingUp,
  UserMinus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchAdminStats, type AdminStats } from '../../services/adminService';
import { errorMessage } from './adminFormat';

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: typeof Users;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="text-[11px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await fetchAdminStats();
        if (!cancelled) setStats(next);
      } catch (err) {
        if (!cancelled) toast.error(errorMessage(err, 'Gagal memuat statistik'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      setStats(await fetchAdminStats());
      toast.success('Statistik diperbarui');
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal refresh statistik'));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Overview</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Ringkasan operasional user & proyek.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-2 text-sm font-semibold text-ink-secondary hover:border-accent/40 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading || !stats ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Users" value={stats.usersTotal} hint={`${stats.usersAdmin} admin`} icon={Users} />
            <StatCard
              label="User aktif"
              value={stats.usersActive}
              hint={`${stats.usersSuspended} suspended`}
              icon={Shield}
            />
            <StatCard
              label="Signup 7 hari"
              value={stats.signupsLast7Days}
              hint="Registrasi terbaru"
              icon={TrendingUp}
            />
            <StatCard
              label="Plan Basic"
              value={stats.usersBasic}
              hint="Hanya analisis risiko"
              icon={Users}
            />
            <StatCard
              label="Plan Premium"
              value={stats.usersPremium}
              hint="Bisa konsep rumah"
              icon={Crown}
            />
            <StatCard
              label="User suspended"
              value={stats.usersSuspended}
              hint="Tidak bisa login"
              icon={UserMinus}
            />
            <StatCard
              label="Proyek + lokasi"
              value={stats.projectsWithLocation}
              hint={`Total proyek ${stats.projectsTotal}`}
              icon={MapPin}
            />
            <StatCard
              label="Draft kosong"
              value={stats.projectsEmpty}
              hint="Tanpa pin — bisa dibersihkan"
              icon={FolderKanban}
            />
            <StatCard
              label="Guest (berlokasi)"
              value={stats.projectsGuest}
              hint="Tanpa owner"
              icon={Shield}
            />
            <StatCard
              label="Total proyek"
              value={stats.projectsTotal}
              hint="Semua status"
              icon={FolderKanban}
            />
          </section>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              to="/admin/users"
              className="rounded-lg border border-border bg-surface px-3 py-2 font-semibold text-ink-secondary hover:border-accent/40"
            >
              Kelola users
            </Link>
            <Link
              to="/admin/projects"
              className="rounded-lg border border-border bg-surface px-3 py-2 font-semibold text-ink-secondary hover:border-accent/40"
            >
              Kelola projects
            </Link>
            {stats.projectsEmpty > 0 ? (
              <Link
                to="/admin/system"
                className="rounded-lg border border-danger/30 px-3 py-2 font-semibold text-danger hover:bg-danger-soft"
              >
                Bersihkan {stats.projectsEmpty} draft kosong
              </Link>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
