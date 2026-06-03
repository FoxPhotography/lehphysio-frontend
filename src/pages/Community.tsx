import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNameColor, getFrameImage } from '../utils/helpers';
import { UserAvatar } from '../components/UserAvatar';
import { HighlightWrapper } from '../components/notifications/HighlightWrapper';
import { useNotifications } from '../context/NotificationContext';
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
  Sparkles,
  Frown,
  Zap
} from 'lucide-react';

interface CommunityProps {
  user: any;
  onlineCount: number;
  chatMessages: any[];
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
  setChatInput: (val: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => void;
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
  usernames?: any[];
  getAvatarFrameClass?: () => string;
  equippedFrame?: string;
  loadOlderMessages?: (beforeId: string) => void;
  isLoadingOlder?: boolean;
  hasMoreChat?: boolean;
}

// Helper to strip emojis from names
const stripEmojis = (str: string) => {
  if (!str) return '';
  return str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
};

// Map emoji characters to Lucide icons to satisfy Requirement 3 (no emojis in UI) and 4 (exclusively Lucide)
const renderReactionIcon = (emoji: string) => {
  const iconClass = "w-3.5 h-3.5 fill-current";
  if (emoji === '👍') return <ThumbsUp className="w-3 h-3" />;
  if (emoji === '❤️') return <Heart className={`${iconClass} text-red-500`} />;
  if (emoji === '🔥') return <Flame className={`${iconClass} text-brand-orange`} />;
  if (emoji === '😂') return <Smile className="w-3.5 h-3.5 text-yellow-300" />;
  if (emoji === '👏') return <Sparkles className="w-3.5 h-3.5 text-yellow-400" />;
  if (emoji === '😢') return <Frown className="w-3.5 h-3.5 text-blue-400" />;
  return <span>{emoji}</span>;
};

export const Community: React.FC<CommunityProps> = ({
  user,
  onlineCount,
  chatMessages,
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
  usernames = [],
  getAvatarFrameClass,
  equippedFrame,
  loadOlderMessages,
  isLoadingOlder = false,
  hasMoreChat = true,
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

  // Mentions autocomplete state
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const { deepLinkTarget, setDeepLinkTarget } = useNotifications();

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

  // Scroll to and highlight message from URL param ?msg=X or deepLinkTarget
  useEffect(() => {
    if (activeSubTab === 'chat' && chatMessages.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const msgIdStr = searchParams.get('msg');
      const msgId = msgIdStr ? parseInt(msgIdStr, 10) : (deepLinkTarget?.type === 'chat_message' ? deepLinkTarget.messageId : null);

      if (msgId) {
        const exists = chatMessages.some(m => m.id === msgId);
        if (exists) {
          setTimeout(() => {
            const el = document.getElementById(`chat-msg-${msgId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (deepLinkTarget) setDeepLinkTarget(null);
            }
          }, 100);
        }
      }
    }
  }, [chatMessages, activeSubTab, deepLinkTarget, setDeepLinkTarget]);

  const renderTextWithMentions = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="text-yellow-400 font-extrabold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setChatInput(value);
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
    const value = chatInput;
    const selectionStart = mentionStartIndex + targetUsername.length + 2; 
    const newValue = 
      value.substring(0, mentionStartIndex) + 
      `@${targetUsername} ` + 
      value.substring(mentionStartIndex + mentionSearch.length + 1);
    
    setChatInput(newValue);
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
    <div className="w-full max-w-4xl mx-auto px-0 md:px-4 pt-20 md:pt-4 pb-0 md:pb-20 text-left md:h-auto"
      style={{
        height: window.innerWidth < 768
          ? `${viewportHeight - (isInputFocused ? 0 : 72)}px`
          : undefined
      }}>
      <div className="glass-card p-0 md:p-6 flex flex-col h-full md:h-[650px] relative overflow-hidden border-0 md:border border-zinc-900/60 rounded-none md:rounded-2xl">
        
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
            <span className="hidden sm:inline">General Chat</span>
            <span className="sm:hidden">Chat</span>
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
            <span className="hidden sm:inline">Suggestions Board</span>
            <span className="sm:hidden">Suggestions</span>
          </button>
        </div>

        {activeSubTab === 'chat' ? (
          <>
            {/* Multi-select bar or Standard Header */}
            {isMultiSelectMode ? (
              <div className="flex justify-between items-center bg-brand-orange/10 border border-brand-orange/20 rounded-xl p-3 mb-3 mx-3 md:mx-0 shrink-0">
                <span className="text-xs font-black text-white">Selected {selectedMessageIds.length} messages</span>
                <div className="flex gap-2">
                  <button className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer" onClick={handleBulkDeleteMessages} disabled={selectedMessageIds.length === 0}>Delete</button>
                  <button className="border border-zinc-800 hover:bg-zinc-900 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer" onClick={() => { setIsMultiSelectMode(false); setSelectedMessageIds([]); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-2 border-b border-zinc-900 pb-2 mx-3 md:mx-0 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-orange" />
                  <h3 className="text-sm font-black text-white">Chat Feed</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-brand-orange font-extrabold uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{onlineCount} Online</span>
                </div>
              </div>
            )}

            {/* Chat Messages Feed */}
            <div 
              id="pl-chat-feed" 
              onScroll={(e) => {
                const el = e.currentTarget;
                const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 150;
                setShowScrollDownBtn(isUp);

                // Infinite scroll up
                if (el.scrollTop === 0 && !isLoadingOlder && hasMoreChat && loadOlderMessages) {
                  const oldestMsg = chatMessages[0];
                  if (oldestMsg && oldestMsg.id) {
                    loadOlderMessages(oldestMsg.id);
                  }
                }
              }}
              className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 py-2 px-3 md:px-1 pb-2 direction-rtl"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {isLoadingOlder && (
                <div className="flex items-center justify-center py-2 text-zinc-500 text-xs font-bold gap-2 shrink-0 direction-ltr">
                  <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تحميل الرسائل السابقة...</span>
                </div>
              )}

              {chatMessages.map((msg: any) => {
                const isMyMsg = user && msg.username === user.username;
                const isSelected = selectedMessageIds.includes(msg.id);
                
                const tx = swipeTranslateX[msg.id] || 0;
                const isSwiping = swipeMessageIdRef.current === msg.id;
                const framePngUrl = getFrameImage(msg.equipped_frame);

                return (
                  <div 
                    key={msg.id} 
                    id={`chat-msg-${msg.id}`}
                    className="flex w-full"
                    style={{
                      justifyContent: isMyMsg ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
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
                          <CornerUpLeft className="w-4.5 h-4.5 text-zinc-500" />
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
                          className="self-center ml-2 shrink-0 cursor-pointer text-brand-orange"
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
                          <span className="text-[10px] font-black" style={{ color: isMyMsg ? 'var(--color-brand-orange)' : getNameColor(msg.username) }}>
                            {msg.username}
                          </span>
                          <span className="text-[8px] font-bold bg-zinc-900 border border-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded-md">
                            {msg.batch}
                          </span>
                          <span className="text-[8px] text-zinc-500 font-semibold">
                            {stripEmojis(msg.rank?.name_en || '')}
                          </span>
                          {(msg.role === 'admin' || msg.role === 'owner') && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${
                              msg.role === 'owner' ? 'border-brand-amber/30 text-brand-amber bg-brand-amber/5' : 'border-brand-orange/30 text-brand-orange bg-brand-orange/5'
                            }`}>
                              {msg.role}
                            </span>
                          )}
                        </div>

                        {/* Text card bubble */}
                        <HighlightWrapper
                          isHighlighted={deepLinkTarget?.type === 'chat_message' && deepLinkTarget?.messageId === msg.id}
                          className="rounded-2xl"
                        >
                          <div 
                            className={`px-3 py-2 rounded-2xl text-xs md:text-sm font-semibold shadow-lg text-left relative ${
                              isMyMsg 
                                ? 'bg-gradient-to-r from-brand-orange to-brand-amber text-black rounded-tr-none' 
                                : 'bg-zinc-900/60 border border-zinc-800 text-white rounded-tl-none'
                            }`}
                          >
                          {/* Quote reply */}
                          {msg.reply_to?.username && (
                            <div className={`border-l-2 border-brand-orange px-2.5 py-1.5 rounded-lg mb-2 text-[10px] text-left direction-ltr ${
                              isMyMsg ? 'bg-black/10 text-zinc-800' : 'bg-black/30 text-zinc-400'
                            }`}>
                              <div className={`font-black ${isMyMsg ? 'text-black' : 'text-brand-orange'}`}>
                                @{msg.reply_to.username}
                              </div>
                              <div className="truncate mt-0.5">{msg.reply_to.message}</div>
                            </div>
                          )}

                          <div className="flex items-end justify-between gap-3 min-w-0 direction-ltr">
                            <p className="whitespace-pre-wrap word-break-word leading-relaxed flex-1">
                              {renderTextWithMentions(msg.message)}
                            </p>
                            
                            <div className="flex items-center gap-1 shrink-0 text-[8px] opacity-75 select-none pb-0.5">
                              {!!msg.is_edited && <span>(edited)</span>}
                              <span>{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
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
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-bold cursor-pointer transition-colors ${
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
              className="border-t border-zinc-900/80 pt-2.5 bg-zinc-950/90 backdrop-blur-md px-3 md:px-0 shrink-0 direction-ltr text-left relative"
            >
              
              {/* Reply tag indicator */}
              {replyingTo && (
                <div className="flex justify-between items-center bg-brand-orange/5 border-l-2 border-brand-orange rounded-xl px-3 py-2.5 mb-2 text-xs font-bold text-brand-orange">
                  <div className="truncate pr-4">
                    <span>Replying to <strong>@{replyingTo.username}</strong>: </span>
                    <span className="text-zinc-500 font-medium">{replyingTo.message}</span>
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
                    <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 md:left-0 md:right-0 max-h-[160px] overflow-y-auto z-50 bg-zinc-950/95 border border-zinc-850 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs text-zinc-500 text-center font-bold">
                      No matching users found
                    </div>
                  );
                }
                return (
                  <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 md:left-0 md:right-0 max-h-[160px] overflow-y-auto z-50 bg-zinc-950/95 border border-zinc-850 rounded-xl p-1 shadow-2xl backdrop-blur-md">
                    {filteredSuggestions.map((u: any, idx: number) => (
                      <button
                        key={u.username}
                        type="button"
                        onClick={() => handleSelectMention(u.username)}
                        onMouseEnter={() => setActiveSuggestionIdx(idx)}
                        className={`w-full flex items-center gap-3 p-2.5 cursor-pointer rounded-lg text-left text-xs font-bold text-white transition-colors ${
                          idx === activeSuggestionIdx ? 'bg-brand-orange/20 border border-brand-orange/30 shadow-orange-glow' : 'hover:bg-brand-orange/10'
                        }`}
                      >
                        <UserAvatar username={u.username} avatarUrl={u.avatar_url} equippedFrame={u.equipped_frame} size={24} />
                        <div className="flex flex-col text-left">
                           <span className="text-brand-orange font-black">@{u.username}</span>
                           <span className="text-[9px] text-zinc-500">{u.role === 'owner' ? 'Owner' : u.role === 'admin' ? 'Admin' : 'Student'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Editing tag indicator */}
              {editingMessage && (
                <div className="flex justify-between items-center bg-brand-amber/5 border-l-2 border-brand-amber rounded-xl px-3 py-2.5 mb-2 text-xs font-bold text-brand-amber">
                  <span>Editing message...</span>
                  <button 
                    onClick={() => {
                      setEditingMessage(null);
                      setChatInput('');
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
                    handleSendChatMessage(e);
                    const el = document.getElementById('community-chat-input');
                    if (el) el.style.height = 'auto';
                  }}
                  className="flex gap-2.5 items-end py-2"
                >
                  <div className="flex-1 relative flex items-end bg-zinc-900/40 border border-zinc-800/80 focus-within:border-brand-orange/60 focus-within:ring-1 focus-within:ring-brand-orange/20 rounded-2xl transition-all duration-200 px-3.5">
                    <textarea
                      id="community-chat-input"
                      name="chatMessage"
                      autoComplete="off"
                      autoCorrect="on"
                      spellCheck="true"
                      className="w-full bg-transparent text-white py-2.5 text-xs md:text-sm font-semibold placeholder-zinc-500 outline-none resize-none min-h-[40px] max-h-[140px] leading-relaxed"
                      placeholder={editingMessage ? "Edit your message here..." : "Type a message..."}
                      value={chatInput}
                      onChange={handleInputChange}
                      onFocus={() => setIsInputFocused(true)}
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
                    {editingMessage ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Send className="w-4.5 h-4.5 stroke-[2.5] translate-x-0.5" />}
                  </button>
                </form>
              ) : (
                <div className="text-zinc-500 text-xs font-bold text-center py-2 uppercase tracking-wide">
                  Please <button onClick={() => setCurrentPage('login')} className="text-brand-orange hover:text-brand-amber font-black cursor-pointer underline">Login</button> to participate in the live chat.
                </div>
              )}
            </div>

            {/* Scroll bottom btn */}
            <AnimatePresence>
              {showScrollDownBtn && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  onClick={handleScrollToBottom}
                  className="absolute left-6 w-9 h-9 rounded-full bg-zinc-950/90 border border-brand-orange flex items-center justify-center text-white cursor-pointer z-[25] shadow-orange-glow transition-all active:scale-90 bottom-[68px]"
                  title="Scroll to bottom"
                >
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                </motion.button>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {user ? (
              <form 
                onSubmit={submitSuggestion} 
                className="glass-card p-4 flex flex-col gap-3 mb-3 border border-zinc-900/60 shrink-0 text-left"
              >
                <h4 className="text-xs font-black text-brand-orange flex items-center gap-1.5">
                  <Lightbulb className="w-4.5 h-4.5" />
                  <span>Submit a Suggestion or Feedback</span>
                </h4>
                <input 
                  type="text" 
                  placeholder="Brief Title (e.g. Add dark mode toggle)" 
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl px-3 py-2 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200"
                  value={suggTitle}
                  onChange={(e) => setSuggTitle(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  required
                />
                <textarea 
                  placeholder="Explain your idea or feedback in detail..." 
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
                  <span>Submit Idea +50 XP</span>
                </button>
              </form>
            ) : (
              <div 
                className="text-zinc-500 text-xs font-bold text-center py-6 border border-dashed border-zinc-800 rounded-xl mb-4 uppercase tracking-wide shrink-0 bg-[#0a0a0a]"
              >
                Please <button onClick={() => setCurrentPage('login')} className="text-brand-orange hover:text-brand-amber font-black cursor-pointer underline">Login</button> to submit suggestions.
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 px-3 md:px-0 pr-3 md:pr-1 pb-4 md:pb-0">
              {suggestions.length === 0 ? (
                <div className="text-zinc-500 text-xs font-bold text-center py-10">No suggestions submitted yet. Be the first!</div>
              ) : (
                suggestions.map((s: any) => {
                  let statusColor = 'text-zinc-500';
                  let statusBg = 'bg-zinc-900/40 border-zinc-800';
                  if (s.status === 'approved') {
                    statusColor = 'text-green-400';
                    statusBg = 'bg-green-500/10 border-green-500/20';
                  } else if (s.status === 'rejected') {
                    statusColor = 'text-red-400';
                    statusBg = 'bg-red-500/10 border-red-500/20';
                  }

                  return (
                    <div key={s.id} className="glass-card p-4 border border-zinc-900/60 flex flex-col gap-2.5 text-left">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xs font-black text-white">{s.title}</h4>
                          <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">
                            By @{s.username} · {new Date(s.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${statusColor} ${statusBg}`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                        {s.content}
                      </p>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-900/40">
                        <button 
                          type="button" 
                          className={`flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${s.isUpvoted ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`} 
                          onClick={() => handleUpvoteSuggestion(s.id)}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${s.isUpvoted ? 'fill-current' : ''}`} /> 
                          <span>{s.upvotes || 0} Upvotes</span>
                        </button>
                        {user && (user.role === 'admin' || user.role === 'owner') && (
                          <button 
                            type="button" 
                            className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer" 
                            onClick={() => handleDeleteSuggestion(s.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
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
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bg-zinc-950 border border-zinc-800 rounded-2xl p-1.5 flex flex-col gap-1 min-w-[150px] shadow-2xl z-[1000] text-left"
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
                    className="p-1 text-xs hover:scale-12ability hover:bg-zinc-800 rounded-lg cursor-pointer transition-transform"
                    onClick={() => {
                      handleToggleReaction(activeContextMenu.messageId, emoji);
                      setActiveContextMenu(null);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
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
                <CornerUpLeft className="w-3.5 h-3.5 text-zinc-500" /> 
                <span>Reply</span>
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
                  <span>Edit</span>
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
                <span>Select</span>
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
                  <span>Delete</span>
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
                  <span>Moderate User</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
