import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { HighlightWrapper } from '../notifications/HighlightWrapper';
import { UserAvatar } from '../UserAvatar';
import { 
  X, 
  Send, 
  Heart, 
  CornerUpLeft, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  MessageSquare,
  ChevronDown,
  Smile,
  Keyboard
} from 'lucide-react';
import { communityService } from '../../services/communityService';
import { formatMentions } from '../../utils/mentions';

interface CommentItem {
  id: number;
  user_id: number;
  username: string;
  avatar_url?: string;
  equipped_frame?: string;
  batch?: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
  likes_count: number;
  has_liked?: boolean;
  replies?: CommentItem[];
}

interface CommentsSlideUpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number | null;
  postAuthorName?: string;
  user: any;
  usernames?: any[];
  triggerXpPopup?: (amount: number) => void;
  showToast: (msg: string) => void;
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;
  onCommentCountChange?: (postId: number, delta: number) => void;
  deepLinkTarget?: any;
  setDeepLinkTarget?: (val: any) => void;
}

export const CommentsSlideUpPanel: React.FC<CommentsSlideUpPanelProps> = ({
  isOpen,
  onClose,
  postId,
  postAuthorName,
  user,
  usernames = [],
  triggerXpPopup,
  showToast,
  handleOpenReportModal,
  onCommentCountChange,
  deepLinkTarget,
  setDeepLinkTarget,
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Mentions autocomplete
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Context menu
  const [activeMenuCommentId, setActiveMenuCommentId] = useState<number | null>(null);

  // Expand replies tracking
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const isHandlingPopStateRef = useRef(false);

  // Synchronize with Browser History for Back Button handling
  useEffect(() => {
    if (!isOpen || !postId) {
      return () => {};
    }

    // If the URL doesn't already have comments=postId, push state
    const currentUrl = new URL(window.location.href);
    const currentCommentsParam = currentUrl.searchParams.get('comments');
    
    if (currentCommentsParam !== String(postId)) {
      currentUrl.searchParams.set('comments', String(postId));
      window.history.pushState({ commentsSheetOpen: true, postId }, '', currentUrl.toString());
    }

    const handlePopState = () => {
      // If back button was pressed, dismiss the comments sheet only
      if (isOpen) {
        isHandlingPopStateRef.current = true;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, postId]);

  // Clean URL when closing if not already popped by browser
  const handlePanelClose = () => {
    if (!isHandlingPopStateRef.current) {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('comments')) {
        currentUrl.searchParams.delete('comments');
        window.history.replaceState({}, '', currentUrl.pathname + (currentUrl.search ? currentUrl.search : ''));
      }
    }
    isHandlingPopStateRef.current = false;
    onClose();
  };

  // Fetch comments when postId changes or panel opens
  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await communityService.fetchComments(postId);
      if (res.ok) {
        const data = await res.json();
        setComments(data || []);
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
      setReplyingTo(null);
      setCommentText('');
      setEditingCommentId(null);
      setActiveMenuCommentId(null);
    }
  }, [isOpen, postId]);

  // Handle deep-link scrolling to a specific comment
  useEffect(() => {
    if (isOpen && deepLinkTarget && deepLinkTarget.type === 'comment' && deepLinkTarget.postId === postId && comments.length > 0) {
      const { commentId } = deepLinkTarget;
      setTimeout(() => {
        const el = document.getElementById(`sheet-comment-${commentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('notification-highlight');
          setTimeout(() => {
            el.classList.remove('notification-highlight');
          }, 3000);
          if (setDeepLinkTarget) setDeepLinkTarget(null);
        }
      }, 300);
    }
  }, [isOpen, deepLinkTarget, comments, postId]);

  // Mentions autocomplete logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCommentText(text);

    const lastAtIdx = text.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const isStartOrAfterSpace = lastAtIdx === 0 || text[lastAtIdx - 1] === ' ' || text[lastAtIdx - 1] === '\n';
      const textAfterAt = text.substring(lastAtIdx + 1);
      if (isStartOrAfterSpace && !textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setActiveSuggestionIdx(0);
        return;
      }
    }
    setMentionSearch(null);
  };

  const selectMention = (targetUsername: string) => {
    const lastAtIdx = commentText.lastIndexOf('@');
    if (lastAtIdx === -1) return;
    const beforeAt = commentText.substring(0, lastAtIdx);
    const updated = `${beforeAt}@${targetUsername} `;
    setCommentText(updated);
    setMentionSearch(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const getFilteredUsernames = () => {
    if (mentionSearch === null || !usernames) return [];
    return usernames.filter((u: any) =>
      u.username.toLowerCase().includes(mentionSearch.toLowerCase()) &&
      u.username !== user?.username
    ).slice(0, 5);
  };

  // Submit new comment or reply
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = commentText.trim();
    if (!text || !postId || !user || submitting) return;

    setSubmitting(true);
    const parentId = replyingTo ? replyingTo.id : null;

    try {
      const res = await communityService.addComment(postId, text, parentId, localStorage.getItem('token') || undefined);
      if (res.ok) {
        const newComment = await res.json();
        if (newComment.xp_earned && triggerXpPopup) {
          triggerXpPopup(newComment.xp_earned);
        }

        if (parentId) {
          setComments(prev => prev.map(c => 
            c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c
          ));
          setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
        } else {
          setComments(prev => [...prev, newComment]);
        }

        if (onCommentCountChange) {
          onCommentCountChange(postId, 1);
        }

        setCommentText('');
        setReplyingTo(null);
        setMentionSearch(null);

        // Scroll to bottom of comments list if top-level
        if (!parentId) {
          setTimeout(() => {
            if (listContainerRef.current) {
              listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight;
            }
          }, 100);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      showToast('Network error: Could not submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Like / Unlike comment
  const handleToggleLike = async (commentId: number) => {
    if (!user) {
      showToast('Please log in to like comments! 🔒');
      return;
    }

    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const newLiked = !c.has_liked;
        return { ...c, has_liked: newLiked, likes_count: Math.max(0, c.likes_count + (newLiked ? 1 : -1)) };
      }
      return {
        ...c,
        replies: (c.replies || []).map(r =>
          r.id === commentId ? { ...r, has_liked: !r.has_liked, likes_count: Math.max(0, r.likes_count + (!r.has_liked ? 1 : -1)) } : r
        )
      };
    }));

    try {
      await communityService.likeComment(commentId, localStorage.getItem('token') || undefined);
    } catch (e) {
      console.error('Error toggling comment like:', e);
      fetchComments();
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: number, isReply: boolean, parentId?: number) => {
    try {
      const res = await communityService.deleteComment(commentId, localStorage.getItem('token') || undefined);
      if (res.ok) {
        if (triggerXpPopup) triggerXpPopup(-15);
        if (isReply && parentId) {
          setComments(prev => prev.map(c =>
            c.id === parentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) } : c
          ));
        } else {
          setComments(prev => prev.filter(c => c.id !== commentId));
        }
        if (onCommentCountChange && postId) {
          onCommentCountChange(postId, -1);
        }
        showToast('Comment deleted');
      }
    } catch (e) {
      console.error('Error deleting comment:', e);
      showToast('Failed to delete comment');
    }
  };

  // Edit comment
  const handleSaveEdit = async (commentId: number) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await communityService.editComment(commentId, editCommentText.trim(), localStorage.getItem('token') || undefined);
      if (res.ok) {
        setEditingCommentId(null);
        setEditCommentText('');
        fetchComments();
        showToast('Comment updated');
      }
    } catch (e) {
      console.error('Error editing comment:', e);
      showToast('Failed to update comment');
    }
  };

  // Quick Emoji Click
  const handleAddEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Drag down gesture completion handler
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 350) {
      handlePanelClose();
    }
  };

  // Render text with highlight mentions
  const renderFormattedText = (text: string) => {
    return formatMentions(text, usernames, 'text-brand-orange font-extrabold hover:underline cursor-pointer transition-colors');
  };

  // Render a single comment row
  const renderCommentItem = (c: CommentItem, isReply: boolean = false, parentId?: number) => {
    const isOwner = user && (c.user_id === user.id || c.username === user.username || user.role === 'admin' || user.role === 'owner');
    const isMenuOpen = activeMenuCommentId === c.id;
    const isEditing = editingCommentId === c.id;
    const hasReplies = !isReply && c.replies && c.replies.length > 0;
    const isRepliesExpanded = expandedReplies[c.id];

    return (
      <div 
        key={c.id} 
        id={`sheet-comment-${c.id}`}
        className={`group relative transition-all ${isReply ? 'ml-8 mt-2 pl-3 border-l-2 border-zinc-800/80' : 'mb-4'}`}
      >
        <div className="flex gap-3 items-start">
          <UserAvatar 
            username={c.username} 
            avatarUrl={c.avatar_url} 
            equippedFrame={c.equipped_frame} 
            size={isReply ? 28 : 34} 
          />

          <div className="flex-1 min-w-0">
            {/* Comment bubble */}
            <div className="bg-zinc-900/60 hover:bg-zinc-900/80 transition-colors border border-zinc-800/60 rounded-2xl p-3 text-left relative">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-white hover:text-brand-orange cursor-pointer transition-colors">
                    {c.username}
                  </span>
                  {c.batch && (
                    <span className="text-[8px] font-bold bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded-md border border-zinc-700/40">
                      {c.batch}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 font-medium">
                    {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>

                  {/* 3-dots options menu */}
                  {user && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuCommentId(isMenuOpen ? null : c.id);
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      <AnimatePresence>
                        {isMenuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setActiveMenuCommentId(null)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -5 }}
                              className="absolute right-0 top-7 z-50 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 flex flex-col gap-1 min-w-[120px] shadow-2xl"
                            >
                              {isOwner ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditCommentText(c.content);
                                      setActiveMenuCommentId(null);
                                    }}
                                    className="w-full flex items-center gap-2 p-2 font-bold text-xs text-brand-amber rounded-lg hover:bg-zinc-900 cursor-pointer text-left transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteComment(c.id, isReply, parentId);
                                      setActiveMenuCommentId(null);
                                    }}
                                    className="w-full flex items-center gap-2 p-2 font-bold text-xs text-red-400 rounded-lg hover:bg-zinc-900 cursor-pointer text-left transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (handleOpenReportModal) {
                                      handleOpenReportModal('comment', c.id, c.content);
                                    }
                                    setActiveMenuCommentId(null);
                                  }}
                                  className="w-full flex items-center gap-2 p-2 font-bold text-xs text-amber-400 rounded-lg hover:bg-zinc-900 cursor-pointer text-left transition-colors"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Report</span>
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment Content / Edit input */}
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-brand-orange rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(c.id)}
                      className="px-3 py-1 rounded-lg text-[10px] font-extrabold bg-brand-orange text-black cursor-pointer shadow-md"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-200 font-medium leading-relaxed whitespace-pre-wrap break-words">
                  {renderFormattedText(c.content)}
                </p>
              )}
            </div>

            {/* Sub-actions (Like, Reply, Reply count) */}
            <div className="flex items-center gap-4 mt-1 px-1.5 text-[11px]">
              <button
                onClick={() => handleToggleLike(c.id)}
                className={`flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                  c.has_liked ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${c.has_liked ? 'fill-current' : ''}`} />
                <span>{c.likes_count > 0 ? c.likes_count : 'Like'}</span>
              </button>

              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingTo({ id: c.id, username: c.username });
                    inputRef.current?.focus();
                  }}
                  className="flex items-center gap-1 font-bold text-zinc-500 hover:text-brand-orange cursor-pointer transition-colors"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              )}
            </div>

            {/* Threaded replies toggle */}
            {hasReplies && (
              <div className="mt-2">
                <button
                  onClick={() => setExpandedReplies(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-brand-orange/90 hover:text-brand-orange cursor-pointer py-1"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isRepliesExpanded ? 'rotate-180' : ''}`} />
                  <span>
                    {isRepliesExpanded 
                      ? 'Hide replies' 
                      : `View ${c.replies?.length} ${c.replies?.length === 1 ? 'reply' : 'replies'}`}
                  </span>
                </button>

                <AnimatePresence>
                  {isRepliesExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-2 mt-1"
                    >
                      {c.replies?.map(reply => renderCommentItem(reply, true, c.id))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          {/* Dimmed Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handlePanelClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Slide-Up Bottom Sheet Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            className="relative z-10 w-full max-w-2xl mx-auto bg-zinc-950/95 border-t md:border border-zinc-800/80 rounded-t-[28px] md:rounded-[28px] md:mb-4 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col max-h-[88vh] h-[85vh] overflow-hidden"
          >
            {/* Top Drag Handle Header */}
            <div className="pt-3 pb-2 px-5 flex flex-col border-b border-zinc-800/60 bg-zinc-950/80 select-none">
              <div className="w-12 h-1.5 bg-zinc-700 hover:bg-zinc-500 rounded-full mx-auto mb-2 cursor-grab active:cursor-grabbing transition-colors" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-orange/15 flex items-center justify-center text-brand-orange">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Comments {comments.length > 0 && `(${comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})`}
                    </h3>
                    {postAuthorName && (
                      <p className="text-[10px] text-zinc-500 font-semibold">
                        Post by @{postAuthorName}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handlePanelClose}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                  title="Close comments"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Comments List */}
            <div 
              ref={listContainerRef}
              className="flex-1 overflow-y-auto p-4 overscroll-contain space-y-2 scroll-smooth"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-xs gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                  <span className="font-bold">Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-600 mb-1">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-extrabold text-zinc-300">No comments yet</p>
                  <p className="text-xs text-zinc-500 font-medium">Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.map(c => renderCommentItem(c))
              )}
            </div>

            {/* Mentions Autocomplete Floating Box */}
            <AnimatePresence>
              {mentionSearch !== null && getFilteredUsernames().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-20 left-4 right-4 z-30 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-2 shadow-2xl max-h-40 overflow-y-auto"
                >
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider px-2 py-1">
                    Mention user
                  </div>
                  {getFilteredUsernames().map((u: any, idx: number) => (
                    <div
                      key={u.id || u.username}
                      onClick={() => selectMention(u.username)}
                      className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors ${
                        idx === activeSuggestionIdx ? 'bg-brand-orange/20 text-brand-orange' : 'hover:bg-zinc-800 text-white'
                      }`}
                    >
                      <UserAvatar username={u.username} avatarUrl={u.avatar_url} size={22} />
                      <span className="text-xs font-bold">@{u.username}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Replying banner indicator */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-brand-orange/10 border-t border-brand-orange/20 px-4 py-2 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 text-brand-orange font-bold">
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    <span>Replying to @{replyingTo.username}</span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sticky Bottom Input Bar */}
            <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/95 pb-safe relative">
              {user ? (
                <form onSubmit={handleSubmitComment} className="flex items-center gap-2 relative">
                  <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatar_url}
                    equippedFrame={user.equipped_frame}
                    size={32}
                  />

                  <div className="flex-1 relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={commentText}
                      onChange={handleInputChange}
                      onFocus={() => setShowEmojiPicker(false)}
                      placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Write a comment... (Type @ to mention)'}
                      className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-full py-2.5 pl-4 pr-4 text-xs font-semibold placeholder-zinc-500 outline-none transition-all"
                    />
                  </div>

                  {/* Emoji Picker Button (Next to Send button) */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        if (showEmojiPicker) {
                          setShowEmojiPicker(false);
                          if (inputRef.current) inputRef.current.focus();
                        } else {
                          if (inputRef.current) inputRef.current.blur();
                          setShowEmojiPicker(true);
                        }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all border ${
                        showEmojiPicker 
                          ? 'bg-brand-orange text-black border-brand-orange shadow-orange-glow' 
                          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-brand-orange'
                      }`}
                      title={showEmojiPicker ? 'Switch to Keyboard' : 'Insert Emoji'}
                    >
                      {showEmojiPicker ? <Keyboard className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
                    </button>

                    <EmojiPickerPopover
                      isOpen={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                      onEmojiSelect={(emoji) => {
                        handleAddEmoji(emoji);
                      }}
                      position="top-right"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!commentText.trim() || submitting}
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-brand-orange to-brand-amber text-black flex items-center justify-center cursor-pointer shadow-orange-glow hover:shadow-orange-intense active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Send className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-2 text-xs text-zinc-500 font-bold">
                  Please log in to join the conversation.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
