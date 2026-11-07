import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, MessageCircle, Heart, Share2, AlertCircle } from 'lucide-react';
import { PostCard } from '../components/home/PostCard';
import { communityService } from '../services/communityService';
import { useNotifications } from '../context/NotificationContext';
import { copyToClipboard } from '../utils/helpers';

interface PostDetailProps {
  postId: number | null;
  user: any;
  usernames?: any[];
  setCurrentPage: (page: string) => void;
  showToast: (msg: string) => void;
  handleLikePost: (postId: number) => void;
  handleDeletePost: (postId: number) => void;
  handleCancelPostRevision: (postId: number) => void;
  handleEditPost: (postId: number, content: string, imageUrl: string) => Promise<void>;
  handleUploadImage: (file: File) => Promise<string | null>;
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;
  triggerXpPopup?: (amount: number) => void;
  onOpenComments: (postId: number, authorName?: string) => void;
  communityPosts?: any[];
}

export const PostDetail: React.FC<PostDetailProps> = ({
  postId,
  user,
  usernames = [],
  setCurrentPage,
  showToast,
  handleLikePost,
  handleDeletePost,
  handleCancelPostRevision,
  handleEditPost,
  handleUploadImage,
  handleOpenReportModal,
  triggerXpPopup,
  onOpenComments,
  communityPosts = []
}) => {
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { deepLinkTarget, setDeepLinkTarget } = useNotifications();

  // Load post from communityPosts cache first, or fetch from backend API
  useEffect(() => {
    if (!postId) {
      setError('Invalid post link');
      setLoading(false);
      return;
    }

    const cached = communityPosts.find((p: any) => p.id === postId);
    if (cached) {
      setPost(cached);
      setLoading(false);
    }

    // Always fetch fresh single post details
    const fetchSinglePost = async () => {
      try {
        const token = localStorage.getItem('token') || undefined;
        const res = await communityService.fetchPostById(postId, token);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          setError(null);
        } else if (!cached) {
          setError('Post not found or has been removed.');
        }
      } catch (e) {
        console.error('Error loading post:', e);
        if (!cached) {
          setError('Failed to load post. Please check your network connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSinglePost();
  }, [postId, communityPosts]);

  const handleBackToFeed = () => {
    setCurrentPage('home');
  };

  const handleShare = async (id: number) => {
    const ref = user?.username ? `?ref=${user.username}` : '';
    const shareUrl = `${window.location.origin}/post/${id}${ref}`;
    const shareTitle = post?.title || 'LehPhysio Community Post';
    const shareText = post?.content ? `${post.content.substring(0, 100)}...` : 'Check out this post on LehPhysio!';

    // Always copy link to clipboard reliably
    try {
      await copyToClipboard(shareUrl);
      showToast('Post link copied to clipboard! 🔗');
    } catch {
      showToast('Post link copied to clipboard! 🔗');
    }

    // Open native share sheet on mobile or desktop browsers if supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch {
        // User cancelled share
      }
    }
  };

  return (
    <div className="space-y-6 xl:pt-6 max-w-3xl mx-auto px-4">
      {/* Top Navigation Bar with Back Button */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={handleBackToFeed}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-white font-extrabold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 text-brand-orange group-hover:-translate-x-1 transition-transform" />
          <span>Back to Feed / العودة للرئيسية</span>
        </button>

        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          Post Details
        </span>
      </div>

      {/* Loading Skeleton */}
      {loading && !post && (
        <div className="glass-card p-6 space-y-4 border border-zinc-800/80 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800" />
            <div className="space-y-2">
              <div className="w-28 h-3.5 rounded bg-zinc-800" />
              <div className="w-16 h-2.5 rounded bg-zinc-800/60" />
            </div>
          </div>
          <div className="space-y-2 py-4">
            <div className="w-full h-3 rounded bg-zinc-800/80" />
            <div className="w-4/5 h-3 rounded bg-zinc-800/80" />
            <div className="w-2/3 h-3 rounded bg-zinc-800/80" />
          </div>
          <div className="w-full h-48 rounded-xl bg-zinc-800/40" />
          <div className="flex justify-around pt-3 border-t border-zinc-800">
            <div className="w-12 h-4 rounded bg-zinc-800" />
            <div className="w-12 h-4 rounded bg-zinc-800" />
            <div className="w-12 h-4 rounded bg-zinc-800" />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="glass-card p-10 text-center space-y-4 border border-red-500/20 bg-red-950/5">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-white">{error}</h3>
          <p className="text-xs text-zinc-400">
            The post you're looking for might have been deleted, or the link is incorrect.
          </p>
          <button
            onClick={handleBackToFeed}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs px-5 py-2.5 rounded-full cursor-pointer hover:shadow-orange-glow transition-all"
          >
            Return to Community Feed
          </button>
        </div>
      )}

      {/* Post View */}
      {post && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <PostCard
            post={post}
            user={user}
            usernames={usernames}
            deepLinkTarget={deepLinkTarget}
            setDeepLinkTarget={setDeepLinkTarget}
            handleLikePost={handleLikePost}
            handleDeletePost={(id) => {
              handleDeletePost(id);
              setCurrentPage('home');
            }}
            handleCancelPostRevision={handleCancelPostRevision}
            handleSharePost={handleShare}
            handleEditPost={handleEditPost}
            handleUploadImage={handleUploadImage}
            showToast={showToast}
            handleOpenReportModal={handleOpenReportModal}
            triggerXpPopup={triggerXpPopup}
            onOpenComments={(id) => onOpenComments(id, post.username)}
          />

          {/* Quick CTA to open comments if not already open */}
          <div className="glass-card p-4 flex items-center justify-between border border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
              <MessageCircle className="w-4 h-4 text-brand-orange" />
              <span>Have something to say?</span>
            </div>
            <button
              onClick={() => onOpenComments(post.id, post.username)}
              className="bg-brand-orange/15 hover:bg-brand-orange/25 border border-brand-orange/30 text-brand-orange font-black text-xs px-4 py-2 rounded-xl cursor-pointer transition-all hover:scale-102 active:scale-98"
            >
              Open Comments ({post.comments_count || 0}) 💬
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
