import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div
      className="fixed bottom-nav-offset xl:bottom-8 inset-x-0 z-[150] flex justify-center px-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {message && (
          <m.div
            key={message}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl"
          >
            <div className="p-1 bg-brand-orange/15 rounded-lg text-brand-orange shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <span dir="auto" className="text-sm font-bold text-zinc-100 leading-normal">{message}</span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
