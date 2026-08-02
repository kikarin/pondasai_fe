import { Hammer, CheckCircle2, Bot, AlertTriangle } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';

export function RecommendationsStep() {
  const { recommendations, aiExplanation, siteAnalysis, nextStep } = usePondasiWorkspace();

  if (!recommendations) return null;

  const isNotRecommended = siteAnalysis?.buildSuitability?.level === 'tidak_disarankan';

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {isNotRecommended && siteAnalysis?.buildSuitability ? (
          <div className="rounded-2xl border border-red-200 bg-danger-soft p-5 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-danger">{siteAnalysis.buildSuitability.label}</p>
              <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
                {siteAnalysis.buildSuitability.advisory}
              </p>
            </div>
          </div>
        ) : null}

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto border border-amber-100">
            <Hammer className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-ink tracking-tight">Rekomendasi Teknis Desain</h2>
          <p className="text-sm text-ink-muted max-w-xl mx-auto">
            Output analisis desain — struktur, pondasi, dan elevasi untuk konsep rumah. Bukan mitigasi
            lokasi dari hasil risiko.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Sistem Struktur
            </span>
            <div className="text-xl font-bold text-accent">{recommendations.structureType}</div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Tipe Pondasi
            </span>
            <div className="text-xl font-bold text-success">{recommendations.foundationType}</div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
              Elevasi Lantai Dasar
            </span>
            <div className="text-xl font-bold text-violet-600">+{recommendations.floorElevation} cm</div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex gap-4">
          <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-ink uppercase tracking-wider">Kesimpulan Rule Desain</h4>
            <p className="text-sm text-ink-secondary leading-relaxed">{recommendations.description}</p>
          </div>
        </div>

        <div className="bg-accent-soft p-5 rounded-xl border border-blue-100 flex gap-4 items-start">
          <Bot className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
              Penjelasan AI (narasi saja)
            </span>
            <p className="text-xs text-ink-secondary leading-relaxed italic">
              {aiExplanation || 'Penjelasan AI belum tersedia.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-accent hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-600/20 transition"
          >
            Lihat Denah 2D
          </button>
        </div>
      </div>
    </div>
  );
}
