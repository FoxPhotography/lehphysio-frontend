import React, { useEffect, useRef } from 'react';
import EmojiPicker, { Theme, EmojiClickData, EmojiStyle } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'centered';
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  position = 'top-right',
  className = '',
  width = 320,
  height = 380,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return () => {};

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'bottom-full right-0 mb-2';
      case 'top-left':
        return 'bottom-full left-0 mb-2';
      case 'bottom-right':
        return 'top-full right-0 mt-2';
      case 'bottom-left':
        return 'top-full left-0 mt-2';
      case 'centered':
        return 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000]';
      default:
        return 'bottom-full right-0 mb-2';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] ${position === 'centered' ? '' : 'md:hidden'}`}
          />
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`z-[10001] shadow-2xl overflow-hidden border border-zinc-800/90 bg-zinc-950/98 backdrop-blur-2xl 
              max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:w-full max-md:rounded-t-3xl max-md:rounded-b-none max-md:border-b-0
              md:rounded-2xl md:${position === 'centered' ? 'fixed' : 'absolute'} md:${getPositionClasses()} ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag / close header bar */}
            <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/60">
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto" />
            </div>
            <div className="w-full flex justify-center [&_.EmojiPickerReact]:!border-0 [&_.EmojiPickerReact]:!bg-transparent [&_.EmojiPickerReact]:!w-full">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.APPLE}
                autoFocusSearch={false}
                lazyLoadEmojis={true}
                searchPlaceHolder="بحث عن إيموجي..."
                width="100%"
                height={typeof window !== 'undefined' && window.innerWidth < 768 ? 320 : height}
                previewConfig={{
                  showPreview: false,
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
