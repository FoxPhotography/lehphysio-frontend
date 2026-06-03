import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  FileText,
  FileEdit,
  Lightbulb,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ThumbsUp,
  Clock,
  Search,
  MessageSquare,
  ChevronDown,
  UserX,
  VolumeX,
  Volume2,
  Lock,
  Unlock,
  Check,
  Eye,
} from 'lucide-react';

interface ModeratorDashboardProps {
  user: any;
  token: string | null;
  apiBase: string;
  showConfirm?: any;
  handleOpenModerationModal?: any;
  setCurrentPage: (page: string) => void;
}

export const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({
  user,
  token,
  apiBase,
  showConfirm,
  handleOpenModerationModal,
  setCurrentPage,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'revisions' | 'suggestions' | 'users' | 'reports'>('posts');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Rejection modal state
  const [rejectionPostId, setRejectionPostId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectingRevision, setIsRejectingRevision] = useState(false);

  // User moderation form states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modAction, setModAction] = useState<'mute' | 'unmute' | 'ban' | 'unban'>('mute');
  const [modDuration, setModDuration] = useState('1d');
  const [modReason, setModReason] = useState('');
  const [modSubmitting, setModSubmitting] = useState(false);

  // Fetch pending posts (both new pending posts and revisions)
  const fetchPendingPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/posts/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPendingPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin suggestions review
  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users list for moderation
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts' || activeTab === 'revisions') {
      fetchPendingPosts();
    } else if (activeTab === 'suggestions') {
      fetchSuggestions();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  // Handle Post Moderation (Approve)
  const handleApprovePost = async (postId: number, isRevision: boolean) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/posts/${postId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(isRevision ? 'تم قبول تعديلات المنشور بنجاح! 🎉' : 'تم الموافقة على نشر المنشور بنجاح! 🎉');
        fetchPendingPosts();
      } else {
        setMessage(data.error || 'Failed to approve post.');
      }
    } catch (err) {
      setMessage('Failed to connect to server.');
    }
  };

  // Open rejection modal
  const handleOpenRejectionModal = (postId: number, isRevision: boolean) => {
    setRejectionPostId(postId);
    setIsRejectingRevision(isRevision);
    setRejectionReason('');
  };

  // Handle Post Moderation (Reject)
  const handleRejectPostSubmit = async () => {
    if (!rejectionPostId) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/posts/${rejectionPostId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectionReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(isRejectingRevision ? 'تم رفض وإلغاء تعديل المنشور.' : 'تم رفض وحذف المنشور المعلق.');
        setRejectionPostId(null);
        fetchPendingPosts();
      } else {
        setMessage(data.error || 'Failed to reject post.');
      }
    } catch (err) {
      setMessage('Failed to connect to server.');
    }
  };

  // Handle Suggestion Moderation
  const handleSuggestionStatus = async (suggestionId: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`${apiBase}/api/admin/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessage(status === 'approved' ? 'تم الموافقة على الاقتراح!' : 'تم رفض الاقتراح.');
        fetchSuggestions();
      }
    } catch (err) {
      setMessage('Failed to moderate suggestion.');
    }
  };

  // Handle User Moderation Form Submit
  const handleUserModerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setMessage('Please select a user to moderate.');
      return;
    }
    setModSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`${apiBase}/api/admin/users/${selectedUser.id}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: modAction,
          duration: ['mute', 'ban'].includes(modAction) ? modDuration : undefined,
          reason: modReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || `Action ${modAction} applied successfully.`);
        setModReason('');
        setSelectedUser(null);
        fetchUsers();
      } else {
        setMessage(data.error || 'Failed to moderate user.');
      }
    } catch (err) {
      setMessage('Failed to connect to server.');
    } finally {
      setModSubmitting(false);
    }
  };

  // Filter users based on search
  const filteredUsers = usersList.filter(u =>
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Separate pending new posts and edits
  const pendingNewPosts = pendingPosts.filter(p => !p.is_edit_draft);
  const pendingRevisions = pendingPosts.filter(p => p.is_edit_draft);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto px-4 pt-20 md:pt-6 space-y-5 pb-16"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">Moderator Dashboard</h1>
          <p className="text-[12px] text-zinc-500">
            Daily content moderation &amp; user management
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: 'posts', label: 'Pending Posts', icon: <FileText className="w-3.5 h-3.5" />, count: pendingNewPosts.length },
          { id: 'revisions', label: 'Post Revisions', icon: <FileEdit className="w-3.5 h-3.5" />, count: pendingRevisions.length },
          { id: 'suggestions', label: 'Suggestions', icon: <Lightbulb className="w-3.5 h-3.5" />, count: suggestions.filter(s => s.status === 'pending').length },
          { id: 'users', label: 'User Actions', icon: <UserCheck className="w-3.5 h-3.5" /> },
          { id: 'reports', label: 'Reports Queue', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setMessage('');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20'
                : 'bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:border-white/15'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-black/25 text-black' : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[13px] text-white"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Indicator */}
      {loading && pendingPosts.length === 0 && suggestions.length === 0 && usersList.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-zinc-900/60 p-12 text-center">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-xs">Loading queue items...</p>
        </div>
      )}

      {/* ── 1. PENDING POSTS ────────────────────────────────────────────── */}
      {activeTab === 'posts' && !loading && (
        <div className="space-y-4">
          {pendingNewPosts.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-zinc-900/40 p-8 text-center text-zinc-500 text-[13px]">
              No new posts pending approval.
            </div>
          ) : (
            pendingNewPosts.map((post) => (
              <div key={post.id} className="rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                    {post.avatar_url ? (
                      <img src={post.avatar_url} alt={post.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[14px] font-bold text-zinc-400">{post.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-white">@{post.username}</h4>
                    <p className="text-[10px] text-zinc-500">{post.batch} · {new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  {post.title && <h3 className="text-sm font-bold text-white leading-tight">{post.title}</h3>}
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{post.content}</p>
                  {post.image_url && (
                    <div className="rounded-xl overflow-hidden max-h-60 border border-white/10">
                      <img src={post.image_url} alt="Post Attachment" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleApprovePost(post.id, false)}
                    className="flex-1 bg-emerald-500 text-black font-black text-xs py-2.5 rounded-xl cursor-pointer hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Post
                  </button>
                  <button
                    onClick={() => handleOpenRejectionModal(post.id, false)}
                    className="border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── 2. POST REVISIONS ───────────────────────────────────────────── */}
      {activeTab === 'revisions' && !loading && (
        <div className="space-y-4">
          {pendingRevisions.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-zinc-900/40 p-8 text-center text-zinc-500 text-[13px]">
              No post revisions pending approval.
            </div>
          ) : (
            pendingRevisions.map((post) => (
              <div key={post.id} className="rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                    {post.avatar_url ? (
                      <img src={post.avatar_url} alt={post.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[14px] font-bold text-zinc-400">{post.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-white">@{post.username}</h4>
                    <p className="text-[10px] text-zinc-500">Revision Request · {new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Compare Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Live version */}
                  <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4 space-y-2 relative text-left">
                    <span className="absolute top-2.5 right-2.5 bg-zinc-800 text-zinc-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Live Approved</span>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Original Post</p>
                    {post.original_title && <h4 className="text-[12px] font-bold text-zinc-400 leading-tight">{post.original_title}</h4>}
                    <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line truncate-5">{post.original_content}</p>
                    {post.original_image_url && (
                      <div className="rounded-lg overflow-hidden h-24 border border-white/5 mt-1.5 opacity-60">
                        <img src={post.original_image_url} alt="Original Attachment" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Pending Revision */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/3 p-4 space-y-2 relative text-left">
                    <span className="absolute top-2.5 right-2.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">New Edit</span>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">Revision Draft</p>
                    {post.title && <h4 className="text-[12px] font-black text-white leading-tight">{post.title}</h4>}
                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">{post.content}</p>
                    {post.image_url && (
                      <div className="rounded-lg overflow-hidden h-28 border border-white/10 mt-1.5">
                        <img src={post.image_url} alt="Revision Attachment" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleApprovePost(post.id, true)}
                    className="flex-1 bg-emerald-500 text-black font-black text-xs py-2.5 rounded-xl cursor-pointer hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Revision
                  </button>
                  <button
                    onClick={() => handleOpenRejectionModal(post.id, true)}
                    className="border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject Revision
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── 3. SUGGESTIONS QUEUE ────────────────────────────────────────── */}
      {activeTab === 'suggestions' && !loading && (
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-zinc-900/40 p-8 text-center text-zinc-500 text-[13px]">
              No suggestions in database.
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-2xl border p-4.5 space-y-3 text-left transition-all ${
                    s.status === 'approved' ? 'border-emerald-500/20 bg-emerald-500/3' :
                    s.status === 'rejected' ? 'border-red-500/20 bg-red-500/3' :
                    'border-white/8 bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-[13px] font-bold text-white">{s.title}</h4>
                      <p className="text-[10px] text-zinc-500">
                        Submitted by @{s.username} · {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border shrink-0 ${
                      s.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                      s.status === 'rejected' ? 'bg-red-500/15 text-red-400 border-red-500/25' :
                      'bg-zinc-800 text-zinc-400 border-white/10'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-zinc-300 leading-relaxed">{s.content}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1 text-[11px] text-orange-400 font-bold">
                      <ThumbsUp className="w-3.5 h-3.5" /> {s.upvotes || 0} Upvotes
                    </span>

                    {s.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSuggestionStatus(s.id, 'approved')}
                          className="bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleSuggestionStatus(s.id, 'rejected')}
                          className="bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. USER MODERATION ACTIONS ───────────────────────────────────── */}
      {activeTab === 'users' && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* User selector column */}
          <div className="md:col-span-2 rounded-2xl border border-white/8 bg-zinc-900/60 p-4 space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Select Member</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search username or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/50"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-zinc-600 text-xs py-4">No users found.</p>
              ) : (
                filteredUsers.map((u) => {
                  const ROLE_WEIGHTS = { user: 0, moderator: 1, admin: 2, owner: 3 };
                  const targetWeight = ROLE_WEIGHTS[u.role] || 0;
                  const requesterWeight = ROLE_WEIGHTS[user.role] || 0;
                  const isModeratable = requesterWeight > targetWeight && u.id !== user.id;

                  return (
                    <button
                      key={u.id}
                      disabled={!isModeratable}
                      onClick={() => setSelectedUser(u)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        selectedUser?.id === u.id
                          ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold'
                          : isModeratable 
                            ? 'hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                            : 'opacity-40 cursor-not-allowed border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold truncate">@{u.username}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                            u.role === 'owner' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
                            u.role === 'admin' ? 'bg-orange-500/15 text-orange-400 border-orange-500/25' :
                            u.role === 'moderator' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                            'bg-white/5 text-zinc-500 border-white/10'
                          }`}>
                            {u.role === 'user' ? 'Student' : u.role === 'moderator' ? 'Moderator' : u.role === 'admin' ? 'Admin' : 'Owner'}
                          </span>
                          {u.role === 'owner' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider animate-pulse">
                              Protected
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500">{u.batch}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center flex-shrink-0">
                        {u.is_muted ? <span title="Muted"><VolumeX className="w-3.5 h-3.5 text-orange-400" /></span> : null}
                        {u.is_banned ? <span title="Banned"><UserX className="w-3.5 h-3.5 text-red-500" /></span> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Action form column */}
          <div className="md:col-span-3 rounded-2xl border border-white/8 bg-zinc-900/60 p-5">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-4">Moderation Action</h3>
            {selectedUser ? (
              <form onSubmit={handleUserModerateSubmit} className="space-y-4 text-left">
                <div className="p-3 bg-zinc-950/40 rounded-xl border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                    {selectedUser.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">Targeting: @{selectedUser.username}</p>
                    <p className="text-[10px] text-zinc-500">Currently: {selectedUser.is_banned ? 'Banned' : selectedUser.is_muted ? 'Muted' : 'Normal'}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Action Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'mute', label: 'Mute User', icon: <VolumeX className="w-3.5 h-3.5" /> },
                      { id: 'unmute', label: 'Unmute', icon: <Volume2 className="w-3.5 h-3.5" /> },
                      { id: 'ban', label: 'Ban User', icon: <Lock className="w-3.5 h-3.5" /> },
                      { id: 'unban', label: 'Unban', icon: <Unlock className="w-3.5 h-3.5" /> },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setModAction(act.id as any)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold justify-center cursor-pointer transition-all ${
                          modAction === act.id
                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                            : 'bg-white/3 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {act.icon}
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>

                {['mute', 'ban'].includes(modAction) && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Duration</label>
                    <div className="relative">
                      <select
                        value={modDuration}
                        onChange={(e) => setModDuration(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white font-bold focus:border-red-500/50 outline-none appearance-none"
                      >
                        <option value="1h">1 Hour</option>
                        <option value="1d">1 Day</option>
                        <option value="7d">7 Days</option>
                        <option value="permanent">Permanent</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rejection/Moderation Reason</label>
                  <textarea
                    placeholder="Provide details or reasons for this action (optional)..."
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-red-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={modSubmitting}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-xs py-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {modSubmitting ? 'Applying moderation...' : 'Execute Moderation'}
                </button>
              </form>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-zinc-600 text-xs font-bold">
                Select a member on the left to moderate
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. REPORTS QUEUE (FUTURE-READY PLACEHOLDER) ────────────────────── */}
      {activeTab === 'reports' && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/60 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto text-red-400 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-white">Reports Handling Queue</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              This section is prepared for receiving reported content (posts, comments, chat messages) flag notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-4">
            {[
              { label: 'Reported Posts', count: 0, desc: 'Flagged community feed content' },
              { label: 'Reported Comments', count: 0, desc: 'Flagged replies & discussion items' },
              { label: 'Reported Messages', count: 0, desc: 'Flagged public chat logs' },
            ].map((rep, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 text-left space-y-1">
                <span className="bg-zinc-800 text-zinc-500 text-[10px] font-bold px-1.5 py-0.5 rounded">0 pending</span>
                <h4 className="text-[11px] font-black text-white pt-1">{rep.label}</h4>
                <p className="text-[9px] text-zinc-600 leading-tight">{rep.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection reason modal */}
      <AnimatePresence>
        {rejectionPostId !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md p-6 relative flex flex-col gap-4 border border-white/10"
            >
              <div className="flex items-center gap-2.5 text-red-400">
                <XCircle className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-base font-black tracking-tight">
                  {isRejectingRevision ? 'رفض تعديل المنشور المعلق' : 'رفض وحذف المنشور المعلق'}
                </h3>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">السبب (اختياري)</label>
                <textarea
                  placeholder="اكتب سبب الرفض لمشاركته مع الكاتب..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleRejectPostSubmit}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-xs py-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                >
                  تأكيد الرفض
                </button>
                <button
                  onClick={() => setRejectionPostId(null)}
                  className="border border-zinc-800 hover:bg-zinc-900/60 text-zinc-400 font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
