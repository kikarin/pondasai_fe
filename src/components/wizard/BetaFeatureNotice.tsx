import type { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';

type BetaFeatureNoticeProps = {
  title?: string;
  children: ReactNode;
};

export function BetaFeatureNotice({ title = 'Fitur Beta', children }: BetaFeatureNoticeProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
      <FlaskConical className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">{title}</p>
        <p className="text-xs text-amber-900/80 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
