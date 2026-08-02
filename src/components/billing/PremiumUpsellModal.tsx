import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Crown, X } from 'lucide-react';

type PremiumUpsellModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PremiumUpsellModal({ open, onClose }: PremiumUpsellModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/40"
      style={{ width: '100vw', height: '100dvh', top: 0, left: 0 }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-upsell-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 id="premium-upsell-title" className="font-display text-lg font-semibold text-ink">
                Upgrade ke Premium
              </h3>
              <p className="text-sm text-ink-muted mt-1 leading-relaxed">
                Fitur lanjutan lokasi (skenario edukasi, mitigasi, indeks risiko) dan konsep rumah (denah,
                3D, material) tersedia di paket Premium. Skor risiko dasar tetap gratis di Basic.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-ink-secondary">
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Skenario edukasi, mitigasi lokasi, & indeks risiko on-demand</li>
            <li>Input lahan & area bangunan</li>
            <li>Rekomendasi struktur & denah 2D</li>
            <li>Preview 3D dan daftar material</li>
          </ul>
          <p className="text-xs text-ink-muted">
            Pembayaran online segera hadir. Untuk sekarang, upgrade dilakukan oleh admin.
          </p>
        </div>
        <div className="px-5 py-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-border text-sm text-ink-muted hover:text-ink"
          >
            Nanti saja
          </button>
          <Link
            to="/upgrade"
            onClick={onClose}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-[#2450d1]"
          >
            Lihat Premium
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
