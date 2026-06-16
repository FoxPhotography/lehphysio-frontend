import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HighlightWrapper } from '../notifications/HighlightWrapper';
import { UserAvatar } from '../UserAvatar';
import { Loader2, CornerUpLeft, X, Heart, MoreVertical, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

interface CommentsSectionProps {
  postId: number;
  user: any;
  usernames?: any[];
  deepLinkTarget: any;
  setDeepLinkTarget: (val: any) => void;
  triggerXpPopup?: (amount: number) => void;
  showToast: (msg: string) => void;
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;
  isExpanded: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  user,
  usernames = [],
  deepLinkTarget,
  setDeepLinkTarget,
  triggerXpPopup,
  showToast,
  handleOpenReportModal,
  isExpanded,
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentMentionSearch, setCommentMentionSearch] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; commentId: number; content: string; parentId?: number; commentUserId?: number; commentUsername?: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Fetch comments
  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchComments();
    }
  }, [isExpanded, postId]);

  // Click coordinator to close context menu
  useEffect(() => {
    if (!contextMenu) return () => {};
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  // Handle deep link target scrolling
  useEffect(() => {
    if (isExpanded && deepLinkTarget && deepLinkTarget.type === 'comment' && deepLinkTarget.postId === postId && comments.length > 0) {
      const { commentId } = deepLinkTarget;
      setTimeout(() => {
        const el = document.getElementById(`comment-${commentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('notification-highlight');
          setTimeout(() => {
            el.classList.remove('notification-highlight');
          }, 3000);
          setDeepLinkTarget(null);
          window.history.replaceState({}, '', '/');
        }
      }, 300);
    }
  }, [isExpanded, deepLinkTarget, comments, postId]);

  const submitComment = async (parentId?: number) => {
    const text = commentText.trim();
    if (!text || !user) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: text, parent_id: parentId || null })
      });
      if (res.ok) {
        const comment = await res.json();
        if (comment.xp_earned && triggerXpPopup) triggerXpPopup(comment.xp_earned);
        
        if (parentId) {
          setComments(prev => prev.map((c: any) =>
            c.id === parentId ? { ...c, replies: [...(c.replies || []), comment] } : c
          ));
        } else {
          setComments(prev => [...prev, comment]);
        }
        setCommentText('');
        setReplyingToComment(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to post comment');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error: Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: number, isReply?: boolean, parentId?: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        if (triggerXpPopup) triggerXpPopup(-15);
        if (isReply && parentId) {
          setComments(prev => prev.map((c: any) =>
            c.id === parentId ? { ...c, replies: (c.replies || []).filter((r: any) => r.id !== commentId) } : c
          ));
        } else {
          setComments(prev => prev.filter(c => c.id !== commentId));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (!user) return;

    setComments(prev => prev.map((c: any) => {
      if (c.id === commentId) {
        const newLiked = !c.has_liked;
        return { ...c, has_liked: newLiked, likes_count: c.likes_count + (newLiked ? 1 : -1) };
      }
      return { ...c, replies: (c.replies || []).map((r: any) =>
        r.id === commentId ? { ...r, has_liked: !r.has_liked, likes_count: r.likes_count + (!r.has_liked ? 1 : -1) } : r
      )};
    }));

    try {
      const res = await fetch(`${API_BASE}/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        // Revert
        setComments(prev => prev.map((c: any) => {
          if (c.id === commentId) {
            const reverted = !c.has_liked;
            return { ...c, has_liked: reverted, likes_count: c.likes_count + (reverted ? 1 : -1) };
          }
          return { ...c, replies: (c.replies || []).map((r: any) =>
            r.id === commentId ? { ...r, has_liked: !r.has_liked, likes_count: r.likes_count + (!r.has_liked ? 1 : -1) } : r
          )};
        }));
      }
    } catch (e) {
      console.error(e);
      // Revert on error
      setComments(prev => prev.map((c: any) => {
        if (c.id === commentId) {
          const reverted = !c.has_liked;
          return { ...c, has_liked: reverted, likes_count: c.likes_count + (reverted ? 1 : -1) };
        }
        return { ...c, replies: (c.replies || []).map((r: any) =>
          r.id === commentId ? { ...r, has_liked: !r.has_liked, likes_count: r.likes_count + (!r.has_liked ? 1 : -1) } : r
        )};
      }));
    }
  };

  const handleEditComment = async (commentId: number, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/community/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: content.trim() })
      });
      if (res.ok) {
        setEditingCommentId(null);
        setEditCommentText('');
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getFilteredUsernames = () => {
    if (commentMentionSearch === null || commentMentionSearch === undefined || !usernames) return [];
    return usernames.filter((u: any) => 
      u.username.toLowerCase().includes(commentMentionSearch.toLowerCase()) && 
      u.username !== user?.username
    );
  };

  const handleCommentInputChange = (text: string) => {
    setCommentText(text);
    const lastAtIdx = text.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const isStartOrAfterSpace = lastAtIdx === 0 || text[lastAtIdx - 1] === ' ' || text[lastAtIdx - 1] === '\n';
      const textAfterAt = text.substring(lastAtIdx + 1);
      if (isStartOrAfterSpace && !textAfterAt.includes(' ')) {
        setCommentMentionSearch(textAfterAt);
        setActiveSuggestionIdx(0);
        return;
      }
    }
    setCommentMentionSearch(null);
  };

  const handleSelectCommentMention = (targetUsername: string) => {
    const lastAtIdx = commentText.lastIndexOf('@');
    if (lastAtIdx === -1) return;
    const beforeAt = commentText.substring(0, lastAtIdx);
    const updatedText = beforeAt + `@${targetUsername} `;
    setCommentText(updatedText);
    setCommentMentionSearch(null);
    setTimeout(() => {
      document.getElementById(`comment-input-${postId}`)?.focus();
    }, 50);
  };

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

  if (!isExpanded) return null;

  return (
    <div className="mt-4 pt-4 border-t border-zinc-900/60 flex flex-col gap-3.5 overflow-hidden text-left">
      {loading ? (
        <div className="flex items-center justify-center py-4 text-xs text-zinc-500 gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange" />
          <span>Loading comments...</span>
        </div>
      ) : (
        <>
          {comments.length === 0 ? (
            <p className="text-zinc-500 text-[11px] font-medium py-3 text-center">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((c: any) => {
              const isCommentHighlighted = deepLinkTarget?.type === 'comment' && deepLinkTarget?.commentId === c.id;
              return (
                <HighlightWrapper key={c.id} isHighlighted={isCommentHighlighted} className="w-full rounded-xl">
                  <div 
                    id={`comment-${c.id}`}
                    className="bg-zinc-900/30 rounded-xl p-3.5 border border-zinc-900/40 relative group/comment"
                    onContextMenu={(e) => {
                      if (user) {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, commentUserId: c.user_id, commentUsername: c.username });
                      }
                    }}
                  >
                    <div className="flex gap-3 items-start">
                      <UserAvatar username={c.username} avatarUrl={c.avatar_url} equippedFrame={c.equipped_frame} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-brand-orange">@{c.username}</span>
                            <span className="text-[8px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md">{c.batch}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] text-zinc-500 font-semibold">
                              {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                            {user && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContextMenu({ x: e.clientX, y: e.clientY, commentId: c.id, content: c.content, commentUserId: c.user_id, commentUsername: c.username });
                                }}
                                className="text-zinc-500 hover:text-white cursor-pointer opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                title="More Options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {editingCommentId === c.id ? (
                          <div className="my-2 flex flex-col gap-2">
                            <textarea
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-orange text-white rounded-lg p-2 text-xs outline-none resize-none"
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-end gap-1.5">
                              <button className="border border-zinc-800 hover:bg-zinc-900 text-white font-bold text-[9px] py-1.5 px-3 rounded-lg cursor-pointer transition-all" onClick={() => setEditingCommentId(null)}>Cancel</button>
                              <button className="bg-brand-orange text-black font-extrabold text-[9px] py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-md" onClick={() => handleEditComment(c.id, editCommentText)}>Save</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-200 font-medium leading-relaxed mb-2 pr-1">{renderTextWithMentions(c.content)}</p>
                        )}

                        <div className="flex gap-4 items-center">
                          <button 
                            className={`flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${c.has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`}
                            onClick={() => handleCommentLike(c.id)}
                          >
                            <Heart className={`w-3 h-3 ${c.has_liked ? 'fill-current' : ''}`} /> 
                            <span>{c.likes_count}</span>
                          </button>
                          <button 
                            className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" 
                            onClick={() => {
                              setReplyingToComment(c);
                              document.getElementById(`comment-input-${postId}`)?.focus();
                            }}
                          >
                            <CornerUpLeft className="w-3 h-3" /> 
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nested replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="border-l-2 border-zinc-800/80 pl-3 ml-3 mt-3.5 space-y-3.5 text-left">
                        {c.replies.map((r: any) => {
                          const isReplyHighlighted = deepLinkTarget?.type === 'comment' && deepLinkTarget?.commentId === r.id;
                          return (
                            <HighlightWrapper key={r.id} isHighlighted={isReplyHighlighted} className="w-full rounded-xl">
                              <div id={`comment-${r.id}`} className="flex gap-2.5 items-start group/reply relative">
                                <UserAvatar username={r.username} avatarUrl={r.avatar_url} equippedFrame={r.equipped_frame} size={22} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[11px] font-bold text-zinc-400">@{r.username}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] text-zinc-600 font-semibold">
                                        {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                      </span>
                                      {user && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setContextMenu({ x: e.clientX, y: e.clientY, commentId: r.id, content: r.content, parentId: c.id, commentUserId: r.user_id, commentUsername: r.username });
                                          }}
                                          className="text-zinc-600 hover:text-white cursor-pointer opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                          title="More"
                                        >
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {editingCommentId === r.id ? (
                                    <div className="my-1.5 flex flex-col gap-1.5">
                                      <textarea
                                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-orange text-white rounded-lg p-2 text-[11px] outline-none resize-none"
                                        value={editCommentText}
                                        onChange={(e) => setEditCommentText(e.target.value)}
                                        rows={2}
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <button className="border border-zinc-800 text-white text-[8px] py-1 px-2.5 rounded-md cursor-pointer" onClick={() => setEditingCommentId(null)}>Cancel</button>
                                        <button className="bg-brand-orange text-black font-extrabold text-[8px] py-1 px-2.5 rounded-md cursor-pointer" onClick={() => handleEditComment(r.id, editCommentText)}>Save</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-zinc-300 font-medium leading-relaxed pr-1 mt-0.5">{renderTextWithMentions(r.content)}</p>
                                  )}

                                  <div className="flex gap-2 items-center mt-1">
                                    <button 
                                      className={`flex items-center gap-1 text-[9px] font-bold cursor-pointer transition-colors ${r.has_liked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`}
                                      onClick={() => handleCommentLike(r.id)}
                                    >
                                      <Heart className={`w-2.5 h-2.5 ${r.has_liked ? 'fill-current' : ''}`} /> 
                                      <span>{r.likes_count}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </HighlightWrapper>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </HighlightWrapper>
              );
            })
          )}
          
          {/* Comment composer form */}
          {user ? (
            <div className="relative mt-2 border-t border-zinc-900/40 pt-3">
              {replyingToComment && (
                <div className="flex items-center justify-between bg-brand-orange/5 border-l-2 border-brand-orange rounded-xl px-3 py-2 mb-3 text-xs font-bold text-brand-orange">
                  <div className="flex items-center gap-1.5">
                    <CornerUpLeft className="w-3.5 h-3.5 shrink-0" />
                    <span>Replying to <strong>@{replyingToComment.username}</strong></span>
                  </div>
                  <button 
                    onClick={() => setReplyingToComment(null)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              {/* Mention suggestions */}
              {commentMentionSearch !== null && usernames && usernames.length > 0 && (() => {
                const suggestionsList = getFilteredUsernames();
                if (suggestionsList.length === 0) return null;
                return (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 max-h-[160px] overflow-y-auto z-10 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-2xl backdrop-blur-md">
                    {suggestionsList.map((u: any, idx: number) => (
                      <div
                        key={u.username}
                        onClick={() => handleSelectCommentMention(u.username)}
                        onMouseEnter={() => setActiveSuggestionIdx(idx)}
                        className={`flex items-center gap-2 p-2 cursor-pointer rounded-lg text-left text-xs font-bold transition-colors ${
                          idx === activeSuggestionIdx ? 'bg-brand-orange text-black font-extrabold' : 'hover:bg-brand-orange/10 text-white'
                        }`}
                      >
                        <UserAvatar username={u.username} avatarUrl={u.avatar_url} equippedFrame={u.equipped_frame} size={20} />
                        <span>@{u.username}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="flex gap-2.5 items-end">
                <textarea
                  id={`comment-input-${postId}`}
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl px-3 py-2 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[34px] maxHeight-[120px]"
                  placeholder={replyingToComment ? `Reply to @${replyingToComment.username}...` : "Write a comment..."}
                  value={commentText}
                  onChange={(e) => {
                    handleCommentInputChange(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    const suggestionsList = getFilteredUsernames();
                    const hasSuggestions = suggestionsList.length > 0;

                    if (hasSuggestions) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveSuggestionIdx(prev => (prev + 1) % suggestionsList.length);
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveSuggestionIdx(prev => (prev - 1 + suggestionsList.length) % suggestionsList.length);
                        return;
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const selectedUser = suggestionsList[activeSuggestionIdx];
                        if (selectedUser) {
                          handleSelectCommentMention(selectedUser.username);
                        }
                        return;
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setCommentMentionSearch(null);
                        return;
                      }
                    }

                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (commentText.trim()) {
                        submitComment(replyingToComment?.id);
                      }
                    }
                  }}
                  rows={1}
                />
                <button 
                  className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-[10px] h-[34px] px-4 rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center disabled:opacity-50"
                  onClick={() => {
                    submitComment(replyingToComment?.id);
                  }}
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    replyingToComment ? 'Reply' : 'Post'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-[10px] font-bold text-center py-2 uppercase tracking-wide">
              Please login to post.
            </div>
          )}
        </>
      )}

      {/* Context Menu for comments */}
      <AnimatePresence>
        {contextMenu && (
          <div className="fixed inset-0 z-[999]" onClick={() => setContextMenu(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
              }}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-1 flex flex-col gap-0.5 min-w-[130px] shadow-2xl z-[1000]"
              onClick={(e) => e.stopPropagation()}
            >
              {user && (contextMenu.commentUserId === user.id || contextMenu.commentUsername === user.username || user.role === 'moderator' || user.role === 'admin' || user.role === 'owner') ? (
                <>
                  <button
                    onClick={() => {
                      setEditingCommentId(contextMenu.commentId);
                      setEditCommentText(contextMenu.content);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-white rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Edit Comment</span>
                  </button>
                  <button
                    onClick={() => {
                      deleteComment(contextMenu.commentId, !!contextMenu.parentId, contextMenu.parentId);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-red-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Delete Comment</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleOpenReportModal && handleOpenReportModal('comment', contextMenu.commentId, contextMenu.content);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-amber-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Report Comment</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom inline edit form overlay */}
      <AnimatePresence>
        {editingCommentId && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-850 p-4 z-[9000] shadow-2xl backdrop-blur-md flex gap-2.5 items-end"
          >
            <textarea
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-brand-orange text-white rounded-xl p-3 text-xs outline-none resize-none"
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              rows={2}
              autoFocus
            />
            <button 
              className="border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
              onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
            >
              Cancel
            </button>
            <button
              className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2.5 px-4 rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-orange-glow"
              onClick={() => handleEditComment(editingCommentId, editCommentText)}
              disabled={!editCommentText.trim()}
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
