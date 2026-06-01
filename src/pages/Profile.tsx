import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Pencil,
  Sparkles,
  ShieldCheck,
  Crown,
  Lock,
  X,
  LogOut,
  CheckCircle,
  Flame,
  Zap,
  Star,
  LayoutDashboard,
  ZoomIn,
} from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { setFramesCache } from '../utils/helpers';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.startsWith('192.168.')
    ? `http://${window.location.hostname}:5000`
    : '');

// ─── Helpers ───────────────────────────────────────────────────────────────────
const stripEmojis = (str: string) => {
  if (!str) return '';
  return str
    .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
    .trim();
};

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Batch options ─────────────────────────────────────────────────────────────
const BATCHES = [
  { value: 'PT 9',  label: 'PT 9 (Year 6)' },
  { value: 'PT 10', label: 'PT 10 (Year 5)' },
  { value: 'PT 11', label: 'PT 11 (Year 4)' },
  { value: 'PT 12', label: 'PT 12 (Year 3)' },
  { value: 'PT 13', label: 'PT 13 (Year 2)' },
  { value: 'PT 14', label: 'PT 14 (Year 1)' },
];

// ─── Next rank names ───────────────────────────────────────────────────────────
const RANK_NAMES = ['Anatomy Rookie', 'Pain Specialist', 'Ortho King', 'Neurogenic', 'Rehab Legend'];

// ─── Rank thresholds ───────────────────────────────────────────────────────────
const RANK_THRESHOLDS = [0, 500, 1500, 3000, 6000];

