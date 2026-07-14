import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Shield, Sparkles } from 'lucide-react';
import { AppLogo } from '../components/layout/AppLogo';
import { PageMeta } from '../components/seo/PageMeta';
import { APP_NAME } from '../config/brand';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080B10] text-[#E4E6EB] flex flex-col">
      <PageMeta path="/" />
      <header className="px-8 py-6 border-b border-[#1F293D] flex items-center justify-between">
        <AppLogo to="/" />
        <Link
          to="/app"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition"
        >
          Masuk Aplikasi
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Pra-Konstruksi Geospasial
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Pahami lahan sebelum bangun rumah anti-banjir & gempa
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {APP_NAME} membantu calon pemilik rumah menganalisis risiko lokasi, rekomendasi struktur, denah, dan kebutuhan material — berbasis data InaRISK & rule engine deterministik.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-[#0F1423] border border-[#1F293D] rounded-xl p-5">
              <MapPin className="w-5 h-5 text-blue-400 mb-3" />
              <h3 className="font-bold text-white text-sm mb-1">Analisis Lokasi</h3>
              <p className="text-xs text-gray-400">Banjir, gempa, elevasi, kemiringan, jarak sungai.</p>
            </div>
            <div className="bg-[#0F1423] border border-[#1F293D] rounded-xl p-5">
              <Shield className="w-5 h-5 text-emerald-400 mb-3" />
              <h3 className="font-bold text-white text-sm mb-1">Rekomendasi Struktur</h3>
              <p className="text-xs text-gray-400">Pondasi, elevasi lantai, sistem struktur aman.</p>
            </div>
            <div className="bg-[#0F1423] border border-[#1F293D] rounded-xl p-5">
              <Sparkles className="w-5 h-5 text-purple-400 mb-3" />
              <h3 className="font-bold text-white text-sm mb-1">Output Siap Pakai</h3>
              <p className="text-xs text-gray-400">Denah 2D, preview 3D, material, laporan PDF.</p>
            </div>
          </div>

          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition"
          >
            Mulai Perencanaan
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
