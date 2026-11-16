import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Newspaper, Send, Volume2 } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { ImageCropModal } from '../components/common/ImageCropModal';
import { PostCard } from '../components/home/PostCard';
import { API_BASE } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

interface NewsProps {
  user: any;
  newsPosts: any[];
  handleLikePost: (id: number) => void;
  handleDeletePost: (id: number) => void;
  handleCancelPostRevision: (id: number) => void;
  handleSharePost: (id: number) => void;
  handleUploadImage: (file: File) => Promise<string | null>;
  handleEditPost: (id: number, content: string, imageUrl: string) => Promise<void>;
  setCurrentPage: (page: string) => void;
  showToast: (msg: string) => void;
  equippedFrame?: string;
  usernames?: any[];
  triggerXpPopup?: (amount: number) => void;
  handleOpenReportModal?: (type: 'post' | 'comment' | 'message', id: number, preview?: string) => void;
  onOpenComments?: (postId: number, authorName?: string) => void;
}

export const News: React.FC<NewsProps> = ({
  user,
  newsPosts = [],
  handleLikePost,
  handleDeletePost,
  handleCancelPostRevision,
  handleSharePost,
  handleUploadImage,
  handleEditPost,
  setCurrentPage,
  showToast,
  usernames = [],
  triggerXpPopup,
  handleOpenReportModal,
  onOpenComments,
}) => {
  const { deepLinkTarget, setDeepLinkTarget } = useNotifications();
  const [newPostContent, setNewPostContent] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('news-image.jpg');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropFileName(file.name);
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCroppedImage = async (file: File) => {
    setIsUploadingImage(true);
    const url = await handleUploadImage(file);
    setIsUploadingImage(false);
    if (url) {
      setUploadedImageUrl(url);
      setCropImageSrc(null);
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: '',
          content: newPostContent.trim(),
          image_url: uploadedImageUrl || null,
          is_news: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'معرفناش ننشر الإعلان.');
        return;
      }
      setNewPostContent('');
      setUploadedImageUrl('');
      showToast('الإعلان اتنشر! 📢');
      window.dispatchEvent(new CustomEvent('news_published'));
    } catch (error) {
      console.error('Error publishing news:', error);
      showToast('حصل خطأ في نشر الإعلان.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 xl:pt-6 space-y-6">
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-zinc-950/40 relative overflow-hidden">
        <div className="absolute top-0 end-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl -z-10" />
        <div className="flex items-center gap-4 text-start w-full md:w-auto">
          <button
            onClick={() => setCurrentPage('home')}
            className="w-10 h-10 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
            aria-label="العودة للرئيسية"
          >
            <span className="text-lg">←</span>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent tracking-tight flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-brand-orange shrink-0" />
              <span>الأخبار والبيانات الرسمية</span>
            </h1>
            <p className="text-xs text-zinc-500 font-semibold mt-1">المصدر المعتمد لجميع إعلانات منصة @LehPhysio</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <form onSubmit={handleSubmitPost} className="glass-card p-5 flex gap-4 items-start text-start border border-zinc-900/60 relative">
          <div className="absolute -top-3 start-6 bg-brand-orange/10 border border-brand-orange/20 rounded-full px-3 py-0.5 text-2xs font-extrabold text-brand-orange uppercase tracking-wider flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5" />
            <span>إعلان من الإدارة</span>
          </div>
          <UserAvatar username={user.username} avatarUrl={user.avatar_url} equippedFrame={user.equipped_frame} size={40} />
          <div className="flex-1 space-y-3">
            <textarea
              className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3.5 text-xs font-semibold placeholder-zinc-500 outline-none transition-all resize-none min-h-[90px]"
              placeholder="اكتب إعلاناً رسمياً جديداً يظهر باسم LehPhysio..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <div className="flex flex-row items-center justify-between w-full pt-2 gap-4">
              <label className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-2xs py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shrink-0">
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{isUploadingImage ? 'بنرفع…' : 'أضف بانر'}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isUploadingImage} />
              </label>
              <button
                type="submit"
                className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                disabled={!newPostContent.trim() || isUploadingImage || isPosting}
              >
                {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="rtl:-scale-x-100 w-3 h-3" />}
                <span>{isPosting ? 'بننشر…' : 'انشر'}</span>
              </button>
            </div>
            {uploadedImageUrl && (
              <img src={uploadedImageUrl} alt="معاينة البانر" className="w-full max-h-40 object-cover rounded-xl border border-zinc-800" />
            )}
          </div>
        </form>
      )}

      <div className="space-y-4">
        {newsPosts.length === 0 ? (
          <div className="glass-card p-12 text-center border border-zinc-900/60">
            <p className="text-zinc-500 text-sm font-semibold">لا توجد أخبار أو إعلانات رسمية حالياً.</p>
          </div>
        ) : (
          newsPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              usernames={usernames}
              deepLinkTarget={deepLinkTarget}
              setDeepLinkTarget={setDeepLinkTarget}
              handleLikePost={handleLikePost}
              handleDeletePost={handleDeletePost}
              handleCancelPostRevision={handleCancelPostRevision}
              handleSharePost={handleSharePost}
              handleEditPost={handleEditPost}
              handleUploadImage={handleUploadImage}
              showToast={showToast}
              handleOpenReportModal={handleOpenReportModal}
              triggerXpPopup={triggerXpPopup}
              onOpenComments={onOpenComments}
            />
          ))
        )}
      </div>
      </div>
      <ImageCropModal
        imageSrc={cropImageSrc}
        fileName={cropFileName}
        onCancel={() => setCropImageSrc(null)}
        onComplete={handleCroppedImage}
      />
    </>
  );
};
