import React, { Suspense, lazy, useEffect, useRef } from 'react';
import type { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';

// The picker is ~300KB. Load it only when someone actually opens it.
const EmojiPicker = lazy(() => import('emoji-picker-react'));
const PickerFallback: React.FC<{ height: number | string }> = ({ height }) => (
  <div style={{ height }} className="w-full flex items-center justify-center text-zinc-500 text-xs font-bold">
    <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
  </div>
);
const DARK = 'dark' as Theme;
// Native emoji: no per-emoji image downloads, and they match what the keyboard inserts.
const NATIVE = 'native' as EmojiStyle;
import { m, AnimatePresence } from 'framer-motion';

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
  variant,
  position,
  className = '',
  width = 330,
  height = 320,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // If variant is explicitly specified, use it. Otherwise, if position is specified, use 'popover', else 'popover'.
  const activeVariant = variant || (position ? 'popover' : 'popover');
  const activePosition = position || 'top-left';

  // Close when clicking outside on popover mode
  useEffect(() => {
    if (!isOpen || activeVariant === 'drawer') return () => {};

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
  }, [isOpen, activeVariant, onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  // ─── DRAWER VARIANT (In-flow full-width keyboard replacement) ────────
  if (activeVariant === 'drawer') {
    return (
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: typeof height === 'number' ? height : 280, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className={`w-full min-w-[280px] overflow-hidden border-t border-zinc-800/80 bg-zinc-950 flex justify-center 
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
            <Suspense fallback={<PickerFallback height={height} />}><EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={DARK}
              emojiStyle={NATIVE}
              searchDisabled={true}
              skinTonesDisabled={true}
              autoFocusSearch={false}
              lazyLoadEmojis={true}
              width="100%"
              height={typeof height === 'number' ? height : 280}
              previewConfig={{
                showPreview: false,
              }}
            /></Suspense>
          </m.div>
        )}
      </AnimatePresence>
    );
  }

  // ─── POPOVER VARIANT (Floating dropdown) ───────────────────────────────────────
  const getPositionClasses = () => {
    switch (activePosition) {
      case 'top-right':
        return 'bottom-full end-0 mb-2';
      case 'top-left':
        return 'bottom-full start-0 mb-2';
      case 'bottom-right':
        return 'top-full end-0 mt-2';
      case 'bottom-left':
        return 'top-full start-0 mt-2';
      case 'centered':
        return 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000]';
      default:
        return 'bottom-full start-0 mb-2';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.94, y: activePosition.startsWith('top') ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: activePosition.startsWith('top') ? 8 : -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`absolute ${getPositionClasses()} z-[10001] shadow-2xl rounded-2xl overflow-hidden border border-zinc-800/90 bg-zinc-950/95 w-[320px] sm:w-[350px] max-w-[calc(100vw-32px)]
            [&_.EmojiPickerReact]:!border-0 
            [&_.EmojiPickerReact]:!bg-transparent 
            [&_.EmojiPickerReact]:!w-full 
            [&_.epr-emoji-category-label]:!hidden 
            [&_.epr-search-container]:!hidden 
            [&_.epr-header]:!hidden 
            [&_.epr-skin-tones]:!hidden 
            ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Suspense fallback={<PickerFallback height={height} />}><EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={DARK}
            emojiStyle={NATIVE}
            searchDisabled={true}
            skinTonesDisabled={true}
            autoFocusSearch={false}
            lazyLoadEmojis={true}
            width="100%"
            height={height}
            previewConfig={{
              showPreview: false,
            }}
          /></Suspense>
        </m.div>
      )}
    </AnimatePresence>
  );
};
