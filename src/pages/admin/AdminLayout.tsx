import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  FolderKanban,
  LayoutDashboard,
  Loader2,
  ScrollText,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { AppLogo } from '../../components/layout/AppLogo';
import { PageMeta } from '../../components/seo/PageMeta';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/admin/system', label: 'System', icon: Wrench, end: false },
  { to: '/admin/audit', label: 'Audit', icon: ScrollText, end: false },
];

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas p-6 text-ink">
        <PageMeta path="/admin" noIndex />
        <Shield className="h-8 w-8 text-danger" />
        <p className="text-sm font-medium">Akses admin ditolak</p>
        <Link to="/app" className="text-sm text-accent hover:underline">
          Kembali ke aplikasi
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageMeta path="/admin" noIndex />

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <AppLogo to="/" tone="light" size="sm" />
          <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-ink-muted sm:inline">{user.email}</span>
          <Link to="/app" className="text-ink-muted hover:text-ink">
            Proyek saya
          </Link>
          <button type="button" onClick={() => void logout()} className="text-ink-muted hover:text-ink">
            Keluar
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="lg:w-52 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-ink-muted hover:bg-surface hover:text-ink'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
