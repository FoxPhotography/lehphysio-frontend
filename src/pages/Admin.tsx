import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { RoleSelectModal } from '../components/RoleSelectModal';
import {
  Video,
  Key,
  Users,
  Lightbulb,
  Frame,
  Settings,
  ShieldCheck,
  ShieldAlert,
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
  User,
  Search,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { setFramesCache } from '../utils/helpers';
import { API_BASE } from '../services/api';

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
  handleAdminUpdateUserRole: (userId: number, role: string) => Promise<void>;
  handleAdminUpdateSuggestionStatus: (suggestionId: number, status: 'approved' | 'rejected') => void;
  handleAdminDeleteCode: (codeId: number | string, codeName: string) => void;
  handleOpenModerationModal: (username: string, userId: number) => void;
  handleAdminDeleteUser: (userId: number, username: string) => void;
  user: any;
  token?: string | null;
  apiBase?: string;
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
  <div className={`rounded-2xl border border-white/8 bg-zinc-900/60 p-5 ${className}`}>
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
        <span className="ms-2 px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 text-xs font-bold">
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
    {label && <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
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
    {label && <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <div className="relative">
      <select
        {...props}
        className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] focus:outline-none focus:border-orange-500/60 appearance-none transition-colors ${className || ''}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
    </div>
  </div>
);

const AdminTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({
  label, className, ...props
}) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
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
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-[13px]',
  };
  return (
    <m.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={`rounded-xl font-bold transition-all flex items-center gap-1.5 ${variants[variant]} ${sizes[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      {...(props as any)}
    >
      {children}
    </m.button>
  );
};

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
  handleAdminUpdateUserRole,
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

  // Role Select modal state
  const [selectedRoleUser, setSelectedRoleUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const handleConfirmRoleChange = async (userId: number, newRole: string) => {
    setRoleLoading(true);
    try {
      await handleAdminUpdateUserRole(userId, newRole);
      setSelectedRoleUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      setRoleLoading(false);
    }
  };

  // Dynamic Tabs
  const tabs = [
    { id: 'episodes',   label: 'الحلقات',    icon: <Video    className="w-3.5 h-3.5" /> },
    { id: 'codes',      label: 'أكواد XP',    icon: <Key      className="w-3.5 h-3.5" /> },
    { id: 'users',      label: 'المستخدمين',       icon: <Users    className="w-3.5 h-3.5" /> },
    { id: 'frames',     label: 'الفريمات',      icon: <Frame    className="w-3.5 h-3.5" /> },
    { id: 'xp_settings',label: 'إعدادات XP', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'system_profile', label: 'الحساب الرسمي', icon: <User className="w-3.5 h-3.5" /> },
    ...(user?.role === 'owner' ? [
      { id: 'audit_logs', label: 'سجل العمليات', icon: <ShieldAlert className="w-3.5 h-3.5" /> }
    ] : [])
  ];

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPagination, setAuditPagination] = useState<any>({ page: 1, limit: 30, total: 0, hasMore: false });
  const [auditFilters, setAuditFilters] = useState({
    search: '',
    action: '',
    targetType: '',
    dateRange: '30days',
    startDate: '',
    endDate: '',
    page: 1,
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchAuditLogs = async (loadMore = false) => {
    if (user?.role !== 'owner' || !token) return;
    setAuditLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const pageToFetch = loadMore ? auditFilters.page + 1 : 1;
      queryParams.append('page', String(pageToFetch));
      queryParams.append('limit', '30');
      
      if (auditFilters.search.trim()) {
        queryParams.append('search', auditFilters.search.trim());
      }
      if (auditFilters.action) {
        queryParams.append('action', auditFilters.action);
      }
      if (auditFilters.targetType) {
        queryParams.append('targetType', auditFilters.targetType);
      }
      if (auditFilters.dateRange) {
        queryParams.append('dateRange', auditFilters.dateRange);
        if (auditFilters.dateRange === 'custom' && auditFilters.startDate && auditFilters.endDate) {
          queryParams.append('startDate', auditFilters.startDate);
          queryParams.append('endDate', auditFilters.endDate);
        }
      }
      
      const res = await fetch(`${API_BASE}/api/admin/audit-logs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (loadMore) {
          setAuditLogs(prev => [...prev, ...data.logs]);
        } else {
          setAuditLogs(data.logs);
        }
        setAuditPagination(data.pagination);
        setAuditFilters(prev => ({ ...prev, page: pageToFetch }));
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSoftDeleteLog = async (logId: number) => {
    showConfirm?.(
      'Delete Log Entry',
      'Are you sure you want to delete this log entry? This is a soft delete and will hide it from the dashboard, but the database will preserve it.',
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/audit-logs/${logId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setAdminMessage('السجل اتمسح.');
            setSelectedLog(null);
            fetchAuditLogs(false);
          } else {
            setAdminMessage(data.error || 'Failed to delete log entry.');
          }
        } catch (err) {
          setAdminMessage('الاتصال فشل.');
        }
      },
      undefined, 'Delete', 'Cancel', 'danger'
    );
  };

  useEffect(() => {
    if (adminSection === 'audit_logs') {
      fetchAuditLogs(false);
    }
  }, [adminSection, auditFilters.action, auditFilters.targetType, auditFilters.dateRange, auditFilters.startDate, auditFilters.endDate]);

  const EMPTY_EPISODE = {
    episode_number: '',
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
          setAdminMessage(uploadData.error || 'رفع الصورة فشل.');
          setThumbnailUploading(false);
          setAdminSubmitting(false);
          return;
        }
      } catch {
        setAdminMessage('رفع الصورة فشل.');
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
    if (adminEpisodeForm.episode_number && !editingEpisodeId) {
      body.episode_number = Number(adminEpisodeForm.episode_number);
    }
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
      setAdminMessage('مش قادرين نوصل للسيرفر.');
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
          episode_number: String(data.episode.id || data.episode._id || episodeId),
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
      setAdminMessage('مش قادرين نوصل للسيرفر.');
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
        setAdminMessage('معرفناش نمسح الحلقة.');
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
  const [editingFrameId, setEditingFrameId] = useState<any | null>(null);
  const [editingFramePrice, setEditingFramePrice] = useState<number>(0);

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
        setFrameError(uploadData.error || 'رفع الصورة فشل.');
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

  const handleUpdateFramePrice = async (frameId: any, newPrice: number) => {
    if (newPrice < 0) {
      setFrameError('Price must be 0 or greater.');
      return;
    }
    setFrameError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/frames/${frameId}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ price: newPrice })
      });
      const data = await res.json();
      if (!res.ok) {
        setFrameError(data.error || 'Failed to update price.');
      } else {
        setEditingFrameId(null);
        fetchAdminFrames();
      }
    } catch {
      setFrameError('مش قادرين نوصل للسيرفر.');
    }
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
      {label && <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>}
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
              <p className="text-xs font-bold text-white">{file.name}</p>
              <p className="text-2xs text-zinc-500">اضغط للتغيير</p>
            </>
          ) : existingUrl ? (
            <>
              <div className={`${aspectRatio === '16/9' ? 'aspect-video' : 'aspect-square'} w-full max-w-[200px] overflow-hidden rounded-lg`}>
                <img src={existingUrl} alt="Current" className="w-full h-full object-cover" />
              </div>
              <p className="text-2xs text-zinc-500">الصورة الحالية — اضغط للتغيير</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <ImagePlus className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-[13px] font-bold text-white">ارفع صورة</p>
              <p className="text-xs text-zinc-500">اضغط أو اسحب الصورة هنا</p>
            </>
          )}
        </div>
      </label>
    </div>
  );

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto px-4 xl:pt-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/25 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">لوحة الإدارة</h1>
          <p className="text-xs text-zinc-500">
            {user?.role === 'owner' ? 'Owner' : 'Admin'} Panel
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((tab) => (
          <m.button
            key={tab.id}
            onClick={() => setAdminSection(tab.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              adminSection === tab.id
                ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                : 'bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:border-white/15'
            }`}
          >
            {tab.icon}
            {tab.label}
          </m.button>
        ))}
      </div>

      {/* Admin Message Banner */}
      <AnimatePresence>
        {adminMessage && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/25 text-[13px] text-white"
          >
            <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            {adminMessage}
          </m.div>
        )}
      </AnimatePresence>

      {/* ── 1. EPISODES ─────────────────────────────────────────────────── */}
      {adminSection === 'episodes' && (
        <div className="space-y-5">
          <SectionCard>
            <SectionTitle
              icon={<Video className="w-4 h-4" />}
              label={editingEpisodeId ? `تعديل: ${adminEpisodeForm.title_ar}` : 'انشر حلقة جديدة'}
            />
            <form onSubmit={handleEpisodeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    رقم الحلقة {editingEpisodeId ? '(ثابت)' : '(اختياري)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={!!editingEpisodeId}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-[13px] focus:outline-none focus:border-orange-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    placeholder={editingEpisodeId ? `#${editingEpisodeId}` : "Auto"}
                    value={adminEpisodeForm.episode_number || ''}
                    onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, episode_number: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-3">
                  <AdminInput
                    label="عنوان الحلقة"
                    placeholder="مثال: ليه فيزيو؟ 🎙️ الحلقة 6 | أسرار العلاج الطبيعي"
                    value={adminEpisodeForm.title_ar}
                    onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_ar: e.target.value, title_en: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <AdminTextarea
                label="ملخص الحلقة والفصول"
                placeholder={"ملخص الحلقة… وكل سطر فيه وقت يبقى فصل، مثلًا:\n03:15 بداية الحوار\n12:40 نصايح للتدريب"}
                rows={3}
                value={adminEpisodeForm.description}
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, description: e.target.value }))}
              />

              <FileUploadBox
                label="الصورة المصغّرة (16:9)"
                file={thumbnailFile}
                onChange={setThumbnailFile}
                aspectRatio="16/9"
                existingUrl={adminEpisodeForm.thumbnail_url}
              />

              <AdminInput
                label="لينك يوتيوب"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={adminEpisodeForm.youtube_url}
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, youtube_url: e.target.value }))}
              />

              {/* Quiz Section */}
              <div className="rounded-xl border border-dashed border-white/15 bg-white/2 p-4 space-y-3">
                <p className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> كويز تفاعلي (اختياري)
                </p>
                <AdminInput
                  label="سؤال الكويز"
                  placeholder="مثلًا: إيه أول خط دفاع في…؟"
                  value={adminEpisodeForm.quiz_question || ''}
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, quiz_question: e.target.value }))}
                />
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">الاختيارات</p>
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-black flex-shrink-0 ${
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
                        className={`w-7 h-7 rounded-lg border text-2xs font-black flex-shrink-0 transition-colors ${
                          adminEpisodeForm.quiz_correct === idx
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'border-white/15 text-zinc-600 hover:border-emerald-500/50'
                        }`}
                        title="الإجابة الصح"
                      >
                        {adminEpisodeForm.quiz_correct === idx ? <CheckCircle className="w-3 h-3 mx-auto" /> : <span>?</span>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secret Code Section */}
              <div className="rounded-xl border border-dashed border-white/15 bg-white/2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                    <Key className="w-4 h-4" /> الكود السري للحلقة (اختياري)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setAdminEpisodeForm((p: any) => ({ ...p, code: `EP-${rand}` }));
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>اعمل كود</span>
                  </button>
                </div>
                <AdminInput
                  label="Code Name"
                  placeholder="e.g. EP-4892"
                  value={adminEpisodeForm.code || ''}
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <AdminInput
                    label="أقصى عدد استخدام"
                    type="number"
                    value={adminEpisodeForm.code_max_uses || 200}
                    onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code_max_uses: Number(e.target.value) }))}
                  />
                  <AdminInput
                    label="تاريخ الانتهاء"
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
                    إلغاء
                  </AdminBtn>
                )}
              </div>
            </form>
          </SectionCard>

          {/* Existing Episodes List */}
          <SectionCard>
            <SectionTitle icon={<Video className="w-4 h-4" />} label="إدارة الحلقات" count={episodes.length} />
            {episodes.length === 0 ? (
              <p className="text-center text-zinc-600 text-[13px] py-6">مفيش حلقات منشورة لسه.</p>
            ) : (
              <div className="space-y-2">
                {episodes.map((ep: any) => (
                  <div key={ep.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8 hover:border-white/12 transition-colors">
                    {ep.thumbnail_url && (
                      <img src={ep.thumbnail_url} alt={ep.title_ar || ep.title_en} className="w-14 h-8 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">
                        <span className="text-orange-400 font-mono me-1.5 font-bold">#{ep.id}</span>
                        {ep.title_ar || ep.title_en}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
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
                        onClick={() => handleDeleteEpisode(ep.id, ep.title_ar || ep.title_en)}
                      >
                        <Trash2 className="w-3 h-3" />
                        حذف
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
            <SectionTitle icon={<Key className="w-4 h-4" />} label="اعمل كود XP" />
            <form onSubmit={handleAdminCreateCode} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">اسم الكود</label>
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = adminCodeForm.type === 'episode' ? 'EP' : 'LEH';
                        const rand = Math.floor(1000 + Math.random() * 9000);
                        setAdminCodeForm((p: any) => ({ ...p, code: `${prefix}-${rand}` }));
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>توليد</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="مثلًا LEH-4921"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-[13px] focus:outline-none focus:border-orange-500/60 transition-colors font-bold uppercase"
                    value={adminCodeForm.code}
                    onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, code: e.target.value }))}
                    required
                  />
                </div>
                <AdminInput
                  label="قيمة XP"
                  type="number"
                  value={adminCodeForm.xp_reward}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, xp_reward: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AdminSelect
                  label="النوع"
                  value={adminCodeForm.type}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, type: e.target.value }))}
                >
                  <option value="social" className="bg-zinc-900">سوشيال ميديا / عام</option>
                  <option value="episode" className="bg-zinc-900">كود حلقة</option>
                </AdminSelect>
                <AdminInput
                  label="أقصى عدد استخدام"
                  type="number"
                  value={adminCodeForm.max_uses}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, max_uses: Number(e.target.value) }))}
                  required
                />
                <AdminInput
                  label="تاريخ الانتهاء"
                  type="date"
                  value={adminCodeForm.expiry_date}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, expiry_date: e.target.value }))}
                />
              </div>

              {adminCodeForm.type === 'episode' && (
                <AdminSelect
                  label="الحلقة (الكود هيشتغل فيها أو في المتجر بس)"
                  value={adminCodeForm.episode_id || ''}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, episode_id: e.target.value }))}
                >
                  <option value="" className="bg-zinc-900">كود لأي حلقة</option>
                  {episodes.map((ep: any) => (
                    <option key={ep.id} value={ep.id} className="bg-zinc-900">
                      حلقة {ep.id}: {ep.title_ar || ep.title_en}
                    </option>
                  ))}
                </AdminSelect>
              )}

              <AdminBtn type="submit" disabled={adminSubmitting} className="w-full justify-center">
                <Plus className="w-4 h-4" /> اعمل الكود
              </AdminBtn>
            </form>
          </SectionCard>

          <SectionCard>
            <SectionTitle icon={<Key className="w-4 h-4" />} label="كل أكواد XP" count={adminCodes.length} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/8 text-start text-zinc-500">
                    <th className="pb-2 pe-3 font-bold">الكود</th>
                    <th className="pb-2 pe-3 font-bold">XP</th>
                    <th className="pb-2 pe-3 font-bold">النوع / الهدف</th>
                    <th className="pb-2 pe-3 font-bold">الاستخدام</th>
                    <th className="pb-2 pe-3 font-bold">ينتهي</th>
                    <th className="pb-2 font-bold text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {adminCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-zinc-600">مفيش أكواد XP لسه.</td>
                    </tr>
                  ) : adminCodes.map((c: any) => {
                    const codeId = c.id ?? c._id;
                    const isExpired = c.expiry_date && new Date(c.expiry_date) < new Date();
                    const isHighlighted = c.isNewHighlight;
                    return (
                      <tr 
                        key={codeId} 
                        className={`border-b transition-all duration-500 ${
                          isHighlighted
                            ? 'bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-transparent border-orange-500/40 shadow-[inset_0_0_15px_rgba(249,115,22,0.15)]'
                            : 'border-white/4 hover:bg-white/2'
                        }`}
                      >
                        <td className="py-2.5 pe-3 font-bold text-white font-mono">
                          <div className="flex items-center gap-2">
                            <span>{c.code}</span>
                            {isHighlighted && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white text-2xs font-black uppercase tracking-wider animate-pulse shadow-sm">
                                <Sparkles className="w-2.5 h-2.5" />
                                جديد
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 pe-3 text-orange-400 font-bold">+{c.xp_reward}</td>
                        <td className="py-2.5 pe-3 text-zinc-300">
                          {c.type === 'episode' ? (
                            c.episode_id ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                                حلقة {c.episode_id}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
                                أي حلقة
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-xs font-bold">
                              سوشيال ميديا
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pe-3 text-zinc-400">{c.current_uses}/{c.max_uses}</td>
                        <td className={`py-2.5 pe-3 ${isExpired ? 'text-red-400' : 'text-zinc-400'}`}>
                          {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('ar-EG-u-nu-latn', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                          {isExpired && ' (Expired)'}
                        </td>
                        <td className="py-2.5 text-center">
                          <AdminBtn size="sm" variant="danger" onClick={() => handleAdminDeleteCode(codeId, c.code)}>
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
          <SectionTitle icon={<Users className="w-4 h-4" />} label="الأعضاء" count={adminUsers.length} />
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-white/8 text-start text-zinc-500">
                  <th className="pb-2 pe-3 font-bold">المستخدم</th>
                  <th className="pb-2 pe-3 font-bold">الإيميل</th>
                  <th className="pb-2 pe-3 font-bold">الدفعة</th>
                  <th className="pb-2 pe-3 font-bold">XP</th>
                  <th className="pb-2 pe-3 font-bold">الصلاحية</th>
                  <th className="pb-2 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-zinc-600">مفيش مستخدمين.</td>
                  </tr>
                ) : adminUsers.map((u: any) => (
                  <tr key={u.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                    <td className="py-2.5 pe-3 font-bold text-white"><bdi dir="ltr">@{u.username}</bdi></td>
                    <td className="py-2.5 pe-3 text-zinc-500">{u.email}</td>
                    <td className="py-2.5 pe-3 text-zinc-400">{u.batch}</td>
                    <td className="py-2.5 pe-3 text-orange-400 font-bold">{u.total_xp?.toLocaleString()}</td>
                    <td className="py-2.5 pe-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-2xs font-black uppercase ${
                          u.role === 'owner' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                          u.role === 'admin' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                          u.role === 'moderator' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                          'bg-white/5 text-zinc-500 border border-white/10'
                        }`}>
                          {u.role === 'user' ? 'Student' : u.role === 'moderator' ? 'Moderator' : u.role === 'admin' ? 'Admin' : 'Owner'}
                        </span>
                        {u.role === 'owner' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-2xs font-black uppercase tracking-wider animate-pulse">
                            محمي
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-center">
                      <div className="flex gap-1 justify-center">
                        {(() => {
                          const ROLE_WEIGHTS = { user: 0, moderator: 1, admin: 2, owner: 3 };
                          const requesterWeight = ROLE_WEIGHTS[user?.role] || 0;
                          const targetWeight = ROLE_WEIGHTS[u.role] || 0;
                          
                          const canChangeRole = requesterWeight >= 2 && requesterWeight > targetWeight && u.id !== user.id;
                          const canModerate = requesterWeight > targetWeight && u.role !== 'owner' && u.id !== user.id;
                          const canDelete = user?.role === 'owner' && u.role !== 'owner' && u.id !== user.id;

                          return (
                            <>
                              {canChangeRole && (
                                <AdminBtn size="sm" variant="ghost" onClick={() => setSelectedRoleUser({ id: u.id, username: u.username, role: u.role })}>
                                  <RefreshCw className="w-3 h-3" /> الصلاحية
                                </AdminBtn>
                              )}
                              {canModerate && (
                                <AdminBtn size="sm" onClick={() => handleOpenModerationModal(u.username, u.id)}
                                  className="bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20"
                                >
                                  إجراء
                                </AdminBtn>
                              )}
                              {canDelete && (
                                <AdminBtn size="sm" variant="danger" onClick={() => handleAdminDeleteUser(u.id, u.username)}>
                                  <Trash2 className="w-3 h-3" />
                                </AdminBtn>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}



      {/* ── 5. FRAMES ──────────────────────────────────────────────────────── */}
      {adminSection === 'frames' && (
        <div className="space-y-5">
          <SectionCard>
            <SectionTitle icon={<Frame className="w-4 h-4" />} label="ارفع فريم جديد" />
            {frameError && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {frameError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="اسم الفريم"
                  placeholder="مثلًا: لهب أسطوري"
                  value={frameName}
                  onChange={(e) => setFrameName(e.target.value)}
                />
                <AdminInput
                  label="السعر بالـ XP"
                  type="number"
                  placeholder="500"
                  value={framePrice || ''}
                  onChange={(e) => setFramePrice(Math.max(0, Number(e.target.value)))}
                  min={0}
                />
              </div>
              <FileUploadBox
                label="صورة الفريم PNG (خلفية شفافة)"
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
                {frameUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> بنرفع…</> : <><Upload className="w-4 h-4" /> ارفع الفريم</>}
              </AdminBtn>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionTitle icon={<Frame className="w-4 h-4" />} label="الفريمات الموجودة" count={adminFrames.length} />
            {adminFrames.length === 0 ? (
              <p className="text-center text-zinc-600 text-[13px] py-8">مفيش فريمات لسه.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {adminFrames.map((f: any) => {
                  const isEditing = editingFrameId === f._id;
                  return (
                    <div key={f._id} className="rounded-xl border border-white/8 bg-white/2 p-3 flex flex-col items-center gap-2 text-center">
                      <div className="w-14 h-14 rounded-xl bg-black/30 overflow-hidden flex items-center justify-center">
                        <img src={f.image_url} alt={f.name} className="w-full h-full object-contain" />
                      </div>
                      <p className="text-xs font-bold text-white leading-tight">{f.name}</p>
                      
                      {isEditing ? (
                        <div className="space-y-1.5 w-full">
                          <input
                            type="number"
                            value={editingFramePrice}
                            onChange={(e) => setEditingFramePrice(Math.max(0, Number(e.target.value)))}
                            className="w-full px-2 py-1 text-xs rounded bg-white/5 border border-white/10 text-white text-center focus:outline-none focus:border-orange-500/60"
                            min={0}
                          />
                          <div className="flex gap-1 justify-center w-full">
                            <AdminBtn
                              size="sm"
                              variant="success"
                              onClick={() => handleUpdateFramePrice(f._id, editingFramePrice)}
                              className="px-2 py-1 text-2xs flex-1 justify-center"
                            >
                              حفظ
                            </AdminBtn>
                            <AdminBtn
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingFrameId(null)}
                              className="px-2 py-1 text-2xs flex-1 justify-center"
                            >
                              إلغاء
                            </AdminBtn>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-center">
                          <p className="text-2xs text-orange-400 font-bold" dir="ltr">{f.price.toLocaleString()} XP</p>
                          <button
                            onClick={() => {
                              setEditingFrameId(f._id);
                              setEditingFramePrice(f.price);
                            }}
                            className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            title="تعديل السعر"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {!isEditing && (
                        <AdminBtn size="sm" variant="danger" onClick={() => handleDeleteFrame(f._id)} className="w-full justify-center text-2xs py-1 mt-1">
                          <Trash2 className="w-3 h-3" /> حذف
                        </AdminBtn>
                      )}
                    </div>
                  );
                })}
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

      {/* ── 7. SYSTEM PROFILE SETTINGS ─────────────────────────────────────── */}
      {adminSection === 'system_profile' && (
        <SystemProfileConfig
          token={token}
          apiBase={API_BASE}
          setAdminMessage={setAdminMessage}
          showConfirm={showConfirm}
        />
      )}

      {/* ── 8. AUDIT LOGS (OWNER ONLY) ─────────────────────────────────────── */}
      {adminSection === 'audit_logs' && user?.role === 'owner' && (
        <div className="space-y-5">
          {/* Timeline & Filters Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick Timeline of last 5 entries */}
            <SectionCard className="lg:col-span-1">
              <SectionTitle icon={<Clock className="w-4 h-4" />} label="آخر النشاطات" />
              <div className="space-y-3 max-h-60 overflow-y-auto pe-1">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="relative ps-4 border-s-2 border-orange-500/30 py-0.5 text-start">
                    <div className="absolute w-2 h-2 rounded-full bg-orange-500 -start-[5px] top-1.5" />
                    <p className="text-2xs text-zinc-500 font-bold">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(log.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-white font-bold leading-tight mt-0.5">
                      @{log.moderator?.username || 'System'}
                    </p>
                    <p className="text-2xs text-zinc-400 leading-normal truncate">
                      {log.action} on {log.target_type}
                    </p>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-center text-zinc-650 text-xs py-4">مفيش نشاط حديث.</p>
                )}
              </div>
            </SectionCard>

            {/* Filters panel */}
            <SectionCard className="lg:col-span-2">
              <SectionTitle icon={<Settings className="w-4 h-4" />} label="الفلاتر والبحث" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Search username */}
                  <div className="space-y-1.5 text-start">
                    <label className="text-2xs font-bold text-zinc-500 uppercase tracking-wider">ابحث باسم المستخدم أو السبب</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ابحث…"
                        value={auditFilters.search}
                        onChange={(e) => setAuditFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full ps-8 pe-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-650 text-xs focus:outline-none focus:border-orange-500/50"
                      />
                      <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  {/* Action filter */}
                  <AdminSelect
                    label="نوع الإجراء"
                    value={auditFilters.action}
                    onChange={(e) => setAuditFilters(prev => ({ ...prev, action: e.target.value }))}
                  >
                    <option value="" className="bg-zinc-900">كل الإجراءات</option>
                    <option value="promote" className="bg-zinc-900">ترقية</option>
                    <option value="demote" className="bg-zinc-900">تخفيض</option>
                    <option value="mute" className="bg-zinc-900">كتم</option>
                    <option value="unmute" className="bg-zinc-900">إلغاء الكتم</option>
                    <option value="ban" className="bg-zinc-900">حظر</option>
                    <option value="unban" className="bg-zinc-900">إلغاء الحظر</option>
                    <option value="approve_post" className="bg-zinc-900">قبول بوست</option>
                    <option value="reject_post" className="bg-zinc-900">رفض بوست</option>
                    <option value="approve_revision" className="bg-zinc-900">قبول تعديل</option>
                    <option value="reject_revision" className="bg-zinc-900">رفض تعديل</option>
                    <option value="delete_post" className="bg-zinc-900">حذف بوست</option>
                    <option value="approve_suggestion" className="bg-zinc-900">قبول اقتراح</option>
                    <option value="reject_suggestion" className="bg-zinc-900">رفض اقتراح</option>
                    <option value="delete_comment" className="bg-zinc-900">حذف تعليق</option>
                    <option value="delete_chat_message" className="bg-zinc-900">حذف رسالة شات</option>
                  </AdminSelect>

                  {/* Date range filter */}
                  <AdminSelect
                    label="الفترة"
                    value={auditFilters.dateRange}
                    onChange={(e) => setAuditFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  >
                    <option value="today" className="bg-zinc-900">النهارده</option>
                    <option value="7days" className="bg-zinc-900">آخر 7 أيام</option>
                    <option value="30days" className="bg-zinc-900">آخر 30 يوم</option>
                    <option value="custom" className="bg-zinc-900">فترة مخصصة</option>
                  </AdminSelect>
                </div>

                {auditFilters.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 text-start">
                    <AdminInput
                      label="من"
                      type="date"
                      value={auditFilters.startDate}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                    <AdminInput
                      label="إلى"
                      type="date"
                      value={auditFilters.endDate}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <AdminBtn size="sm" variant="ghost" onClick={() => {
                    setAuditFilters({
                      search: '',
                      action: '',
                      targetType: '',
                      dateRange: '30days',
                      startDate: '',
                      endDate: '',
                      page: 1,
                    });
                  }}>
                    مسح الفلاتر
                  </AdminBtn>
                  <AdminBtn size="sm" onClick={() => fetchAuditLogs(false)}>
                    <Search className="w-3 h-3" /> ابحث
                  </AdminBtn>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Logs Table Card */}
          <SectionCard>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <h4 className="text-xs font-black uppercase text-zinc-450 tracking-wider">Audit Log Records ({auditPagination.total})</h4>
              {auditLoading && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[650px] text-start">
                <thead>
                  <tr className="border-b border-white/8 text-zinc-550">
                    <th className="pb-2 pe-3 font-bold">إجراء</th>
                    <th className="pb-2 pe-3 font-bold">المنفّذ</th>
                    <th className="pb-2 pe-3 font-bold">الصلاحية</th>
                    <th className="pb-2 pe-3 font-bold">الهدف</th>
                    <th className="pb-2 pe-3 font-bold">التاريخ</th>
                    <th className="pb-2 font-bold text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    return (
                      <tr key={log.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                        <td className="py-2.5 pe-3">
                          <span className="font-extrabold text-white">{log.action}</span>
                        </td>
                        <td className="py-2.5 pe-3 text-zinc-300">
                          @{log.moderator?.username || 'System'}
                        </td>
                        <td className="py-2.5 pe-3">
                          <span className="text-2xs uppercase font-bold text-orange-400">
                            {log.actor_role || log.moderator?.role}
                          </span>
                        </td>
                        <td className="py-2.5 pe-3 text-zinc-400 capitalize">
                          {log.target_type} ({log.target_user ? `@${log.target_user.username}` : log.target_id || 'N/A'})
                        </td>
                        <td className="py-2.5 pe-3 text-zinc-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-center">
                          <AdminBtn size="sm" variant="ghost" onClick={() => setSelectedLog(log)}>
                            عرض
                          </AdminBtn>
                        </td>
                      </tr>
                    );
                  })}
                  {auditLogs.length === 0 && !auditLoading && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-650 font-bold">مفيش سجلات بالفلاتر دي.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {auditPagination.hasMore && (
              <div className="pt-4 flex justify-center">
                <AdminBtn size="sm" variant="ghost" onClick={() => fetchAuditLogs(true)} disabled={auditLoading}>
                  {auditLoading ? 'Loading...' : 'Load More Logs'}
                </AdminBtn>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* Details Drawer for selected log entry */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 bg-black/80 z-[99999] flex justify-end animate-fade-in" onClick={() => setSelectedLog(null)}>
            <m.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-zinc-950 border-s border-white/8 h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2 text-orange-400">
                    <ShieldAlert className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-wider">تفاصيل السجل</h3>
                  </div>
                  <button onClick={() => setSelectedLog(null)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/8 text-zinc-400 hover:text-white cursor-pointer transition-all">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-start">
                  {/* Action summary */}
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/15">
                    <p className="text-2xs text-orange-400 font-bold uppercase tracking-wider">الإجراء</p>
                    <p className="text-base font-black text-white mt-1">{selectedLog.action}</p>
                    <p className="text-xs text-zinc-450 mt-1">الحالة: تم</p>
                  </div>

                  {/* Actor details */}
                  <div className="space-y-1">
                    <p className="text-2xs text-zinc-500 font-bold uppercase tracking-wider">المنفّذ</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                        {(selectedLog.moderator?.username || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">@{selectedLog.moderator?.username || 'System'}</p>
                        <p className="text-2xs text-zinc-500">الصلاحية: <span className="uppercase font-bold text-orange-400">{selectedLog.actor_role || selectedLog.moderator?.role}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Target details */}
                  <div className="space-y-1">
                    <p className="text-2xs text-zinc-500 font-bold uppercase tracking-wider">العنصر المستهدف</p>
                    <div className="p-3 bg-white/3 rounded-xl border border-white/5 space-y-1 text-xs">
                      <p className="text-white"><span className="text-zinc-500">النوع:</span> <span className="capitalize font-bold">{selectedLog.target_type}</span></p>
                      <p className="text-white"><span className="text-zinc-500">ID:</span> {selectedLog.target_id || 'N/A'}</p>
                      {selectedLog.target_user && (
                        <p className="text-white"><span className="text-zinc-500">المستخدم المستهدف:</span> <bdi dir="ltr">@{selectedLog.target_user.username}</bdi> (ID: {selectedLog.target_user.id})</p>
                      )}
                    </div>
                  </div>

                  {/* Reason & details */}
                  <div className="space-y-1">
                    <p className="text-2xs text-zinc-500 font-bold uppercase tracking-wider">سبب المشرف</p>
                    <p className="text-xs text-zinc-300 bg-white/2 p-3 rounded-xl border border-white/5 leading-relaxed whitespace-pre-line">
                      {selectedLog.reason || 'No reason provided.'}
                    </p>
                  </div>

                  {/* Technical Metadata */}
                  <div className="space-y-1">
                    <p className="text-2xs text-zinc-500 font-bold uppercase tracking-wider">بيانات إضافية</p>
                    <pre className="text-2xs text-orange-400/90 font-mono bg-black/60 p-3 rounded-xl border border-white/5 overflow-x-auto max-h-40">
                      {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                    </pre>
                  </div>

                  {/* IP Address & Time */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-2xs text-zinc-500 font-bold uppercase tracking-wider">عنوان IP</p>
                      <p className="text-xs text-zinc-300 font-mono mt-0.5">{selectedLog.ip_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-zinc-500 font-bold uppercase tracking-wider">الوقت</p>
                      <p className="text-xs text-zinc-300 mt-0.5">{new Date(selectedLog.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <AdminBtn
                  variant="danger"
                  className="w-full justify-center"
                  onClick={() => handleSoftDeleteLog(selectedLog.id)}
                >
                  <Trash2 className="w-4 h-4" /> حذف السجل
                </AdminBtn>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Select Modal */}
      <RoleSelectModal
        isOpen={selectedRoleUser !== null}
        onClose={() => setSelectedRoleUser(null)}
        targetUser={selectedRoleUser}
        currentUserRole={user?.role || 'user'}
        onConfirm={handleConfirmRoleChange}
        isLoading={roleLoading}
      />
    </m.div>
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
  game_play:     { label: 'Memory Game Play',     desc: 'XP awarded for completing the single-player match game (Limit: 3 daily rewarded wins).',       icon: <Settings  className="w-4 h-4" /> },
  referral:      { label: 'Shared Link Visit',    desc: 'XP awarded when a visitor visits user\'s shared link.',        icon: <Users     className="w-4 h-4" /> },
  surprise_box:  { label: 'Surprise Box Claim',   desc: 'XP awarded when opening the daily surprise box.',              icon: <Settings  className="w-4 h-4" /> },
  poll_vote:     { label: 'Daily Poll Vote',      desc: 'XP awarded for voting in the daily dashboard poll.',            icon: <CheckCircle className="w-4 h-4" /> },
  quiz_solve:    { label: 'Quiz Solved',          desc: 'Fallback XP for solving an episode quiz.',                     icon: <CheckCircle className="w-4 h-4" /> },
  question_of_the_day_correct: { label: 'Question Of The Day Correct', desc: 'XP awarded for answering the daily question correctly.', icon: <CheckCircle className="w-4 h-4" /> },
  question_of_the_day_wrong:   { label: 'Question Of The Day Wrong',   desc: 'XP awarded for answering the daily question incorrectly.', icon: <XCircle className="w-4 h-4" /> },
  suggestion_create:           { label: 'Suggestion Submitted',        desc: 'XP awarded for submitting a new suggestion or feedback.',   icon: <Lightbulb className="w-4 h-4" /> },
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
    question_of_the_day_correct: 50,
    question_of_the_day_wrong: 10,
    suggestion_create: 50,
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
      setError('مش قادرين نوصل للسيرفر.');
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
        setAdminMessage('إعدادات XP اتحفظت!');
        fetchXpSettings();
      } else {
        setError(data.error || 'Failed to update XP settings.');
      }
    } catch {
      setError('مش قادرين نوصل للسيرفر.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/8 bg-zinc-900/60 p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-2" />
        <p className="text-zinc-500 text-[13px]">بنحمّل إعدادات XP…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-orange-400">
          <Settings className="w-4 h-4" />
        </div>
        <h3 className="text-[15px] font-black text-white">إعدادات مكافآت XP</h3>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
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
                <p className="text-xs font-bold text-white">{meta.label}</p>
                <p className="text-2xs text-zinc-600 leading-tight">{meta.desc}</p>
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
                <span className="text-2xs text-zinc-600 font-bold">XP</span>
              </div>
            </div>
          );
        })}

        <div className="pt-2">
          <m.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-sm hover:from-orange-400 hover:to-amber-400 transition-colors disabled:opacity-60"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> بنحفظ…</> : <><Save className="w-4 h-4" /> احفظ إعدادات XP</>}
          </m.button>
        </div>
      </form>
    </div>
  );
};

// ─── System Profile Config Sub-Component ─────────────────────────────────────
const SystemProfileConfig: React.FC<{
  token: string | null;
  apiBase: string;
  setAdminMessage: (msg: string) => void;
  showConfirm: any;
}> = ({ token, apiBase, setAdminMessage, showConfirm }) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/system-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setName(data.name || '');
        setAvatarUrl(data.avatar || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setAdminMessage('الاسم مطلوب.');
      return;
    }
    setSaving(true);
    setAdminMessage('');
    let finalAvatar = avatarUrl;

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('image', avatarFile);
        const uploadRes = await fetch(`${apiBase}/api/upload/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          finalAvatar = uploadData.url;
          setAvatarUrl(uploadData.url);
          setAvatarFile(null);
        } else {
          setAdminMessage(uploadData.error || 'Failed to upload profile image.');
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`${apiBase}/api/admin/system-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim(), avatar: finalAvatar })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminMessage('الحساب الرسمي اتحدّث! 🎉');
      } else {
        setAdminMessage(data.error || 'Failed to update profile settings.');
      }
    } catch (err) {
      console.error(err);
      setAdminMessage('الاتصال فشل.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <SectionCard>
      <SectionTitle icon={<ShieldCheck className="w-4 h-4 text-orange-400" />} label="الحساب الرسمي لليه فيزيو" />
      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        الاسم والصورة دول بيظهروا على الإعلانات الرسمية. الأدمن بس هو اللي بينشرها.
      </p>
      <form onSubmit={handleSave} className="space-y-4 text-start">
        <AdminInput
          label="الاسم الرسمي"
          placeholder="مثلًا LehPhysio"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">الصورة الرسمية</p>
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            />
            <div className="rounded-xl border-2 border-dashed border-white/15 bg-white/2 hover:border-orange-500/40 hover:bg-orange-500/3 transition-all text-center p-5 flex flex-col items-center gap-2">
              {avatarFile ? (
                <>
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                    <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-bold text-white">{avatarFile.name}</p>
                </>
              ) : avatarUrl ? (
                <>
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                    <img src={avatarUrl} alt="LehPhysio" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-2xs text-zinc-500">الصورة الرسمية — اضغط للتغيير</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-orange-400" />
                  </div>
                  <p className="text-[13px] font-bold text-white">ارفع صورة</p>
                </>
              )}
            </div>
          </label>
        </div>

        <AdminBtn type="submit" disabled={saving} className="w-full justify-center">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> بنحفظ…</>
          ) : (
            <><Save className="w-4 h-4" /> احفظ الحساب الرسمي</>
          )}
        </AdminBtn>
      </form>
    </SectionCard>
  );
};
