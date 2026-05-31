import React, { useState, useEffect } from 'react';
import { setFramesCache } from '../utils/helpers';

const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

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
  showConfirm?: (title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string, type?: 'danger' | 'info' | 'success' | 'warning') => void;
}

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
  showConfirm
}) => {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null);
  const [editingLoading, setEditingLoading] = useState(false);

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
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
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
    // Build body with updated thumbnail
    const body: any = {
      title_ar: adminEpisodeForm.title_ar,
      title_en: adminEpisodeForm.title_en,
      description: adminEpisodeForm.description,
      thumbnail_url: thumbnailUrl,
      youtube_url: adminEpisodeForm.youtube_url
    };
    if (adminEpisodeForm.quiz_question) {
      body.quiz = {
        question: adminEpisodeForm.quiz_question,
        options: adminEpisodeForm.quiz_options.filter((o: string) => o.trim()),
        correct_option_index: adminEpisodeForm.quiz_correct
      };
    }
    if (adminEpisodeForm.code) {
      body.xp_code = { code: adminEpisodeForm.code, max_uses: adminEpisodeForm.code_max_uses, expiry_date: adminEpisodeForm.code_expiry || null };
    }
    try {
      const url = editingEpisodeId 
        ? `${API_BASE}/api/admin/episodes/${editingEpisodeId}` 
        : `${API_BASE}/api/admin/episode`;
      const method = editingEpisodeId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setAdminMessage(data.message || data.error);
      if (res.ok) {
        setAdminEpisodeForm({ title_ar: '', title_en: '', description: '', thumbnail_url: '', youtube_url: '', quiz_question: '', quiz_options: ['', '', '', ''], quiz_correct: 0, code: '', code_max_uses: 200, code_expiry: '' });
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
        headers: { 'Authorization': `Bearer ${token}` }
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
          code_expiry: data.xp_code && data.xp_code.expiry_date ? data.xp_code.expiry_date.split('T')[0] : ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setAdminMessage(data.error || 'Failed to fetch episode details.');
      }
    } catch {
      setAdminMessage('Failed to connect to server.');
    } finally {
      setEditingLoading(false);
    }
  };

  const handleCancelEditEpisode = () => {
    setEditingEpisodeId(null);
    setAdminEpisodeForm({ title_ar: '', title_en: '', description: '', thumbnail_url: '', youtube_url: '', quiz_question: '', quiz_options: ['', '', '', ''], quiz_correct: 0, code: '', code_max_uses: 200, code_expiry: '' });
    setThumbnailFile(null);
    setAdminMessage('');
  };

  const handleDeleteEpisode = async (episodeId: number, title: string) => {
    const proceed = async () => {
      setAdminMessage('');
      try {
        const res = await fetch(`${API_BASE}/api/admin/episodes/${episodeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setAdminMessage(data.message || data.error);
        if (res.ok) {
          if (fetchEpisodes) fetchEpisodes();
        }
      } catch {
        setAdminMessage('Failed to delete episode.');
      }
    };

    if (showConfirm) {
      showConfirm(
        'Delete Episode',
        `Are you sure you want to delete "${title}"? This will permanently delete the episode, quiz, and any associated XP codes/submissions.`,
        proceed,
        undefined,
        'Delete permanently',
        'Cancel',
        'danger'
      );
    } else {
      if (confirm(`Are you sure you want to delete "${title}"?`)) {
        proceed();
      }
    }
  };

  // Frames management state
  const [adminFrames, setAdminFrames] = useState<any[]>([]);
  const [frameName, setFrameName] = useState('');
  const [framePrice, setFramePrice] = useState(0);
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [frameUploading, setFrameUploading] = useState(false);
  const [frameError, setFrameError] = useState('');

  const token = localStorage.getItem('token');

  const fetchAdminFrames = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/frames`);
      const data = await res.json();
      if (res.ok) {
        setAdminFrames(data);
        setFramesCache(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (adminSection === 'frames') {
      fetchAdminFrames();
    }
  }, [adminSection]);

  const handleFrameUpload = async () => {
    if (!frameName.trim() || !frameFile || framePrice <= 0) {
      setFrameError('Name, image file, and price > 0 are required.');
      return;
    }
    setFrameUploading(true);
    setFrameError('');
    try {
      // Upload image first
      const formData = new FormData();
      formData.append('image', frameFile);
      const uploadRes = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setFrameError(uploadData.error || 'Image upload failed.');
        setFrameUploading(false);
        return;
      }
      // Create frame with returned image_url
      const createRes = await fetch(`${API_BASE}/api/admin/frames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: frameName.trim(), image_url: uploadData.url, price: framePrice })
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

  const handleDeleteFrame = async (frameId: string) => {
    const proceed = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/frames/${frameId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchAdminFrames();
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (showConfirm) {
      showConfirm(
        'Delete Cosmetic Frame',
        'Are you sure you want to delete this avatar frame? This action cannot be undone.',
        proceed,
        undefined,
        'Delete Frame',
        'Cancel',
        'danger'
      );
    } else {
      if (confirm('Delete this frame?')) {
        proceed();
      }
    }
  };
  return (
    <div className="admin-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h2 className="pl-section-h2" style={{ marginBottom: '1.5rem' }}>
        <span><i className="ti ti-shield-lock"></i> Admin Dashboard</span>
      </h2>
      
      {/* Tab Navigation */}
      <div className="games-filter-tabs admin-tabs-mobile" style={{ marginBottom: '1.5rem' }}>
        <button 
          className={`games-filter-btn ${adminSection === 'episodes' ? 'active' : ''}`} 
          onClick={() => setAdminSection('episodes')}
          style={{ whiteSpace: 'nowrap' }}
        >
          📹 New Episode
        </button>
        <button 
          className={`games-filter-btn ${adminSection === 'codes' ? 'active' : ''}`} 
          onClick={() => setAdminSection('codes')}
          style={{ whiteSpace: 'nowrap' }}
        >
          🔑 XP Codes
        </button>
        <button 
          className={`games-filter-btn ${adminSection === 'users' ? 'active' : ''}`} 
          onClick={() => setAdminSection('users')}
          style={{ whiteSpace: 'nowrap' }}
        >
          👥 Users Management
        </button>
        <button 
          className={`games-filter-btn ${adminSection === 'suggestions' ? 'active' : ''}`} 
          onClick={() => setAdminSection('suggestions')}
          style={{ whiteSpace: 'nowrap' }}
        >
          💡 Suggestions
        </button>
        <button 
          className={`games-filter-btn ${adminSection === 'frames' ? 'active' : ''}`} 
          onClick={() => setAdminSection('frames')}
          style={{ whiteSpace: 'nowrap' }}
        >
          🖼️ Frames
        </button>
        <button 
          className={`games-filter-btn ${adminSection === 'xp_settings' ? 'active' : ''}`} 
          onClick={() => setAdminSection('xp_settings')}
          style={{ whiteSpace: 'nowrap' }}
        >
          ⚙️ XP Settings
        </button>
      </div>

      {adminMessage && (
        <div className="pl-form-success" style={{ marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--orange)', background: 'rgba(255, 106, 0, 0.15)', color: '#fff', fontSize: '13px' }}>
          {adminMessage}
        </div>
      )}

      {/* 1. EPISODES MANAGEMENT */}
      {adminSection === 'episodes' && (
        <form onSubmit={handleEpisodeSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '2rem' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', color: 'var(--orange)' }}>
            {editingEpisodeId ? `✏️ Edit Episode: ${adminEpisodeForm.title_en}` : 'Publish a New Podcast Episode'}
          </h3>
          
          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>Title (Arabic)</label>
            <input 
              type="text" 
              className="pl-input" 
              value={adminEpisodeForm.title_ar} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_ar: e.target.value }))} 
              required 
            />
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>Title (English)</label>
            <input 
              type="text" 
              className="pl-input" 
              value={adminEpisodeForm.title_en} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_en: e.target.value }))} 
              required 
            />
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>Description</label>
            <textarea 
              className="pl-input" 
              rows={3}
              value={adminEpisodeForm.description} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, description: e.target.value }))}
            ></textarea>
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>Thumbnail Image (16:9 recommended)</label>
            <div className="pl-file-upload-container">
              <label className="pl-file-upload-label">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} 
                />
                {thumbnailFile ? (
                  <>
                    <div className="pl-file-preview-16-9">
                      <img 
                        src={URL.createObjectURL(thumbnailFile)} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{thumbnailFile.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Click or drag to change image</span>
                  </>
                ) : (
                  <>
                    <i className="ti ti-photo-plus pl-file-upload-icon"></i>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Upload Episode Thumbnail</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Drag & drop or browse (16:9 ratio recommended)</span>
                  </>
                )}
              </label>
            </div>
            {adminEpisodeForm.thumbnail_url && !thumbnailFile && (
              <div style={{ marginTop: '0.5rem', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={adminEpisodeForm.thumbnail_url} alt="Current" style={{ width: '60px', height: '34px', borderRadius: '4px', objectFit: 'cover' }} />
                <span>Current thumbnail (or uploaded)</span>
              </div>
            )}
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>YouTube URL</label>
            <input 
              type="url" 
              className="pl-input" 
              placeholder="https://www.youtube.com/watch?v=..."
              value={adminEpisodeForm.youtube_url} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, youtube_url: e.target.value }))} 
            />
          </div>

          {/* QUIZ CONFIGURATION */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--card-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--orange)' }}>📝 Interactive Episode Quiz (Optional)</h4>
            
            <div className="pl-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Quiz Question</label>
              <input 
                type="text" 
                className="pl-input" 
                placeholder="What is the first line of defense for...?"
                value={adminEpisodeForm.quiz_question || ''} 
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, quiz_question: e.target.value }))} 
              />
            </div>

            <div className="pl-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Quiz Options</label>
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  type="text"
                  className="pl-input"
                  placeholder={`Option ${idx + 1}`}
                  value={adminEpisodeForm.quiz_options[idx] || ''}
                  onChange={(e) => {
                    const nextOpts = [...adminEpisodeForm.quiz_options];
                    nextOpts[idx] = e.target.value;
                    setAdminEpisodeForm((p: any) => ({ ...p, quiz_options: nextOpts }));
                  }}
                  required={!!adminEpisodeForm.quiz_question}
                  style={{ marginBottom: '6px' }}
                />
              ))}
            </div>

            <div className="pl-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Correct Answer Option</label>
              <select 
                className="pl-input"
                value={adminEpisodeForm.quiz_correct}
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, quiz_correct: Number(e.target.value) }))}
              >
                <option value={0}>Option 1</option>
                <option value={1}>Option 2</option>
                <option value={2}>Option 3</option>
                <option value={3}>Option 4</option>
              </select>
            </div>
          </div>

          {/* EPISODE SECRET CODE */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--card-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--orange)' }}>🔑 Episode Secret Code (Optional)</h4>
            
            <div className="pl-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Secret Code Name</label>
              <input 
                type="text" 
                className="pl-input" 
                placeholder="EPXX_SECRET"
                value={adminEpisodeForm.code || ''} 
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code: e.target.value }))} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="pl-form-group">
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Max Uses</label>
                <input 
                  type="number" 
                  className="pl-input" 
                  value={adminEpisodeForm.code_max_uses || 200} 
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code_max_uses: Number(e.target.value) }))} 
                />
              </div>

              <div className="pl-form-group">
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Expiry Date</label>
                <input 
                  type="date" 
                  className="pl-input" 
                  value={adminEpisodeForm.code_expiry || ''} 
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code_expiry: e.target.value }))} 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={adminSubmitting} style={{ flex: 1 }}>
              {adminSubmitting 
                ? (editingEpisodeId ? 'Saving Changes...' : 'Uploading Episode...') 
                : (editingEpisodeId ? 'Save Episode Changes' : 'Publish Episode & Enable Quiz')}
            </button>
            {editingEpisodeId && (
              <button type="button" className="btn-outline" onClick={handleCancelEditEpisode} style={{ flex: 1 }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* List of existing episodes for editing/deleting */}
      {adminSection === 'episodes' && (
        <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', marginBottom: '1rem' }}>
            Manage Existing Episodes ({episodes.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {episodes.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '1rem 0' }}>
                No episodes published yet.
              </div>
            ) : (
              episodes.map((ep: any) => (
                <div key={ep.id} className="admin-episode-row">
                  <div className="admin-episode-info">
                    {ep.thumbnail_url && (
                      <img 
                        src={ep.thumbnail_url} 
                        alt={ep.title_en} 
                        className="admin-episode-thumbnail"
                      />
                    )}
                    <div className="admin-episode-details">
                      <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: '#fff' }}>{ep.title_en}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{ep.description ? ep.description.substring(0, 80) + '...' : 'No description'}</p>
                    </div>
                  </div>
                  <div className="admin-episode-actions">
                    <button 
                      type="button"
                      onClick={() => handleStartEditEpisode(ep.id)}
                      className="btn-outline mini"
                      disabled={editingLoading}
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                    >
                      {editingEpisodeId === ep.id ? 'Editing...' : '✏️ Edit'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteEpisode(ep.id, ep.title_en)}
                      className="btn-outline mini"
                      style={{ fontSize: '11px', padding: '6px 12px', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.2)' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. STANDALONE XP CODES */}
      {adminSection === 'codes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Create Code Form */}
          <form onSubmit={handleAdminCreateCode} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              Create Standalone XP / Promo Code
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Code Name (Uppercase)</label>
                <input 
                  type="text" 
                  className="pl-input" 
                  placeholder="e.g. FACEBOOK50"
                  value={adminCodeForm.code} 
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, code: e.target.value }))} 
                  required 
                />
              </div>

              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>XP Reward Amount</label>
                <input 
                  type="number" 
                  className="pl-input" 
                  value={adminCodeForm.xp_reward} 
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, xp_reward: Number(e.target.value) }))} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Type</label>
                <select 
                  className="pl-input"
                  value={adminCodeForm.type}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, type: e.target.value }))}
                >
                  <option value="social">Social Media Code</option>
                  <option value="episode">Episode Code</option>
                </select>
              </div>

              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Max Uses</label>
                <input 
                  type="number" 
                  className="pl-input" 
                  value={adminCodeForm.max_uses} 
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, max_uses: Number(e.target.value) }))} 
                  required 
                />
              </div>

              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Expiry Date</label>
                <input 
                  type="date" 
                  className="pl-input" 
                  value={adminCodeForm.expiry_date} 
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, expiry_date: e.target.value }))} 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={adminSubmitting} style={{ marginTop: '0.5rem' }}>
              Create Standalone Code
            </button>
          </form>

          {/* XP Codes Table */}
          <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', marginBottom: '1rem' }}>
              Existing XP Codes ({adminCodes.length})
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', opacity: 0.7 }}>
                  <th style={{ padding: '8px 12px' }}>Code</th>
                  <th style={{ padding: '8px 12px' }}>XP</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Uses</th>
                  <th style={{ padding: '8px 12px' }}>Expiry</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminCodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No XP codes registered.
                    </td>
                  </tr>
                ) : (
                  adminCodes.map((c: any) => {
                    const isExpired = c.expiry_date && new Date(c.expiry_date) < new Date();
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#fff' }}>{c.code}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--orange)' }}>+{c.xp_reward} XP</td>
                        <td style={{ padding: '8px 12px', textTransform: 'capitalize' }}>{c.type}</td>
                        <td style={{ padding: '8px 12px' }}>{c.current_uses} / {c.max_uses}</td>
                        <td style={{ padding: '8px 12px', color: isExpired ? '#e74c3c' : 'inherit' }}>
                          {c.expiry_date ? new Date(c.expiry_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'}
                          {isExpired && ' (Expired)'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleAdminDeleteCode(c.id, c.code)}
                            className="btn-outline mini"
                            style={{ fontSize: '10px', padding: '4px 8px', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.2)' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. USERS MANAGEMENT */}
      {adminSection === 'users' && (
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', marginBottom: '1rem' }}>
            Registered Members List ({adminUsers.length})
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', opacity: 0.7 }}>
                <th style={{ padding: '8px 12px' }}>User</th>
                <th style={{ padding: '8px 12px' }}>Email</th>
                <th style={{ padding: '8px 12px' }}>Batch</th>
                <th style={{ padding: '8px 12px' }}>Total XP</th>
                <th style={{ padding: '8px 12px' }}>Role</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No users registered in the database.
                  </td>
                </tr>
              ) : (
                adminUsers.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 800, color: '#fff' }}>@{u.username}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '8px 12px' }}>{u.batch}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--orange)', fontWeight: 700 }}>{u.total_xp.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge-tag mini" style={{ 
                        borderColor: u.role === 'owner' ? '#FFD700' : u.role === 'admin' ? 'var(--orange)' : 'var(--text-secondary)',
                        color: u.role === 'owner' ? '#FFD700' : u.role === 'admin' ? 'var(--orange)' : 'var(--text-secondary)',
                        background: u.role === 'owner' ? 'rgba(255, 215, 0, 0.15)' : u.role === 'admin' ? 'rgba(255, 106, 0, 0.15)' : 'transparent',
                        textTransform: 'uppercase',
                        fontWeight: u.role === 'owner' ? 900 : 700
                      }}>
                        {u.role === 'owner' ? '👑 OWNER' : u.role}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {user?.role === 'owner' && u.role !== 'owner' && (
                        <button 
                          onClick={() => handleAdminToggleUserRole(u.id, u.role)}
                          className="btn-outline mini" 
                          style={{ fontSize: '10px', padding: '4px 8px' }}
                        >
                          Toggle Role
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenModerationModal(u.username, u.id)}
                        className="btn-outline mini" 
                        style={{ fontSize: '10px', padding: '4px 8px', color: '#e67e22', borderColor: 'rgba(230,126,34,0.3)' }}
                      >
                        Moderate
                      </button>
                      {user?.role === 'owner' && u.role !== 'owner' && (
                        <button 
                          onClick={() => handleAdminDeleteUser(u.id, u.username)}
                          className="btn-outline mini" 
                          style={{ fontSize: '10px', padding: '4px 8px', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.3)' }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. FRAMES MANAGEMENT */}
      {adminSection === 'frames' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', marginBottom: '1rem' }}>
            🖼️ Avatar Frames Management
          </h3>

          {frameError && (
            <div style={{ color: '#ff4d4d', fontSize: '12px', marginBottom: '1rem', padding: '8px 12px', background: 'rgba(255,77,77,0.1)', borderRadius: '8px' }}>
              {frameError}
            </div>
          )}

          {/* Upload form */}
          <div className="admin-frames-upload">
            <h4 style={{ fontSize: '13px', fontWeight: 800 }}>Upload New Frame</h4>
            <div className="pl-form-group">
              <label>Frame Name</label>
              <input type="text" value={frameName} onChange={e => setFrameName(e.target.value)} placeholder="e.g. Legendary Flame" />
            </div>
            <div className="pl-form-group">
              <label>XP Price</label>
              <input type="number" value={framePrice} onChange={e => setFramePrice(Math.max(0, Number(e.target.value)))} placeholder="e.g. 500" min={0} />
            </div>
            <div className="pl-form-group">
              <label>Frame Image (PNG with transparent background)</label>
              <div className="pl-file-upload-container">
                <label className="pl-file-upload-label">
                  <input 
                    type="file" 
                    accept="image/png,image/webp,image/gif" 
                    onChange={e => setFrameFile(e.target.files?.[0] || null)} 
                  />
                  {frameFile ? (
                    <>
                      <div className="pl-file-preview-square">
                        <img 
                          src={URL.createObjectURL(frameFile)} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{frameFile.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Click or drag to change image</span>
                    </>
                  ) : (
                    <>
                      <i className="ti ti-photo-plus pl-file-upload-icon"></i>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Upload Frame PNG</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Transparent PNG format</span>
                    </>
                  )}
                </label>
              </div>
            </div>
            <button onClick={handleFrameUpload} disabled={frameUploading} className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: '12px' }}>
              {frameUploading ? 'Uploading...' : 'Upload Frame'}
            </button>
          </div>

          {/* Frames grid */}
          <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: '1rem' }}>Existing Frames ({adminFrames.length})</h4>
          <div className="admin-frames-grid">
            {adminFrames.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', padding: '2rem 0', width: '100%', textAlign: 'center' }}>
                No frames uploaded yet.
              </div>
            ) : (
              adminFrames.map((f: any) => (
                <div key={f._id} className="admin-frame-card">
                  <div className="admin-frame-preview">
                    <img src={f.image_url} alt={f.name} />
                  </div>
                  <span className="admin-frame-name">{f.name}</span>
                  <span className="admin-frame-price">{f.price.toLocaleString()} XP</span>
                  <button onClick={() => handleDeleteFrame(f._id)} className="btn-outline mini" style={{ fontSize: '10px', padding: '3px 8px', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.2)' }}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. SUGGESTIONS MODERATION */}
      {adminSection === 'suggestions' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', marginBottom: '1rem' }}>
            Suggestions Moderation Feed ({adminSuggestions.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {adminSuggestions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                No suggestions have been submitted yet.
              </div>
            ) : (
              adminSuggestions.map((s: any) => {
                let statusColor = 'var(--text-secondary)';
                let statusBg = 'rgba(255,255,255,0.06)';
                if (s.status === 'approved') {
                  statusColor = '#2ecc71';
                  statusBg = 'rgba(46, 204, 113, 0.15)';
                } else if (s.status === 'rejected') {
                  statusColor = '#e74c3c';
                  statusBg = 'rgba(231, 76, 60, 0.15)';
                }

                return (
                  <div key={s.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#fff' }}>{s.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Submitted by @{s.username} · {new Date(s.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="badge-tag" style={{ color: statusColor, borderColor: statusColor, background: statusBg, fontSize: '9px', textTransform: 'capitalize' }}>
                        {s.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0.25rem 0 0.5rem 0' }}>
                      {s.content}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '11px', color: 'var(--orange)' }}>
                        👍 {s.upvotes || 0} Upvotes
                      </span>
                      
                      {s.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleAdminUpdateSuggestionStatus(s.id, 'approved')}
                            className="btn-primary mini" 
                            style={{ background: '#2ecc71', fontSize: '10px' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleAdminUpdateSuggestionStatus(s.id, 'rejected')}
                            className="btn-outline mini" 
                            style={{ borderColor: '#e74c3c', color: '#e74c3c', fontSize: '10px' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 6. XP SETTINGS CONFIGURATION */}
      {adminSection === 'xp_settings' && (
        <XpSettingsManager 
          token={token} 
          apiBase={API_BASE} 
          fetchXpSettings={fetchXpSettings || (() => {})} 
          setAdminMessage={setAdminMessage} 
        />
      )}
    </div>
  );
};

// Sub-component to manage dynamic XP reward values
const XpSettingsManager: React.FC<{
  token: string | null;
  apiBase: string;
  fetchXpSettings: () => void;
  setAdminMessage: (msg: string) => void;
}> = ({ token, apiBase, fetchXpSettings, setAdminMessage }) => {
  const [localSettings, setLocalSettings] = useState<any>({
    like: 5,
    comment: 15,
    share: 25,
    comment_like: 2,
    daily_login: 10,
    streak_bonus: 70,
    game_play: 50,
    referral: 25,
    surprise_box: 50,
    poll_vote: 30,
    quiz_solve: 150
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/admin/xp-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLocalSettings(data);
      } else {
        setError(data.error || 'Failed to fetch XP settings.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setAdminMessage('');
    try {
      const res = await fetch(`${apiBase}/api/admin/xp-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(localSettings)
      });
      const data = await res.json();
      if (res.ok) {
        setAdminMessage('XP settings updated successfully! 🎉');
        fetchXpSettings(); // Update global cache in App.tsx
      } else {
        setError(data.error || 'Failed to update XP settings.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    const val = parseInt(value, 10) || 0;
    setLocalSettings((prev: any) => ({
      ...prev,
      [key]: val >= 0 ? val : 0
    }));
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading XP Configuration... ⚙️</p>
      </div>
    );
  }

  // Readable labels and descriptions for keys
  const settingMetadata: { [key: string]: { label: string; desc: string; icon: string } } = {
    like: { label: 'Episode/Post Like', desc: 'XP awarded for liking an episode or community post.', icon: 'ti-thumb-up' },
    comment: { label: 'Comment Made', desc: 'XP awarded for adding a comment on an episode or post.', icon: 'ti-message' },
    share: { label: 'Share Link Created', desc: 'XP awarded to user when they generate a share link.', icon: 'ti-share' },
    comment_like: { label: 'Comment Liked', desc: 'XP awarded for liking someone else\'s comment.', icon: 'ti-heart' },
    daily_login: { label: 'Daily Login Reward', desc: 'XP awarded for logging in each day.', icon: 'ti-gift' },
    streak_bonus: { label: '7-Day Streak Bonus', desc: 'Extra XP awarded when user reaches a 7-day login streak.', icon: 'ti-flame' },
    game_play: { label: 'Memory Game Play', desc: 'XP awarded for completing the single-player match game.', icon: 'ti-device-gamepad-2' },
    referral: { label: 'Shared Link Visit', desc: 'XP awarded when a unique visitor visits user\'s shared link.', icon: 'ti-user-plus' },
    surprise_box: { label: 'Surprise Box claim', desc: 'XP awarded when opening the daily surprise box.', icon: 'ti-package' },
    poll_vote: { label: 'Daily Poll Vote', desc: 'XP awarded for voting in the daily dashboard interactive poll.', icon: 'ti-checkbox' },
    quiz_solve: { label: 'Quiz Solved Fallback', desc: 'Fallback XP for solving an episode quiz if not overridden by the quiz itself.', icon: 'ti-school' }
  };

  return (
    <form onSubmit={handleSave} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 900, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', color: 'var(--orange)' }}>
        ⚙️ Manage Global XP Reward Settings
      </h3>

      {error && (
        <div style={{ color: '#ff4d4d', fontSize: '12px', padding: '8px 12px', background: 'rgba(255,77,77,0.1)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="xp-settings-grid">
        {Object.entries(localSettings).map(([key, val]: [string, any]) => {
          const meta = settingMetadata[key] || { label: key, desc: 'XP reward for this activity.', icon: 'ti-settings' };
          return (
            <div key={key} className="xp-setting-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: '12px', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <div style={{ fontSize: '18px', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,106,0,0.1)' }}>
                  <i className={`ti ${meta.icon}`}></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: '#fff' }}>{meta.label}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{meta.desc}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  className="pl-input"
                  value={val}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  style={{ width: '80px', textAlign: 'center', fontWeight: 700 }}
                  min={0}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>XP</span>
              </div>
            </div>
          );
        })}
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving Settings...' : 'Save XP Settings'}
      </button>
    </form>
  );
};
