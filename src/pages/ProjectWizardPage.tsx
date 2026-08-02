import { Navigate, useParams } from 'react-router-dom';
import { PondasiWorkspaceProvider } from '../context/PondasiWorkspaceContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { MetricsStrip } from '../components/layout/MetricsStrip';
import { RightInsightPanel } from '../components/layout/RightInsightPanel';
import { LoadingOverlay } from '../components/overlays/LoadingOverlay';
import { DashboardWorkspace } from '../components/dashboard/DashboardWorkspace';
import { PageMeta } from '../components/seo/PageMeta';

function PondasiDashboard() {
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

  if (!id) {
    return <Navigate to="/app" replace />;
  }

  return (
    <PondasiWorkspaceProvider projectId={id}>
      <PageMeta path={`/app/project/${id}`} noIndex />
      <PondasiDashboard />
    </PondasiWorkspaceProvider>
  );
}
