import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PondasiWorkspaceProvider } from '../context/PondasiWorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { AuthGate } from '../components/AuthGate';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { MetricsStrip } from '../components/layout/MetricsStrip';
import { RightInsightPanel } from '../components/layout/RightInsightPanel';
import { LoadingOverlay } from '../components/overlays/LoadingOverlay';
import { DashboardWorkspace } from '../components/dashboard/DashboardWorkspace';
import { PageMeta } from '../components/seo/PageMeta';
import { getProject } from '../services/projectService';
import { ApiError } from '../services/apiClient';

function PondasiDashboard({ projectId }: { projectId: string }) {
  const { user, claimCurrentProject } = useAuth();

  useEffect(() => {
    if (!user) return;
    void claimCurrentProject(projectId).catch(() => undefined);
  }, [user, projectId, claimCurrentProject]);

  return (
    <div
      id="pondasi-app-root"
      className="h-screen bg-canvas text-ink font-sans antialiased selection:bg-blue-600 selection:text-white overflow-hidden flex"
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <DashboardHeader />
        <LoadingOverlay />

        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          <main id="main-content-dashboard" className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            <MetricsStrip />
            <DashboardWorkspace />
          </main>
          <RightInsightPanel />
        </div>
      </div>
    </div>
  );
}

export function ProjectWizardPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [gate, setGate] = useState<'loading' | 'ok' | 'forbidden'>('loading');

  useEffect(() => {
    if (!id || authLoading) return;
    if (!user) return;

    let cancelled = false;

    async function checkAccess() {
      try {
        await getProject(id!);
        if (!cancelled) setGate('ok');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setGate('forbidden');
          return;
        }
        setGate('ok');
      }
    }

    void checkAccess();
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  if (!id) {
    return <Navigate to="/app" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <PageMeta path={`/app/project/${id}`} noIndex />
        <AuthGate nextPath={`/app/project/${id}`} />
      </>
    );
  }

  if (gate === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (gate === 'forbidden') {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center gap-3 p-6">
        <PageMeta path={`/app/project/${id}`} noIndex />
        <p className="text-sm font-medium">Anda tidak punya akses ke proyek ini.</p>
        <Link to="/app" className="text-sm text-accent hover:underline">
          Kembali ke daftar proyek
        </Link>
      </div>
    );
  }

  return (
    <PondasiWorkspaceProvider projectId={id}>
      <PageMeta path={`/app/project/${id}`} noIndex />
      <PondasiDashboard projectId={id} />
    </PondasiWorkspaceProvider>
  );
}
