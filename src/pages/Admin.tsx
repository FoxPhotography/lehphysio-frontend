import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Key,
  Users,
  Lightbulb,
  Frame,
  Settings,
  ShieldCheck,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ThumbsUp,
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
  Save,
  ImagePlus,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { setFramesCache } from '../utils/helpers';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.startsWith('192.168.')
    ? `http://${window.location.hostname}:5000`
    : '');

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AdminProps {
  adminSection: string;
  setAdminSection: (val: string) => void;
  adminMessage: string;
  setAdminMessage: (val: string) => void;
  adminEpisodeForm: any;
  setAdminEpisodeForm: React.Dispatch<React.SetStateAction<any>>;
  handleAdminCreateEpisode: (e: React.FormEvent) => void;
  adminSubmitting: boolean;
  setAdminSubmitting: (val: boolean) => void;
  adminUsers: any[];
  adminCodes: any[];
  adminSuggestions: any[];
  adminCodeForm: any;
  setAdminCodeForm: React.Dispatch<React.SetStateAction<any>>;
  handleAdminCreateCode: (e: React.FormEvent) => void;
  handleAdminToggleUserRole: (userId: number, currentRole: string) => void;
  handleAdminUpdateSuggestionStatus: (suggestionId: number, status: 'approved' | 'rejected') => void;
  handleAdminDeleteCode: (codeId: number, codeName: string) => void;
  handleOpenModerationModal: (username: string, userId: number) => void;
  handleAdminDeleteUser: (userId: number, username: string) => void;
  user: any;
  fetchXpSettings?: () => void;
  episodes?: any[];
  fetchEpisodes?: () => void;
  showConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    type?: 'danger' | 'info' | 'success' | 'warning'
  ) => void;
}

// ─── Shared sub-components ─────────────────────────────────────────────────────
const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children, className = ''
}) => (
  <div className={`rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-xl p-5 ${className}`}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; label: string; count?: number }> = ({
  icon, label, count
}) => (
  <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/8">
    <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-orange-400">
      {icon}
    </div>
    <h3 className="text-[15px] font-black text-white">
      {label}
      {count !== undefined && (
        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 text-[11px] font-bold">
          {count}
        </span>
      )}
    </h3>
  </div>
);

const AdminInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({
  label, className, ...props
}) => (
  <div className="space-y-1.5">
    {label && <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <input
      {...props}
      className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-[13px] focus:outline-none focus:border-orange-500/60 transition-colors ${className || ''}`}
    />
  </div>
);

const AdminSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({
  label, children, className, ...props
}) => (
  <div className="space-y-1.5">
    {label && <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <div className="relative">
      <select
        {...props}
        className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] focus:outline-none focus:border-orange-500/60 appearance-none transition-colors ${className || ''}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
    </div>
  </div>
);

const AdminTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({
  label, className, ...props
}) => (
  <div className="space-y-1.5">
    {label && <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <textarea
      {...props}
      className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-[13px] focus:outline-none focus:border-orange-500/60 resize-none transition-colors ${className || ''}`}
    />
  </div>
);

const AdminBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md';
}> = ({ variant = 'primary', size = 'md', className, children, ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400',
    danger: 'border border-red-500/25 text-red-400 hover:bg-red-500/10',
    ghost: 'border border-white/10 text-zinc-400 hover:text-white hover:border-white/20',
    success: 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-4 py-2.5 text-[13px]',
  };
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={`rounded-xl font-bold transition-all flex items-center gap-1.5 ${variants[variant]} ${sizes[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};

// ─── Tab Definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'episodes',   label: 'Episodes',    icon: <Video    className="w-3.5 h-3.5" /> },
  { id: 'codes',      label: 'XP Codes',    icon: <Key      className="w-3.5 h-3.5" /> },
  { id: 'users',      label: 'Users',       icon: <Users    className="w-3.5 h-3.5" /> },
  { id: 'suggestions',label: 'Suggestions', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: 'frames',     label: 'Frames',      icon: <Frame    className="w-3.5 h-3.5" /> },
  { id: 'xp_settings',label: 'XP Settings', icon: <Settings className="w-3.5 h-3.5" /> },
];

// ─── Main Admin Component ──────────────────────────────────────────────────────
export const Admin: React.FC<AdminProps> = ({
  adminSection,
  setAdminSection,
  adminMessage,
  setAdminMessage,
  adminEpisodeForm,
  setAdminEpisodeForm,
  handleAdminCreateEpisode,
  adminSubmitting,
  setAdminSubmitting,
  adminUsers,
  adminCodes,
  adminSuggestions,
  adminCodeForm,
  setAdminCodeForm,
  handleAdminCreateCode,
  handleAdminToggleUserRole,
  handleAdminUpdateSuggestionStatus,
  handleAdminDeleteCode,
  handleOpenModerationModal,
  handleAdminDeleteUser,
  user,
  fetchXpSettings,
  episodes = [],
  fetchEpisodes,
  showConfirm,
}) => {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null);
  const [editingLoading, setEditingLoading] = useState(false);

  const token = localStorage.getItem('token');

  const EMPTY_EPISODE = {
    title_ar: '', title_en: '', description: '', thumbnail_url: '',
    youtube_url: '', quiz_question: '', quiz_options: ['', '', '', ''],
    quiz_correct: 0, code: '', code_max_uses: 200, code_expiry: ''
  };

  // ── Episode Submit ──────────────────────────────────────────────────────────
  const handleEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSubmitting(true);
    setAdminMessage('');
    let thumbnailUrl = adminEpisodeForm.thumbnail_url;

    if (thumbnailFile) {
      setThumbnailUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', thumbnailFile);
        const uploadRes = await fetch(`${API_BASE}/api/upload/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          thumbnailUrl = uploadData.url;
        } else {
          setAdminMessage(uploadData.error || 'Image upload failed.');
          setThumbnailUploading(false);
          setAdminSubmitting(false);
          return;
        }
      } catch {
        setAdminMessage('Image upload failed.');
        setThumbnailUploading(false);
        setAdminSubmitting(false);
        return;
      }
      setThumbnailUploading(false);
    }

    const body: any = {
      title_ar: adminEpisodeForm.title_ar,
      title_en: adminEpisodeForm.title_en,
      description: adminEpisodeForm.description,
      thumbnail_url: thumbnailUrl,
      youtube_url: adminEpisodeForm.youtube_url,
    };
    if (adminEpisodeForm.quiz_question) {
      body.quiz = {
        question: adminEpisodeForm.quiz_question,
        options: adminEpisodeForm.quiz_options.filter((o: string) => o.trim()),
        correct_option_index: adminEpisodeForm.quiz_correct,
      };
    }
    if (adminEpisodeForm.code) {
      body.xp_code = {
        code: adminEpisodeForm.code,
        max_uses: adminEpisodeForm.code_max_uses,
        expiry_date: adminEpisodeForm.code_expiry || null,
      };
    }

    try {
      const url = editingEpisodeId
        ? `${API_BASE}/api/admin/episodes/${editingEpisodeId}`
        : `${API_BASE}/api/admin/episode`;
      const method = editingEpisodeId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setAdminMessage(data.message || data.error);
      if (res.ok) {
        setAdminEpisodeForm(EMPTY_EPISODE);
        setThumbnailFile(null);
        setEditingEpisodeId(null);
        if (fetchEpisodes) fetchEpisodes();
      }
    } catch {
      setAdminMessage('Connection to server failed.');
    }
    setAdminSubmitting(false);
  };

  const handleStartEditEpisode = async (episodeId: number) => {
    setEditingLoading(true);
    setAdminMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/episodes/${episodeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEditingEpisodeId(episodeId);
        setAdminEpisodeForm({
          title_ar: data.episode.title_ar || '',
          title_en: data.episode.title_en || '',
          description: data.episode.description || '',
          thumbnail_url: data.episode.thumbnail_url || '',
          youtube_url: data.episode.youtube_url || '',
          quiz_question: data.quiz ? data.quiz.question : '',
          quiz_options: data.quiz ? data.quiz.options : ['', '', '', ''],
          quiz_correct: data.quiz ? data.quiz.correct_option_index : 0,
          code: data.xp_code ? data.xp_code.code : '',
          code_max_uses: data.xp_code ? data.xp_code.max_uses : 200,
          code_expiry: data.xp_code?.expiry_date ? data.xp_code.expiry_date.split('T')[0] : '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setAdminMessage(data.error || 'Failed to fetch episode details.');
      }
    } catch {
      setAdminMessage('Failed to connect to server.');
    }
    setEditingLoading(false);
  };

  const handleCancelEditEpisode = () => {
    setEditingEpisodeId(null);
    setAdminEpisodeForm(EMPTY_EPISODE);
    setThumbnailFile(null);
    setAdminMessage('');
  };

  const handleDeleteEpisode = (episodeId: number, title: string) => {
    const proceed = async () => {
      setAdminMessage('');
      try {
        const res = await fetch(`${API_BASE}/api/admin/episodes/${episodeId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAdminMessage(data.message || data.error);
        if (res.ok && fetchEpisodes) fetchEpisodes();
      } catch {
        setAdminMessage('Failed to delete episode.');
      }
    };

    if (showConfirm) {
      showConfirm(
        'Delete Episode',
        `Are you sure you want to delete "${title}"? This will permanently delete the episode and all associated data.`,
        proceed,
        undefined,
        'Delete permanently',
        'Cancel',
        'danger'
      );
    } else if (confirm(`Delete "${title}"?`)) {
      proceed();
    }
  };

  // ── Frames Management ───────────────────────────────────────────────────────
  const [adminFrames, setAdminFrames] = useState<any[]>([]);
  const [frameName, setFrameName] = useState('');
  const [framePrice, setFramePrice] = useState(0);
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [frameUploading, setFrameUploading] = useState(false);
  const [frameError, setFrameError] = useState('');

  const fetchAdminFrames = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/frames`);
      const data = await res.json();
      if (res.ok) {
        setAdminFrames(data);
        setFramesCache(data);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (adminSection === 'frames') fetchAdminFrames();
  }, [adminSection]);

  const handleFrameUpload = async () => {
    if (!frameName.trim() || !frameFile || framePrice <= 0) {
      setFrameError('Name, image file, and price > 0 are required.');
      return;
    }
    setFrameUploading(true);
    setFrameError('');
    try {
      const formData = new FormData();
      formData.append('image', frameFile);
      const uploadRes = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setFrameError(uploadData.error || 'Image upload failed.');
        setFrameUploading(false);
        return;
      }
      const createRes = await fetch(`${API_BASE}/api/admin/frames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: frameName.trim(), image_url: uploadData.url, price: framePrice }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setFrameError(createData.error || 'Failed to create frame.');
      } else {
        setFrameName('');
        setFramePrice(0);
        setFrameFile(null);
        fetchAdminFrames();
      }
    } catch (e: any) {
      setFrameError(e.message || 'An error occurred.');
    }
    setFrameUploading(false);
  };

  const handleDeleteFrame = (frameId: string) => {
    const proceed = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/frames/${frameId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) fetchAdminFrames();
      } catch { /* silent */ }
    };
    if (showConfirm) {
      showConfirm(
        'Delete Frame',
        'Are you sure you want to delete this avatar frame? This cannot be undone.',
        proceed,
        undefined,
        'Delete Frame',
        'Cancel',
        'danger'
      );
    } else if (confirm('Delete this frame?')) {
      proceed();
    }
  };

  // ─── FILE UPLOAD UI helper ─────────────────────────────────────────────────
  const FileUploadBox: React.FC<{
    file: File | null;
    onChange: (file: File | null) => void;
    accept?: string;
    aspectRatio?: '16/9' | '1/1';
    existingUrl?: string;
    label?: string;
  }> = ({ file, onChange, accept = 'image/*', aspectRatio = '16/9', existingUrl, label }) => (
    <div className="space-y-1.5">
      {label && <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>}
      <label className="block cursor-pointer">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        <div className={`rounded-xl border-2 border-dashed border-white/15 bg-white/2 hover:border-orange-500/40 hover:bg-orange-500/3 transition-all text-center p-5 flex flex-col items-center gap-2 ${aspectRatio === '16/9' ? '' : ''}`}>
          {file ? (
            <>
              <div className={`${aspectRatio === '16/9' ? 'aspect-video' : 'aspect-square'} w-full max-w-[200px] overflow-hidden rounded-lg`}>
                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-[12px] font-bold text-white">{file.name}</p>
              <p className="text-[10px] text-zinc-500">Click to change</p>
            </>
          ) : existingUrl ? (
            <>
              <div className={`${aspectRatio === '16/9' ? 'aspect-video' : 'aspect-square'} w-full max-w-[200px] overflow-hidden rounded-lg`}>
                <img src={existingUrl} alt="Current" className="w-full h-full object-cover" />
              </div>
              <p className="text-[10px] text-zinc-500">Current image — click to replace</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <ImagePlus className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-[13px] font-bold text-white">Upload Image</p>
              <p className="text-[11px] text-zinc-500">Click or drag &amp; drop</p>
            </>
          )}
        </div>
      </label>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto px-4 py-6 space-y-5 pb-16"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/25 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">Admin Dashboard</h1>
          <p className="text-[12px] text-zinc-500">
            {user?.role === 'owner' ? 'Owner' : 'Admin'} Panel
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setAdminSection(tab.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${
              adminSection === tab.id
                ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                : 'bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:border-white/15'
            }`}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Admin Message Banner */}
      <AnimatePresence>
        {adminMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/25 text-[13px] text-white"
          >
            <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            {adminMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. EPISODES ─────────────────────────────────────────────────── */}
      {adminSection === 'episodes' && (
        <div className="space-y-5">
          <SectionCard>
            <SectionTitle
              icon={<Video className="w-4 h-4" />}
              label={editingEpisodeId ? `Edit Episode: ${adminEpisodeForm.title_en}` : 'Publish New Episode'}
            />
            <form onSubmit={handleEpisodeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AdminInput
                  label="Title (Arabic)"
                  placeholder="العنوان بالعربي"
                  value={adminEpisodeForm.title_ar}
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_ar: e.target.value }))}
                  required
                />
                <AdminInput
                  label="Title (English)"
                  placeholder="Episode title in English"
                  value={adminEpisodeForm.title_en}
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_en: e.target.value }))}
                  required
                />
              </div>

              <AdminTextarea
                label="Description"
                placeholder="Brief description of the episode..."
                rows={3}
                value={adminEpisodeForm.description}
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, description: e.target.value }))}
              />

              <FileUploadBox
                label="Thumbnail (16:9 recommended)"
                file={thumbnailFile}
                onChange={setThumbnailFile}
                aspectRatio="16/9"
                existingUrl={adminEpisodeForm.thumbnail_url}
              />

              <AdminInput
                label="YouTube URL"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={adminEpisodeForm.youtube_url}
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, youtube_url: e.target.value }))}
              />

              {/* Quiz Section */}
              <div className="rounded-xl border border-dashed border-white/15 bg-white/2 p-4 space-y-3">
                <p className="text-[12px] font-black text-orange-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Interactive Quiz (Optional)
                </p>
                <AdminInput
                  label="Quiz Question"
                  placeholder="What is the first line of defense for...?"
                  value={adminEpisodeForm.quiz_question || ''}
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, quiz_question: e.target.value }))}
                />
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Options</p>
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        adminEpisodeForm.quiz_correct === idx ? 'bg-emerald-500 text-black' : 'bg-white/8 text-zinc-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-[13px] focus:outline-none focus:border-orange-500/60 transition-colors"
                        placeholder={`Option ${idx + 1}`}
                        value={adminEpisodeForm.quiz_options[idx] || ''}
                        onChange={(e) => {
                          const nextOpts = [...adminEpisodeForm.quiz_options];
                          nextOpts[idx] = e.target.value;
                          setAdminEpisodeForm((p: any) => ({ ...p, quiz_options: nextOpts }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setAdminEpisodeForm((p: any) => ({ ...p, quiz_correct: idx }))}
                        className={`w-7 h-7 rounded-lg border text-[10px] font-black flex-shrink-0 transition-colors ${
                          adminEpisodeForm.quiz_correct === idx
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'border-white/15 text-zinc-600 hover:border-emerald-500/50'
                        }`}
                        title="Mark as correct"
                      >
                        {adminEpisodeForm.quiz_correct === idx ? <CheckCircle className="w-3 h-3 mx-auto" /> : <span>?</span>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secret Code Section */}
              <div className="rounded-xl border border-dashed border-white/15 bg-white/2 p-4 space-y-3">
                <p className="text-[12px] font-black text-orange-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> Episode Secret Code (Optional)
                </p>
                <AdminInput
                  label="Code Name"
                  placeholder="EPXX_SECRET"
                  value={adminEpisodeForm.code || ''}
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <AdminInput
                    label="Max Uses"
                    type="number"
                    value={adminEpisodeForm.code_max_uses || 200}
                    onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code_max_uses: Number(e.target.value) }))}
                  />
                  <AdminInput
                    label="Expiry Date"
                    type="date"
                    value={adminEpisodeForm.code_expiry || ''}
                    onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code_expiry: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <AdminBtn type="submit" disabled={adminSubmitting} className="flex-1 justify-center">
                  {adminSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {editingEpisodeId ? 'Saving...' : 'Publishing...'}</>
                  ) : (
                    <><Upload className="w-4 h-4" /> {editingEpisodeId ? 'Save Changes' : 'Publish Episode'}</>
                  )}
                </AdminBtn>
                {editingEpisodeId && (
                  <AdminBtn type="button" variant="ghost" onClick={handleCancelEditEpisode}>
                    Cancel
                  </AdminBtn>
                )}
              </div>
            </form>
          </SectionCard>

          {/* Existing Episodes List */}
          <SectionCard>
            <SectionTitle icon={<Video className="w-4 h-4" />} label="Manage Episodes" count={episodes.length} />
            {episodes.length === 0 ? (
              <p className="text-center text-zinc-600 text-[13px] py-6">No episodes published yet.</p>
            ) : (
              <div className="space-y-2">
                {episodes.map((ep: any) => (
                  <div key={ep.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8 hover:border-white/12 transition-colors">
                    {ep.thumbnail_url && (
                      <img src={ep.thumbnail_url} alt={ep.title_en} className="w-14 h-8 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">{ep.title_en}</p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {ep.description ? ep.description.substring(0, 70) + '...' : 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <AdminBtn
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEditEpisode(ep.id)}
                        disabled={editingLoading}
                      >
                        <Pencil className="w-3 h-3" />
                        {editingEpisodeId === ep.id ? 'Editing...' : 'Edit'}
                      </AdminBtn>
                      <AdminBtn
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteEpisode(ep.id, ep.title_en)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Del
                      </AdminBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── 2. XP CODES ───────────────────────────────────────────────────── */}
      {adminSection === 'codes' && (
        <div className="space-y-5">
          <SectionCard>
            <SectionTitle icon={<Key className="w-4 h-4" />} label="Create XP Code" />
            <form onSubmit={handleAdminCreateCode} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="Code Name"
                  placeholder="FACEBOOK50"
                  value={adminCodeForm.code}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, code: e.target.value }))}
                  required
                />
                <AdminInput
                  label="XP Amount"
                  type="number"
                  value={adminCodeForm.xp_reward}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, xp_reward: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <AdminSelect
                  label="Type"
                  value={adminCodeForm.type}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, type: e.target.value }))}
                >
                  <option value="social" className="bg-zinc-900">Social Media</option>
                  <option value="episode" className="bg-zinc-900">Episode</option>
                </AdminSelect>
                <AdminInput
                  label="Max Uses"
                  type="number"
                  value={adminCodeForm.max_uses}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, max_uses: Number(e.target.value) }))}
                  required
                />
                <AdminInput
                  label="Expiry Date"
                  type="date"
                  value={adminCodeForm.expiry_date}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, expiry_date: e.target.value }))}
                />
              </div>
              <AdminBtn type="submit" disabled={adminSubmitting} className="w-full justify-center">
                <Plus className="w-4 h-4" /> Create Code
              </AdminBtn>
            </form>
          </SectionCard>

          <SectionCard>
            <SectionTitle icon={<Key className="w-4 h-4" />} label="All XP Codes" count={adminCodes.length} />
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] min-w-[520px]">
                <thead>
                  <tr className="border-b border-white/8 text-left text-zinc-500">
                    <th className="pb-2 pr-3 font-bold">Code</th>
                    <th className="pb-2 pr-3 font-bold">XP</th>
                    <th className="pb-2 pr-3 font-bold">Type</th>
                    <th className="pb-2 pr-3 font-bold">Uses</th>
                    <th className="pb-2 pr-3 font-bold">Expires</th>
                    <th className="pb-2 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-zinc-600">No XP codes yet.</td>
                    </tr>
                  ) : adminCodes.map((c: any) => {
                    const isExpired = c.expiry_date && new Date(c.expiry_date) < new Date();
                    return (
                      <tr key={c.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                        <td className="py-2.5 pr-3 font-bold text-white">{c.code}</td>
                        <td className="py-2.5 pr-3 text-orange-400 font-bold">+{c.xp_reward}</td>
                        <td className="py-2.5 pr-3 capitalize text-zinc-400">{c.type}</td>
                        <td className="py-2.5 pr-3 text-zinc-400">{c.current_uses}/{c.max_uses}</td>
                        <td className={`py-2.5 pr-3 ${isExpired ? 'text-red-400' : 'text-zinc-400'}`}>
                          {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                          {isExpired && ' (Expired)'}
                        </td>
                        <td className="py-2.5 text-center">
                          <AdminBtn size="sm" variant="danger" onClick={() => handleAdminDeleteCode(c.id, c.code)}>
                            <Trash2 className="w-3 h-3" />
                          </AdminBtn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── 3. USERS ───────────────────────────────────────────────────────── */}
      {adminSection === 'users' && (
        <SectionCard>
          <SectionTitle icon={<Users className="w-4 h-4" />} label="Registered Members" count={adminUsers.length} />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[600px]">
              <thead>
                <tr className="border-b border-white/8 text-left text-zinc-500">
                  <th className="pb-2 pr-3 font-bold">User</th>
                  <th className="pb-2 pr-3 font-bold">Email</th>
                  <th className="pb-2 pr-3 font-bold">Batch</th>
                  <th className="pb-2 pr-3 font-bold">XP</th>
                  <th className="pb-2 pr-3 font-bold">Role</th>
                  <th className="pb-2 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-zinc-600">No users in database.</td>
                  </tr>
                ) : adminUsers.map((u: any) => (
                  <tr key={u.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                    <td className="py-2.5 pr-3 font-bold text-white">@{u.username}</td>
                    <td className="py-2.5 pr-3 text-zinc-500">{u.email}</td>
                    <td className="py-2.5 pr-3 text-zinc-400">{u.batch}</td>
                    <td className="py-2.5 pr-3 text-orange-400 font-bold">{u.total_xp?.toLocaleString()}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        u.role === 'owner' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                        u.role === 'admin' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                        'bg-white/5 text-zinc-500 border border-white/10'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <div className="flex gap-1 justify-center">
                        {user?.role === 'owner' && u.role !== 'owner' && (
                          <AdminBtn size="sm" variant="ghost" onClick={() => handleAdminToggleUserRole(u.id, u.role)}>
                            <RefreshCw className="w-3 h-3" /> Role
                          </AdminBtn>
                        )}
                        <AdminBtn size="sm" onClick={() => handleOpenModerationModal(u.username, u.id)}
                          className="bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20"
                        >
                          Moderate
                        </AdminBtn>
                        {user?.role === 'owner' && u.role !== 'owner' && (
                          <AdminBtn size="sm" variant="danger" onClick={() => handleAdminDeleteUser(u.id, u.username)}>
                            <Trash2 className="w-3 h-3" />
                          </AdminBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── 4. SUGGESTIONS ─────────────────────────────────────────────────── */}
      {adminSection === 'suggestions' && (
        <SectionCard>
          <SectionTitle icon={<Lightbulb className="w-4 h-4" />} label="Suggestions Feed" count={adminSuggestions.length} />
          {adminSuggestions.length === 0 ? (
            <p className="text-center text-zinc-600 text-[13px] py-8">No suggestions submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {adminSuggestions.map((s: any) => (
                <div key={s.id} className={`rounded-xl border p-4 space-y-2 ${
                  s.status === 'approved' ? 'border-emerald-500/20 bg-emerald-500/3' :
                  s.status === 'rejected' ? 'border-red-500/20 bg-red-500/3' :
                  'border-white/8 bg-white/2'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-[14px] font-bold text-white">{s.title}</h4>
                      <p className="text-[11px] text-zinc-500">
                        @{s.username} · {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex-shrink-0 ${
                      s.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                      s.status === 'rejected' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                      'bg-white/8 text-zinc-400 border border-white/15'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">{s.content}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 text-[11px] text-orange-400">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {s.upvotes || 0} upvotes
                    </div>
                    {s.status === 'pending' && (
                      <div className="flex gap-2">
                        <AdminBtn size="sm" variant="success" onClick={() => handleAdminUpdateSuggestionStatus(s.id, 'approved')}>
                          <CheckCircle className="w-3 h-3" /> Approve
                        </AdminBtn>
                        <AdminBtn size="sm" variant="danger" onClick={() => handleAdminUpdateSuggestionStatus(s.id, 'rejected')}>
                          <XCircle className="w-3 h-3" /> Reject
                        </AdminBtn>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── 5. FRAMES ──────────────────────────────────────────────────────── */}
      {adminSection === 'frames' && (
        <div className="space-y-5">
          <SectionCard>
            <SectionTitle icon={<Frame className="w-4 h-4" />} label="Upload New Frame" />
            {frameError && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
                {frameError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="Frame Name"
                  placeholder="Legendary Flame"
                  value={frameName}
                  onChange={(e) => setFrameName(e.target.value)}
                />
                <AdminInput
                  label="XP Price"
                  type="number"
                  placeholder="500"
                  value={framePrice || ''}
                  onChange={(e) => setFramePrice(Math.max(0, Number(e.target.value)))}
                  min={0}
                />
              </div>
              <FileUploadBox
                label="Frame PNG (transparent background)"
                file={frameFile}
                onChange={setFrameFile}
                accept="image/png,image/webp,image/gif"
                aspectRatio="1/1"
              />
              <AdminBtn
                onClick={handleFrameUpload}
                disabled={frameUploading}
                className="w-full justify-center"
              >
                {frameUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Frame</>}
              </AdminBtn>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle icon={<Frame className="w-4 h-4" />} label="Existing Frames" count={adminFrames.length} />
            {adminFrames.length === 0 ? (
              <p className="text-center text-zinc-600 text-[13px] py-8">No frames uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {adminFrames.map((f: any) => (
                  <div key={f._id} className="rounded-xl border border-white/8 bg-white/2 p-3 flex flex-col items-center gap-2 text-center">
                    <div className="w-14 h-14 rounded-xl bg-black/30 overflow-hidden flex items-center justify-center">
                      <img src={f.image_url} alt={f.name} className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[11px] font-bold text-white leading-tight">{f.name}</p>
                    <p className="text-[10px] text-orange-400 font-bold">{f.price.toLocaleString()} XP</p>
                    <AdminBtn size="sm" variant="danger" onClick={() => handleDeleteFrame(f._id)} className="w-full justify-center">
                      <Trash2 className="w-3 h-3" />
                    </AdminBtn>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── 6. XP SETTINGS ─────────────────────────────────────────────────── */}
      {adminSection === 'xp_settings' && (
        <XpSettingsManager
          token={token}
          apiBase={API_BASE}
          fetchXpSettings={fetchXpSettings || (() => {})}
          setAdminMessage={setAdminMessage}
        />
      )}
    </motion.div>
  );
};

// ─── XP Settings Manager Sub-Component ────────────────────────────────────────
const XP_SETTING_METADATA: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
  like:          { label: 'Episode / Post Like',  desc: 'XP awarded for liking an episode or community post.',           icon: <ThumbsUp  className="w-4 h-4" /> },
  comment:       { label: 'Comment Made',         desc: 'XP awarded for adding a comment on an episode or post.',        icon: <Settings  className="w-4 h-4" /> },
  share:         { label: 'Share Link Created',   desc: 'XP awarded to user when they generate a share link.',           icon: <Settings  className="w-4 h-4" /> },
  comment_like:  { label: 'Comment Liked',        desc: 'XP awarded for liking someone else\'s comment.',               icon: <ThumbsUp  className="w-4 h-4" /> },
  daily_login:   { label: 'Daily Login Reward',   desc: 'XP awarded for logging in each day.',                          icon: <CheckCircle className="w-4 h-4" /> },
  streak_bonus:  { label: '7-Day Streak Bonus',   desc: 'Extra XP awarded when user reaches a 7-day login streak.',     icon: <Settings  className="w-4 h-4" /> },
  game_play:     { label: 'Memory Game Play',     desc: 'XP awarded for completing the single-player match game.',       icon: <Settings  className="w-4 h-4" /> },
  referral:      { label: 'Shared Link Visit',    desc: 'XP awarded when a visitor visits user\'s shared link.',        icon: <Users     className="w-4 h-4" /> },
  surprise_box:  { label: 'Surprise Box Claim',   desc: 'XP awarded when opening the daily surprise box.',              icon: <Settings  className="w-4 h-4" /> },
  poll_vote:     { label: 'Daily Poll Vote',      desc: 'XP awarded for voting in the daily dashboard poll.',            icon: <CheckCircle className="w-4 h-4" /> },
  quiz_solve:    { label: 'Quiz Solved',          desc: 'Fallback XP for solving an episode quiz.',                     icon: <CheckCircle className="w-4 h-4" /> },
};

const XpSettingsManager: React.FC<{
  token: string | null;
  apiBase: string;
  fetchXpSettings: () => void;
  setAdminMessage: (msg: string) => void;
}> = ({ token, apiBase, fetchXpSettings, setAdminMessage }) => {
  const [localSettings, setLocalSettings] = useState<any>({
    like: 5, comment: 15, share: 25, comment_like: 2, daily_login: 10,
    streak_bonus: 70, game_play: 50, referral: 25, surprise_box: 50,
    poll_vote: 30, quiz_solve: 150,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/admin/xp-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setLocalSettings(data);
      else setError(data.error || 'Failed to fetch XP settings.');
    } catch {
      setError('Connection to server failed.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setAdminMessage('');
    try {
      const res = await fetch(`${apiBase}/api/admin/xp-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(localSettings),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminMessage('XP settings updated successfully!');
        fetchXpSettings();
      } else {
        setError(data.error || 'Failed to update XP settings.');
      }
    } catch {
      setError('Connection to server failed.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/8 bg-zinc-900/60 p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-2" />
        <p className="text-zinc-500 text-[13px]">Loading XP Configuration...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-xl p-5">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-orange-400">
          <Settings className="w-4 h-4" />
        </div>
        <h3 className="text-[15px] font-black text-white">Global XP Reward Settings</h3>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-2">
        {Object.entries(localSettings).map(([key, val]: [string, any]) => {
          const meta = XP_SETTING_METADATA[key] || { label: key, desc: '', icon: <Settings className="w-4 h-4" /> };
          return (
            <div key={key} className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/2 border border-white/6 hover:border-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/15 flex items-center justify-center text-orange-400 flex-shrink-0">
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white">{meta.label}</p>
                <p className="text-[10px] text-zinc-600 leading-tight">{meta.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="number"
                  value={val}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10) || 0;
                    setLocalSettings((prev: any) => ({ ...prev, [key]: n >= 0 ? n : 0 }));
                  }}
                  className="w-16 text-center px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[13px] font-bold focus:outline-none focus:border-orange-500/60 transition-colors"
                  min={0}
                  required
                />
                <span className="text-[10px] text-zinc-600 font-bold">XP</span>
              </div>
            </div>
          );
        })}

        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-[14px] hover:from-orange-400 hover:to-amber-400 transition-colors disabled:opacity-60"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save XP Settings</>}
          </motion.button>
        </div>
      </form>
    </div>
  );
};
