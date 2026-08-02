import { useState } from 'react';
import { Home, Crown } from 'lucide-react';
import konsepRumahImg from '@/assets/ui/konsep.png';
import { PremiumUpsellModal } from '../billing/PremiumUpsellModal';

type FunnelGateProps = {
  buildPathUnlocked: boolean;
  canAccessBuildPath: boolean;
  onContinue: () => void;
  variant?: 'compact' | 'full';
};

export function FunnelGate({
  buildPathUnlocked,
  canAccessBuildPath,
  onContinue,
  variant = 'full',
}: FunnelGateProps) {
  const [upsellOpen, setUpsellOpen] = useState(false);
  const isCompact = variant === 'compact';

  const handleContinue = () => {
    if (!buildPathUnlocked && !canAccessBuildPath) {
      setUpsellOpen(true);
      return;
    }
    onContinue();
  };

  const ctaLabel = buildPathUnlocked
    ? 'Ke input lahan'
    : canAccessBuildPath
      ? 'Lanjut konsep rumah'
      : 'Upgrade untuk konsep rumah';

  if (isCompact) {
    return (
      <>
        <div className="rounded-2xl border border-border bg-surface shadow-sm p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              {buildPathUnlocked ? 'Jalur konsep rumah terbuka' : 'Langkah selanjutnya'}
            </h3>
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-accent hover:bg-blue-600 shadow-sm shadow-blue-600/20 transition shrink-0"
            >
              {canAccessBuildPath || buildPathUnlocked ? (
                <Home className="w-4 h-4" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              {ctaLabel}
            </button>
          </div>
        </div>
        <PremiumUpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-5 space-y-4 min-w-0">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                {buildPathUnlocked ? 'Jalur konsep rumah terbuka' : 'Langkah selanjutnya'}
              </h3>
              <p className="text-[12px] text-ink-muted leading-relaxed max-w-2xl">
                {buildPathUnlocked
                  ? 'Anda sudah membuka input lahan. Bisa kembali ke konsep rumah kapan saja dari sidebar.'
                  : canAccessBuildPath
                    ? 'Skor risiko lokasi sudah siap. Lanjut rancang konsep rumah atau ubah pin di sidebar bila ingin analisis lokasi lain.'
                    : 'Skor risiko lokasi sudah siap. Konsep rumah (denah, 3D, material) tersedia di paket Premium.'}
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-accent hover:bg-blue-600 shadow-sm shadow-blue-600/20 transition"
              >
                {canAccessBuildPath || buildPathUnlocked ? (
                  <Home className="w-4 h-4" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                {ctaLabel}
              </button>
            </div>
          </div>

          <div className="md:w-56 lg:w-64 shrink-0 border-t md:border-t-0 md:border-l border-border bg-surface-muted">
            <img
              src={konsepRumahImg}
              alt=""
              className="w-full h-40 md:h-full object-cover object-center"
            />
          </div>
        </div>
      </div>
      <PremiumUpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </>
  );
}
