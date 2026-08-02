import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { createProject } from '../services/projectService';
import { PageMeta } from '../components/seo/PageMeta';

export function AppEntryPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const project = await createProject();
        if (!cancelled) {
          navigate(`/app/project/${project.id}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal membuat proyek baru');
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center gap-4">
      <PageMeta path="/app" noIndex />
      <Loader2 className="w-10 h-10 text-accent animate-spin" />
      <p className="text-sm text-ink-muted">Menyiapkan workspace proyek baru...</p>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
