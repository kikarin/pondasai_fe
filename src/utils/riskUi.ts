export const SCORE_CATEGORY_HIGH = 67;
export const SCORE_CATEGORY_MEDIUM = 34;

export type RiskCategoryLabel = 'Rendah' | 'Sedang' | 'Tinggi';

export function scoreCategoryFromValue(score: number): RiskCategoryLabel {
  if (score >= SCORE_CATEGORY_HIGH) return 'Tinggi';
  if (score >= SCORE_CATEGORY_MEDIUM) return 'Sedang';
  return 'Rendah';
}

export function scoreTextColorClass(value: number): string {
  if (value >= SCORE_CATEGORY_HIGH) return 'text-red-600';
  if (value >= SCORE_CATEGORY_MEDIUM) return 'text-amber-600';
  return 'text-emerald-600';
}

export function scoreBarColorClass(value: number): string {
  if (value >= SCORE_CATEGORY_HIGH) return 'bg-red-500';
  if (value >= SCORE_CATEGORY_MEDIUM) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function categoryBadgeClass(category: string | null | undefined): string {
  const base = 'inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold';
  if (category === 'Tinggi') return `${base} text-red-800 bg-red-100 border-red-300`;
  if (category === 'Sedang') return `${base} text-amber-800 bg-amber-100 border-amber-300`;
  return `${base} text-emerald-800 bg-emerald-100 border-emerald-300`;
}

export function levelBadgeClass(level: 'Rendah' | 'Sedang' | 'Tinggi' | string): string {
  return categoryBadgeClass(level);
}

export function riskPillClass(category?: string | null, score?: number): string {
  const cat = category || (score != null ? scoreCategoryFromValue(score) : undefined);
  return categoryBadgeClass(cat);
}