// ─── Frame Option ──────────────────────────────────────────────────────────────
const FrameOption: React.FC<{
  label: string;
  equipped: boolean;
  locked?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}> = ({ label, equipped, locked, onClick, children, accent = 'orange' }) => (
  <motion.div
    onClick={locked ? undefined : onClick}
    whileHover={locked ? {} : { scale: 1.04 }}
    whileTap={locked ? {} : { scale: 0.96 }}
    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all w-[86px] ${
      locked
        ? 'border-white/8 bg-white/2 opacity-50 cursor-not-allowed'
        : equipped
        ? `border-${accent}-500/60 bg-${accent}-500/8`
        : 'border-white/8 bg-white/2 hover:border-white/20'
    }`}
  >
    {children}
    <span className="text-[10px] font-bold text-center leading-tight" style={{ color: locked ? '#71717a' : equipped ? '#f97316' : '#d4d4d8' }}>
      {label}
    </span>
    {equipped && !locked && (
      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange-500 border-2 border-zinc-900 flex items-center justify-center">
        <CheckCircle className="w-2.5 h-2.5 text-black" />
      </span>
    )}
    {locked && (
      <span className="absolute inset-0 flex items-center justify-center rounded-xl">
        <Lock className="w-4 h-4 text-zinc-700" />
      </span>
    )}
  </motion.div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
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
  handleUploadImage,
}) => {
  if (!user) return null;

  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(user.batch);
  const [isUploading, setIsUploading] = useState(false);
  const [showDecorationPicker, setShowDecorationPicker] = useState(false);
  const [framesList, setFramesList] = useState<any[]>([]);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // ─── XP & Rank Calculations ─────────────────────────────────────────────────
  const currentTier = user.rank?.tier || 1;
  const currentThreshold = RANK_THRESHOLDS[currentTier - 1] || 0;
  const nextThreshold = RANK_THRESHOLDS[currentTier] || null;
  const progressPct = nextThreshold
    ? ((user.total_xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPct);
    }, 150);
    return () => clearTimeout(timer);
  }, [progressPct]);

  // ─── Crop State ─────────────────────────────────────────────────────────────
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffset, setCropOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const { width: w, height: h } = imageDimensions;
  const minScale = w > 0 && h > 0 ? Math.max(300 / w, 300 / h) : 1;
  const scale = minScale * cropZoom;
  const renderedWidth = w * scale;
  const renderedHeight = h * scale;
  const defaultX = (300 - renderedWidth) / 2;
  const defaultY = (300 - renderedHeight) / 2;
  const left = defaultX + cropOffset.x;
  const top = defaultY + cropOffset.y;

  // ─── Load frames when picker opens ──────────────────────────────────────────
  useEffect(() => {
    if (!showDecorationPicker) return;
    fetch(`${API_BASE}/api/frames`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFramesList(data);
          setFramesCache(data);
        }
      })
      .catch(() => {});
  }, [showDecorationPicker]);

  const isFrameUnlocked = (frameId: number) =>
    user?.unlocked_frames?.includes(frameId) || false;

  const handleEquipFrame = (frameVal: string) => {
    setEquippedFrame(frameVal);
    localStorage.setItem('eq_frame', frameVal);
    handleUpdateProfile(undefined, undefined, frameVal, undefined);
    setShowDecorationPicker(false);
  };

  // ─── Crop Helpers ────────────────────────────────────────────────────────────
  const constrainOffsets = (newZoom: number) => {
    if (w === 0 || h === 0) return;
    const s = minScale * newZoom;
    const rw = w * s;
    const rh = h * s;
    const defX = (300 - rw) / 2;
    const defY = (300 - rh) / 2;
    let cLeft = defX + cropOffset.x;
    let cTop = defY + cropOffset.y;
    cLeft = Math.min(0, Math.max(300 - rw, cLeft));
    cTop = Math.min(0, Math.max(300 - rh, cTop));
    setCropOffset({ x: cLeft - defX, y: cTop - defY });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || w === 0 || h === 0) return;
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    const newLeft = Math.min(0, Math.max(300 - renderedWidth, defaultX + newX));
    const newTop  = Math.min(0, Math.max(300 - renderedHeight, defaultY + newY));
    setCropOffset({ x: newLeft - defaultX, y: newTop - defaultY });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCropZoom(val);
    constrainOffsets(val);
  };

  const onAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropSave = async () => {
    if (!cropImageSrc) return;
    const img = new Image();
    img.src = cropImageSrc;
    await new Promise(resolve => { img.onload = resolve; });
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
      if (url) handleUpdateProfile(undefined, url);
    }, 'image/png');
  };

  // ─── Rank Card Particles (static positions to avoid hydration issues) ────────
  const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
    left: `${10 + i * 8.5}%`,
    delay: `${(i * 0.37) % 3}s`,
    duration: `${2.2 + (i * 0.3) % 1.8}s`,
    size: `${3 + (i * 0.7) % 4}px`,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto px-4 py-6 space-y-4"
    >
      {/* ── Profile Card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-xl p-6">

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          {/* Circular Progress Ring */}
          <div className="relative mb-4">
            <svg width="140" height="140" className="-rotate-90">
              <defs>
                <linearGradient id="xp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6A00" />
                  <stop offset="100%" stopColor="#FFB000" />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle
                cx="70" cy="70" r="60"
                fill="transparent"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              {/* Fill */}
              <circle
                cx="70" cy="70" r="60"
                fill="transparent"
                stroke="url(#xp-grad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - animatedProgress / 100)}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Avatar inside the ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <UserAvatar
                  username={user.username}
                  avatarUrl={user.avatar_url}
                  equippedFrame={equippedFrame}
                  size={108}
                />
                {/* Camera Upload Overlay */}
                <label
                  className={`absolute inset-0 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isUploading ? 'bg-black/70 opacity-100' : 'bg-black/0 opacity-0 hover:bg-black/60 hover:opacity-100'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span className="text-[10px] text-white font-bold">Uploading</span>
                    </div>
                  ) : (
                    <Camera className="w-7 h-7 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAvatarFileChange}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Tier Pill */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-orange-500 text-black text-[9px] font-black border-2 border-zinc-900 whitespace-nowrap z-20">
              {stripEmojis(user.rank?.name_en) || `Tier ${currentTier}`}
            </div>
          </div>

          {/* Username */}
          <h2 className="text-2xl font-black text-white mb-1">{user.username}</h2>

          {/* Admin / Owner Badge */}
          {(user.role === 'admin' || user.role === 'owner') && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black mb-2"
              style={{
                background: user.role === 'owner'
                  ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.15))'
                  : 'linear-gradient(135deg, rgba(255,106,0,0.15), rgba(255,140,0,0.15))',
                border: `1px solid ${user.role === 'owner' ? 'rgba(255,215,0,0.3)' : 'rgba(255,106,0,0.3)'}`,
                color: user.role === 'owner' ? '#FFD700' : '#FF6A00',
              }}
            >
              {user.role === 'owner' ? <Crown className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {user.role === 'owner' ? 'Owner' : 'Admin'}
            </div>
          )}

          {/* Editable Batch */}
          <div className="flex items-center gap-2">
            {isEditingBatch ? (
              <select
                className="px-3 py-1.5 text-[12px] rounded-lg bg-zinc-800 border border-white/15 text-white focus:outline-none focus:border-orange-500/60"
                value={selectedBatch}
                autoFocus
                onChange={(e) => {
                  const b = e.target.value;
                  setSelectedBatch(b);
                  handleUpdateProfile(b);
                  setIsEditingBatch(false);
                }}
                onBlur={() => setIsEditingBatch(false)}
              >
                {BATCHES.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            ) : (
              <motion.button
                onClick={() => setIsEditingBatch(true)}
                whileHover={{ scale: 1.04 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[12px] font-bold hover:border-orange-500/40 transition-colors"
              >
                {user.batch}
                <Pencil className="w-3 h-3 opacity-70" />
              </motion.button>
            )}
          </div>
        </div>

        {/* ── Rank Card ───────────────────────────────────────────────── */}
        <div className="relative rounded-xl overflow-hidden border border-orange-500/20 bg-gradient-to-br from-orange-500/8 via-transparent to-amber-500/5 p-4 mb-5">
          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-orange-400/30 animate-float"
                style={{
                  left: p.left,
                  bottom: '-4px',
                  width: p.size,
                  height: p.size,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                }}
              />
            ))}
          </div>

          <div className="relative flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">Current Rank</p>
              <p className="text-[16px] font-black text-white truncate">
                {stripEmojis(user.rank?.name_en) || `Tier ${currentTier}`}
              </p>
            </div>
            <span className="text-[13px] font-black text-orange-400">{user.total_xp?.toLocaleString()} XP</span>
          </div>

          {/* XP Progress Bar */}
          <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progressPct)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>{user.total_xp - currentThreshold} XP earned</span>
            <span>
              {nextThreshold
                ? `${nextThreshold - currentThreshold - (user.total_xp - currentThreshold)} XP to ${RANK_NAMES[currentTier] || 'MAX'}`
                : 'MAX RANK'}
            </span>
          </div>
        </div>

        {/* ── Stats Badges ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-white/8 bg-black/30 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4.5 h-4.5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total XP</p>
              <p className="text-[18px] font-black text-white leading-tight">{user.total_xp?.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/30 p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <Flame className="w-4.5 h-4.5 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Streak</p>
              <p className="text-[18px] font-black text-white leading-tight">{user.streak_count} days</p>
            </div>
          </div>
        </div>

        {/* ── Decoration Button ─────────────────────────────────────── */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDecorationPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-[14px] hover:from-orange-400 hover:to-amber-400 transition-colors mb-3 shadow-lg shadow-orange-500/15"
        >
          <Sparkles className="w-4 h-4" />
          Change Profile Decoration
        </motion.button>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          {(user.role === 'admin' || user.role === 'owner') && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage('admin')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 font-bold text-[13px] hover:bg-violet-500/18 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              {user.role === 'owner' ? 'Owner Dashboard' : 'Admin Dashboard'}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 text-red-400 font-bold text-[13px] hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </div>

      {/* ── Decoration Picker Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showDecorationPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDecorationPicker(false)}
            className="fixed inset-0 z-[11000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/8 bg-zinc-900/95 backdrop-blur-xl p-5 max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-orange-400" />
                  <h3 className="text-[16px] font-black text-white">Profile Decoration</h3>
                </div>
                <button
                  onClick={() => setShowDecorationPicker(false)}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              <p className="text-[12px] text-zinc-500 mb-5">
                Choose a frame or title to display on your profile across the app.
              </p>

              {/* Frames Section */}
              <div className="mb-5">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Avatar Frames</p>
                <div className="flex flex-wrap gap-2.5">
                  {/* None */}
                  <FrameOption
                    label="None"
                    equipped={equippedFrame === 'none'}
                    onClick={() => handleEquipFrame('none')}
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-[18px] font-black text-white">
                      {user.username[0].toUpperCase()}
                    </div>
                  </FrameOption>

                  {/* Gold Glow */}
                  <FrameOption
                    label="Gold Glow"
                    equipped={equippedFrame === 'gold-glow'}
                    locked={!unlockedCosmetics.includes('gold-glow')}
                    onClick={() => handleEquipFrame('gold-glow')}
                    accent="yellow"
                  >
                    <div className="avatar-frame-gold-glow w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-[18px] font-black text-amber-400">
                      {user.username[0].toUpperCase()}
                    </div>
                  </FrameOption>

                  {/* Neon Ring */}
                  <FrameOption
                    label="Neon Ring"
                    equipped={equippedFrame === 'neon-ring'}
                    locked={!unlockedCosmetics.includes('neon-ring')}
                    onClick={() => handleEquipFrame('neon-ring')}
                    accent="cyan"
                  >
                    <div className="avatar-frame-neon-ring w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-[18px] font-black text-cyan-400">
                      {user.username[0].toUpperCase()}
                    </div>
                  </FrameOption>

                  {/* Database frames */}
                  {framesList.map((f: any) => {
                    const unlocked = isFrameUnlocked(f._id);
                    const isEquipped = String(equippedFrame) === String(f._id);
                    return (
                      <FrameOption
                        key={f._id}
                        label={f.name}
                        equipped={isEquipped}
                        locked={!unlocked}
                        onClick={() => unlocked && handleEquipFrame(String(f._id))}
                      >
                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-orange-500/10">
                          {unlocked ? (
                            <>
                              <span className="text-[18px] font-black text-orange-400">
                                {user.username[0].toUpperCase()}
                              </span>
                              <img
                                src={f.image_url}
                                alt={f.name}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                style={{ objectFit: 'fill' }}
                              />
                            </>
                          ) : (
                            <Lock className="w-5 h-5 text-zinc-700" />
                          )}
                        </div>
                      </FrameOption>
                    );
                  })}
                </div>
              </div>

              {/* Titles Section */}
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Display Titles</p>
                <div className="flex flex-wrap gap-2">
                  {/* No Title */}
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setEquippedTitle('none');
                      localStorage.setItem('eq_title', 'none');
                      handleUpdateProfile(undefined, undefined, undefined, 'none');
                      setShowDecorationPicker(false);
                    }}
                    className={`px-4 py-2 rounded-xl text-[12px] font-bold border transition-all ${
                      equippedTitle === 'none'
                        ? 'border-orange-500/60 bg-orange-500/10 text-orange-400'
                        : 'border-white/10 bg-white/3 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    No Title
                  </motion.button>

                  {/* Neuro Specialist */}
                  {unlockedCosmetics.includes('neuro-specialist') && (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        const val = 'Neuro Specialist';
                        setEquippedTitle(val);
                        localStorage.setItem('eq_title', val);
                        handleUpdateProfile(undefined, undefined, undefined, val);
                        setShowDecorationPicker(false);
                      }}
                      className={`px-4 py-2 rounded-xl text-[12px] font-bold border transition-all ${
                        equippedTitle === 'Neuro Specialist' || equippedTitle === 'Neuro Specialist 🧠'
                          ? 'border-violet-500/60 bg-violet-500/10 text-violet-400'
                          : 'border-white/10 bg-white/3 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Neuro Specialist
                    </motion.button>
                  )}

                  {/* Diagnosis Legend */}
                  {unlockedCosmetics.includes('diagnosis-legend') && (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        const val = 'Diagnosis Legend';
                        setEquippedTitle(val);
                        localStorage.setItem('eq_title', val);
                        handleUpdateProfile(undefined, undefined, undefined, val);
                        setShowDecorationPicker(false);
                      }}
                      className={`px-4 py-2 rounded-xl text-[12px] font-bold border transition-all ${
                        equippedTitle === 'Diagnosis Legend' || equippedTitle === 'Diagnosis Legend 👑'
                          ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                          : 'border-white/10 bg-white/3 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Diagnosis Legend
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Crop Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cropModalOpen && cropImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[12000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-sm rounded-2xl border border-white/8 bg-zinc-900/95 p-5 space-y-4"
            >
              <div className="text-center">
                <h3 className="text-[18px] font-black text-white">Adjust Photo</h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">Drag to pan, slide to zoom</p>
              </div>

              {/* Crop Viewport */}
              <div
                className="relative mx-auto overflow-hidden rounded-full border-2 border-orange-500/40 cursor-grab active:cursor-grabbing select-none"
                style={{ width: 300, height: 300, touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <img
                  src={cropImageSrc}
                  alt="Crop preview"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                    setCropZoom(1);
                    setCropOffset({ x: 0, y: 0 });
                  }}
                  className="absolute pointer-events-none select-none"
                  style={{
                    width: renderedWidth,
                    height: renderedHeight,
                    left,
                    top,
                  }}
                  draggable={false}
                />
              </div>

              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Zoom</span>
                  </div>
                  <span className="text-[11px] font-bold text-orange-400">{Math.round(cropZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropZoom}
                  onChange={handleZoomChange}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Crop Actions */}
              <div className="flex gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setCropModalOpen(false); setCropImageSrc(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 font-bold text-[13px] hover:text-white hover:border-white/20 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCropSave}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-[13px]"
                >
                  Crop &amp; Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
