import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AppEntryPage } from './pages/AppEntryPage';
import { NewProjectPage } from './pages/NewProjectPage';
import { ProjectWizardPage } from './pages/ProjectWizardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UpgradePage } from './pages/UpgradePage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminProjectDetailPage } from './pages/admin/AdminProjectDetailPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<AppEntryPage />} />
      <Route path="/app/new" element={<NewProjectPage />} />
      <Route path="/app/project/:id" element={<ProjectWizardPage />} />
      <Route path="/upgrade" element={<UpgradePage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="projects" element={<AdminProjectsPage />} />
        <Route path="projects/:id" element={<AdminProjectDetailPage />} />
        <Route path="system" element={<AdminSystemPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
