import { ShoppingCart } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';

export function MaterialListStep() {
  const { materials, nextStep } = usePondasiWorkspace();

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col">
      <div className="max-w-4xl mx-auto space-y-6 w-full">
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-violet-600" />
            Estimasi Kebutuhan Material Utama
          </h2>
          <p className="text-xs text-ink-muted">
            Dihitung berdasarkan Rule Engine pondasai (Kuantitas saja, tanpa estimasi harga).
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs text-ink-muted uppercase tracking-wider border-b border-border">
              <tr>
                <th className="p-4">Material (Sesuai SNI)</th>
                <th className="p-4 text-right">Kuantitas</th>
                <th className="p-4">Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {materials.map((mat, i) => (
                <tr key={i} className="hover:bg-surface-muted transition">
                  <td className="p-4 text-ink font-medium">{mat.name}</td>
                  <td className="p-4 text-right text-accent font-bold font-mono">{mat.quantity.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-ink-muted font-mono text-xs">{mat.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition"
          >
            Lanjut ke Laporan PDF
          </button>
        </div>
      </div>
    </div>
  );
}
