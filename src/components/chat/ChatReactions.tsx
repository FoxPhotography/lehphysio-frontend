import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';
import type { ChatReaction } from '../../types';
import { QUICK_REACTIONS, normalizeEmoji } from '../../utils/chatReactions';

// ─── Pill attached under a bubble ────────────────────────────────────────────

interface ReactionSummaryProps {
  reactions: ChatReaction[];
  isMine: boolean;
  onOpenDetails: () => void;
  onToggle: (emoji: string) => void;
}

/**
 * WhatsApp-style capsule hanging off the bubble's bottom edge: the top emojis plus a
 * total. Tapping opens "who reacted"; a single reaction type that isn't yours can be
 * tapped to join in quickly via the details sheet as well.
 */
export const ReactionSummary: React.FC<ReactionSummaryProps> = ({ reactions, isMine, onOpenDetails }) => {
  const total = reactions.reduce((sum, r) => sum + r.count, 0);
  if (total === 0) return null;
  const top = reactions.slice(0, 3);
  const iReacted = reactions.some(r => r.userReacted);

  return (
    <m.button
      type="button"
      layout
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 22 }}
      onClick={(e) => { e.stopPropagation(); onOpenDetails(); }}
      onTouchStart={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      aria-label={`${total} تفاعل — اعرض مين تفاعل`}
      className={`relative -mt-2.5 z-10 inline-flex items-center gap-1 h-7 ps-1.5 pe-2 rounded-full border shadow-lg shadow-black/40 ring-2 ring-zinc-950 cursor-pointer active:scale-95 transition-colors ${
        isMine ? 'me-2' : 'ms-2'
      } ${iReacted ? 'bg-zinc-900 border-brand-orange/60' : 'bg-zinc-900 border-zinc-700/80 hover:border-zinc-500'}`}
    >
      <span className="flex items-center -space-x-1 rtl:space-x-reverse">
        {top.map(r => (
          <m.span
            key={r.emoji}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 18 }}
            className="text-[15px] leading-none drop-shadow"
          >
            {normalizeEmoji(r.emoji)}
          </m.span>
        ))}
      </span>
      {total > 1 && (
        <span className={`text-[11px] font-black tabular-nums ${iReacted ? 'text-brand-orange' : 'text-zinc-300'}`}>{total}</span>
      )}
    </m.button>
  );
};

// ─── Heart burst on double-tap ───────────────────────────────────────────────

