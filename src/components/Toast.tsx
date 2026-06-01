import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 w-[90%] max-w-xs md:max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="flex items-center gap-3 px-4 py-3 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-md"
          >
            <div className="p-1 bg-brand-orange/15 rounded-lg text-brand-orange shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <span className="text-xs md:text-sm font-bold text-zinc-100 leading-normal">{message}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
