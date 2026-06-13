import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Gift,
  Key,
  CheckCircle,
  Lock,
  Loader2,
  PackageOpen,
  Clock,
  Sparkles,
} from 'lucide-react';
import { playChatSound, setFramesCache } from '../utils/helpers';
import { UserAvatar } from '../components/UserAvatar';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.startsWith('192.168.')
    ? `http://${window.location.hostname}:5000`
    : '');

interface RewardsProps {
  user: any;
  redeemError: string;
  redeemSuccess: string;
  handleRedeem: (e: any) => void;
  secretCode: string;
  setSecretCode: (val: string) => void;
  showToast: (msg: string) => void;
  triggerXpPopup: (amount: number) => void;
  claimMockReward: (amount: number) => void;
  unlockedCosmetics: string[];
  handleShopPurchase: (itemId: string, cost: number) => void;
  hasOpenedBoxToday: boolean;
  handleClaimSurpriseBox: () => void;
  handleBuyFrame?: (frameId: string, price: number) => Promise<boolean>;
}

// ─── Static cosmetic items ─────────────────────────────────────────────────────
const STATIC_ITEMS = [
  {
    id: 'gold-glow',
    name: 'Golden Glowing Frame',
    cost: 500,
    description: 'A radiant gold glow that surrounds your avatar.',
    previewClass: 'avatar-frame-gold-glow',
    color: '#FFD700',
  },
  {
    id: 'neon-ring',
    name: 'Neon Blue Ring',
    cost: 800,
    description: 'Electric neon ring for a futuristic look.',
    previewClass: 'avatar-frame-neon-ring',
    color: '#00ffff',
  },
  {
    id: 'neuro-specialist',
    name: 'Title: Neuro Specialist',
    cost: 1500,
    description: 'Display the Neuro Specialist title on your profile.',
    previewClass: '',
    color: '#a78bfa',
    isTitle: true,
  },
  {
    id: 'diagnosis-legend',
    name: 'Title: Diagnosis Legend',
    cost: 2000,
    description: 'Showcase the Diagnosis Legend title across the app.',
    previewClass: '',
    color: '#f59e0b',
    isTitle: true,
  },
];