export const ReactionBurst: React.FC<{ emoji: string | null; burstKey?: number }> = ({ emoji, burstKey }) => (
  <AnimatePresence>
    {emoji && (
      <m.span
        key={`${emoji}-${burstKey ?? 0}`}
        initial={{ scale: 0.2, opacity: 0, y: 0 }}
        animate={{ scale: [0.2, 1.35, 1], opacity: [0, 1, 1], y: -6 }}
        exit={{ scale: 1.6, opacity: 0, y: -26 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
      >
        {emoji}
      </m.span>
    )}
  </AnimatePresence>
);

// ─── Long-press / right-click overlay ────────────────────────────────────────

// Is a finger / mouse button currently held anywhere on the page? The overlay opens
// while the long-press is still held, so it must ignore the release (and the click
// the browser synthesizes from it) instead of treating it as "tap outside → close".
let pressIsDown = false;
if (typeof window !== 'undefined') {
  const down = () => { pressIsDown = true; };
  const up = (e: Event) => {
    const te = e as TouchEvent;
    pressIsDown = te.touches ? te.touches.length > 0 : false;
  };
  window.addEventListener('touchstart', down, { capture: true, passive: true });
  window.addEventListener('touchend', up, { capture: true, passive: true });
  window.addEventListener('touchcancel', up, { capture: true, passive: true });
  window.addEventListener('mousedown', down, true);
  window.addEventListener('mouseup', up, true);
}

export interface MessageAction {
  key: string;
  label: string;
  icon: React.ElementType;
  tone?: 'default' | 'danger' | 'warning' | 'accent';
  onSelect: () => void;
}

interface MessageActionOverlayProps {
  open: boolean;
  messageId: number | null;
  /** Message bubble the overlay anchors to (looked up by id `chat-msg-{id}`). */
  isMine: boolean;
  preview: { username: string; text: string } | null;
  myReaction: string | null;
  canReact: boolean;
  actions: MessageAction[];
  onReact: (emoji: string) => void;
  onMoreEmoji: () => void;
  onClose: () => void;
}

/**
 * Focus overlay: dims the chat, shows a big quick-reaction bar, a preview of the
 * message and the actions — anchored next to the pressed bubble.
 */
export const MessageActionOverlay: React.FC<MessageActionOverlayProps> = ({
  open, messageId, isMine, preview, myReaction, canReact, actions, onReact, onMoreEmoji, onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; side: number } | null>(null);

  // Stays "unarmed" until the press that opened the menu is released, plus a short grace
  // period — so keeping your finger down keeps the menu open, and lifting it doesn't close
  // it or hit whatever button ended up under the finger.
  const armedRef = useRef(false);
  useEffect(() => {
    if (!open) { armedRef.current = false; return undefined; }
    armedRef.current = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { armedRef.current = true; }, 350);
    };
    const onRelease = (e: Event) => {
      const te = e as TouchEvent;
      if (te.touches && te.touches.length > 0) return;
      window.removeEventListener('touchend', onRelease, true);
      window.removeEventListener('touchcancel', onRelease, true);
      window.removeEventListener('mouseup', onRelease, true);
      arm();
    };
    if (pressIsDown) {
      window.addEventListener('touchend', onRelease, true);
      window.addEventListener('touchcancel', onRelease, true);
      window.addEventListener('mouseup', onRelease, true);
    } else {
      // Opened by a click (e.g. the desktop hover button): nothing is held
      arm();
    }
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('touchend', onRelease, true);
      window.removeEventListener('touchcancel', onRelease, true);
      window.removeEventListener('mouseup', onRelease, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || messageId == null) { setPos(null); return undefined; }
    const place = () => {
      const anchor = document.getElementById(`chat-msg-${messageId}`);
      const panel = panelRef.current;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const h = panel?.offsetHeight || 360;
      const w = panel?.offsetWidth || 300;
      const rect = anchor?.getBoundingClientRect();
      // Prefer sitting just above the bubble's top so the reaction bar is near the thumb
      let top = rect ? rect.top - 70 : vh / 2 - h / 2;
      top = Math.max(12, Math.min(top, vh - h - 12));
      // Align to the bubble's side (RTL: my messages sit on the left)
      const margin = 12;
      let side = margin;
      if (rect) {
        side = isMine ? Math.max(margin, Math.min(rect.left, vw - w - margin)) : Math.max(margin, Math.min(vw - rect.right, vw - w - margin));
      }
      setPos({ top, side });
    };
    place();
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [open, messageId, isMine]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[1100] select-none [-webkit-touch-callout:none]"
          onClickCapture={(e) => {
            // Swallow the release-click of the long-press that opened the menu
            if (!armedRef.current) { e.preventDefault(); e.stopPropagation(); }
          }}
          onClick={() => { if (armedRef.current) onClose(); }}
          // Android fires contextmenu during a long-press — never let it close the menu
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
          />

          <m.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute flex flex-col gap-2 w-[min(320px,calc(100vw-24px))]"
            style={{
              top: pos?.top ?? -9999,
              ...(isMine ? { left: pos?.side ?? 12 } : { right: pos?.side ?? 12 }),
              transformOrigin: isMine ? 'left top' : 'right top',
            }}
          >
            {/* Quick reactions */}
            {canReact && (
              <div className="self-stretch flex items-center justify-between gap-0.5 rounded-full bg-zinc-900/95 border border-zinc-700/70 shadow-2xl shadow-black/60 px-1.5 py-1.5">
                {QUICK_REACTIONS.map((emoji, i) => {
                  const active = myReaction === emoji;
                  return (
                    <m.button
                      key={emoji}
                      type="button"
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.025 * i }}
                      whileHover={{ scale: 1.3, y: -4 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => onReact(emoji)}
                      aria-label={`تفاعل ${emoji}`}
                      aria-pressed={active}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[24px] leading-none cursor-pointer transition-colors ${
                        active ? 'bg-brand-orange/25 ring-2 ring-brand-orange/70' : 'hover:bg-white/5'
                      }`}
                    >
                      {emoji}
                    </m.button>
                  );
                })}
                <m.button
                  type="button"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.16 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={onMoreEmoji}
                  aria-label="إيموجي أكتر"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </m.button>
              </div>
            )}

            {/* Message preview */}
            {preview && (
              <div className={`max-w-full rounded-2xl px-3.5 py-2.5 border shadow-xl ${
                isMine
                  ? 'self-start bg-gradient-to-r from-brand-orange to-brand-amber text-black border-transparent'
                  : 'self-end bg-zinc-900 text-white border-zinc-800'
              }`}>
                <div className={`text-[11px] font-black mb-0.5 ${isMine ? 'text-black/70' : 'text-brand-orange'}`}>{preview.username}</div>
                <p dir="auto" className="text-[13px] font-semibold leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">{preview.text}</p>
              </div>
            )}

            {/* Actions */}
            <div className={`w-56 rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-2xl shadow-black/60 overflow-hidden ${isMine ? 'self-start' : 'self-end'}`}>
              {actions.map((a, idx) => {
                const Icon = a.icon;
                const color =
                  a.tone === 'danger' ? 'text-red-400' :
                  a.tone === 'warning' ? 'text-amber-400' :
                  a.tone === 'accent' ? 'text-brand-orange' : 'text-zinc-100';
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => { a.onSelect(); onClose(); }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-[13px] font-bold cursor-pointer hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors ${color} ${
                      idx > 0 ? 'border-t border-zinc-800/80' : ''
                    }`}
                  >
                    <span>{a.label}</span>
                    <Icon className={`w-4 h-4 opacity-80 ${a.key === 'reply' ? 'rtl:-scale-x-100' : ''}`} />
                  </button>
                );
              })}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ─── "Who reacted" sheet ─────────────────────────────────────────────────────

interface ReactionDetailsSheetProps {
  open: boolean;
  reactions: ChatReaction[];
  myId?: number | null;
  avatarFor: (username: string) => { avatar_url?: string | null; equipped_frame?: string } | undefined;
  onRemoveMine: (emoji: string) => void;
  onClose: () => void;
}

export const ReactionDetailsSheet: React.FC<ReactionDetailsSheetProps> = ({ open, reactions, myId, avatarFor, onRemoveMine, onClose }) => {
  const [tab, setTab] = useState<string>('all');
  const total = reactions.reduce((s, r) => s + r.count, 0);

  const rows = useMemo(() => {
    const list: { emoji: string; id: number; username: string }[] = [];
    for (const r of reactions) {
      if (tab !== 'all' && r.emoji !== tab) continue;
      for (const u of r.users || []) list.push({ emoji: normalizeEmoji(r.emoji), id: u.id, username: u.username });
    }
    // Me first
    return list.sort((a, b) => Number(String(b.id) === String(myId)) - Number(String(a.id) === String(myId)));
  }, [reactions, tab, myId]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={() => setTab('all')}>
      {open && (
        <div className="fixed inset-0 z-[1100] flex flex-col justify-end md:justify-center md:items-center" onClick={onClose}>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/65"
          />
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragSnapToOrigin
            onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 400) onClose(); }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:max-w-md bg-zinc-950 border-t md:border border-zinc-800 rounded-t-[28px] md:rounded-[28px] shadow-2xl max-h-[70vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="pt-3 px-5 pb-3 border-b border-zinc-800/70">
              <div className="w-11 h-1.5 bg-zinc-700 rounded-full mx-auto mb-3 md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">التفاعلات</h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="اقفل"
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Tabs */}
              <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
                {[{ key: 'all', label: `الكل ${total}` }, ...reactions.map(r => ({ key: r.emoji, label: `${normalizeEmoji(r.emoji)} ${r.count}` }))].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-black transition-colors cursor-pointer ${
                      tab === t.key ? 'bg-brand-orange text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-2">
              {rows.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-8">مفيش تفاعلات</p>
              ) : rows.map(row => {
                const isMe = String(row.id) === String(myId);
                const info = avatarFor(row.username);
                return (
                  <button
                    key={`${row.emoji}-${row.id}`}
                    type="button"
                    disabled={!isMe}
                    onClick={() => isMe && onRemoveMine(row.emoji)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-start ${isMe ? 'hover:bg-white/[0.04] cursor-pointer' : 'cursor-default'}`}
                  >
                    <UserAvatar username={row.username} avatarUrl={info?.avatar_url || null} equippedFrame={info?.equipped_frame} size={38} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-extrabold text-white truncate">{isMe ? 'إنت' : row.username}</span>
                      {isMe && <span className="block text-[11px] text-zinc-500">دوس عشان تشيل تفاعلك</span>}
                    </span>
                    <span className="text-2xl leading-none">{row.emoji}</span>
                  </button>
                );
              })}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
