import React, { useState, useEffect } from 'react';
import { UserAvatar } from '../components/UserAvatar';
import { setFramesCache, getFrameImage } from '../utils/helpers';

const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

interface ProfileProps {
  user: any;
  equippedFrame: string;
  setEquippedFrame: (val: string) => void;
  equippedTitle: string;
  setEquippedTitle: (val: string) => void;
  unlockedCosmetics: string[];
  setCurrentPage: (page: string) => void;
  handleLogout: () => void;
  handleUpdateProfile: (batch?: string, avatarUrl?: string, equippedFrameVal?: string, equippedTitleVal?: string) => void;
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
  const [showDecorationPicker, setShowDecorationPicker] = useState(false);

  const [framesList, setFramesList] = useState<any[]>([]);

  useEffect(() => {
    if (showDecorationPicker) {
      fetch(`${API_BASE}/api/frames`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFramesList(data);
            setFramesCache(data);
          }
        })
        .catch(() => {});
    }
  }, [showDecorationPicker]);

  const isFrameUnlocked = (frameId: number) => {
    return user?.unlocked_frames?.includes(frameId) || false;
  };

  const handleEquipFrame = (frameVal: string) => {
    setEquippedFrame(frameVal);
    localStorage.setItem('eq_frame', frameVal);
    handleUpdateProfile(undefined, undefined, frameVal, undefined);
    setShowDecorationPicker(false);
  };

  // Cropper State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffset, setCropOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const rankThresholds = [0, 500, 1500, 3000, 6000];
  const currentTier = user.rank?.tier || 1;
  const currentThreshold = rankThresholds[currentTier - 1] || 0;
  const nextThreshold = rankThresholds[currentTier] || null;
  const progressPct = nextThreshold ? ((user.total_xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 100;
  // Circular calculations
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progressPct / 100) * circ;

  const onAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input to allow selecting same file
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
  };

  const w = imageDimensions.width;
  const h = imageDimensions.height;
  const minScale = w > 0 && h > 0 ? Math.max(300 / w, 300 / h) : 1;
  const scale = minScale * cropZoom;
  
  const renderedWidth = w * scale;
  const renderedHeight = h * scale;
  
  const defaultX = (300 - renderedWidth) / 2;
  const defaultY = (300 - renderedHeight) / 2;
  
  const left = defaultX + cropOffset.x;
  const top = defaultY + cropOffset.y;

  const constrainOffsets = (newZoom: number) => {
    if (w === 0 || h === 0) return;
    const s = minScale * newZoom;
    const rw = w * s;
    const rh = h * s;
    const defX = (300 - rw) / 2;
    const defY = (300 - rh) / 2;
    
    let currentLeft = defX + cropOffset.x;
    let currentTop = defY + cropOffset.y;
    
    currentLeft = Math.min(0, Math.max(300 - rw, currentLeft));
    currentTop = Math.min(0, Math.max(300 - rh, currentTop));
    
    setCropOffset({
      x: currentLeft - defX,
      y: currentTop - defY
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || w === 0 || h === 0) return;
    let newOffsetX = e.clientX - dragStart.x;
    let newOffsetY = e.clientY - dragStart.y;
    
    let newLeft = defaultX + newOffsetX;
    let newTop = defaultY + newOffsetY;
    
    newLeft = Math.min(0, Math.max(300 - renderedWidth, newLeft));
    newTop = Math.min(0, Math.max(300 - renderedHeight, newTop));
    
    setCropOffset({
      x: newLeft - defaultX,
      y: newTop - defaultY
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCropZoom(val);
    constrainOffsets(val);
  };

  const handleCropSave = async () => {
    if (!cropImageSrc) return;
    
    const img = new Image();
    img.src = cropImageSrc;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const sx = -left / scale;
    const sy = -top / scale;
    const sWidth = 300 / scale;
    const sHeight = 300 / scale;
    
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 400, 400);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'avatar.png', { type: 'image/png' });
      
      setCropModalOpen(false);
      setCropImageSrc(null);
      
      setIsUploading(true);
      const url = await handleUploadImage(file);
      setIsUploading(false);
      if (url) {
        handleUpdateProfile(undefined, url);
      }
    }, 'image/png');
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
          <div className="circle-progress-inner-text avatar-container-profile">
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatar_url}
              equippedFrame={equippedFrame}
              size={108}
            />
            
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
            {user.rank?.name_en || `Tier ${currentTier}`}
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
            <span>{user.total_xp.toLocaleString()} XP</span>
            <span>{nextThreshold ? `${user.total_xp - currentThreshold} / ${nextThreshold - currentThreshold} to ${['Anatomy Rookie','Pain Specialist','Ortho King','Neurogenic','Rehab Legend'][currentTier] || 'MAX'}` : 'MAX RANK'}</span>
          </div>
        </div>
        {/* ========== END RANK CARD ========== */}



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

        {/* Decoration Selector Button */}
        <button
          className="btn-primary"
          style={{ width: '100%', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #FF6A00, #FFB000)', fontSize: '13px' }}
          onClick={() => setShowDecorationPicker(true)}
        >
          <i className="ti ti-sparkles"></i> Change Profile Decoration
        </button>

        {/* Decoration Picker Modal */}
        {showDecorationPicker && (
          <div
            className="pl-context-overlay"
            style={{ zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowDecorationPicker(false)}
          >
            <div
              className="glass-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90%',
                maxWidth: '420px',
                background: 'rgba(10, 10, 10, 0.96)',
                border: '1px solid var(--orange)',
                boxShadow: '0 0 30px rgba(255, 106, 0, 0.2)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                direction: 'ltr',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--orange)' }}>
                  <i className="ti ti-sparkles"></i> Profile Decoration
                </h3>
                <button
                  onClick={() => setShowDecorationPicker(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Choose a decoration to show around your avatar across the app.
              </p>

              {/* Frames section */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avatar Frames</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {/* None option */}
                  <div
                    className={`glass-card ${equippedFrame === 'none' ? 'selected' : ''}`}
                    onClick={() => handleEquipFrame('none')}
                    style={{
                      width: '90px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      border: equippedFrame === 'none' ? '2px solid var(--orange)' : '1px solid var(--card-border)',
                      background: equippedFrame === 'none' ? 'rgba(255, 106, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#fff' }}>
                      {user.username[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700 }}>None</span>
                  </div>

                  {/* CSS frames (backward compat) */}
                  {unlockedCosmetics.includes('gold-glow') && (
                    <div
                      className={`glass-card ${equippedFrame === 'gold-glow' ? 'selected' : ''}`}
                      onClick={() => handleEquipFrame('gold-glow')}
                      style={{
                        width: '90px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        border: equippedFrame === 'gold-glow' ? '2px solid #FFD700' : '1px solid var(--card-border)',
                        background: equippedFrame === 'gold-glow' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div className="avatar-frame-gold-glow" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, background: 'var(--bg-secondary)' }}>
                        {user.username[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '10px', color: '#FFD700', fontWeight: 700 }}>Gold Glow</span>
                    </div>
                  )}
                  {!unlockedCosmetics.includes('gold-glow') && (
                    <div style={{ width: '90px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', opacity: 0.5 }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: 'var(--text-secondary)' }}>
                        <i className="ti ti-lock"></i>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>Gold Glow</span>
                    </div>
                  )}

                  {unlockedCosmetics.includes('neon-ring') && (
                    <div
                      className={`glass-card ${equippedFrame === 'neon-ring' ? 'selected' : ''}`}
                      onClick={() => handleEquipFrame('neon-ring')}
                      style={{
                        width: '90px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        border: equippedFrame === 'neon-ring' ? '2px solid #00ffff' : '1px solid var(--card-border)',
                        background: equippedFrame === 'neon-ring' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div className="avatar-frame-neon-ring" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, background: 'var(--bg-secondary)' }}>
                        {user.username[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '10px', color: '#00ffff', fontWeight: 700 }}>Neon Ring</span>
                    </div>
                  )}
                  {!unlockedCosmetics.includes('neon-ring') && (
                    <div style={{ width: '90px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', opacity: 0.5 }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: 'var(--text-secondary)' }}>
                        <i className="ti ti-lock"></i>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>Neon Ring</span>
                    </div>
                  )}

                  {/* Database frames */}
                  {framesList.map((f: any) => {
                    const unlocked = isFrameUnlocked(f._id);
                    const isEquipped = String(equippedFrame) === String(f._id);
                    const framePreviewUrl = f.image_url;
                    return (
                      <div
                        key={f._id}
                        className={`glass-card ${isEquipped ? 'selected' : ''}`}
                        onClick={() => unlocked && handleEquipFrame(String(f._id))}
                        style={{
                          width: '90px',
                          padding: '12px',
                          cursor: unlocked ? 'pointer' : 'default',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          border: isEquipped ? '2px solid var(--orange)' : '1px solid var(--card-border)',
                          background: isEquipped ? 'rgba(255, 106, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.2s',
                          opacity: unlocked ? 1 : 0.5
                        }}
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', position: 'relative', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {unlocked ? (
                            <>
                              <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: 'var(--orange)', background: 'rgba(255,106,0,0.12)' }}>
                                {user.username[0].toUpperCase()}
                              </div>
                              <img
                                src={framePreviewUrl}
                                alt={f.name}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2, userSelect: 'none' }}
                              />
                            </>
                          ) : (
                            <i className="ti ti-lock" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}></i>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: unlocked ? '#fff' : 'var(--text-secondary)', fontWeight: 700, textAlign: 'center' }}>
                          {f.name}
                          {unlocked ? '' : ` (${f.price.toLocaleString()} XP)`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Titles section */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Display Titles</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span
                    className={`badge-tag ${equippedTitle === 'none' ? 'selected' : ''}`}
                    onClick={() => {
                      setEquippedTitle('none');
                      localStorage.setItem('eq_title', 'none');
                      handleUpdateProfile(undefined, undefined, undefined, 'none');
                      setShowDecorationPicker(false);
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '6px 12px',
                      fontSize: '11px',
                      border: equippedTitle === 'none' ? '2px solid var(--orange)' : '1px solid var(--card-border)',
                      background: equippedTitle === 'none' ? 'rgba(255, 106, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    No Title
                  </span>
                  {unlockedCosmetics.includes('neuro-specialist') && (
                    <span
                      className={`badge-tag ${equippedTitle === 'Neuro Specialist 🧠' ? 'selected' : ''}`}
                      onClick={() => {
                        setEquippedTitle('Neuro Specialist 🧠');
                        localStorage.setItem('eq_title', 'Neuro Specialist 🧠');
                        handleUpdateProfile(undefined, undefined, undefined, 'Neuro Specialist 🧠');
                        setShowDecorationPicker(false);
                      }}
                      style={{
                        cursor: 'pointer',
                        padding: '6px 12px',
                        fontSize: '11px',
                        border: equippedTitle === 'Neuro Specialist 🧠' ? '2px solid var(--orange)' : '1px solid var(--card-border)',
                        background: equippedTitle === 'Neuro Specialist 🧠' ? 'rgba(255, 106, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      Neuro Specialist 🧠
                    </span>
                  )}
                  {unlockedCosmetics.includes('diagnosis-legend') && (
                    <span
                      className={`badge-tag ${equippedTitle === 'Diagnosis Legend 👑' ? 'selected' : ''}`}
                      onClick={() => {
                        setEquippedTitle('Diagnosis Legend 👑');
                        localStorage.setItem('eq_title', 'Diagnosis Legend 👑');
                        handleUpdateProfile(undefined, undefined, undefined, 'Diagnosis Legend 👑');
                        setShowDecorationPicker(false);
                      }}
                      style={{
                        cursor: 'pointer',
                        padding: '6px 12px',
                        fontSize: '11px',
                        border: equippedTitle === 'Diagnosis Legend 👑' ? '2px solid var(--orange)' : '1px solid var(--card-border)',
                        background: equippedTitle === 'Diagnosis Legend 👑' ? 'rgba(255, 106, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      Diagnosis Legend 👑
                    </span>
                  )}
                </div>
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

      {cropModalOpen && cropImageSrc && (
        <div className="pl-crop-modal-overlay">
          <div className="pl-crop-modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
              Adjust Profile Photo
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '-0.5rem' }}>
              Drag to pan, slider to zoom.
            </p>

            <div 
              className="pl-crop-viewport-container"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{ touchAction: 'none' }}
            >
              <img 
                src={cropImageSrc} 
                alt="Crop preview" 
                className="pl-crop-image"
                onLoad={onImageLoad}
                style={{
                  width: `${renderedWidth}px`,
                  height: `${renderedHeight}px`,
                  left: `${left}px`,
                  top: `${top}px`
                }}
              />
            </div>

            <div className="pl-crop-slider-container">
              <div className="pl-crop-slider-label">
                <span>Zoom</span>
                <span>{Math.round(cropZoom * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.01" 
                value={cropZoom} 
                onChange={handleZoomChange}
                className="pl-crop-slider"
              />
            </div>

            <div className="pl-crop-actions">
              <button 
                className="btn-outline mini" 
                onClick={() => {
                  setCropModalOpen(false);
                  setCropImageSrc(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary mini" 
                onClick={handleCropSave}
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
