import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLogo } from './layout/AppLogo';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../utils/authErrors';

type AuthGateProps = {
  nextPath?: string;
  title?: string;
  subtitle?: string;
};

export function AuthGate({
  nextPath = '/app',
  title = 'Masuk untuk membuka aplikasi',
  subtitle = 'Proyek hanya disimpan setelah Anda login dan mengunci pin lokasi di peta.',
}: AuthGateProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || nextPath;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          name: name.trim() || undefined,
        });
      }
      navigate(next.startsWith('/') ? next : '/app', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, mode === 'login' ? 'Gagal masuk' : 'Gagal mendaftar'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="px-6 py-5 border-b border-border bg-surface flex items-center justify-between">
        <AppLogo to="/" tone="light" />
        <Link to="/" className="text-sm text-ink-muted hover:text-ink">
          Beranda
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-sm space-y-5">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-ink-muted">{subtitle}</p>
          </div>

          <div className="flex rounded-lg border border-border p-1 bg-surface-muted">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                mode === 'login' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                mode === 'register' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-secondary">Nama (opsional)</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
            ) : null}

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
              <span className="text-xs font-medium text-ink-secondary">Password (min. 8)</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
              {submitting ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Buat akun'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
