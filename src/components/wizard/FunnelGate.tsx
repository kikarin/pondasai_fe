import { Check, Home } from 'lucide-react';
import type { ReactNode } from 'react';

type FunnelGateProps = {
  buildPathUnlocked: boolean;
  onFinish: () => void;
  onContinue: () => void;
  variant?: 'compact' | 'full';
  locationPdf?: ReactNode;
};

export function FunnelGate({
  buildPathUnlocked,
  onFinish,
  onContinue,
  variant = 'full',
  locationPdf,
}: FunnelGateProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={`rounded-2xl border border-[#1F293D] bg-[#0F1423] ${
        isCompact ? 'p-4' : 'p-5 space-y-4'
      }`}
    >
      <div className={isCompact ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between' : 'space-y-2'}>
        <div className="min-w-0 space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            {buildPathUnlocked ? 'Jalur konsep rumah terbuka' : 'Langkah selanjutnya'}
          </h3>
          {!isCompact ? (
            <p className="text-[12px] text-gray-400 leading-relaxed max-w-2xl">
              {buildPathUnlocked
                ? 'Anda sudah membuka input lahan. Bisa kembali ke konsep rumah kapan saja dari sidebar.'
                : 'Skor risiko lokasi sudah siap. Pilih berhenti di sini, unduh PDF lokasi, atau lanjut rancang konsep rumah.'}
            </p>
          ) : null}
        </div>

        <div className={`flex flex-col sm:flex-row gap-2 ${isCompact ? 'shrink-0' : 'pt-1'}`}>
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-[#23324E] bg-[#141A2D] text-gray-200 hover:bg-[#1A2236] hover:text-white transition"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            Selesai — cukup cek risiko
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition"
          >
            <Home className="w-4 h-4" />
            {buildPathUnlocked ? 'Ke input lahan' : 'Lanjut konsep rumah'}
          </button>
        </div>
      </div>

      {!isCompact && locationPdf ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-[#1F293D]">
          {locationPdf}
          <p className="text-[11px] text-gray-500 leading-relaxed">
            PDF lokasi berisi skor & mitigasi pin — bukan denah/struktur/material.
          </p>
        </div>
      ) : null}

      {!isCompact ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#1F293D]">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-400">Cukup untuk cek risiko.</span> Tetap di
            hasil ini — tidak dipaksa isi dimensi lahan.
          </p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-400">Rancang konsep rumah di lahan ini.</span>{' '}
            Buka input dimensi → polygon → kebutuhan, lalu analisis desain.
          </p>
        </div>
      ) : null}
    </div>
  );
}
