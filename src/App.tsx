import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AppEntryPage } from './pages/AppEntryPage';
import { ProjectWizardPage } from './pages/ProjectWizardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppEntryPage />} />
      <Route path="/app/project/:id" element={<ProjectWizardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
