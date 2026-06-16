import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader2, Send } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';

interface PostComposerProps {
  user: any;
  newPostContent: string;
  setNewPostContent: (content: string) => void;
  handleCreatePost: (title: string, content: string, imageUrl: string) => Promise<void>;
  handleUploadImage: (file: File) => Promise<string | null>;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  user,
  newPostContent,
  setNewPostContent,
  handleCreatePost,
  handleUploadImage,
}) => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  if (!user) return null;

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
    await handleCreatePost('', newPostContent, uploadedImageUrl);
    setNewPostContent('');
    setUploadedImageUrl('');
    setIsPosting(false);
  };

  return (
    <form 
      onSubmit={handleSubmitPost} 
      className="glass-card p-5 flex gap-4 items-start text-left border border-zinc-900/60"
    >
      <UserAvatar
        username={user.username}
        avatarUrl={user.avatar_url}
        equippedFrame={user.equipped_frame}
        size={40}
      />
      <div className="flex-1 space-y-3">
        <textarea
          className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl p-3.5 text-xs font-semibold placeholder-zinc-500 outline-none transition-all duration-200 resize-none min-h-[90px]"
          placeholder="What's on your mind today, champ? Share your question or achievement..."
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          maxLength={300}
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

        <div className="flex justify-between items-center pt-2">
          <label className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{isUploadingImage ? 'Uploading...' : 'Add Image'}</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isUploadingImage} />
          </label>
          
          <button 
            type="submit" 
            className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow flex items-center gap-1.5 disabled:opacity-50" 
            disabled={!newPostContent.trim() || isUploadingImage || isPosting}
          >
            {isPosting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
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
  );
};
