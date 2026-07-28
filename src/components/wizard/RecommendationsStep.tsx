import { Hammer, CheckCircle2, Bot, AlertTriangle } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';

export function RecommendationsStep() {
  const { recommendations, aiExplanation, siteAnalysis, nextStep } = usePondasiWorkspace();

  if (!recommendations) return null;

  const isNotRecommended = siteAnalysis?.buildSuitability?.level === 'tidak_disarankan';

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {isNotRecommended && siteAnalysis?.buildSuitability ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-300">{siteAnalysis.buildSuitability.label}</p>
              <p className="text-sm text-red-100/90 mt-1 leading-relaxed">{siteAnalysis.buildSuitability.advisory}</p>
            </div>
          </div>
        ) : null}

        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mx-auto border border-amber-500/20">
            <Hammer className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Rekomendasi Teknis Desain</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Output analisis desain — struktur, pondasi, dan elevasi untuk konsep rumah. Bukan mitigasi
            lokasi dari hasil risiko.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#141A2D] p-6 rounded-2xl border border-[#23324E] space-y-2 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sistem Struktur</span>
            <div className="text-xl font-bold text-blue-400">{recommendations.structureType}</div>
          </div>

          <div className="bg-[#141A2D] p-6 rounded-2xl border border-[#23324E] space-y-2 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Tipe Pondasi</span>
            <div className="text-xl font-bold text-emerald-400">{recommendations.foundationType}</div>
          </div>

          <div className="bg-[#141A2D] p-6 rounded-2xl border border-[#23324E] space-y-2 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Elevasi Lantai Dasar</span>
            <div className="text-xl font-bold text-purple-400">+{recommendations.floorElevation} cm</div>
          </div>
        </div>

        <div className="bg-[#0F1423] p-6 rounded-2xl border border-[#1F293D] flex gap-4 mt-6">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Kesimpulan Rule Desain</h4>
            <p className="text-sm text-gray-400 leading-relaxed">{recommendations.description}</p>
          </div>
        </div>

        <div className="bg-[#0A0D15] p-5 rounded-xl border border-blue-500/20 flex gap-4 items-start">
          <Bot className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Penjelasan AI (narasi saja)</span>
            <p className="text-xs text-gray-300 leading-relaxed italic">
              {aiExplanation || 'Penjelasan AI belum tersedia.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition"
          >
            Lihat Denah 2D
          </button>
        </div>
      </div>
    </div>
  );
}