// ─── Shop Item Card ────────────────────────────────────────────────────────────
const ShopCard: React.FC<{
  name: string;
  cost: number;
  color?: string;
  owned: boolean;
  canAfford: boolean;
  buying?: boolean;
  previewContent: React.ReactNode;
  onBuy: () => void;
}> = ({ name, cost, color, owned, canAfford, buying, previewContent, onBuy }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className={`rounded-2xl border p-4 flex flex-col items-center gap-3 transition-colors ${
      owned
        ? 'border-emerald-500/25 bg-emerald-500/5'
        : 'border-white/8 bg-zinc-900/60 hover:border-white/15'
    }`}
  >
    {/* Preview */}
    <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/8 flex items-center justify-center overflow-hidden">
      {previewContent}
    </div>

    {/* Name */}
    <div className="text-center">
      <p className="text-[13px] font-bold text-white leading-tight">{name}</p>
      <p className="text-[12px] font-black mt-0.5" style={{ color: color || '#f97316' }}>
        {cost.toLocaleString()} XP
      </p>
    </div>

    {/* Buy Button */}
    <motion.button
      whileHover={{ scale: owned || buying ? 1 : 1.04 }}
      whileTap={{ scale: owned || buying ? 1 : 0.96 }}
      onClick={onBuy}
      disabled={owned || buying || !canAfford}
      className={`w-full py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
        owned
          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default'
          : !canAfford
          ? 'bg-white/5 border border-white/8 text-zinc-600 cursor-not-allowed'
          : 'bg-orange-500 text-black hover:bg-orange-400'
      }`}
    >
      {buying ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buying...</>
      ) : owned ? (
        <><CheckCircle className="w-3.5 h-3.5" /> Owned</>
      ) : !canAfford ? (
        <><Lock className="w-3.5 h-3.5" /> Not enough XP</>
      ) : (
        'Buy'
      )}
    </motion.button>
  </motion.div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export const Rewards: React.FC<RewardsProps> = ({
  user,
  redeemError,
  redeemSuccess,
  handleRedeem,
  secretCode,
  setSecretCode,
  showToast,
  triggerXpPopup,
  claimMockReward,
  unlockedCosmetics,
  handleShopPurchase,
  hasOpenedBoxToday,
  handleClaimSurpriseBox,
  handleBuyFrame,
}) => {
  const [shopFrames, setShopFrames] = useState<any[]>([]);
  const [buyingFrameId, setBuyingFrameId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/frames`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setShopFrames(data);
          setFramesCache(data);
        }
      })
      .catch(() => {});
  }, []);

  const isFrameOwned = (frameId: number) =>
    user?.unlocked_frames?.includes(frameId) || false;

  const handleFrameBuy = async (frameId: string) => {
    if (buyingFrameId) return;
    setBuyingFrameId(frameId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/frames/buy/${frameId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Frame purchased!');
        if (handleBuyFrame) await handleBuyFrame(frameId, 0);
      } else {
        showToast(data.error || 'Failed to purchase frame.');
      }
    } catch {
      showToast('An error occurred.');
    }
    setBuyingFrameId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto px-4 pt-20 xl:pt-6 pb-24 md:pb-6 space-y-8"
    >
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">XP Shop</h1>
          <p className="text-[12px] text-zinc-500">Rewards &amp; Cosmetic Center</p>
        </div>
        {user && (
          <div className="ml-auto px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <span className="text-[12px] font-black text-orange-400">{user.total_xp?.toLocaleString() || 0} XP</span>
          </div>
        )}
      </div>

      {/* ── Secret Code Redemption ──────────────────────────────────── */}
      <section className="rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-orange-400" />
          <h2 className="text-[15px] font-black text-white">Redeem Secret XP Code</h2>
        </div>
        <p className="text-[12px] text-zinc-500 mb-4">
          Enter codes from social media or episodes to earn instant XP.
        </p>

        <AnimatePresence>
          {redeemError && (
            <motion.div
              key="err"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-medium"
            >
              {redeemError}
            </motion.div>
          )}
          {redeemSuccess && (
            <motion.div
              key="suc"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-medium"
            >
              {redeemSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleRedeem} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-[13px] focus:outline-none focus:border-orange-500/60 transition-colors"
            placeholder="Enter reward code here..."
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-[13px] hover:from-orange-400 hover:to-amber-400 transition-colors flex-shrink-0"
          >
            Redeem Code
          </motion.button>
        </form>
      </section>

      {/* ── Daily Surprise Box ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/8 bg-zinc-900/60 backdrop-blur-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-violet-400" />
          <h2 className="text-[15px] font-black text-white">Daily Surprise Box</h2>
          {hasOpenedBoxToday && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-zinc-500">
              <Clock className="w-3.5 h-3.5" /> Resets at 12:00 AM
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Box Visual */}
          <div className="relative group select-none">
            {!hasOpenedBoxToday && (
              <>
                <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 opacity-30 blur-md group-hover:opacity-75 transition duration-500 animate-pulse" />
                <span className="absolute -top-1.5 -right-1.5 z-20 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce shadow-lg shadow-red-500/40">
                  Ready
                </span>
              </>
            )}
            
            <motion.button
              onClick={hasOpenedBoxToday ? undefined : handleClaimSurpriseBox}
              animate={hasOpenedBoxToday ? {} : { 
                y: [0, -6, 0] 
              }}
              transition={hasOpenedBoxToday ? {} : {
                y: {
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut"
                }
              }}
              whileHover={hasOpenedBoxToday ? {} : { 
                scale: 1.08,
                rotate: [0, -3, 3, -3, 3, 0],
                transition: {
                  rotate: {
                    repeat: Infinity,
                    duration: 0.4,
                    ease: "easeInOut"
                  }
                }
              }}
              whileTap={hasOpenedBoxToday ? {} : { scale: 0.95 }}
              disabled={hasOpenedBoxToday}
              className={`relative w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all ${
                hasOpenedBoxToday
                  ? 'bg-white/3 border-white/8 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-violet-500/30 cursor-pointer hover:border-violet-400/50 shadow-lg shadow-violet-500/20'
              }`}
            >
              {hasOpenedBoxToday ? (
                <PackageOpen className="w-10 h-10 text-zinc-600" />
              ) : (
                <Gift className="w-10 h-10 text-violet-400 filter drop-shadow-[0_0_8px_rgba(167,139,250,0.5)] animate-pulse" />
              )}
            </motion.button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            {hasOpenedBoxToday ? (
              <>
                <p className="text-[14px] font-bold text-zinc-400">Already opened today</p>
                <p className="text-[12px] text-zinc-600 mt-1">
                  Come back after midnight for your next surprise box.
                </p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-bold text-white">Click the box to open it!</p>
                <p className="text-[12px] text-zinc-500 mt-1">
                  Receive a random daily XP bonus. One box per day.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Cosmetics Shop ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <h2 className="text-[15px] font-black text-white">Cosmetics Shop</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Static cosmetic items */}
          {STATIC_ITEMS.map((item) => {
            const owned = unlockedCosmetics.includes(item.id);
            const canAfford = user && user.total_xp >= item.cost;

            let previewContent: React.ReactNode;
            if (item.isTitle) {
              previewContent = (
                <span className="text-[10px] font-black text-center leading-tight px-1" style={{ color: item.color }}>
                  {item.name.replace('Title: ', '')}
                </span>
              );
            } else {
              previewContent = (
                <UserAvatar
                  username={user?.username || 'A'}
                  avatarUrl={user?.avatar_url}
                  equippedFrame={item.id}
                  size={48}
                />
              );
            }

            return (
              <ShopCard
                key={item.id}
                name={item.name}
                cost={item.cost}
                color={item.color}
                owned={owned}
                canAfford={!!canAfford}
                previewContent={previewContent}
                onBuy={() => !owned && handleShopPurchase(item.id, item.cost)}
              />
            );
          })}

          {/* Dynamic frame items */}
          {shopFrames.map((f: any) => {
            const owned = isFrameOwned(f._id);
            const canAfford = user && user.total_xp >= f.price;
            const isBuying = buyingFrameId === String(f._id);

            const previewContent = (
              <UserAvatar
                username={user?.username || 'A'}
                avatarUrl={user?.avatar_url}
                equippedFrame={String(f._id)}
                size={48}
              />
            );

            return (
              <ShopCard
                key={f._id}
                name={f.name}
                cost={f.price}
                owned={owned}
                canAfford={!!canAfford}
                buying={isBuying}
                previewContent={previewContent}
                onBuy={() => !owned && !buyingFrameId && handleFrameBuy(String(f._id))}
              />
            );
          })}
        </div>
      </section>
    </motion.div>
  );
};
