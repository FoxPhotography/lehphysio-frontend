import React, { useEffect, useRef } from 'react';
import EmojiPicker, { Theme, EmojiClickData, EmojiStyle } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  variant?: 'drawer' | 'popover';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'centered';
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  variant = 'drawer',
  position = 'top-right',
  className = '',
  width = 320,
  height = 280,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside on popover mode
  useEffect(() => {
    if (!isOpen || variant === 'drawer') return () => {};

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
  }, [isOpen, variant, onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  // ─── DRAWER VARIANT (In-flow keyboard replacement under the input form) ────────
  if (variant === 'drawer') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: typeof height === 'number' ? height : 280, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className={`w-full overflow-hidden border-t border-zinc-800/80 bg-zinc-950 flex justify-center 
              [&_.EmojiPickerReact]:!border-0 
              [&_.EmojiPickerReact]:!bg-transparent 
              [&_.EmojiPickerReact]:!w-full 
              [&_.EmojiPickerReact]:!rounded-none
              [&_.epr-emoji-category-label]:!hidden
              [&_.epr-search-container]:!hidden
              [&_.epr-header]:!hidden
              [&_.epr-skin-tones]:!hidden
              ${className}`}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              emojiStyle={EmojiStyle.APPLE}
              searchDisabled={true}
              skinTonesDisabled={true}
              autoFocusSearch={false}
              lazyLoadEmojis={true}
              width="100%"
              height={typeof height === 'number' ? height : 280}
              previewConfig={{
                showPreview: false,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ─── POPOVER VARIANT (Floating dropdown) ───────────────────────────────────────
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
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.92, y: position.startsWith('top') ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: position.startsWith('top') ? 10 : -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`absolute ${getPositionClasses()} z-[10001] shadow-2xl rounded-2xl overflow-hidden border border-zinc-800/90 bg-zinc-950/95 backdrop-blur-xl 
            [&_.epr-emoji-category-label]:!hidden 
            [&_.epr-search-container]:!hidden 
            [&_.epr-header]:!hidden 
            [&_.epr-skin-tones]:!hidden 
            ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.DARK}
            emojiStyle={EmojiStyle.APPLE}
            searchDisabled={true}
            skinTonesDisabled={true}
            autoFocusSearch={false}
            lazyLoadEmojis={true}
            width={width}
            height={height}
            previewConfig={{
              showPreview: false,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
