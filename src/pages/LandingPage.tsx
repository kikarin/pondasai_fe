import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AppLogo } from '../components/layout/AppLogo';
import { PageMeta } from '../components/seo/PageMeta';
import { APP_NAME, APP_TAGLINE, DEFAULT_SEO } from '../config/brand';
import { useAuth } from '../context/AuthContext';

const FUNNEL = [
  {
    step: '01',
    title: 'Cek risiko lokasi',
    body: 'Pin lahan → skor multi-hazard InaRISK, kelayakan, dan mitigasi lokasi.',
  },
  {
    step: '02',
    title: 'Pilih jalur',
    body: 'Cukup sampai risiko, atau lanjut rancang konsep rumah di lahan yang sama.',
  },
  {
    step: '03',
    title: 'Konsep rumah',
    body: 'Struktur, denah, preview 3D, material, dan laporan PDF — opsional setelah gate.',
  },
] as const;

export function LandingPage() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans antialiased">
      <PageMeta
        path="/"
        title="Pra-Konstruksi Geospasial"
        description={DEFAULT_SEO.description}
      />

      <header className="absolute inset-x-0 top-0 z-20 px-6 sm:px-10 py-5 flex items-center justify-between gap-4">
        <AppLogo to="/" tone="light" size="md" />
        <div className="flex items-center gap-2 sm:gap-3">
          {!loading && !user ? (
            <>
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-ink-secondary hover:text-ink transition">
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-3 py-2 text-sm font-medium text-ink-secondary hover:text-ink transition hidden sm:inline"
              >
                Daftar
              </Link>
            </>
          ) : null}
          {!loading && user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="px-3 py-2 text-sm font-medium text-ink-secondary hover:text-ink transition"
            >
              Keluar
            </button>
          ) : null}
          <Link
            to={user ? '/app' : '/login?next=/app'}
            className="px-4 py-2 bg-accent hover:bg-[#2450d1] text-white rounded-lg text-sm font-semibold transition"
          >
            {user ? 'Proyek saya' : 'Masuk'}
          </Link>
        </div>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden flex items-end sm:items-center">
        <div
          className="absolute inset-0 landing-hero-plane"
          aria-hidden
        />
        <div className="absolute inset-0 landing-hero-grid" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/90 to-canvas/35 sm:to-transparent" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 pb-16 pt-28 sm:py-24">
          <motion.div
            className="max-w-xl space-y-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-ink lowercase leading-none">
              {APP_NAME}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-secondary tracking-tight leading-snug">
              Pahami lahan sebelum membangun
            </h1>
            <p className="text-base sm:text-lg text-ink-muted max-w-md leading-relaxed">
              {APP_TAGLINE}. Data InaRISK & rule engine — AI hanya menjelaskan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                to={user ? '/app' : '/login?next=/app'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-accent hover:bg-[#2450d1] text-white rounded-lg text-sm font-semibold transition shadow-sm shadow-accent/20"
              >
                {user ? 'Buka proyek' : 'Masuk & mulai'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              {!user ? (
                <Link
                  to="/register?next=/app"
                  className="inline-flex items-center justify-center px-6 py-3.5 border border-border-strong hover:border-accent/50 text-ink rounded-lg text-sm font-semibold transition bg-surface/70 backdrop-blur-sm"
                >
                  Daftar gratis
                </Link>
              ) : (
                <Link
                  to="/app/new"
                  className="inline-flex items-center justify-center px-6 py-3.5 border border-border-strong hover:border-accent/50 text-ink rounded-lg text-sm font-semibold transition bg-surface/70 backdrop-blur-sm"
                >
                  Proyek baru
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl mb-12"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              Dari risiko ke konsep rumah
            </h2>
            <p className="mt-3 text-ink-muted text-base leading-relaxed">
              Funnel dua jalur: semua user melihat risiko dulu; konsep rumah hanya jika Anda memilih lanjut.
            </p>
          </motion.div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {FUNNEL.map((item, index) => (
              <motion.li
                key={item.step}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="space-y-3"
              >
                <span className="font-mono text-xs font-semibold text-accent tracking-widest">{item.step}</span>
                <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{item.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border px-6 sm:px-10 py-8 text-xs text-ink-muted flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between max-w-6xl mx-auto w-full">
        <span>
          © {new Date().getFullYear()} {APP_NAME}
        </span>
        <span>Bukan software arsitektur profesional — asisten pra-konstruksi.</span>
      </footer>
    </div>
  );
}
