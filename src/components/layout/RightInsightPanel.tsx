import { Lightbulb, Sparkles } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { LocationReportDownload } from '../wizard/LocationReportDownload';
import type { StepId } from '../../types';
import {
  categoryBadgeClass,
  scoreTextColorClass,
} from '../../utils/riskUi';
import { overallCategoryLabel } from '../../utils/siteIndicators';

/** Hide on map/form-heavy steps — avoids the busy 3-column layout. */
const RIGHT_PANEL_STEPS: StepId[] = ['SITE_ANALYSIS', 'RECOMMENDATIONS'];

function scoreTone(score: number, engineCategory?: string | null) {
  const label = overallCategoryLabel(score, engineCategory);
  const pill = categoryBadgeClass(label);
  const textColor = scoreTextColorClass(score);

  const panel =
    label === 'Tinggi'
      ? 'border-red-200 bg-red-50'
      : label === 'Sedang'
        ? 'border-amber-200 bg-amber-50'
        : 'border-emerald-200 bg-emerald-50';

  const dot =
    label === 'Tinggi' ? 'bg-red-500' : label === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500';

  return { label, pill, panel, dot, textColor };
}

export function RightInsightPanel() {
  const {
    siteAnalysis,
    recommendations,
    locationName,
    currentStep,
  } = usePondasiWorkspace();

  if (!RIGHT_PANEL_STEPS.includes(currentStep)) return null;
  if (!siteAnalysis && !recommendations) return null;

  const suitability = siteAnalysis?.buildSuitability;
  const overall = siteAnalysis?.overallRiskScore ?? 0;
  const engineCategory = siteAnalysis?.riskEngine?.overall.category ?? null;
  const tone = scoreTone(overall, engineCategory);
  const mitigations = siteAnalysis?.riskEngine?.recommendation?.slice(0, 3) ?? [];

  return (
    <aside
      id="right-insight-panel"
      className="w-[280px] shrink-0 border-l border-border bg-canvas overflow-y-auto hidden xl:flex flex-col"
    >
      <div className="p-4 space-y-3">
        {siteAnalysis && currentStep === 'SITE_ANALYSIS' ? (
          <section className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className={`w-4 h-4 ${tone.textColor}`} />
              <h3 className="font-display text-sm font-semibold text-ink">Ringkasan lokasi</h3>
            </div>

            <div className={`rounded-xl border px-3 py-2.5 space-y-2 ${tone.panel}`}>
              <p className="text-sm font-medium text-ink leading-snug">
                {suitability?.label || 'Hasil analisis siap ditinjau'}
              </p>
              <span className={`inline-flex items-center gap-1.5 ${tone.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                Skor {overall} · {tone.label}
              </span>
            </div>

            {mitigations.length > 0 ? (
              <ul className="space-y-2">
                {mitigations.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="flex gap-2 text-[13px] text-ink-secondary">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${tone.dot}`} />
                    <span className="leading-snug font-medium text-ink">{item.title}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <LocationReportDownload
              locationName={locationName}
              siteAnalysis={siteAnalysis}
              className="w-full"
              variant="blue"
            />
          </section>
        ) : null}

        {recommendations && currentStep === 'RECOMMENDATIONS' ? (
          <section className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-display text-sm font-semibold text-ink">Konsep struktural</h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">Pondasi</dt>
                <dd className="font-semibold text-ink">{recommendations.foundationType}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Struktur</dt>
                <dd className="font-semibold text-ink">{recommendations.structureType}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Elevasi lantai</dt>
                <dd className="font-semibold text-ink">{recommendations.floorElevation} m</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
