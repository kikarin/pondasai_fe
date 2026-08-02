import { useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import type { AdminUser, AdminUserPlan, AdminUserRole } from '../../../services/adminService';

export type UserFormMode = { type: 'create' } | { type: 'edit'; user: AdminUser };

export type UserFormValues = {
  email: string;
  name: string;
  role: AdminUserRole;
  plan: AdminUserPlan;
  password: string;
};

type UserFormModalProps = {
  mode: UserFormMode;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
};

export function UserFormModal({ mode, busy, error, onClose, onSubmit }: UserFormModalProps) {
  const isEdit = mode.type === 'edit';
  const [email, setEmail] = useState(isEdit ? mode.user.email : '');
  const [name, setName] = useState(isEdit ? mode.user.name || '' : '');
  const [role, setRole] = useState<AdminUserRole>(
    isEdit && mode.user.role === 'admin' ? 'admin' : 'user',
  );
  const [plan, setPlan] = useState<AdminUserPlan>(
    isEdit && mode.user.plan === 'premium' ? 'premium' : 'basic',
  );
  const [password, setPassword] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-modal-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 id="admin-user-modal-title" className="font-display text-lg font-semibold">
            {isEdit ? 'Edit user' : 'Tambah user'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-3 px-5 py-4"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onSubmit({ email, name, role, plan, password });
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Nama</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminUserRole)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Plan</span>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as AdminUserPlan)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="basic">basic</option>
              <option value="premium">premium</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">
              {isEdit ? 'Password baru (opsional)' : 'Password'}
            </span>
            <input
              type="password"
              required={!isEdit}
              minLength={isEdit && !password ? undefined : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Kosongkan jika tidak diganti' : 'Min. 8 karakter'}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-border px-3 py-2 text-sm text-ink-muted hover:text-ink"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
