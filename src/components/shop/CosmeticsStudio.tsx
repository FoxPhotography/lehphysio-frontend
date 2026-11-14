import React, { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Lock, Check, Sparkles, Loader2, Palette, Eye, Crown } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';
import { StreakNameplate, StreakName, StreakAura, StreakBubbleLayers, StreakChip } from '../streak/Streak';
import { streakVars, getStreakTheme } from '../../utils/streakTheme';
import {
  COSMETIC_THEMES,
  COSMETIC_CATEGORIES,
  RARITY,
  cosmeticId,
  cosmeticPrice,
  cosmeticVisual,
  type CosmeticCategory,
  type CosmeticVisual,
} from '../../utils/cosmetics';
import { API_BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Props {
  user: any;
  showToast: (msg: string) => void;
}

type Look = { nameplate: string; bubble: string; profile: string; name: string };
const EMPTY: Look = { nameplate: 'none', bubble: 'none', profile: 'none', name: 'none' };

// ─── Live previews (the same components the app uses everywhere) ─────────────

const NameplatePreview: React.FC<{ user: any; look: Look; compact?: boolean }> = ({ user, look, compact }) => {
  const streak = user?.streak_count || 0;
  return (
    <StreakNameplate
      days={streak}
      override={cosmeticVisual(look.nameplate)}
      className={`flex items-center gap-2.5 rounded-xl border border-white/8 bg-zinc-950/70 ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
    >
      <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-black text-white">1</span>
      <UserAvatar username={user?.username || 'A'} avatarUrl={user?.avatar_url} equippedFrame={user?.equipped_frame} size={compact ? 26 : 32} />
      <div className="flex-1 min-w-0 text-start">
        <div className={`${compact ? 'text-[11px]' : 'text-[13px]'} font-black text-white truncate`}>
          <StreakName days={streak} override={cosmeticVisual(look.name)}>{user?.username || 'إنت'}</StreakName>
        </div>
        {!compact && streak > 0 && <StreakChip days={streak} size="xs" />}
      </div>
      {!compact && (
        <span className="text-xs px-2 py-0.5 rounded-md bg-black/40 border border-orange-500/25 font-black text-orange-400" dir="ltr">
          {(user?.total_xp || 0).toLocaleString()} XP
        </span>
      )}
    </StreakNameplate>
  );
};

const BubblePreview: React.FC<{ user: any; look: Look; text?: string; compact?: boolean }> = ({ user, look, text = 'حد معاه ملخص الأناتومي؟ 👀', compact }) => {
  const streak = user?.streak_count || 0;
  const cos = cosmeticVisual(look.bubble);
  const fancy = !!cos || streak >= 3;
  return (
    <div className="flex flex-col items-start gap-1 min-w-0">
      <span className="text-[10px] font-black">
        <StreakName days={streak} override={cosmeticVisual(look.name)}>{user?.username || 'إنت'}</StreakName>
      </span>
      {fancy ? (
        <div
          className={`streak-bubble ${cos ? `cos-fx cos-fx--${cos.fx}` : ''} rounded-2xl rounded-ss-none ${compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-[13px]'} font-semibold max-w-full`}
          style={streakVars(cos || getStreakTheme(streak))}
        >
          <StreakBubbleLayers days={streak} override={cos} />
          <span className="relative">{text}</span>
        </div>
      ) : (
        <div className={`rounded-2xl rounded-ss-none bg-gradient-to-r from-orange-500 to-amber-400 text-black font-semibold ${compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-[13px]'}`}>{text}</div>
      )}
    </div>
  );
};

const ProfilePreview: React.FC<{ user: any; look: Look; compact?: boolean }> = ({ user, look, compact }) => {
  const streak = user?.streak_count || 0;
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-1.5 ${compact ? 'h-[104px]' : 'h-40'}`}>
      <StreakAura days={streak} override={cosmeticVisual(look.profile)} density={compact ? 'lite' : 'full'} />
      <div className="relative z-10">
        <UserAvatar username={user?.username || 'A'} avatarUrl={user?.avatar_url} equippedFrame={user?.equipped_frame} size={compact ? 40 : 58} />
      </div>
      <span className={`relative z-10 ${compact ? 'text-[11px]' : 'text-sm'} font-black text-white`}>
        <StreakName days={streak} override={cosmeticVisual(look.name)}>{user?.username || 'إنت'}</StreakName>
      </span>
    </div>
  );
};

const NamePreview: React.FC<{ user: any; look: Look }> = ({ user, look }) => (
  <div className="h-[104px] rounded-2xl border border-white/10 bg-zinc-950/70 flex flex-col items-center justify-center gap-1">
    <span className="text-xl font-black text-white">
      <StreakName days={user?.streak_count || 0} override={cosmeticVisual(look.name)}>{user?.username || 'إنت'}</StreakName>
    </span>
    <span className="text-[10px] text-zinc-500 font-bold">في الشات والليدربورد والبروفايل</span>
  </div>
);

// ─── Studio ──────────────────────────────────────────────────────────────────

export const CosmeticsStudio: React.FC<Props> = ({ user, showToast }) => {
  const { setUser } = useAuth() as any;
  const [category, setCategory] = useState<CosmeticCategory>('nameplate');
  const [tryOn, setTryOn] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const xp = user?.total_xp || 0;
  const owned: string[] = user?.unlocked_cosmetics || [];
  const equipped: Look = { ...EMPTY, ...(user?.cosmetics || {}) };
  const cat = COSMETIC_CATEGORIES.find(c => c.key === category)!;

  // What the mirror shows: your current look, plus the item you're trying on
  const mirror: Look = useMemo(() => {
    if (!tryOn) return equipped;
    const [c] = tryOn.split(':') as [CosmeticCategory];
    return { ...equipped, [c]: tryOn };
  }, [tryOn, JSON.stringify(equipped)]);

  const token = () => localStorage.getItem('token') || '';

  const unlock = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`${API_BASE}/api/rewards/buy-cosmetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: id, type: id.split(':')[0] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUser((prev: any) => (prev ? { ...prev, unlocked_cosmetics: data.unlocked_cosmetics || [...(prev.unlocked_cosmetics || []), id] } : prev));
        setCelebrate(id);
        setTimeout(() => setCelebrate(null), 1600);
        showToast('اتفتح! البسه وورّي الناس 🔥');
        if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
      } else {
        showToast(data.error || 'معرفناش نفتحه');
      }
    } catch {
      showToast('مشكلة في النت');
    }
    setBusy(null);
  };

  const equip = async (id: string | 'none', categoryKey: CosmeticCategory) => {
    const field = COSMETIC_CATEGORIES.find(c => c.key === categoryKey)!.field;
    setBusy(id === 'none' ? `${categoryKey}:none` : id);
    const prevLook = equipped;
    // Optimistic: your look changes instantly
    setUser((prev: any) => (prev ? { ...prev, cosmetics: { ...EMPTY, ...(prev.cosmetics || {}), [categoryKey]: id } } : prev));
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ [field]: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.cosmetics) setUser((prev: any) => (prev ? { ...prev, cosmetics: data.cosmetics } : prev));
        showToast(id === 'none' ? 'قلعته 👌' : 'لابسه دلوقتي — الكل شايفه ✨');
        setTryOn(null);
      } else {
        setUser((prev: any) => (prev ? { ...prev, cosmetics: prevLook } : prev));
        showToast(data.error || 'معرفناش نلبّسهولك');
      }
    } catch {
      setUser((prev: any) => (prev ? { ...prev, cosmetics: prevLook } : prev));
      showToast('مشكلة في النت');
    }
    setBusy(null);
  };

  const ownedCount = (c: CosmeticCategory) => COSMETIC_THEMES.filter(t => owned.includes(cosmeticId(c, t.key))).length;

  return (
    <section id="cosmetics-studio" className="space-y-4 scroll-mt-24">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/15 border border-fuchsia-400/30 flex items-center justify-center">
          <Palette className="w-[18px] h-[18px] text-fuchsia-300" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-black text-white leading-tight">استوديو الستايل 🎨</h2>
          <p className="text-[11px] text-zinc-500 font-bold">افتح بالـ XP، جرّب على نفسك، والبس — والكل يشوفه في ساعتها</p>
        </div>
      </div>

      {/* Mirror */}
      <div className="relative rounded-3xl border border-white/10 bg-zinc-950/80 p-3.5 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-zinc-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> {tryOn ? 'بتجرّب دلوقتي' : 'شكلك دلوقتي'}
          </span>
          {tryOn && (
            <button type="button" onClick={() => setTryOn(null)} className="text-[11px] font-black text-zinc-400 hover:text-white cursor-pointer">
              رجّع شكلي ✕
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3">
          <div className="space-y-3 min-w-0">
            <NameplatePreview user={user} look={mirror} />
            <div className="rounded-2xl bg-black/30 border border-white/5 p-3">
              <BubblePreview user={user} look={mirror} />
            </div>
          </div>
          <ProfilePreview user={user} look={mirror} />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {COSMETIC_CATEGORIES.map(c => {
          const active = c.key === category;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => { setCategory(c.key); setTryOn(null); }}
              className={`shrink-0 flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                active ? 'bg-white text-black border-white shadow-lg shadow-white/10' : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white'
              }`}
            >
              {c.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? 'bg-black/10' : 'bg-white/5 text-zinc-500'}`}>
                {ownedCount(c.key)}/{COSMETIC_THEMES.length}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-zinc-500 font-bold -mt-2">{cat.hint}</p>

      {/* Items */}
      <div className="grid grid-cols-2 gap-3">
        {COSMETIC_THEMES.map((t, i) => {
          const id = cosmeticId(category, t.key);
          const price = cosmeticPrice(category, t.key);
          const isOwned = owned.includes(id);
          const isEquipped = equipped[category] === id;
          const canUnlock = !isOwned && xp >= price;
          const pct = Math.min(100, Math.round((xp / price) * 100));
          const rarity = RARITY[t.rarity];
          const vis = cosmeticVisual(id) as CosmeticVisual;
          const look: Look = { ...EMPTY, [category]: id };
          const isBusy = busy === id;

          return (
            <m.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`relative rounded-2xl border p-2.5 flex flex-col gap-2.5 transition-colors ${
                isEquipped ? 'bg-zinc-900/90' : 'bg-zinc-900/60 hover:bg-zinc-900/80'
              } ${tryOn === id ? 'ring-2 ring-white/40' : ''}`}
              style={{
                borderColor: isEquipped ? `rgb(${vis.glow} / 0.7)` : `rgb(${vis.glow} / 0.18)`,
                boxShadow: isEquipped ? `0 0 24px -6px rgb(${vis.glow} / 0.6)` : undefined,
              }}
            >
              {/* Live preview — tap to try it on in the mirror */}
              <button
                type="button"
                onClick={() => setTryOn(tryOn === id ? null : id)}
                className="text-start cursor-pointer"
                aria-label={`جرّب ${t.name}`}
              >
                {category === 'nameplate' && <NameplatePreview user={user} look={look} compact />}
                {category === 'bubble' && (
                  <div className="h-[72px] rounded-xl bg-black/30 border border-white/5 p-2 flex items-center">
                    <BubblePreview user={user} look={look} text="يا عم إنت جامد 🔥" compact />
                  </div>
                )}
                {category === 'profile' && <ProfilePreview user={user} look={look} compact />}
                {category === 'name' && <NamePreview user={user} look={look} />}
              </button>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-black text-white leading-tight truncate">{t.name}</p>
                  <p className="text-[10px] text-zinc-500 font-bold truncate">{t.vibe}</p>
                </div>
                <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5" style={{ color: rarity.color, background: rarity.bg }}>
                  {t.rarity === 'mythic' && <Crown className="w-3 h-3" />}
                  {rarity.label}
                </span>
              </div>

              {!isOwned && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-zinc-400" dir="ltr">{Math.min(xp, price).toLocaleString()} / {price.toLocaleString()} XP</span>
                    <span className={canUnlock ? 'text-emerald-400' : 'text-zinc-500'}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: canUnlock ? 'linear-gradient(90deg,#10b981,#2dd4bf)' : `linear-gradient(90deg, ${vis.c1}, ${vis.c2})` }}
                    />
                  </div>
                </div>
              )}

              {/* Action */}
              {isEquipped ? (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => equip('none', category)}
                  className="h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer border transition-colors"
                  style={{ color: vis.text, borderColor: `rgb(${vis.glow} / 0.5)`, background: `rgb(${vis.glow} / 0.12)` }}
                >
                  {busy === `${category}:none` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  لابسه — دوس تقلعه
                </button>
              ) : isOwned ? (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => equip(id, category)}
                  className="h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-60"
                >
                  {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  البسه
                </button>
              ) : canUnlock ? (
                <m.button
                  type="button"
                  disabled={!!busy}
                  onClick={() => unlock(id)}
                  whileTap={{ scale: 0.96 }}
                  className="h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer text-black shadow-lg disabled:opacity-60"
                  style={{ background: `linear-gradient(90deg, ${vis.c2}, ${vis.c3})`, boxShadow: `0 6px 18px -6px rgb(${vis.glow} / 0.8)` }}
                >
                  {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🔓'}
                  افتحه ببلاش
                </m.button>
              ) : (
                <div className="h-9 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 bg-white/[0.04] border border-white/8 text-zinc-500">
                  <Lock className="w-3.5 h-3.5" />
                  فاضلك {(price - xp).toLocaleString()} XP
                </div>
              )}

              {/* Unlock celebration */}
              <AnimatePresence>
                {celebrate === id && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.3 }}
                    className="pointer-events-none absolute inset-0 rounded-2xl flex items-center justify-center"
                    style={{ background: `radial-gradient(circle, rgb(${vis.glow} / 0.45), transparent 70%)` }}
                  >
                    <span className="text-4xl drop-shadow-lg">🎉</span>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-zinc-500 font-bold">
        ✨ الفتح عمره ما بيخصم من الـ XP بتاعك — كل ما تكبر، حاجات أكتر بتتفتحلك
      </p>
    </section>
  );
};
