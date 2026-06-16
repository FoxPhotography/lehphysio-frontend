import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HighlightWrapper } from '../notifications/HighlightWrapper';
import { UserAvatar } from '../UserAvatar';
import { CommentsSection } from './CommentsSection';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  X, 
  Clock, 
  XCircle, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

const stripEmojis = (str: string) => {
  if (!str) return '';
  return str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
};

interface PostCardProps {
  post: any;
  user: any;
  usernames?: any[];
  deepLinkTarget: any;
  setDeepLinkTarget: (val: any) => void;
  handleLikePost: (postId: number) => void;
  handleDeletePost: (postId: number) => void;
  handleCancelPostRevision: (postId: number) => void;
  handleSharePost: (postId: number) => void;
  handleEditPost: (postId: number, content: string, imageUrl: string) => Promise<void>;
  handleUploadImage: (file: File) => Promise<string | null>;
  showToast: (msg: string) => void;
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;
  triggerXpPopup?: (amount: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  user,
  usernames = [],
  deepLinkTarget,
  setDeepLinkTarget,
  handleLikePost,
  handleDeletePost,
  handleCancelPostRevision,
  handleSharePost,
  handleEditPost,
  handleUploadImage,
  showToast,
  handleOpenReportModal,
  triggerXpPopup,
}) => {
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [openPostMenu, setOpenPostMenu] = useState(false);
  
  // Post editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostImageUrl, setEditPostImageUrl] = useState('');
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  // Lightbox
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Double tap like animations
  const [floatingHearts, setFloatingHearts] = useState<{ id: number }[]>([]);
  const heartIdCounter = useRef(0);

  // Click coordinator
  const clickTimeoutRef = useRef<any>(null);
  const lastClickTimeRef = useRef<number>(0);

  const isPostHighlighted = deepLinkTarget?.type === 'post' && deepLinkTarget?.postId === post.id;
  const isAuthor = user && (post.user_id === user.id || post.username === user.username);
  const hasPendingRevision = isAuthor && post.edit_draft;
  const isPendingPost = post.pending === true || post.status === 'pending';
  const isRejectedPost = post.status === 'rejected';

  // Auto-expand comments if deep-linked to a comment on this post
  useEffect(() => {
    if (deepLinkTarget?.postId === post.id && deepLinkTarget?.type === 'comment') {
      setIsCommentsExpanded(true);
    }
  }, [deepLinkTarget, post.id]);

  const handleImageClickCoord = (imageUrl: string) => {
    const now = Date.now();
    const lastClick = lastClickTimeRef.current || 0;
    
    if (now - lastClick < 300) {
      // Double tap/click detected!
      lastClickTimeRef.current = 0; // Reset
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      
      // Perform Like
      handleLikePost(post.id);
      
      // Heart animation
      const hid = ++heartIdCounter.current;
      setFloatingHearts(prev => [...prev, { id: hid }]);
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== hid));
      }, 800);
    } else {
      // First tap/click
      lastClickTimeRef.current = now;
      
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        // Perform Single tap action (expand/lightbox)
        setActiveLightboxImg(imageUrl);
      }, 250);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingEditImage(true);
    const url = await handleUploadImage(e.target.files[0]);
    setIsUploadingEditImage(false);
    if (url) {
      setEditPostImageUrl(url);
    }
  };

  const handleSaveEdit = async () => {
    if (!editPostContent.trim()) return;
    await handleEditPost(post.id, editPostContent, editPostImageUrl);
    setIsEditing(false);
  };

  return (
    <HighlightWrapper isHighlighted={isPostHighlighted} className="rounded-2xl">
      <div 
        id={`post-${post.id}`} 
        className={`glass-card p-5 text-left relative transition-all ${
          hasPendingRevision || isPendingPost 
            ? 'border-dashed border-zinc-700/60' 
            : isRejectedPost 
            ? 'border-red-500/25 bg-red-950/5' 
            : 'border-zinc-900/60'
        }`}
        style={{ opacity: (isPendingPost || hasPendingRevision) ? 0.6 : 1 }}
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-white">{post.username}</span>
                <span className="text-[9px] font-bold bg-brand-orange/15 text-brand-orange px-2 py-0.5 rounded-full">
                  {post.batch}
                </span>
                {hasPendingRevision && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full">
                    Pending Review
                  </span>
                )}
                {isPendingPost && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Pending Approval</span>
                  </span>
                )}
                {isRejectedPost && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <XCircle className="w-2.5 h-2.5" />
                    <span>Rejected</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold mt-0.5 block">
                {stripEmojis(post.rank.name_en)} · {new Date(post.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasPendingRevision && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelPostRevision(post.id);
                }}
                className="border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-[10px] py-1.5 px-3 rounded-xl cursor-pointer active:scale-95 transition-all"
              >
                Cancel Edit
              </button>
            )}
            {/* 3-dot post options menu */}
            {user && !post.pending && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPostMenu(!openPostMenu);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900/40 cursor-pointer transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {openPostMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenPostMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        className="absolute right-0 top-9 z-20 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 flex flex-col gap-1 min-w-[120px] shadow-2xl"
                      >
                        {(post.user_id === user.id || post.username === user.username || user.role === 'admin' || user.role === 'owner') ? (
                          <>
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setEditPostContent(post.content);
                                setEditPostImageUrl(post.image_url || '');
                                setOpenPostMenu(false);
                              }}
                              className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-brand-amber rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                handleDeletePost(post.id);
                                setOpenPostMenu(false);
                              }}
                              className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-red-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              if (handleOpenReportModal) {
                                handleOpenReportModal('post', post.id, post.content);
                              }
                              setOpenPostMenu(false);
                            }}
                            className="w-full flex items-center gap-2 p-2.5 font-bold text-xs text-amber-500 rounded-lg cursor-pointer hover:bg-zinc-900/60 text-left transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Report Post</span>
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

        {isEditing ? (
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

            <div className="flex justify-between items-center">
              <label className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{isUploadingEditImage ? 'Uploading...' : 'Change Image'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                  disabled={isUploadingEditImage} 
                />
              </label>

              <div className="flex gap-2">
                <button 
                  className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow" 
                  onClick={handleSaveEdit}
                  disabled={!editPostContent.trim() || isUploadingEditImage}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDoubleClick={() => {
              handleLikePost(post.id);
              const hid = ++heartIdCounter.current;
              setFloatingHearts(prev => [...prev, { id: hid }]);
              setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== hid)), 800);
            }}
            className="relative cursor-pointer select-none"
          >
            {post.title && (
              <h3 className="text-sm font-black text-white mt-4 mb-2">
                {post.title}
              </h3>
            )}

            <p className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed mt-3 whitespace-pre-wrap">
              {post.content}
            </p>

            {post.image_url && (
              <div 
                className="mt-4 rounded-xl overflow-hidden border border-zinc-900 bg-zinc-900/40 max-h-[300px] cursor-pointer relative group"
                onDoubleClick={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClickCoord(post.image_url);
                }}
              >
                <img 
                  src={post.image_url} 
                  alt="Post content" 
                  className="w-full h-full object-contain max-h-[300px] group-hover:scale-[1.01] transition-transform duration-300" 
                />
              </div>
            )}

            {isPendingPost && (
              <div className="mt-4 p-3 rounded-xl border border-yellow-500/10 bg-yellow-500/[0.02] flex items-center gap-2 text-yellow-400/80 font-bold text-[10px] uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Waiting for moderation approval...</span>
              </div>
            )}

            {isRejectedPost && (
              <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-950/10 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-red-400 font-extrabold text-[10px] uppercase tracking-wide">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Post Rejected</span>
                </div>
                {post.rejection_reason && (
                  <p className="text-xs text-zinc-300 font-medium">
                    <strong>Reason:</strong> {post.rejection_reason}
                  </p>
                )}
                <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                  You can edit this post to fix any issues and resubmit it.
                </p>
              </div>
            )}

            {/* Floating Heart Burst overlay */}
            <AnimatePresence>
              {floatingHearts.map(h => (
                <motion.div 
                  key={h.id} 
                  initial={{ opacity: 0, scale: 0.3, y: 30 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.4, 1.2, 0.9], y: -80 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 pointer-events-none z-30 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                >
                  <Heart className="w-16 h-16 fill-current" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Actions row */}
        <div className="flex gap-6 mt-4 pt-3.5 border-t border-zinc-900/60">
          <button 
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${post.isLiked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'} ${post.pending ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={() => {
              if (post.pending) return;
              handleLikePost(post.id);
            }}
            disabled={post.pending}
          >
            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} /> 
            <span>{post.likes_count}</span>
          </button>
          <button 
            className={`flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer ${post.pending ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={() => {
              if (post.pending) return;
              setIsCommentsExpanded(!isCommentsExpanded);
            }}
            disabled={post.pending}
          >
            <MessageCircle className="w-4 h-4" /> 
            <span>{post.comments_count || 0}</span>
          </button>
          <button 
            className={`flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer ${post.pending ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={() => {
              if (post.pending) return;
              handleSharePost(post.id);
            }}
            disabled={post.pending}
          >
            <Share2 className="w-4 h-4" /> 
            <span>{post.shares_count || 0}</span>
          </button>
        </div>

        {/* Expandable comments thread list */}
        <CommentsSection
          postId={post.id}
          user={user}
          usernames={usernames}
          deepLinkTarget={deepLinkTarget}
          setDeepLinkTarget={setDeepLinkTarget}
          triggerXpPopup={triggerXpPopup}
          showToast={showToast}
          handleOpenReportModal={handleOpenReportModal}
          isExpanded={isCommentsExpanded}
        />
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
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </HighlightWrapper>
  );
};
