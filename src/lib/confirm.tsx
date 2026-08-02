import { confirmable, createConfirmation, type ConfirmDialogProps } from 'react-confirm';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
};

function ConfirmDialog({
  show,
  proceed,
  title = 'Konfirmasi',
  message,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
}: ConfirmDialogProps<ConfirmOptions, boolean>) {
  if (!show) return null;

  const confirmClass =
    tone === 'danger'
      ? 'bg-danger hover:bg-[#b92d24] text-white'
      : 'bg-accent hover:bg-[#2450d1] text-white';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40"
      role="presentation"
      onClick={() => proceed(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pondasi-confirm-title"
        aria-describedby="pondasi-confirm-message"
        className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border">
          <h3 id="pondasi-confirm-title" className="font-display text-lg font-semibold text-ink">
            {title}
          </h3>
        </div>
        <div className="px-5 py-4">
          <p id="pondasi-confirm-message" className="text-sm text-ink-secondary leading-relaxed">
            {message}
          </p>
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={() => proceed(false)}
            className="px-3 py-2 rounded-lg border border-border text-sm text-ink-muted hover:text-ink"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => proceed(true)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const confirmDialog = createConfirmation(confirmable(ConfirmDialog));

export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const result = await confirmDialog(options);
  return result === true;
}
