import { useState, type ReactNode } from 'react';
import { Crown, Lock } from 'lucide-react';
import { PremiumUpsellModal } from './PremiumUpsellModal';

type PremiumFeatureGateProps = {
  locked: boolean;
  title: string;
  description: string;
  children: ReactNode;
};

/** Saat Basic: tampilkan card terkunci + upsell. Premium: render children utuh. */
export function PremiumFeatureGate({
  locked,
  title,
  description,
  children,
}: PremiumFeatureGateProps) {
  const [upsellOpen, setUpsellOpen] = useState(false);

  if (!locked) return <>{children}</>;

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-4 h-4 text-ink-muted shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">{title}</h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent-soft px-2 py-0.5 rounded-md">
              Premium
            </span>
          </div>
        </div>
        <p className="text-[12px] text-ink-muted leading-relaxed">{description}</p>
        <button
          type="button"
          onClick={() => setUpsellOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white bg-accent hover:bg-[#2450d1] transition"
        >
          <Crown className="w-4 h-4" />
          Upgrade untuk membuka
        </button>
      </div>
      <PremiumUpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </>
  );
}
