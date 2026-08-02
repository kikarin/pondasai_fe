import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLogo } from '../components/layout/AppLogo';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../utils/authErrors';

function safeNextPath(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/app';
}

function projectIdFromNext(next: string): string | null {
  const match = next.match(/^\/app\/project\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function LoginPage() {
  const { login, claimCurrentProject } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNextPath(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      const projectId = projectIdFromNext(next);
      if (projectId) {
        await claimCurrentProject(projectId);
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, 'Gagal masuk'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <PageMeta path="/login" noIndex />
      <header className="px-6 py-5 border-b border-border bg-surface flex items-center justify-between">
        <AppLogo to="/" tone="light" />
        <Link to={`/register?next=${encodeURIComponent(next)}`} className="text-sm font-medium text-accent hover:underline">
          Daftar
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 space-y-5 shadow-sm">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold text-ink">Masuk</h1>
            <p className="text-sm text-ink-muted">Lanjutkan proyek tersimpan di akun Anda.</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-secondary">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-secondary">Password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent hover:bg-[#2450d1] text-white text-sm font-semibold py-2.5 transition disabled:opacity-60"
          >
            {submitting ? 'Memproses…' : 'Masuk'}
          </button>

          <p className="text-xs text-ink-muted text-center">
            Belum punya akun?{' '}
            <Link to={`/register?next=${encodeURIComponent(next)}`} className="text-accent font-medium hover:underline">
              Daftar
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
