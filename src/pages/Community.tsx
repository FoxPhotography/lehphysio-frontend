import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { rankName } from '../utils/ranks';
import { textDir } from '../utils/format';
import { m, AnimatePresence } from 'framer-motion';
import { getNameColor, getFrameImage } from '../utils/helpers';
import { UserAvatar } from '../components/UserAvatar';
import { HighlightWrapper } from '../components/notifications/HighlightWrapper';
import { useNotifications } from '../context/NotificationContext';
import { formatMentions } from '../utils/mentions';
import { 
  MessageSquare, 
  Lightbulb, 
  Trash2, 
  Check, 
  X, 
  CornerUpLeft, 
  Edit2, 
  Square,
  CheckSquare,
  ShieldAlert, 
  ChevronDown, 
  ThumbsUp, 
  Send,
  Clock,
  Heart,
  Flame,
  Smile,
  Keyboard,
  Sparkles,
  Frown,
  Zap,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { EmojiPickerPopover } from '../components/common/EmojiPickerPopover';

interface CommunityProps {
  user: any;
  onlineCount: number;
  chatMessages: any[];
  isFindingTargetMessage?: boolean;
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: (val: boolean) => void;
  selectedMessageIds: number[];
  setSelectedMessageIds: React.Dispatch<React.SetStateAction<number[]>>;
  swipeTranslateX: { [key: number]: number };
  swipeMessageIdRef: React.MutableRefObject<number | null>;
  replyingTo: any;
  setReplyingTo: (val: any) => void;
  editingMessage: any;
  setEditingMessage: (val: any) => void;
  chatInput: string;
  setChatInput: (val: string | ((prev: string) => string)) => void;
  handleSendChatMessage: (e: React.FormEvent, text?: string) => void;
  setCurrentPage: (page: string) => void;
  activeContextMenu: any;
  setActiveContextMenu: (val: any) => void;
  handleChatContextMenu: (e: React.MouseEvent, msg: any) => void;
  handleChatTouchStart: (e: React.TouchEvent, msg: any) => void;
  handleChatTouchMove: (e: React.TouchEvent, msg: any) => void;
  handleChatTouchEnd: (e: React.TouchEvent, msg: any) => void;
  handleToggleReaction: (messageId: number, emoji: string) => void;
  handleDeleteMessage: (messageId: number) => void;
  handleBulkDeleteMessages: () => void;
  suggestions: any[];
  handleCreateSuggestion: (title: string, content: string) => void;
  handleUpvoteSuggestion: (id: number) => void;
  handleOpenModerationModal: (username: string, userId: number) => void;
  handleDeleteSuggestion: (id: number) => void;
  handleEditSuggestion: (id: number, title: string, content: string) => Promise<void>;
  handleCancelSuggestionRevision: (id: number) => Promise<void>;
  usernames?: any[];
  getAvatarFrameClass?: () => string;
  equippedFrame?: string;
  loadOlderMessages?: (beforeId: string) => void;
  isLoadingOlder?: boolean;
  hasMoreChat?: boolean;
  isRefreshingChat?: boolean;
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;
  xpSettings?: any;
}

// Helper to strip emojis from names
const stripEmojis = (str: string) => {
  if (!str) return '';
  return str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
};

const EMOJI_MAP: Record<string, string> = {
  'like': '👍',
  'thumbsup': '👍',
  'heart': '❤️',
  'love': '❤️',
  'fire': '🔥',
  'flame': '🔥',
  'joy': '😂',
  'laugh': '😂',
  'smile': '😊',
  'clap': '👏',
  'sad': '😢',
  'frown': '😢',
  'cry': '😢',
  'wow': '😮',
  'skull': '💀',
  '100': '💯'
};

const renderReactionIcon = (emoji: string) => {
  const actualEmoji = EMOJI_MAP[emoji?.toLowerCase?.()] || emoji;
  return <span className="text-xs md:text-sm leading-none inline-block transform hover:scale-110 transition-transform">{actualEmoji}</span>;
};

export const Community: React.FC<CommunityProps> = ({
  user,
  onlineCount,
  chatMessages,
  isFindingTargetMessage,
  isMultiSelectMode,
  setIsMultiSelectMode,
  selectedMessageIds,
  setSelectedMessageIds,
  swipeTranslateX,
  swipeMessageIdRef,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  chatInput,
  setChatInput,
  handleSendChatMessage,
  setCurrentPage,
  activeContextMenu,
  setActiveContextMenu,
  handleChatContextMenu,
  handleChatTouchStart,
  handleChatTouchMove,
  handleChatTouchEnd,
  handleToggleReaction,
  handleDeleteMessage,
  handleBulkDeleteMessages,
  suggestions,
  handleCreateSuggestion,
  handleUpvoteSuggestion,
  handleOpenModerationModal,
  handleDeleteSuggestion,
  handleEditSuggestion,
  handleCancelSuggestionRevision,
  usernames = [],
  getAvatarFrameClass,
  equippedFrame,
  loadOlderMessages,
  isLoadingOlder = false,
  hasMoreChat = true,
  isRefreshingChat = false,
  handleOpenReportModal,
  xpSettings = {}
}) => {

  const getFrameClass = (frameName: string) => {
    if (frameName === 'gold-glow') return 'avatar-frame-gold-glow';
    if (frameName === 'neon-ring') return 'avatar-frame-neon-ring';
    return '';
  };
  
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'suggestions'>('chat');
  const [suggTitle, setSuggTitle] = useState('');
  const [suggContent, setSuggContent] = useState('');
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Suggestion editing states
  const [editingSuggId, setEditingSuggId] = useState<number | null>(null);
  const [editSuggTitle, setEditSuggTitle] = useState('');
  const [editSuggContent, setEditSuggContent] = useState('');

  // Mentions autocomplete state
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  // Emoji picker states
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<number | null>(null);

  const { deepLinkTarget, setDeepLinkTarget } = useNotifications();

  // Windowed rendering: only the newest messages are in the DOM. Scrolling to the top
  // reveals more from memory first, then asks the server for older ones.
  // Typing stays local to this page: the shared chatInput (owned by App) is only
  // touched on send / edit, so a keystroke no longer re-renders the whole app.
  const [draft, setDraft] = useState(chatInput);
  useEffect(() => { setDraft(chatInput); }, [chatInput]);

  const CHAT_WINDOW_STEP = 60;
  const [renderLimit, setRenderLimit] = useState(CHAT_WINDOW_STEP);
  const visibleMessages = chatMessages.length > renderLimit ? chatMessages.slice(-renderLimit) : chatMessages;

  // ── Scroll anchoring ──────────────────────────────────────────────────────
  // The chat always opens on the newest message, and follows new messages when
  // you sent them or were already at the bottom (like WhatsApp / Messenger).
  // This lives here (not in App) because the page is code-split: App's effect
  // used to run before this list existed, so the chat opened at the top.
  const nearBottomRef = useRef(true);
  const lastMsgIdRef = useRef<any>(null);
  const scrollFeedToBottom = () => {
    const el = document.getElementById('pl-chat-feed');
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    // Once more after fonts/avatars settle the final heights
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
    setTimeout(() => { if (nearBottomRef.current) el.scrollTop = el.scrollHeight; }, 250);
  };
  useLayoutEffect(() => {
    if (activeSubTab !== 'chat' || deepLinkTarget?.type === 'chat_message') return;
    nearBottomRef.current = true;
    scrollFeedToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]);
  useLayoutEffect(() => {
    if (activeSubTab !== 'chat') return;
    const last = visibleMessages[visibleMessages.length - 1];
    const lastId = last?.id ?? null;
    if (lastId === lastMsgIdRef.current) return;
    const isFirstLoad = lastMsgIdRef.current === null;
    lastMsgIdRef.current = lastId;
    const mine = !!(last && user && last.username === user.username);
    if (deepLinkTarget?.type === 'chat_message' && !mine) return;
    if (isFirstLoad || mine || nearBottomRef.current) scrollFeedToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMessages, activeSubTab]);
  useEffect(() => {
    // A deep link may point at an older message: render everything we have so it can be found.
    if (deepLinkTarget?.type === 'chat_message') setRenderLimit(Number.MAX_SAFE_INTEGER);
  }, [deepLinkTarget]);

  const selectedMessages = chatMessages.filter(msg => selectedMessageIds.includes(msg.id));
  const canDeleteSelected = !!user && (
    user.role === 'admin' || 
    user.role === 'owner' || 
    selectedMessages.every(msg => msg.username === user.username)
  );

  // Track exact visual viewport height to support mobile virtual keyboards
  useEffect(() => {
    if (!window.visualViewport) return undefined;

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    // Set initial height
    setViewportHeight(window.visualViewport.height);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Manage keyboard-open body class to hide bottom navigation globally
  useEffect(() => {
    if (isInputFocused && window.innerWidth < 768) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
    return () => {
      document.body.classList.remove('keyboard-open');
    };
  }, [isInputFocused]);

  // Lock body scroll on mobile for community page to prevent overscroll bounce/chaining
  useEffect(() => {
    if (window.innerWidth < 768) {
      const origHtmlOverflow = document.documentElement.style.overflow;
      const origBodyOverflow = document.body.style.overflow;
      const origBodyPosition = document.body.style.position;
      const origBodyWidth = document.body.style.width;
      const origBodyHeight = document.body.style.height;

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      return () => {
        document.documentElement.style.overflow = origHtmlOverflow;
        document.body.style.overflow = origBodyOverflow;
        document.body.style.position = origBodyPosition;
        document.body.style.width = origBodyWidth;
        document.body.style.height = origBodyHeight;
      };
    }
    return undefined;
  }, []);

  // Auto-switch to chat tab if we have a chat deep link target
  useEffect(() => {
    if (deepLinkTarget?.type === 'chat_message') {
      setActiveSubTab('chat');
    }
  }, [deepLinkTarget]);

  // Scroll to and highlight message from URL param ?msg=X, hash, or deepLinkTarget
  useEffect(() => {
    if (activeSubTab === 'chat' && chatMessages.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const msgIdStr = searchParams.get('msg');
      const hashMatch = window.location.hash.match(/#(?:chat-msg-|message-)?(\d+)/);
      const msgId = msgIdStr 
        ? parseInt(msgIdStr, 10) 
        : (hashMatch 
            ? parseInt(hashMatch[1], 10) 
            : (deepLinkTarget?.type === 'chat_message' ? Number(deepLinkTarget.messageId) : null));

      if (msgId) {
        const exists = chatMessages.some(m => m.id === msgId);
        if (exists) {
          setTimeout(() => {
            const el = document.getElementById(`chat-msg-${msgId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Apply yellow highlight animation
              el.classList.add('notification-highlight-yellow');
              setTimeout(() => {
                el.classList.remove('notification-highlight-yellow');
              }, 3000);

              if (deepLinkTarget) setDeepLinkTarget(null);
              // Clear URL hash/query parameters to avoid scroll loops
              window.history.replaceState({}, '', '/chat');
            }
          }, 100);
        }
      }
    }
  }, [chatMessages, activeSubTab, deepLinkTarget, setDeepLinkTarget]);

  // Select suggestions sub-tab automatically if tab=suggestions is in the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('tab') === 'suggestions') {
      setActiveSubTab('suggestions');
    }
  }, []);

  const renderTextWithMentions = (text: string) => {
    return formatMentions(text, usernames, 'text-yellow-400 font-extrabold hover:underline cursor-pointer transition-colors');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft(value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;

    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, selectionStart);
    
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const isStartOrAfterSpace = lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ' || textBeforeCursor[lastAtIdx - 1] === '\n';
      const textAfterAt = textBeforeCursor.substring(lastAtIdx + 1);
      
      if (isStartOrAfterSpace && !textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setMentionStartIndex(lastAtIdx);
        setShowMentionSuggestions(true);
        setActiveSuggestionIdx(0);
        return;
      }
    }
    
    setShowMentionSuggestions(false);
  };

  const handleSelectMention = (targetUsername: string) => {
    if (mentionStartIndex === -1) return;
    const value = draft;
    const selectionStart = mentionStartIndex + targetUsername.length + 2; 
    const newValue = 
      value.substring(0, mentionStartIndex) + 
      `@${targetUsername} ` + 
      value.substring(mentionStartIndex + mentionSearch.length + 1);
    
    setDraft(newValue);
    setShowMentionSuggestions(false);
    setActiveSuggestionIdx(0);
    
    setTimeout(() => {
      const inputEl = document.getElementById('community-chat-input') as HTMLTextAreaElement;
      if (inputEl) {
        inputEl.focus();
        inputEl.setSelectionRange(selectionStart, selectionStart);
      }
    }, 50);
  };

  const submitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggTitle.trim() || !suggContent.trim()) return;
    handleCreateSuggestion(suggTitle, suggContent);
    setSuggTitle('');
    setSuggContent('');
  };

  const handleScrollToBottom = () => {
    const el = document.getElementById('pl-chat-feed');
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-none px-0 pb-0 text-start md:h-[calc(100dvh-var(--spacing-nav)-env(safe-area-inset-bottom,0px))] xl:h-dvh pt-[calc(4rem+env(safe-area-inset-top,0px))] xl:pt-0"
      style={{
        height: window.innerWidth < 768
          ? `${viewportHeight - (isInputFocused ? 0 : (document.querySelector('nav[aria-label]') as HTMLElement | null)?.offsetHeight ?? 72)}px`
          : undefined
      }}>
      <div className="glass-card p-0 md:p-4 flex flex-col h-full relative overflow-hidden border-0 rounded-none">
        
        {/* Sub tab switcher */}
        <div className="flex gap-2 mb-3 p-3 md:p-0 shrink-0">
          <button 
            type="button" 
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
              activeSubTab === 'chat' 
                ? 'bg-gradient-to-r from-brand-orange to-brand-amber text-black shadow-orange-glow' 
                : 'bg-zinc-900/40 text-zinc-400 border border-zinc-800/80 hover:text-white'
            }`} 
            onClick={() => setActiveSubTab('chat')}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">الشات العام</span>
            <span className="sm:hidden">الشات</span>
          </button>
          <button 
            type="button" 
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
              activeSubTab === 'suggestions' 
                ? 'bg-gradient-to-r from-brand-orange to-brand-amber text-black shadow-orange-glow' 
                : 'bg-zinc-900/40 text-zinc-400 border border-zinc-800/80 hover:text-white'
            }`} 
            onClick={() => setActiveSubTab('suggestions')}
          >
            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">لوحة الاقتراحات</span>
            <span className="sm:hidden">الاقتراحات</span>
          </button>
        </div>

        {activeSubTab === 'chat' ? (
          <>
            {/* Multi-select bar or Standard Header */}
            {isMultiSelectMode ? (
              <div className="flex justify-between items-center bg-brand-orange/10 border border-brand-orange/20 rounded-xl p-3 mb-3 mx-3 md:mx-0 shrink-0">
                <span className="text-xs font-black text-white">Selected {selectedMessageIds.length} messages</span>
                <div className="flex gap-2">
                  {canDeleteSelected && (
                    <button className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-2xs py-1.5 px-3 rounded-lg cursor-pointer" onClick={handleBulkDeleteMessages} disabled={selectedMessageIds.length === 0}>حذف</button>
                  )}
                  <button className="border border-zinc-800 hover:bg-zinc-900 text-white font-bold text-2xs py-1.5 px-3 rounded-lg cursor-pointer" onClick={() => { setIsMultiSelectMode(false); setSelectedMessageIds([]); }}>إلغاء</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-2 border-b border-zinc-900 pb-2 mx-3 md:mx-0 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-orange" />
                  <h3 className="text-sm font-black text-white">الشات</h3>
                  {isRefreshingChat && (
                    <div className="flex items-center gap-1.5 text-2xs text-zinc-500 font-bold uppercase tracking-wider animate-pulse ms-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                      <span>بنحدّث…</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-2xs text-brand-orange font-extrabold uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{onlineCount} أونلاين</span>
                </div>
              </div>
            )}

            {/* Chat Messages Feed */}
            <div 
              id="pl-chat-feed" 
              onScroll={(e) => {
                const el = e.currentTarget;
                const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
                nearBottomRef.current = distance < 120;
                const isUp = distance > 150;
                setShowScrollDownBtn(isUp);

                // Infinite scroll up: reveal cached messages first, then fetch older ones
                if (el.scrollTop === 0 && chatMessages.length > renderLimit) {
                  const prevHeight = el.scrollHeight;
                  setRenderLimit((n) => n + CHAT_WINDOW_STEP);
                  requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight; });
                  return;
                }
                if (el.scrollTop === 0 && !isLoadingOlder && hasMoreChat && loadOlderMessages) {
                  setRenderLimit((n) => n + 30);
                  const oldestMsg = chatMessages[0];
                  if (oldestMsg && oldestMsg.id) {
                    loadOlderMessages(oldestMsg.id);
                  }
                }
              }}
              className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 py-2 px-3 md:px-1 pb-2"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {isLoadingOlder && (
                <div className="flex items-center justify-center py-2 text-zinc-500 text-xs font-bold gap-2 shrink-0">
                  <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تحميل الرسائل السابقة...</span>
                </div>
              )}

              {visibleMessages.map((msg: any) => {
                const isMyMsg = user && msg.username === user.username;
                const isSelected = selectedMessageIds.includes(msg.id);
                
                const tx = swipeTranslateX[msg.id] || 0;
                const isSwiping = swipeMessageIdRef.current === msg.id;
                const framePngUrl = getFrameImage(msg.equipped_frame);

                return (
                  <div 
                    key={msg.id} 
                    className="flex w-full"
                    style={{
                      justifyContent: isMyMsg ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      id={`chat-msg-${msg.id}`}
                      className={`flex items-start gap-2.5 max-w-[85%] relative rounded-2xl select-none cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-brand-orange/40 bg-brand-orange/5' : ''
                      }`}
                      style={{ 
                        transform: `translateX(${tx}px)`,
                        transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                      }}
                      onClick={() => {
                        if (isMultiSelectMode) {
                          setSelectedMessageIds(prev => 
                            prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]
                          );
                        }
                      }}
                      onContextMenu={(e) => handleChatContextMenu(e, msg)}
                      onTouchStart={(e) => handleChatTouchStart(e, msg)}
                      onTouchMove={(e) => handleChatTouchMove(e, msg)}
                      onTouchEnd={(e) => handleChatTouchEnd(e, msg)}
                    >
                      {/* Swipe indicators */}
                      {tx !== 0 && (
                        <div 
                          className="absolute flex items-center justify-center opacity-70 pointer-events-none"
                          style={{
                            right: tx < 0 ? '-35px' : 'auto',
                            left: tx > 0 ? '-35px' : 'auto',
                            transition: 'opacity 0.1s'
                          }}
                        >
                          <CornerUpLeft className="rtl:-scale-x-100 w-4.5 h-4.5 text-zinc-500" />
                        </div>
                      )}

                      {/* Checkbox for Multiselect */}
                      {isMultiSelectMode && user && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMessageIds(prev => 
                              prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]
                            );
                          }}
                          className="self-center ms-2 shrink-0 cursor-pointer text-brand-orange"
                        >
                          {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-zinc-600" />}
                        </div>
                      )}

                      {/* Outgoing Avatar (Other User) */}
                      {!isMyMsg && (
                        <div className="relative mt-4 shrink-0">
                          <UserAvatar 
                            username={msg.username} 
                            avatarUrl={msg.avatar_url} 
                            equippedFrame={msg.equipped_frame} 
                            size={32} 
                          />
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}>
                        {/* Sender info */}
                        <div className="flex items-center gap-1.5 mb-1 select-none">
                          <span className="text-2xs font-black" style={{ color: isMyMsg ? 'var(--color-brand-orange)' : getNameColor(msg.username) }}>
                            {msg.username}
                          </span>
                          <span className="text-2xs font-bold bg-zinc-900 border border-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded-md">
                            {msg.batch}
                          </span>
                          <span className="text-2xs text-zinc-500 font-semibold">
                            {msg.rank ? rankName(msg.rank) : ''}
                          </span>
                          {(msg.role === 'admin' || msg.role === 'owner') && (
                            <span className={`text-2xs font-black px-1.5 py-0.5 rounded-md uppercase border ${
                              msg.role === 'owner' ? 'border-brand-amber/30 text-brand-amber bg-brand-amber/5' : 'border-brand-orange/30 text-brand-orange bg-brand-orange/5'
                            }`}>
                              {msg.role === 'owner' ? 'المالك' : 'أدمن'}
                            </span>
                          )}
                        </div>

                        {/* Text card bubble */}
                        <HighlightWrapper
                          isHighlighted={deepLinkTarget?.type === 'chat_message' && deepLinkTarget?.messageId === msg.id}
                          highlightColor="#FFB000"
                          className="rounded-2xl"
                        >
                          <div 
                            className={`px-3 py-2 rounded-2xl text-xs md:text-sm font-semibold shadow-lg text-start relative min-w-0 ${
                              isMyMsg 
                                ? 'bg-gradient-to-r from-brand-orange to-brand-amber text-black rounded-se-none' 
                                : 'bg-zinc-900/60 border border-zinc-800 text-white rounded-ss-none'
                            }`}
                          >
                          {/* Quote reply */}
                          {msg.reply_to?.username && (
                            <div className={`border-s-2 border-brand-orange px-2.5 py-1.5 rounded-lg mb-2 text-2xs text-start ${
                              isMyMsg ? 'bg-black/10 text-zinc-800' : 'bg-black/30 text-zinc-400'
                            }`}>
                              <div className={`font-black ${isMyMsg ? 'text-black' : 'text-brand-orange'}`}>
                                <bdi dir="ltr">@{msg.reply_to.username}</bdi>
                              </div>
                              <div dir="auto" className="truncate mt-0.5">{msg.reply_to.message}</div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1 w-full min-w-0">
                            <p dir={textDir(msg.message)} className="whitespace-pre-wrap break-words [word-break:break-word] leading-relaxed min-w-0">
                              {renderTextWithMentions(msg.message)}
                            </p>
                            
                            <div className="flex items-center gap-1 shrink-0 text-2xs opacity-75 select-none pb-0.5 ms-auto self-end">
                              {!!msg.is_edited && <span>(متعدّلة)</span>}
                              <span>{new Date(msg.created_at).toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMyMsg && (
                                msg.isPending ? (
                                  <Clock className="w-2.5 h-2.5" />
                                ) : (
                                  <Check className="w-2.5 h-2.5" />
                                )
                              )}
                            </div>
                          </div>

                          {/* Reaction row */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-black/10">
                              {msg.reactions.map((react: any, rIdx: number) => (
                                <button
                                  key={rIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReaction(msg.id, react.emoji);
                                  }}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-2xs font-bold cursor-pointer transition-colors ${
                                    react.userReacted 
                                      ? 'bg-brand-orange/20 border-brand-orange/40 text-white' 
                                      : 'bg-black/25 border-zinc-800/20 text-zinc-300'
                                  }`}
                                >
                                  {renderReactionIcon(react.emoji)}
                                  <span>{react.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </HighlightWrapper>
                      </div>

                      {/* Incoming Avatar (Me) */}
                      {isMyMsg && (
                        <div className="relative mt-4 shrink-0">
                          <UserAvatar 
                            username={msg.username} 
                            avatarUrl={msg.avatar_url} 
                            equippedFrame={msg.equipped_frame} 
                            size={32} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat form compose area */}
            <div 
              className="border-t border-zinc-900/80 pt-2.5 bg-zinc-950/90 px-3 md:px-0 shrink-0 text-start relative"
            >
              
              {/* Reply tag indicator */}
              {replyingTo && (
                <div className="flex justify-between items-center bg-brand-orange/5 border-s-2 border-brand-orange rounded-xl px-3 py-2.5 mb-2 text-xs font-bold text-brand-orange">
                  <div className="truncate pe-4">
                    <span>بترد على <strong><bdi dir="ltr">@{replyingTo.username}</bdi></strong>: </span>
                    <span dir="auto" className="text-zinc-500 font-medium">{replyingTo.message}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-zinc-500 hover:text-white cursor-pointer shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mention drop container */}
              {showMentionSuggestions && usernames && usernames.length > 0 && (() => {
                const filteredSuggestions = usernames.filter((u: any) => u.username.toLowerCase().includes(mentionSearch.toLowerCase()) && u.username !== user?.username);
                if (filteredSuggestions.length === 0) {
                  return (
                    <div className="absolute bottom-[calc(100%+8px)] start-3 end-3 md:start-0 md:end-0 max-h-[160px] overflow-y-auto z-50 bg-zinc-950/95 border border-zinc-850 rounded-xl p-3 shadow-2xl text-xs text-zinc-500 text-center font-bold">
                      مفيش حد بالاسم ده
                    </div>
                  );
                }
                return (
                  <div className="absolute bottom-[calc(100%+8px)] start-3 end-3 md:start-0 md:end-0 max-h-[160px] overflow-y-auto z-50 bg-zinc-950/95 border border-zinc-850 rounded-xl p-1 shadow-2xl">
                    {filteredSuggestions.map((u: any, idx: number) => (
                      <button
                        key={u.username}
                        type="button"
                        onClick={() => handleSelectMention(u.username)}
                        onMouseEnter={() => setActiveSuggestionIdx(idx)}
                        className={`w-full flex items-center gap-3 p-2.5 cursor-pointer rounded-lg text-start text-xs font-bold text-white transition-colors ${
                          idx === activeSuggestionIdx ? 'bg-brand-orange/20 border border-brand-orange/30 shadow-orange-glow' : 'hover:bg-brand-orange/10'
                        }`}
                      >
                        <UserAvatar username={u.username} avatarUrl={u.avatar_url} equippedFrame={u.equipped_frame} size={24} />
                        <div className="flex flex-col text-start">
                           <span className="text-brand-orange font-black"><bdi dir="ltr">@{u.username}</bdi></span>
                           <span className="text-2xs text-zinc-500">{u.role === 'owner' ? 'المالك' : u.role === 'admin' ? 'أدمن' : 'طالب'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Editing tag indicator */}
              {editingMessage && (
                <div className="flex justify-between items-center bg-brand-amber/5 border-s-2 border-brand-amber rounded-xl px-3 py-2.5 mb-2 text-xs font-bold text-brand-amber">
                  <span>بتعدّل الرسالة…</span>
                  <button 
                    onClick={() => {
                      setEditingMessage(null);
                      setChatInput('');
                      setDraft('');
                    }} 
                    className="text-zinc-500 hover:text-white cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input field compose form */}
              {user ? (
                <form
                  onSubmit={(e) => {
                    handleSendChatMessage(e, draft);
                    setDraft('');
                    const el = document.getElementById('community-chat-input');
                    if (el) el.style.height = 'auto';
                  }}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  className="flex gap-2.5 items-end py-2"
                >
                  <div className="flex-1 relative flex items-center bg-zinc-900/40 border border-zinc-800/80 focus-within:border-brand-orange/60 focus-within:ring-1 focus-within:ring-brand-orange/20 rounded-2xl transition-all duration-200 px-3.5 gap-2">
                    <textarea
                      id="community-chat-input"
                      name="chatMessage"
                      dir="auto"
                      autoComplete="off"
                      autoCorrect="on"
                      autoCapitalize="sentences"
                      spellCheck="true"
                      inputMode="text"
                      enterKeyHint="send"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                      className="w-full bg-transparent text-white py-2.5 text-xs md:text-sm font-semibold placeholder-zinc-500 outline-none resize-none min-h-[40px] max-h-[140px] leading-relaxed"
                      placeholder={editingMessage ? "عدّل رسالتك هنا…" : "اكتب رسالة…"}
                      value={draft}
                      onChange={handleInputChange}
                      onFocus={() => {
                        setIsInputFocused(true);
                      }}
                      onBlur={() => setIsInputFocused(false)}
                      onKeyDown={(e) => {
                        const filtered = usernames ? usernames.filter((u: any) => u.username.toLowerCase().includes(mentionSearch.toLowerCase()) && u.username !== user?.username) : [];
                        if (showMentionSuggestions && filtered.length > 0) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActiveSuggestionIdx(prev => (prev + 1) % filtered.length);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActiveSuggestionIdx(prev => (prev - 1 + filtered.length) % filtered.length);
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSelectMention(filtered[activeSuggestionIdx].username);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setShowMentionSuggestions(false);
                          }
                        } else {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const form = e.currentTarget.form;
                            if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                          }
                        }
                      }}
                      rows={1}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-10 h-10 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-amber text-black flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-brand-orange/20 shrink-0 transition-all duration-200"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {editingMessage ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Send className="rtl:-scale-x-100 w-4.5 h-4.5 stroke-[2.5] translate-x-0.5" />}
                  </button>
                </form>
              ) : (
                <div className="text-zinc-500 text-xs font-bold text-center py-2 uppercase tracking-wide">
                  من فضلك <button onClick={() => setCurrentPage('login')} className="text-brand-orange hover:text-brand-amber font-black cursor-pointer underline">سجّل دخول</button> عشان تشارك في الشات.
                </div>
              )}
            </div>

            {/* Scroll bottom btn */}
            <AnimatePresence>
              {showScrollDownBtn && (
                <m.button
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  onClick={handleScrollToBottom}
                  className="absolute start-6 w-9 h-9 rounded-full bg-zinc-950/90 border border-brand-orange flex items-center justify-center text-white cursor-pointer z-[25] shadow-orange-glow transition-all active:scale-90 bottom-[75px]"
                  title="انزل لآخر رسالة"
                >
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                </m.button>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {user ? (
              <form 
                onSubmit={submitSuggestion} 
                className="glass-card p-4 flex flex-col gap-3 mb-3 border border-zinc-900/60 shrink-0 text-start"
              >
                <h4 className="text-xs font-black text-brand-orange flex items-center gap-1.5">
                  <Lightbulb className="w-4.5 h-4.5" />
                  <span>قدّم اقتراح أو رأي</span>
                </h4>
                <input 
                  type="text" 
                  placeholder="عنوان مختصر (مثلًا: إضافة بنك أسئلة)" 
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl px-3 py-2 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200"
                  value={suggTitle}
                  onChange={(e) => setSuggTitle(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  required
                />
                <textarea 
                  placeholder="اشرح فكرتك أو رأيك بالتفصيل…" 
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none"
                  value={suggContent}
                  onChange={(e) => setSuggContent(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  required
                  rows={2}
                />
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow self-start flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Submit Idea +{xpSettings.suggestion_create !== undefined ? xpSettings.suggestion_create : 50} XP</span>
                </button>
              </form>
            ) : (
              <div 
                className="text-zinc-500 text-xs font-bold text-center py-6 border border-dashed border-zinc-800 rounded-xl mb-4 uppercase tracking-wide shrink-0 bg-[#0a0a0a]"
              >
                من فضلك <button onClick={() => setCurrentPage('login')} className="text-brand-orange hover:text-brand-amber font-black cursor-pointer underline">سجّل دخول</button> عشان تقدّم اقتراحات.
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 px-3 md:px-0 pe-3 md:pe-1 pb-4 md:pb-0">
              {suggestions.length === 0 ? (
                <div className="text-zinc-500 text-xs font-bold text-center py-10">مفيش اقتراحات لسه. خليك أول واحد!</div>
              ) : (
                suggestions.map((s: any) => {
                  const isAuthor = user && (String(s.user_id) === String(user.id) || s.username === user.username);
                  const isAdmin = user && (user.role === 'admin' || user.role === 'owner');
                  const isEditing = editingSuggId === s.id;
                  const isUpvoted = s.isUpvoted || s.hasUpvoted;

                  let statusColor = 'text-zinc-500';
                  let statusBg = 'bg-zinc-900/40 border-zinc-800';
                  let statusLabel = s.status;
                  
                  if (s.delete_pending) {
                    statusColor = 'text-red-400';
                    statusBg = 'bg-red-500/10 border-red-500/20';
                    statusLabel = 'طلب حذف معلّق';
                  } else if (s.edit_draft) {
                    statusColor = 'text-amber-400';
                    statusBg = 'bg-amber-500/10 border-amber-500/20';
                    statusLabel = 'تعديل معلّق';
                  } else if (s.status === 'approved') {
                    statusColor = 'text-green-400';
                    statusBg = 'bg-green-500/10 border-green-500/20';
                  } else if (s.status === 'rejected') {
                    statusColor = 'text-red-400';
                    statusBg = 'bg-red-500/10 border-red-500/20';
                  }

                  return (
                    <div key={s.id} className="glass-card p-4 border border-zinc-900/60 flex flex-col gap-2.5 text-start">
                      {isEditing ? (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-2xs font-bold text-brand-orange uppercase block mb-1">العنوان</label>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-brand-orange outline-none"
                              value={editSuggTitle}
                              onChange={(e) => setEditSuggTitle(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-2xs font-bold text-brand-orange uppercase block mb-1">التفاصيل</label>
                            <textarea 
                              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 text-xs font-semibold focus:border-brand-orange outline-none resize-none"
                              value={editSuggContent}
                              onChange={(e) => setEditSuggContent(e.target.value)}
                              required
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button 
                              type="button"
                              className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-2xs py-1.5 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow"
                              onClick={async () => {
                                await handleEditSuggestion(s.id, editSuggTitle, editSuggContent);
                                setEditingSuggId(null);
                              }}
                            >
                              احفظ التعديلات
                            </button>
                            <button 
                              type="button"
                              className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold text-2xs py-1.5 px-4 rounded-xl cursor-pointer transition-all"
                              onClick={() => setEditingSuggId(null)}
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 dir="auto" className="text-xs font-black text-white">
                                {s.title}
                              </h4>
                              <span className="text-2xs text-zinc-500 font-semibold block mt-0.5">
                                By <bdi dir="ltr">@{s.username}</bdi> · {new Date(s.created_at).toLocaleString('ar-EG-u-nu-latn', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className={`text-2xs font-black px-2.5 py-0.5 rounded-full uppercase border ${statusColor} ${statusBg}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p dir="auto" className="text-xs text-zinc-400 font-medium leading-relaxed">
                            {s.content}
                          </p>
                          
                          {s.status === 'rejected' && isAuthor && s.rejection_reason && (
                            <div className="p-2 border border-red-500/20 bg-red-500/5 text-red-400 rounded-lg text-2xs font-semibold">
                              Rejection Reason: {s.rejection_reason}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t border-zinc-900/40">
                            <button 
                              type="button" 
                              className={`flex items-center gap-1.5 text-2xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                                isUpvoted ? 'text-brand-orange scale-105' : 'text-zinc-500 hover:text-zinc-300'
                              }`} 
                              onClick={() => handleUpvoteSuggestion(s.id)}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 transition-all duration-300 ease-out ${
                                isUpvoted ? 'animate-upvote-pop fill-brand-orange text-brand-orange' : 'text-zinc-500'
                              }`} /> 
                              <span>{s.upvotes || 0} Upvotes</span>
                            </button>

                            <div className="flex gap-3">
                              {isAuthor && !s.delete_pending && (
                                <button 
                                  type="button" 
                                  className="flex items-center gap-1 text-2xs font-bold text-brand-orange hover:text-brand-amber transition-colors cursor-pointer" 
                                  onClick={() => {
                                    setEditingSuggId(s.id);
                                    setEditSuggTitle(s.title);
                                    setEditSuggContent(s.content);
                                  }}
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> 
                                  <span>تعديل</span>
                                </button>
                              )}

                              {isAuthor && (s.edit_draft || s.delete_pending) ? (
                                <button 
                                  type="button" 
                                  className="flex items-center gap-1 text-2xs font-bold text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer" 
                                  onClick={() => handleCancelSuggestionRevision(s.id)}
                                >
                                  <X className="w-3.5 h-3.5" /> 
                                  <span>تجاهل التعديلات</span>
                                </button>
                              ) : (
                                (isAuthor || isAdmin) && (
                                  <button 
                                    type="button" 
                                    className="flex items-center gap-1 text-2xs font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer" 
                                    onClick={() => handleDeleteSuggestion(s.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> 
                                    <span>حذف</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {activeContextMenu && (
          <div 
            className="fixed inset-0 z-[100] cursor-default"
            onClick={() => setActiveContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setActiveContextMenu(null); }}
          >
            <m.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bg-zinc-950 border border-zinc-800 rounded-2xl p-1.5 flex flex-col gap-1 min-w-[150px] shadow-2xl z-[1000] text-start"
              style={{
                top: Math.min(activeContextMenu.y, window.innerHeight - 280),
                left: Math.max(10, Math.min(activeContextMenu.x - 105, window.innerWidth - 220))
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Reactions Emoji Bar */}
              <div className="flex justify-around items-center bg-zinc-900 border border-zinc-800/80 rounded-xl p-1 mb-1 gap-1">
                {['👍', '❤️', '🔥', '😂', '👏', '😢'].map((emoji) => (
                  <button
                    key={emoji}
                    className="p-1 text-xs hover:scale-125 hover:bg-zinc-800 rounded-lg cursor-pointer transition-transform"
                    onClick={() => {
                      handleToggleReaction(activeContextMenu.messageId, emoji);
                      setActiveContextMenu(null);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="p-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
                  title="إيموجي أكتر"
                  onClick={() => {
                    setReactionPickerMsgId(activeContextMenu.messageId);
                    setActiveContextMenu(null);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action buttons */}
              <button 
                className="w-full flex items-center gap-2.5 p-2 font-bold text-xs text-white rounded-lg cursor-pointer hover:bg-zinc-900/60 transition-colors"
                onClick={() => {
                  setReplyingTo({
                    id: activeContextMenu.msg.id,
                    username: activeContextMenu.msg.username,
                    message: activeContextMenu.msg.message
                  });
                  setActiveContextMenu(null);
                }}
              >
                <CornerUpLeft className="rtl:-scale-x-100 w-3.5 h-3.5 text-zinc-500" /> 
                <span>رد</span>
              </button>

              {user && activeContextMenu.msg.username === user.username && (
                <button 
                  className="w-full flex items-center gap-2.5 p-2 font-bold text-xs text-white rounded-lg cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  onClick={() => {
                    setEditingMessage(activeContextMenu.msg);
                    setChatInput(activeContextMenu.msg.message);
                    setReplyingTo(null);
                    setActiveContextMenu(null);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5 text-zinc-500" /> 
                  <span>تعديل</span>
                </button>
              )}

              <button 
                className="w-full flex items-center gap-2.5 p-2 font-bold text-xs text-white rounded-lg cursor-pointer hover:bg-zinc-900/60 transition-colors"
                onClick={() => {
                  setIsMultiSelectMode(true);
                  setSelectedMessageIds([activeContextMenu.messageId]);
                  setActiveContextMenu(null);
                }}
              >
                <CheckSquare className="w-3.5 h-3.5 text-zinc-500" /> 
                <span>تحديد</span>
              </button>

              {user && (activeContextMenu.msg.username === user.username || user.role === 'admin' || user.role === 'owner') && (
                <button 
                  className="w-full flex items-center gap-2.5 p-2 font-bold text-xs text-red-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  onClick={() => {
                    handleDeleteMessage(activeContextMenu.messageId);
                    setActiveContextMenu(null);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" /> 
                  <span>حذف</span>
                </button>
              )}
              {user && (user.role === 'admin' || user.role === 'owner') && activeContextMenu.msg.username !== user.username && (
                <button 
                  className="w-full flex items-center gap-2.5 p-2 font-bold text-xs text-brand-orange rounded-lg cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  onClick={() => {
                    handleOpenModerationModal(activeContextMenu.msg.username, activeContextMenu.msg.user_id);
                    setActiveContextMenu(null);
                  }}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-brand-orange" /> 
                  <span>إجراء على المستخدم</span>
                </button>
              )}
              {user && activeContextMenu.msg.username !== user.username && (
                <button 
                  className="w-full flex items-center gap-2.5 p-2 font-bold text-xs text-amber-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  onClick={() => {
                    handleOpenReportModal && handleOpenReportModal('message', activeContextMenu.messageId, activeContextMenu.msg.message);
                    setActiveContextMenu(null);
                  }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 
                  <span>إبلاغ عن الرسالة</span>
                </button>
              )}
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reactions Custom Emoji Picker Modal */}
      <EmojiPickerPopover
        isOpen={reactionPickerMsgId !== null}
        onClose={() => setReactionPickerMsgId(null)}
        onEmojiSelect={(emoji) => {
          if (reactionPickerMsgId) {
            handleToggleReaction(reactionPickerMsgId, emoji);
          }
          setReactionPickerMsgId(null);
        }}
        position="centered"
      />
    </div>
  );
};
