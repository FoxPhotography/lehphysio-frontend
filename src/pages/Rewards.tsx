import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Gift,
  Key,
  CheckCircle,
  Lock,
  Loader2,
  PackageOpen,
  Clock,
  Frame,
} from 'lucide-react';
import { playChatSound, setFramesCache } from '../utils/helpers';
import { UserAvatar } from '../components/UserAvatar';
import { API_BASE } from '../services/api';
import { CosmeticsStudio } from '../components/shop/CosmeticsStudio';
import { useAuth } from '../context/AuthContext';

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
  handleShopPurchase: (item: any) => void;
  hasOpenedBoxToday: boolean;
  handleClaimSurpriseBox: () => void;
  handleBuyFrame?: (frameId: string, price: number) => Promise<boolean>;
}

// ─── Static cosmetic items ─────────────────────────────────────────────────────
const STATIC_ITEMS: any[] = [];

// ─── Shop Item Card ────────────────────────────────────────────────────────────
const ShopCard: React.FC<{
  name: string;
  cost: number;
  color?: string;
  owned: boolean;
  canAfford: boolean;
  buying?: boolean;
  userXp?: number;
  previewContent: React.ReactNode;
  onBuy: () => void;
  /** Owned items can be switched to right from the shop */
  equipped?: boolean;
  onEquip?: () => void;
}> = ({ name, cost, color, owned, canAfford, buying, userXp = 0, previewContent, onBuy, equipped, onEquip }) => {
  const progressPct = Math.min(100, Math.round((userXp / cost) * 100));

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border p-4 flex flex-col items-center gap-3 transition-all relative overflow-hidden ${
        owned
          ? 'border-emerald-500/25 bg-emerald-500/5'
          : canAfford
          ? 'border-orange-500/40 bg-orange-500/5 shadow-orange-glow/10'
          : 'border-white/8 bg-zinc-900/60 hover:border-white/15'
      }`}
    >
      {/* Preview */}
      <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/8 flex items-center justify-center overflow-hidden relative">
        {previewContent}
      </div>

      {/* Name & Milestone Requirement */}
      <div className="text-center w-full">
        <p className="text-[13px] font-black text-white leading-tight truncate">{name}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-xs font-extrabold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
            يتفتح عند {cost.toLocaleString()} XP
          </span>
        </div>

        {/* Milestone Progress Bar for locked items */}
        {!owned && (
          <div className="mt-2.5 w-full">
            <div className="flex justify-between items-center text-2xs font-bold text-zinc-400 mb-1">
              <span dir="ltr">{Math.min(userXp, cost).toLocaleString()} XP</span>
              <span className={canAfford ? 'text-emerald-400' : 'text-zinc-500'}>{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  canAfford 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-gradient-to-r from-orange-500 to-amber-400'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Use / in-use (owned items) */}
      {owned && onEquip ? (
        <m.button
          whileTap={{ scale: 0.96 }}
          onClick={onEquip}
          className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            equipped
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
              : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          {equipped ? <><CheckCircle className="w-3.5 h-3.5" /> مستخدَم — دوس للإلغاء</> : <>استخدمه</>}
        </m.button>
      ) : (
      <m.button
        whileHover={{ scale: owned || buying ? 1 : 1.04 }}
        whileTap={{ scale: owned || buying ? 1 : 0.96 }}
        onClick={onBuy}
        disabled={owned || buying || !canAfford}
        className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
          owned
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default'
            : !canAfford
            ? 'bg-white/5 border border-white/8 text-zinc-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-orange-glow hover:shadow-orange-intense'
        }`}
      >
        {buying ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> بنفتح…</>
        ) : owned ? (
          <><CheckCircle className="w-3.5 h-3.5" /> مفتوح</>
        ) : !canAfford ? (
          <><Lock className="w-3.5 h-3.5" /> فاضلك {Math.max(0, cost - userXp).toLocaleString()} XP</>
        ) : (
          <>افتحه ببلاش</>
        )}
      </m.button>
      )}
    </m.div>
  );
};

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
  const { equippedFrame, setEquippedFrame, handleUpdateProfile } = useAuth() as any;

  // Switch frames right from the shop (tap again to remove)
  const switchFrame = (frameId: string) => {
    const next = String(equippedFrame) === String(frameId) ? 'none' : String(frameId);
    setEquippedFrame(next);
    localStorage.setItem('eq_frame', next);
    handleUpdateProfile(undefined, undefined, next, undefined);
    showToast(next === 'none' ? 'اتشال الفريم 👌' : 'الفريم اتفعّل ✨');
  };
  const [buyingFrameId, setBuyingFrameId] = useState<string | null>(null);

  // Came from the profile's "استوديو الستايل" button → jump to the studio
  useEffect(() => {
    if (sessionStorage.getItem('shop_focus') === 'cosmetics') {
      sessionStorage.removeItem('shop_focus');
      // Glide there once, then quietly re-align while content above (codes, box)
      // is still loading — unless the user already started scrolling himself.
      let touched = false;
      const stop = () => { touched = true; };
      window.addEventListener('wheel', stop, { passive: true, once: true });
      window.addEventListener('touchstart', stop, { passive: true, once: true });
      const go = (smooth: boolean) => {
        const el = document.getElementById('cosmetics-studio');
        if (el && !touched) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      };
      const t1 = setTimeout(() => go(true), 120);
      const t2 = setTimeout(() => go(false), 900);
      const t3 = setTimeout(() => go(false), 1800);
      return () => {
        [t1, t2, t3].forEach(clearTimeout);
        window.removeEventListener('wheel', stop);
        window.removeEventListener('touchstart', stop);
      };
    }
    return undefined;
  }, []);

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
        showToast(data.message || 'الفريم بقى بتاعك!');
        if (handleBuyFrame) await handleBuyFrame(frameId, 0);
      } else {
        showToast(data.error || 'معرفناش نفتح الفريم.');
      }
    } catch {
      showToast('حصل خطأ.');
    }
    setBuyingFrameId(null);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto px-4 xl:pt-6 space-y-8"
    >
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">متجر XP</h1>
          <p className="text-xs text-zinc-500">ستايلات، فريمات ومكافآت</p>
        </div>
        {user && (
          <div className="ms-auto px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <span className="text-xs font-black text-orange-400" dir="ltr">{user.total_xp?.toLocaleString() || 0} XP</span>
          </div>
        )}
      </div>

      {/* ── Secret Code Redemption ──────────────────────────────────── */}
      <section className="rounded-2xl border border-white/8 bg-zinc-900/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-orange-400" />
          <h2 className="text-[15px] font-black text-white whitespace-nowrap truncate min-w-0">استخدم كود XP سري</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          اكتب الأكواد اللي بتنزل في الحلقات أو على السوشيال واكسب XP على طول.
        </p>

        <AnimatePresence>
          {redeemError && (
            <m.div
              key="err"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
            >
              {redeemError}
            </m.div>
          )}
          {redeemSuccess && (
            <m.div
              key="suc"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
            >
              {redeemSuccess}
            </m.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleRedeem} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 text-[13px] focus:outline-none focus:border-orange-500/60 transition-colors"
            placeholder="اكتب الكود هنا…"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
          />
          <m.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-[13px] hover:from-orange-400 hover:to-amber-400 transition-colors flex-shrink-0"
          >
            استخدم الكود
          </m.button>
        </form>
      </section>

      {/* ── Daily Surprise Box ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/8 bg-zinc-900/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-violet-400 shrink-0" />
          <h2 className="text-[15px] font-black text-white whitespace-nowrap truncate min-w-0">صندوق اليوم</h2>
          {hasOpenedBoxToday && (
            <span className="ms-auto shrink-0 whitespace-nowrap flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3.5 h-3.5" /> يتجدد 12 بالليل
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Box Visual */}
          <div className="relative group select-none">
            {!hasOpenedBoxToday && (
              <>
                <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 opacity-30 blur-md group-hover:opacity-75 transition duration-500 animate-pulse" />
                <span className="absolute -top-1.5 -end-1.5 z-20 bg-red-500 text-white text-2xs font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce shadow-lg shadow-red-500/40">
                  جاهز
                </span>
              </>
            )}
            
            <m.button
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
            </m.button>
          </div>

          <div className="flex-1 text-center sm:text-start">
            {hasOpenedBoxToday ? (
              <>
                <p className="text-sm font-bold text-zinc-400">فتحته النهارده خلاص</p>
                <p className="text-xs text-zinc-600 mt-1">
                  ارجع بعد نص الليل عشان الصندوق الجاي.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-white">دوس على الصندوق عشان تفتحه!</p>
                <p className="text-xs text-zinc-500 mt-1">
                  XP عشوائي كل يوم. صندوق واحد في اليوم.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Cosmetics studio (packages, nameplates, chat bubbles, profile themes, name colours) ── */}
      {user && <CosmeticsStudio user={user} showToast={showToast} />}

      {/* ── Avatar Frame Milestones ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Frame className="w-4 h-4 text-orange-400" />
            <h2 className="text-[15px] font-black text-white whitespace-nowrap truncate min-w-0">الفريمات</h2>
          </div>
          <div className="text-xs font-bold text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
            <span>✨ فتح الفريمات</span>
            <strong className="text-orange-400">عمره ما بيخصم من</strong>
            <span>الـ XP بتاعك!</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Static cosmetic items */}
          {STATIC_ITEMS.map((item) => {
            const owned = unlockedCosmetics.includes(item.id);
            const canAfford = user && user.total_xp >= item.cost;

            let previewContent: React.ReactNode;
            if (item.isTitle) {
              previewContent = (
                <span className="text-2xs font-black text-center leading-tight px-1" style={{ color: item.color }}>
                  {item.name.replace('اللقب: ', '')}
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
                userXp={user?.total_xp || 0}
                previewContent={previewContent}
                onBuy={() => !owned && handleShopPurchase({ id: item.id, cost: item.cost, type: item.isTitle ? 'title' : 'frame' })}
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
                userXp={user?.total_xp || 0}
                previewContent={previewContent}
                onBuy={() => !owned && !buyingFrameId && handleFrameBuy(String(f._id))}
                equipped={String(equippedFrame) === String(f._id)}
                onEquip={() => switchFrame(String(f._id))}
              />
            );
          })}
        </div>
      </section>
    </m.div>
  );
};
