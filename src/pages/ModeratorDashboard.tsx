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
  BarChart3,
  HelpCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { PremiumDateTimePicker } from '../components/PremiumDateTimePicker';

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
  const [activeTab, setActiveTab] = useState<'posts' | 'revisions' | 'suggestions' | 'users' | 'reports' | 'qotd'>('posts');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [reports, setReports] = useState<any[]>([]);



  // Question of the Day states
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [qQuestion, setQQuestion] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState<number>(0);
  const [qPublishAt, setQPublishAt] = useState('');
  const [qStatus, setQStatus] = useState<'Draft' | 'Scheduled'>('Scheduled');
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [selectedStats, setSelectedStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [qSubmitting, setQSubmitting] = useState(false);

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

  // Fetch content reports list
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Action on reports
  const handleResolveReport = async (reportId: number, action: 'dismiss' | 'resolve_delete') => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(action === 'dismiss' ? 'Report dismissed successfully.' : 'Content deleted and report resolved.');
        fetchReports();
      } else {
        setMessage(data.error || 'Failed to resolve report.');
      }
    } catch (err) {
      console.error('Error resolving report:', err);
      setMessage('Failed to process request due to a server error.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all QOTDs (Moderators/Admins)
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/questions/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuestionsList(data);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit QOTD (create/edit)
  const handleQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = qQuestion.trim();
    if (!cleanQuestion) {
      setMessage('Please enter the question text.');
      return;
    }
    const cleanOpts = qOptions.map(opt => opt.trim()).filter(Boolean);
    if (cleanOpts.length < 2) {
      setMessage('Please provide at least two choices.');
      return;
    }
    setQSubmitting(true);
    setMessage('');
    try {
      const url = editingQuestionId 
        ? `${apiBase}/api/questions/admin/${editingQuestionId}`
        : `${apiBase}/api/questions/admin`;
      const method = editingQuestionId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: cleanQuestion,
          options: cleanOpts,
          correct_answer: qCorrect,
          publish_at: qPublishAt ? new Date(qPublishAt).toISOString() : '',
          status: qStatus
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(editingQuestionId ? 'Question updated successfully!' : 'Daily Question created and scheduled successfully!');
        setQQuestion('');
        setQOptions(['', '', '', '']);
        setQCorrect(0);
        setQPublishAt('');
        setQStatus('Scheduled');
        setEditingQuestionId(null);
        fetchQuestions();
      } else {
        setMessage(data.error || 'Failed to save question.');
      }
    } catch (err) {
      console.error('Error saving question:', err);
      setMessage('Failed to connect to server.');
    } finally {
      setQSubmitting(false);
    }
  };

  // Delete QOTD
  const handleQDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`${apiBase}/api/questions/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Question deleted successfully.');
        fetchQuestions();
      } else {
        setMessage(data.error || 'Failed to delete question.');
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      setMessage('Failed to connect to server.');
    }
  };

  // Fetch statistics of QOTD
  const fetchQStats = async (id: number) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/questions/admin/${id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedStats(data);
      } else {
        setMessage(data.error || 'Failed to fetch question statistics.');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setMessage('Failed to connect to server.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Edit action helper
  const handleEditClick = (q: any) => {
    setEditingQuestionId(q._id || q.id);
    setQQuestion(q.question);
    const padded = [...q.options];
    while (padded.length < 4) padded.push('');
    setQOptions(padded);
    setQCorrect(q.correct_answer);
    
    if (q.publish_at) {
      const date = new Date(q.publish_at);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      setQPublishAt(localDate.toISOString().slice(0, 16));
    } else {
      setQPublishAt('');
    }
    
    setQStatus(q.status);
    setMessage('');
  };

  useEffect(() => {
    if (activeTab === 'posts' || activeTab === 'revisions') {
      fetchPendingPosts();
    } else if (activeTab === 'suggestions') {
      fetchSuggestions();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'qotd') {
      fetchQuestions();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('change_moderator_tab', handleTabChange);

    const savedTab = localStorage.getItem('moderator_active_tab');
    if (savedTab) {
      setActiveTab(savedTab as any);
      localStorage.removeItem('moderator_active_tab');
    }

    return () => {
      window.removeEventListener('change_moderator_tab', handleTabChange);
    };
  }, []);

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
        setMessage(isRevision ? 'Edit approved successfully!' : 'Post approved successfully!');
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
        setMessage(isRejectingRevision ? 'Edit rejected successfully!' : 'Post rejected successfully.');
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
  const handleSuggestionStatus = async (suggestionId: number, status: 'approved' | 'rejected', action?: string, reason?: string) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, action, reason }),
      });
      if (res.ok) {
        if (action === 'approve_revision') {
          setMessage('Suggestion edit approved!');
        } else if (action === 'reject_revision') {
          setMessage('Suggestion edit rejected.');
        } else if (action === 'approve_delete') {
          setMessage('Suggestion deletion approved.');
        } else if (action === 'reject_delete') {
          setMessage('Suggestion deletion rejected.');
        } else {
          setMessage(status === 'approved' ? 'Suggestion approved!' : 'Suggestion rejected.');
        }
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
          { id: 'qotd', label: 'Daily Question', icon: <HelpCircle className="w-3.5 h-3.5" /> },
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
      {loading && pendingPosts.length === 0 && suggestions.length === 0 && usersList.length === 0 && questionsList.length === 0 && !selectedStats && (
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
              {suggestions.map((s) => {
                let statusColor = 'text-zinc-500';
                let statusBg = 'bg-zinc-800 text-zinc-400 border-white/10';
                let statusLabel = s.status;

                if (s.delete_pending) {
                  statusColor = 'text-red-400';
                  statusBg = 'bg-red-500/15 text-red-400 border-red-500/25';
                  statusLabel = 'Delete Pending';
                } else if (s.edit_draft) {
                  statusColor = 'text-amber-400';
                  statusBg = 'bg-amber-500/15 text-amber-400 border-amber-500/25';
                  statusLabel = 'Edit Pending';
                } else if (s.status === 'approved') {
                  statusColor = 'text-emerald-400';
                  statusBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
                } else if (s.status === 'rejected') {
                  statusColor = 'text-red-400';
                  statusBg = 'bg-red-500/15 text-red-400 border-red-500/25';
                }

                return (
                  <div
                    key={s.id}
                    className={`rounded-2xl border p-4.5 space-y-4 text-left transition-all ${
                      s.delete_pending ? 'border-red-500/25 bg-red-500/5' :
                      s.edit_draft ? 'border-amber-500/25 bg-amber-500/5' :
                      s.status === 'approved' ? 'border-emerald-500/20 bg-emerald-500/3' :
                      s.status === 'rejected' ? 'border-red-500/20 bg-red-500/3' :
                      'border-white/8 bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-[13px] font-bold text-white">
                          {s.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500">
                          Submitted by @{s.username} ({s.batch || 'User'}) · {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border shrink-0 ${statusBg}`}>
                        {statusLabel}
                      </span>
                    </div>
                    
                    {s.edit_draft ? (
                      <div className="p-3.5 border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-bold">
                          <FileEdit className="w-3.5 h-3.5" /> Revision Edit Request Pending
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">Original</span>
                            <h5 className="text-xs font-bold text-zinc-400">{s.title}</h5>
                            <p className="text-[11px] text-zinc-500">{s.content}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-amber-500 uppercase">New Draft</span>
                            <h5 className="text-xs font-bold text-white">{s.edit_draft.title}</h5>
                            <p className="text-[11px] text-zinc-300">{s.edit_draft.content}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSuggestionStatus(s.id, 'approved', 'approve_revision')}
                            className="bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3 h-3" /> Approve Revision
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Enter rejection reason (optional):");
                              handleSuggestionStatus(s.id, 'rejected', 'reject_revision', reason || undefined);
                            }}
                            className="bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <XCircle className="w-3 h-3" /> Reject Revision
                          </button>
                        </div>
                      </div>
                    ) : s.delete_pending ? (
                      <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Deletion Request Pending
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{s.content}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSuggestionStatus(s.id, 'rejected', 'approve_delete')}
                            className="bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3 h-3" /> Approve Deletion
                          </button>
                          <button
                            onClick={() => handleSuggestionStatus(s.id, 'approved', 'reject_delete')}
                            className="border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <XCircle className="w-3 h-3" /> Keep Suggestion
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-300 leading-relaxed">{s.content}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="flex items-center gap-1 text-[11px] text-orange-400 font-bold">
                        <ThumbsUp className="w-3.5 h-3.5" /> {s.upvotes || 0} Upvotes
                      </span>

                      {s.status === 'pending' && !s.edit_draft && !s.delete_pending && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSuggestionStatus(s.id, 'approved')}
                            className="bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Enter rejection reason (optional):");
                              handleSuggestionStatus(s.id, 'rejected', undefined, reason || undefined);
                            }}
                            className="bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* ── 5. REPORTS QUEUE ────────────────────────────────────────────── */}
      {activeTab === 'reports' && !loading && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-zinc-900/40 p-8 text-center text-zinc-500 text-[13px]">
              No content reports pending moderation.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-xl p-5 space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-white/10">
                        {report.reporter?.avatar_url ? (
                          <img src={report.reporter.avatar_url} alt={report.reporter.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[12px] font-bold text-zinc-400">
                            {report.reporter?.username ? report.reporter.username[0].toUpperCase() : '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[12px] font-black text-white">
                          Reporter: <span className="text-zinc-400">@{report.reporter?.username || 'Unknown'}</span>
                        </h4>
                        <p className="text-[9px] text-zinc-500">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        report.target_type === 'post' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        report.target_type === 'comment' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      }`}>
                        Reported {report.target_type}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        report.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 animate-pulse' :
                        report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                        'bg-zinc-800 text-zinc-400 border border-white/10'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Reason for Report</p>
                      <p className="text-xs text-zinc-200 mt-1 font-medium italic">"{report.reason}"</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-white/5">
                          {report.target_user?.avatar_url ? (
                            <img src={report.target_user.avatar_url} alt={report.target_user.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-zinc-400">
                              {report.target_user?.username ? report.target_user.username[0].toUpperCase() : '?'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          Author: <span className="text-white font-bold">@{report.target_user?.username || 'Unknown'}</span>
                        </p>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-2.5 rounded-lg border border-white/5 whitespace-pre-line font-mono">
                        {report.content_preview || <span className="text-zinc-600 italic">No content preview available.</span>}
                      </p>
                    </div>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex gap-2.5 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleResolveReport(report.id, 'dismiss')}
                        className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer border border-white/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 text-emerald-400" /> Keep Content (Dismiss)
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'resolve_delete')}
                        className="flex-1 bg-red-500 text-black font-black text-xs py-2.5 rounded-xl cursor-pointer hover:bg-red-400 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Content
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 6. DAILY QUESTION MANAGEMENT (QOTD) ─────────────────────────── */}
      {activeTab === 'qotd' && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Daily Questions List (Left column, col-span-3) */}
          <div className="md:col-span-3 rounded-2xl border border-white/8 bg-zinc-900/60 p-5 space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Daily Questions List</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/8 text-zinc-500 font-bold">
                    <th className="pb-2">Question</th>
                    <th className="pb-2">Publish At</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {questionsList.map((q) => {
                    const statusColors = {
                      Draft: 'bg-zinc-800 text-zinc-400 border-white/10',
                      Scheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
                      Published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                      Expired: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
                    };
                    const badgeClass = statusColors[q.status as keyof typeof statusColors] || statusColors.Draft;

                    return (
                      <tr key={q._id || q.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 pr-3 font-medium text-white max-w-[200px] truncate" title={q.question}>
                          {q.question}
                          <div className="text-[10px] text-zinc-500 font-normal mt-0.5">
                            Correct Option: <span className="text-emerald-400 font-bold">#{q.correct_answer + 1}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-zinc-400 text-[10px]">
                          {q.publish_at ? new Date(q.publish_at).toLocaleString() : 'Not Set'}
                        </td>
                        <td className="py-3 pr-3 text-center">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border ${badgeClass}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(q.status === 'Draft' || q.status === 'Scheduled') ? (
                              <>
                                <button
                                  onClick={() => handleEditClick(q)}
                                  title="Edit"
                                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/8 text-zinc-400 hover:text-white cursor-pointer hover:border-white/15 transition-all"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleQDelete(q._id || q.id)}
                                  title="Delete"
                                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 cursor-pointer transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => fetchQStats(q._id || q.id)}
                                title="View Statistics"
                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer transition-all"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {questionsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-zinc-500">
                        No daily questions found. Create one on the right!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create/Edit Question Form (Right column, col-span-2) */}
          <div className="md:col-span-2 rounded-2xl border border-white/8 bg-zinc-900/60 p-5 text-left space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
              {editingQuestionId ? 'Edit Daily Question' : 'Create Daily Question'}
            </h3>
            
            <form onSubmit={handleQSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Question Text</label>
                <textarea
                  required
                  placeholder="e.g. Which muscle is responsible for shoulder abduction beyond 90 degrees?"
                  value={qQuestion}
                  onChange={(e) => setQQuestion(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-650 text-xs focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Choices & Correct Answer</label>
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required={idx < 2}
                      placeholder={`Option ${idx + 1}${idx >= 2 ? ' (optional)' : ' (required)'}`}
                      value={qOptions[idx] || ''}
                      onChange={(e) => {
                        const updated = [...qOptions];
                        updated[idx] = e.target.value;
                        setQOptions(updated);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                    <label className="flex items-center gap-1 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={qCorrect === idx}
                        onChange={() => setQCorrect(idx)}
                        className="accent-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] font-bold text-zinc-400">Correct</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <PremiumDateTimePicker
                  value={qPublishAt}
                  onChange={setQPublishAt}
                  label="Publish At"
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">Status</label>
                  <div className="relative">
                    <select
                      value={qStatus}
                      onChange={(e) => setQStatus(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={qSubmitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs py-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {qSubmitting ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Publish / Schedule'}
                </button>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestionId(null);
                      setQQuestion('');
                      setQOptions(['', '', '', '']);
                      setQCorrect(0);
                      setQPublishAt('');
                      setQStatus('Scheduled');
                      setMessage('');
                    }}
                    className="border border-zinc-800 hover:bg-zinc-900/60 text-zinc-400 font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
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
                  {isRejectingRevision ? 'Reject Edit' : 'Reject and Delete Post'}
                </h3>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reason (Optional)</label>
                <textarea
                  placeholder="Write the reason for rejection to share with the author..."
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
                  Confirm Rejection
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

        {/* QOTD Stats Modal */}
        {selectedStats && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md p-6 relative flex flex-col gap-5 border border-white/10 text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <BarChart3 className="w-5 h-5 flex-shrink-0" />
                  <h3 className="text-base font-black tracking-tight">Question Statistics</h3>
                </div>
                <button 
                  onClick={() => setSelectedStats(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/8 text-zinc-400 hover:text-white cursor-pointer transition-all"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-extrabold text-white leading-relaxed">{selectedStats.question}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Unique Participants</p>
                    <p className="text-lg font-black text-white mt-0.5">{selectedStats.unique_participants}</p>
                  </div>
                  <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Total Answers</p>
                    <p className="text-lg font-black text-white mt-0.5">{selectedStats.total_answers}</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                    <p className="text-[9px] text-emerald-400 font-bold uppercase">Correct Answers</p>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">
                      {selectedStats.correct_answers} ({selectedStats.correct_percentage}%)
                    </p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                    <p className="text-[9px] text-red-400 font-bold uppercase">Wrong Answers</p>
                    <p className="text-lg font-black text-red-400 mt-0.5">
                      {selectedStats.wrong_answers} ({selectedStats.total_answers > 0 ? 100 - selectedStats.correct_percentage : 0}%)
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Answer Distribution</p>
                  <div className="space-y-2">
                    {selectedStats.options.map((option: string, idx: number) => {
                      const count = selectedStats.option_counts[idx] || 0;
                      const pct = selectedStats.total_answers > 0 ? Math.round((count / selectedStats.total_answers) * 100) : 0;
                      const isCorrect = idx === selectedStats.correct_answer;

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-zinc-300">
                            <span className="truncate pr-2 flex items-center gap-1.5">
                              {option}
                              {isCorrect && <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/20">Correct</span>}
                            </span>
                            <span className="shrink-0 text-[10px] text-zinc-550 font-extrabold">
                              {count} answers ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isCorrect ? 'bg-emerald-500' : 'bg-white/20'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
