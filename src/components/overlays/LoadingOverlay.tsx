import { AnimatePresence, motion } from 'motion/react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import {
  DESIGN_LOADING_STEPS,
  SITE_LOADING_STEPS,
} from '../../hooks/usePondasiWorkspaceState';
import { Loader2 } from 'lucide-react';

export function LoadingOverlay() {
  const { isPending, loadingStepIndex, loadingKind } = usePondasiWorkspace();

  const steps = loadingKind === 'design' ? DESIGN_LOADING_STEPS : SITE_LOADING_STEPS;
  const title =
    loadingKind === 'design'
      ? 'Menyusun konsep rumah'
      : 'Menganalisis risiko lokasi';

  return (
    <AnimatePresence>
      {isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#080B10]/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
          <div className="w-16 h-16 relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping" />
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-blue-400 font-mono text-sm max-w-md text-center h-6">
            {steps[loadingStepIndex] || 'Menyelesaikan...'}
          </p>

          <div className="w-64 h-1.5 bg-[#1F293D] rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
              style={{ width: `${((loadingStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
