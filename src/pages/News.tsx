import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '../components/UserAvatar';
import { 
  ArrowLeft,
  Image as ImageIcon, 
  Loader2, 
  Send, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Heart, 
  MessageCircle, 
  Share2, 
  X, 
  CornerUpLeft,
  Check,
  Zap,
  Sparkles,
  Volume2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

interface NewsProps {
  user: any;
  newsPosts: any[];
  handleLikePost: (id: number) => void;
  handleDeletePost: (id: number) => void;
  handleSharePost: (id: number) => void;
  handleUploadImage: (file: File) => Promise<string | null>;
  handleEditPost: (id: number, content: string, imageUrl: string) => Promise<void>;
  setCurrentPage: (page: string) => void;
  showToast: (msg: string) => void;
  equippedFrame?: string;
}

const stripEmojis = (str: string) => {
  if (!str) return '';
  return str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
};

export const News: React.FC<NewsProps> = ({
  user,
  newsPosts = [],
  handleLikePost,
  handleDeletePost,
  handleSharePost,
  handleUploadImage,
  handleEditPost,
  setCurrentPage,
  showToast,
  equippedFrame
}) => {
  // Composer states (only for Admin publishing news directly from News Page)
  const [newPostContent, setNewPostContent] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Post editing states
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostImageUrl, setEditPostImageUrl] = useState('');
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  // 3-dot post options menu
  const [openPostMenu, setOpenPostMenu] = useState<number | null>(null);

  // Expandable Comments panel states
  const [expandedComments, setExpandedComments] = useState<{[key: number]: any[]}>({});
  const [commentsLoading, setCommentsLoading] = useState<{[key: number]: boolean}>({});
  const [newCommentTexts, setNewCommentTexts] = useState<{[key: number]: string}>({});
  const [replyingToComment, setReplyingToComment] = useState<{[key: number]: any | null}>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{[key: number]: boolean}>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; commentId: number; content: string; postId: number; parentId?: number } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Lightbox & image zoom state
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Click coordinator to avoid conflict between single tap (zoom) and double tap (like)
  const clickTimeoutRef = useRef<{[key: number]: any}>({});
  const lastClickTimeRef = useRef<{ [key: number]: number }>({});

  const handleImageClickCoord = (postId: number, imageUrl: string) => {
    const now = Date.now();
    const lastClick = lastClickTimeRef.current[postId] || 0;
    
    if (now - lastClick < 300) {
      // Double tap/click detected!
      lastClickTimeRef.current[postId] = 0; // Reset
      if (clickTimeoutRef.current[postId]) {
        clearTimeout(clickTimeoutRef.current[postId]);
        delete clickTimeoutRef.current[postId];
      }
      
      // Perform Like
      handleLikePost(postId);
      
      // Heart animation
      const hid = ++heartIdCounter.current;
      setFloatingHearts(prev => [...prev, { id: hid, postId }]);
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== hid));
      }, 800);
    } else {
      // First tap/click
      lastClickTimeRef.current[postId] = now;
      
      // Clear any existing timeout for this post
      if (clickTimeoutRef.current[postId]) {
        clearTimeout(clickTimeoutRef.current[postId]);
      }
      
      clickTimeoutRef.current[postId] = setTimeout(() => {
        delete clickTimeoutRef.current[postId];
        // Perform Single tap action (expand/lightbox)
        setActiveLightboxImg(imageUrl);
      }, 250); // 250ms window
    }
  };

  // Double-tap to like
  const lastTapRef = useRef<{postId: number; time: number} | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{id: number; postId: number}[]>([]);
  const heartIdCounter = useRef(0);

  const handleDoubleTapLike = (postId: number) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.postId === postId && now - lastTapRef.current.time < 300) {
      lastTapRef.current = null;
      handleLikePost(postId);
      
      const hid = ++heartIdCounter.current;
      setFloatingHearts(prev => [...prev, { id: hid, postId }]);
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== hid));
      }, 800);
    } else {
      lastTapRef.current = { postId, time: now };
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    const url = await handleUploadImage(file);
    setIsUploadingImage(false);
    if (url) {
      setUploadedImageUrl(url);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || isPosting) return;
    setIsPosting(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: '', content: newPostContent, image_url: uploadedImageUrl, is_news: true })
      });
      const data = await res.json();
      if (res.ok) {
        setNewPostContent('');
        setUploadedImageUrl('');
        showToast('Official News published successfully! 📢');
        // Refresh page newsposts in parent via a reload or window event or simple navigation
        window.dispatchEvent(new CustomEvent('news_published'));
      } else {
        showToast(data.error || 'Failed to publish news.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error publishing news.');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleComments = async (postId: number) => {
    if (expandedComments[postId] !== undefined) {
      setExpandedComments(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
      return;
    }

    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setExpandedComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const submitComment = async (postId: number, parentId?: number) => {
    const text = newCommentTexts[postId]?.trim();
    if (!text || !user) return;
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text, parent_id: parentId })
      });
      const data = await res.json();
      if (res.ok) {
        setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));
        setReplyingToComment(prev => ({ ...prev, [postId]: null }));
        
        // Refresh comments list
        const cRes = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`);
        if (cRes.ok) {
          const cData = await cRes.json();
          setExpandedComments(prev => ({ ...prev, [postId]: cData }));
        }
        showToast('Comment published! 📝');
      } else {
        showToast(data.error || 'Failed to comment.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const deleteComment = async (postId: number, commentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Comment deleted.');
        // Refresh comments list
        const cRes = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`);
        if (cRes.ok) {
          const cData = await cRes.json();
          setExpandedComments(prev => ({ ...prev, [postId]: cData }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 xl:pt-6 pb-6 space-y-6 md:pb-24">
      {/* Premium Glass Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-zinc-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl -z-10"></div>
        <div className="flex items-center gap-4 text-left w-full md:w-auto">
          <button 
            onClick={() => setCurrentPage('home')}
            className="w-10 h-10 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange shrink-0 animate-pulse" />
              <span>الأخبار والبيانات الرسمية</span>
            </h1>
            <p className="text-xs text-zinc-500 font-semibold mt-1">المصدر المعتمد لجميع إعلانات منصة @LehPhysio</p>
          </div>
        </div>
      </div>

      {/* Admin Quick Post Composer */}
      {isAdmin && (
        <form 
          onSubmit={handleSubmitPost} 
          className="glass-card p-5 flex gap-4 items-start text-left border border-zinc-900/60 relative"
        >
          <div className="absolute -top-3 left-6 bg-brand-orange/10 border border-brand-orange/20 rounded-full px-3 py-0.5 text-[9px] font-extrabold text-brand-orange uppercase tracking-wider flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 animate-bounce" />
            <span>Admin Broadcast</span>
          </div>

          <UserAvatar
            username={user.username}
            avatarUrl={user.avatar_url}
            equippedFrame={user.equipped_frame}
            size={40}
          />
          <div className="flex-1 space-y-3">
            <textarea
              className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3.5 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[90px]"
              placeholder="اكتب إعلاناً رسمياً جديداً يظهر باسم LehPhysio..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              maxLength={1000}
              rows={3}
            />

            {uploadedImageUrl && (
              <div className="relative rounded-xl overflow-hidden max-w-[200px] border border-zinc-800">
                <img src={uploadedImageUrl} alt="Upload preview" className="w-full max-h-[140px] object-cover" />
                <button
                  type="button"
                  onClick={() => setUploadedImageUrl('')}
                  className="absolute top-2 right-2 bg-black/80 hover:bg-black/90 text-white border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-row items-center justify-between w-full pt-2 gap-4">
              <label className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shrink-0">
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{isUploadingImage ? 'Uploading...' : 'Add Banner'}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isUploadingImage} />
              </label>
              
              <button 
                type="submit" 
                className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow flex items-center gap-1.5 disabled:opacity-50 shrink-0" 
                disabled={!newPostContent.trim() || isUploadingImage || isPosting}
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>Publish</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* News Feed */}
      <div className="space-y-4">
        {newsPosts.length === 0 ? (
          <div className="glass-card p-12 text-center border border-zinc-900/60">
            <p className="text-zinc-500 text-sm font-semibold">لا توجد أخبار أو إعلانات رسمية حالياً.</p>
          </div>
        ) : (
          newsPosts.map((post: any) => (
            <div 
              key={post.id} 
              id={`post-${post.id}`} 
              className="glass-card p-5 text-left border border-brand-orange/5 hover:border-brand-orange/15 transition-all duration-300 relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <UserAvatar
                    username={post.username}
                    avatarUrl={post.avatar_url}
                    equippedFrame={post.equipped_frame}
                    size={40}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{post.username}</span>
                      <span className="text-[9px] font-bold bg-brand-orange/15 text-brand-orange px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 fill-current shrink-0" />
                        <span>{post.batch}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold mt-0.5 block">
                      {stripEmojis(post.rank.name_en)} · {new Date(post.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {/* Admin/Owner controls */}
                {user && (user.role === 'admin' || user.role === 'owner') && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenPostMenu(openPostMenu === post.id ? null : post.id);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900/40 cursor-pointer transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {openPostMenu === post.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          className="absolute right-0 top-9 z-20 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 flex flex-col gap-1 min-w-[120px] shadow-2xl"
                        >
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditPostContent(post.content);
                              setEditPostImageUrl(post.image_url || '');
                              setOpenPostMenu(null);
                            }}
                            className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-brand-amber rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              handleDeletePost(post.id);
                              setOpenPostMenu(null);
                            }}
                            className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-red-500 rounded-lg cursor-pointer hover:bg-red-500/10 text-left transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              {editingPostId === post.id ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3.5 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[90px]"
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                  />

                  {editPostImageUrl && (
                    <div className="relative rounded-xl overflow-hidden max-w-[200px] border border-zinc-800">
                      <img src={editPostImageUrl} alt="Edit preview" className="w-full max-h-[140px] object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditPostImageUrl('')}
                        className="absolute top-2 right-2 bg-black/80 hover:bg-black/90 text-white border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-row items-center justify-between w-full gap-4">
                    <label className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shrink-0">
                      <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{isUploadingEditImage ? 'Uploading...' : 'Change Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={async (e) => {
                          if (!e.target.files || e.target.files.length === 0) return;
                          setIsUploadingEditImage(true);
                          const url = await handleUploadImage(e.target.files[0]);
                          setIsUploadingEditImage(false);
                          if (url) {
                            setEditPostImageUrl(url);
                          }
                        }} 
                        className="hidden" 
                        disabled={isUploadingEditImage} 
                      />
                    </label>

                    <div className="flex gap-2">
                      <button 
                        className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
                        onClick={() => setEditingPostId(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow" 
                        onClick={async () => {
                          if (!editPostContent.trim()) return;
                          await handleEditPost(post.id, editPostContent, editPostImageUrl);
                          setEditingPostId(null);
                        }}
                        disabled={!editPostContent.trim() || isUploadingEditImage}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="mt-4 text-zinc-100 text-xs md:text-sm font-semibold leading-relaxed break-words relative cursor-pointer"
                  onDoubleClick={() => { handleLikePost(post.id); const hid = ++heartIdCounter.current; setFloatingHearts(prev => [...prev, { id: hid, postId: post.id }]); setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== hid)), 800); }}
                >
                  {/* Floating hearts container */}
                  <AnimatePresence>
                    {floatingHearts.filter(h => h.postId === post.id).map(h => (
                      <motion.div
                        key={h.id}
                        initial={{ opacity: 1, scale: 0, y: 0 }}
                        animate={{ opacity: 0, scale: 2.2, y: -60 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center pointer-events-none z-10"
                      >
                        <Heart className="w-12 h-12 fill-red-500 text-red-500 drop-shadow-heart shrink-0" />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {post.title && <h3 className="text-zinc-100 font-extrabold text-sm md:text-base mb-2">{post.title}</h3>}
                  <p className="whitespace-pre-wrap">{post.content}</p>

                  {post.image_url && (
                    <div 
                      className="mt-4 rounded-xl overflow-hidden border border-zinc-900/60 max-h-[380px] bg-zinc-950 cursor-pointer relative group"
                      onDoubleClick={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClickCoord(post.id, post.image_url);
                      }}
                    >
                      <img 
                        src={post.image_url} 
                        alt="News attachment" 
                        className="w-full h-full object-contain max-h-[380px] group-hover:scale-[1.01] transition-transform duration-300" 
                      />

                    </div>
                  )}
                </div>
              )}

              {/* Interaction Panel */}
              <div className="flex gap-6 items-center mt-5 pt-3.5 border-t border-zinc-900/60">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer border-none bg-transparent outline-none ${
                    post.isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span>{post.likes_count}</span>
                </button>

                <button
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer border-none bg-transparent outline-none ${
                    expandedComments[post.id] !== undefined ? 'text-brand-orange' : 'text-zinc-500 hover:text-brand-orange'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments_count}</span>
                </button>

                <button
                  onClick={() => handleSharePost(post.id)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-brand-orange transition-colors cursor-pointer border-none bg-transparent outline-none"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{post.shares_count}</span>
                </button>
              </div>

              {/* Collapsible Comments Section */}
              <AnimatePresence>
                {expandedComments[post.id] !== undefined && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-zinc-900/60 space-y-4"
                  >
                    {commentsLoading[post.id] ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-brand-orange" />
                      </div>
                    ) : (
                      <>
                        {/* Comments list */}
                        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                          {expandedComments[post.id]?.length === 0 ? (
                            <p className="text-zinc-500 text-[10px] font-bold text-center py-2">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                          ) : (
                            expandedComments[post.id]?.map((comment: any) => (
                              <div key={comment.id} className="flex gap-2.5 items-start text-left bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-900/30">
                                <UserAvatar
                                  username={comment.username}
                                  avatarUrl={comment.avatarUrl || comment.avatar_url}
                                  equippedFrame={comment.equipped_frame || 'none'}
                                  size={28}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-extrabold text-[11px] text-zinc-200">{comment.username}</span>
                                      <span className="text-[8px] bg-zinc-900 text-zinc-400 font-bold px-1.5 py-0.5 rounded ml-2 uppercase">
                                        {comment.batch}
                                      </span>
                                    </div>
                                    
                                    {user && (comment.username === user.username || user.role === 'admin' || user.role === 'owner') && (
                                      <button 
                                        onClick={() => deleteComment(post.id, comment.id)}
                                        className="text-zinc-600 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors p-0.5"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-zinc-300 text-[11px] font-semibold mt-1 break-words">{comment.content}</p>
                                  <span className="text-[8px] text-zinc-500 font-bold mt-1 block">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Comment input composer */}
                        {user && (
                          <div className="flex gap-2.5 items-center">
                            <input
                              type="text"
                              value={newCommentTexts[post.id] || ''}
                              onChange={(e) => setNewCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="اكتب تعليقاً..."
                              className="flex-1 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 outline-none transition-all duration-200"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') submitComment(post.id);
                              }}
                            />
                            <button
                              onClick={() => submitComment(post.id)}
                              disabled={commentSubmitting[post.id] || !newCommentTexts[post.id]?.trim()}
                              className="bg-brand-orange hover:bg-brand-orange/90 text-black font-black text-xs py-2 px-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50 shrink-0"
                            >
                              {commentSubmitting[post.id] ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Immersive Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightboxImg(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[99999] flex items-center justify-center p-4 cursor-zoom-out"
          >
            {/* Close button */}
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:bg-zinc-800 active:scale-95 z-[999999]"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              src={activeLightboxImg}
              alt="Expanded preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-zinc-800/40"
              onClick={(e) => e.stopPropagation()} // Stop closing on image click
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
