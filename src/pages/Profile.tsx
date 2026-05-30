import React, { useState } from 'react';

interface ProfileProps {
  user: any;
  equippedFrame: string;
  setEquippedFrame: (val: string) => void;
  equippedTitle: string;
  setEquippedTitle: (val: string) => void;
  unlockedCosmetics: string[];
  setCurrentPage: (page: string) => void;
  handleLogout: () => void;
  handleUpdateProfile: (batch?: string, avatarUrl?: string) => void;
  handleUploadImage: (file: File) => Promise<string | null>;
}

export const Profile: React.FC<ProfileProps> = ({
  user,
  equippedFrame,
  setEquippedFrame,
  equippedTitle,
  setEquippedTitle,
  unlockedCosmetics,
  setCurrentPage,
  handleLogout,
  handleUpdateProfile,
  handleUploadImage
}) => {
  if (!user) return null;

  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(user.batch);
  const [isUploading, setIsUploading] = useState(false);

  const progressPct = (user.total_xp % 1000) / 10;
  // Circular calculations
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progressPct / 100) * circ;

  const getAvatarFrameClass = () => {
    if (equippedFrame === 'gold-glow') return 'avatar-frame-gold-glow';
    if (equippedFrame === 'neon-ring') return 'avatar-frame-neon-ring';
    return '';
  };

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    const url = await handleUploadImage(file);
    setIsUploading(false);
    if (url) {
      handleUpdateProfile(undefined, url);
    }
  };

  return (
    <div className="profile-panel animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-card profile-rank-panel">
        {/* Circular level progress */}
        <div className="circle-progress-wrapper" style={{ position: 'relative' }}>
          <svg className="svg-progress-ring" width="140" height="140">
            <defs>
              <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6A00" />
                <stop offset="100%" stopColor="#FFB000" />
              </linearGradient>
            </defs>
            <circle className="progress-ring-circle-bg" strokeWidth="8" fill="transparent" r={radius} cx="70" cy="70" />
            <circle
              className="progress-ring-circle-fill"
              strokeWidth="8"
              fill="transparent"
              r={radius}
              cx="70"
              cy="70"
              strokeDasharray={circ}
              strokeDashoffset={offset}
            />
          </svg>
          <div className={`circle-progress-inner-text mobile-avatar-ring ${getAvatarFrameClass()}`} style={{ border: 'none', background: 'transparent', width: '108px', height: '108px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#000' }}>
                {user.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            {/* Camera upload overlay */}
            <label className="avatar-upload-overlay" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isUploading ? 1 : 0,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              color: '#fff',
              zIndex: 5
            }}>
              {isUploading ? (
                <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Uploading...</div>
              ) : (
                <i className="ti ti-camera" style={{ fontSize: '24px' }}></i>
              )}
              <input type="file" accept="image/*" onChange={onAvatarFileChange} style={{ display: 'none' }} disabled={isUploading} />
            </label>
          </div>
          
          {/* Level indicator pill overlay at the bottom of the circle */}
          <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', background: 'var(--orange)', color: '#000', borderRadius: '10px', padding: '2px 8px', fontSize: '10px', fontWeight: 900, border: '2px solid #000', zIndex: 6 }}>
            Lvl {Math.floor(user.total_xp / 1000) + 1}
          </div>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 900, marginTop: '0.5rem', marginBottom: '0.25rem' }}>{user.username}</h2>

        {/* Editable Batch section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {isEditingBatch ? (
            <select
              className="pl-input"
              value={selectedBatch}
              onChange={(e) => {
                const b = e.target.value;
                setSelectedBatch(b);
                handleUpdateProfile(b, undefined);
                setIsEditingBatch(false);
              }}
              onBlur={() => setIsEditingBatch(false)}
              autoFocus
              style={{ padding: '4px 10px', fontSize: '12px', width: 'auto', background: 'rgba(10,10,10,0.9)' }}
            >
              <option value="PT 9">PT 9 (Year 6)</option>
              <option value="PT 10">PT 10 (Year 5)</option>
              <option value="PT 11">PT 11 (Year 4)</option>
              <option value="PT 12">PT 12 (Year 3)</option>
              <option value="PT 13">PT 13 (Year 2)</option>
              <option value="PT 14">PT 14 (Year 1)</option>
            </select>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setIsEditingBatch(true)}>
              <span className="badge-tag" style={{ margin: 0, padding: '3px 8px', fontSize: '12px', background: 'rgba(255, 106, 0, 0.1)' }}>
                {user.batch} <i className="ti ti-edit" style={{ fontSize: '11px', marginLeft: '4px', opacity: 0.8 }}></i>
              </span>
            </div>
          )}
        </div>

        {/* ========== PREMIUM RANK CARD ========== */}
        <div className="rank-card-premium">
          <div className="rank-card-glow"></div>
          <div className="rank-card-particles">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="rank-particle" style={{
                left: `${8 + Math.random() * 84}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                width: `${3 + Math.random() * 4}px`,
                height: `${3 + Math.random() * 4}px`
              }}></span>
            ))}
          </div>
          <div className="rank-card-content">
            <span className="rank-card-emoji">{user.rank.emoji}</span>
            <div className="rank-card-info">
              <span className="rank-card-title">{user.rank.name_en}</span>
              <span className="rank-card-subtitle">{user.rank.name_ar || 'Rank Badge'}</span>
            </div>
            {(user.role === 'admin' || user.role === 'owner') && (
              <span className="rank-card-role-badge" style={{
                background: user.role === 'owner' ? 'linear-gradient(135deg, #FFD700, #FF8C00)' : 'linear-gradient(135deg, #FF6A00, #FF8C00)',
                color: '#000',
              }}>
                {user.role === 'owner' ? '👑 OWNER' : '🛡️ ADMIN'}
              </span>
            )}
          </div>
          <div className="rank-card-xp-bar">
            <div className="rank-card-xp-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
          <div className="rank-card-xp-labels">
            <span>{user.total_xp % 1000} / 1000 XP</span>
            <span>Lvl {Math.floor(user.total_xp / 1000) + 1} → {Math.floor(user.total_xp / 1000) + 2}</span>
          </div>
        </div>
        {/* ========== END RANK CARD ========== */}

        {/* Equips frames and titles badges */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {equippedFrame !== 'none' && (
            <span className="badge-tag" style={{ borderColor: equippedFrame === 'gold-glow' ? '#FFD700' : '#00ffff', color: '#fff' }}>
              Frame: {equippedFrame === 'gold-glow' ? 'Gold Glow 🌟' : 'Neon Ring 🩵'}
            </span>
          )}
          {equippedTitle !== 'none' && (
            <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'var(--orange)' }}>
              Title: {equippedTitle}
            </span>
          )}
        </div>

        {/* Stats Badges Grid */}
        <div className="stats-badge-grid" style={{ gridTemplateColumns: '1fr 1fr', width: '100%', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ background: '#0A0A0A' }}>
            <span className="stat-badge-label">Total XP</span>
            <div className="stat-badge-value" style={{ fontSize: '20px' }}>{user.total_xp}</div>
          </div>
          <div className="glass-card" style={{ background: '#0A0A0A' }}>
            <span className="stat-badge-label">Login Streak</span>
            <div className="stat-badge-value" style={{ fontSize: '20px' }}>{user.streak_count} 🔥</div>
          </div>
        </div>

        {/* Equipment customization */}
        {unlockedCosmetics.length > 0 && (
          <div className="glass-card" style={{ width: '100%', background: '#0A0A0A', textAlign: 'right', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--orange)' }}>Equip Cosmetics</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Equip Glow Frame:</label>
                <select
                  className="pl-input"
                  value={equippedFrame}
                  onChange={(e) => {
                    setEquippedFrame(e.target.value);
                    localStorage.setItem('eq_frame', e.target.value);
                  }}
                  style={{ marginTop: '4px' }}
                >
                  <option value="none">No Frame</option>
                  {unlockedCosmetics.includes('gold-glow') && <option value="gold-glow">Gold Glow Frame 🌟</option>}
                  {unlockedCosmetics.includes('neon-ring') && <option value="neon-ring">Neon Ring Frame 🩵</option>}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Equip Title:</label>
                <select
                  className="pl-input"
                  value={equippedTitle}
                  onChange={(e) => {
                    setEquippedTitle(e.target.value);
                    localStorage.setItem('eq_title', e.target.value);
                  }}
                  style={{ marginTop: '4px' }}
                >
                  <option value="none">No Title</option>
                  {unlockedCosmetics.includes('neuro-specialist') && <option value="Neuro Specialist 🧠">Neuro Specialist 🧠</option>}
                  {unlockedCosmetics.includes('diagnosis-legend') && <option value="Diagnosis Legend 👑">Diagnosis Legend 👑</option>}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {(user.role === 'admin' || user.role === 'owner') && (
            <button className="btn-primary" onClick={() => setCurrentPage('admin')}>
              <i className="ti ti-shield-lock"></i> {user.role === 'owner' ? 'Owner Dashboard' : 'Admin Dashboard'}
            </button>
          )}
          <button className="btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
