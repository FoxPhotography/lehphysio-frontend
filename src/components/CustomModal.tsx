import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface CustomModalProps {
  modal: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: 'danger' | 'info' | 'success' | 'warning';
  } | null;
}

export const CustomModal: React.FC<CustomModalProps> = ({ modal }) => {
  if (!modal || !modal.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => modal.onCancel ? modal.onCancel() : modal.onConfirm()}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl z-10 backdrop-blur-md overflow-hidden text-left"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-brand-orange/10 blur-xl pointer-events-none rounded-full" />

          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            onClick={modal.onCancel ? modal.onCancel : modal.onConfirm}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className={`p-2.5 rounded-xl ${
              modal.type === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              modal.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              modal.type === 'warning' ? 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20' :
              'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white">{modal.title}</h3>
          </div>

          {/* Body */}
          <div className="mb-6">
            <p className="text-sm text-zinc-400 font-medium leading-relaxed">{modal.message}</p>
          </div>

          {/* Footer */}
          <div className="flex flex-row-reverse gap-3">
            <button 
              className={`font-extrabold text-xs py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md active:scale-95 ${
                modal.type === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' :
                'bg-gradient-to-r from-brand-orange to-brand-amber text-black hover:opacity-90 shadow-orange-glow'
              }`}
              onClick={modal.onConfirm}
            >
              {modal.confirmText || 'OK'}
            </button>
            {modal.onCancel && (
              <button 
                className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-2.5 px-5 rounded-xl cursor-pointer active:scale-95 transition-all" 
                onClick={modal.onCancel}
              >
                {modal.cancelText || 'Cancel'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
