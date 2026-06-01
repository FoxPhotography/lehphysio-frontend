import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface XPPopupProps {
  popups: { id: number; amount: number }[];
}

export const XPPopup: React.FC<XPPopupProps> = ({ popups }) => {
  return (
    <div className="fixed inset-x-0 bottom-[20%] pointer-events-none flex flex-col items-center gap-2 z-[9999]">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1.1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              damping: 15, 
              stiffness: 150,
              duration: 1.2 
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-sm md:text-base shadow-lg ${
              popup.amount >= 0 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/20 border border-green-500/30' 
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/20 border border-red-500/30'
            }`}
          >
            <Zap className={`w-4.5 h-4.5 fill-current ${popup.amount >= 0 ? 'text-green-200' : 'text-red-200'}`} />
            <span>
              {popup.amount > 0 ? '+' : ''}
              {popup.amount} XP
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
