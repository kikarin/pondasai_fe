import { Link } from 'react-router-dom';
import { Crown, ArrowLeft } from 'lucide-react';
import { PageMeta } from '../components/seo/PageMeta';
import { AppLogo } from '../components/layout/AppLogo';
import { useAuth } from '../context/AuthContext';

export function UpgradePage() {
  const { user, canAccessBuildPath, refresh } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageMeta
        path="/upgrade"
        title="Upgrade Premium"
        description="Buka konsep rumah Pondasi.ai dengan paket Premium."
      />
      <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <AppLogo to="/" tone="light" />
        <Link to={user ? '/app' : '/'} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12 space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
          <Crown className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold">Premium</h1>
          <p className="text-ink-muted leading-relaxed">
            Buka jalur konsep rumah setelah analisis risiko: input lahan, denah, preview 3D, dan material.
            Harga & pembayaran online segera tersedia.
          </p>
        </div>

        {canAccessBuildPath ? (
          <div className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-ink">
            Akun Anda sudah bisa mengakses konsep rumah.
            <div className="mt-2">
              <Link to="/app" className="font-semibold text-accent hover:underline">
                Buka proyek saya
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3 text-sm">
            <p className="text-ink-secondary">
              Untuk upgrade sekarang, hubungi admin agar plan akun diubah ke Premium. Setelah diubah, muat
              ulang sesi lalu lanjutkan dari hasil risiko.
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Cek status Premium
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
