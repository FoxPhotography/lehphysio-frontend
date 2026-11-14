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
  /** Inside the profile's "شكل البروفايل" sheet: no big title */
  embedded?: boolean;
}

type Tab = CosmeticCategory | 'package';
const CATEGORY_KEYS: CosmeticCategory[] = ['nameplate', 'bubble', 'profile', 'name'];

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

export const CosmeticsStudio: React.FC<Props> = ({ user, showToast, embedded = false }) => {
  const { setUser } = useAuth() as any;
  const [category, setCategory] = useState<Tab>('package');
  const [tryOn, setTryOn] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const xp = user?.total_xp || 0;
  const owned: string[] = user?.unlocked_cosmetics || [];
  const equipped: Look = { ...EMPTY, ...(user?.cosmetics || {}) };
  const cat = COSMETIC_CATEGORIES.find(c => c.key === category);

  // What the mirror shows: your current look, plus the item you're trying on
  const mirror: Look = useMemo(() => {
    if (!tryOn) return equipped;
    const [c, theme] = tryOn.split(':');
    if (tryOn === 'package:streak') return EMPTY;
    if (c === 'package') {
      return { nameplate: `nameplate:${theme}`, bubble: `bubble:${theme}`, profile: `profile:${theme}`, name: `name:${theme}` };
    }
    return { ...equipped, [c]: tryOn };
  }, [tryOn, JSON.stringify(equipped)]);

  const token = () => localStorage.getItem('token') || '';

  const unlock = async (id: string, quiet = false): Promise<boolean> => {
    if (!quiet) setBusy(id);
    let ok = false;
    try {
      const res = await fetch(`${API_BASE}/api/rewards/buy-cosmetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: id, type: id.split(':')[0] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        ok = true;
        setUser((prev: any) => (prev ? { ...prev, unlocked_cosmetics: data.unlocked_cosmetics || [...(prev.unlocked_cosmetics || []), id] } : prev));
        if (!quiet) {
          setCelebrate(id);
          setTimeout(() => setCelebrate(null), 1600);
          showToast('اتفتح! استخدمه وورّي الناس 🔥');
          if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
        }
      } else if (!quiet) {
        showToast(data.error || 'معرفناش نفتحه');
      }
    } catch {
      if (!quiet) showToast('مشكلة في النت');
    }
    if (!quiet) setBusy(null);
    return ok;
  };

  /** Apply several categories in one request (used by packages). */
  const applyLook = async (changes: Partial<Look>, busyKey: string, okMsg: string) => {
    setBusy(busyKey);
    const prevLook = equipped;
    setUser((prev: any) => (prev ? { ...prev, cosmetics: { ...EMPTY, ...(prev.cosmetics || {}), ...changes } } : prev));
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(changes)) {
      const field = COSMETIC_CATEGORIES.find(c => c.key === k)!.field;
      body[field] = v as string;
    }
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.cosmetics) setUser((prev: any) => (prev ? { ...prev, cosmetics: data.cosmetics } : prev));
        showToast(okMsg);
        setTryOn(null);
      } else {
        setUser((prev: any) => (prev ? { ...prev, cosmetics: prevLook } : prev));
        showToast(data.error || 'معرفناش نطبّقه');
      }
    } catch {
      setUser((prev: any) => (prev ? { ...prev, cosmetics: prevLook } : prev));
      showToast('مشكلة في النت');
    }
    setBusy(null);
  };

  // Package = the same theme across all four categories
  const applyPackage = async (themeKey: string) => {
    const ids = CATEGORY_KEYS.map(c => cosmeticId(c, themeKey));
    const toUnlock = ids.filter(id => !owned.includes(id) && xp >= cosmeticPrice(id.split(':')[0] as CosmeticCategory, themeKey));
    setBusy(`package:${themeKey}`);
    const unlocked: string[] = [];
    for (const id of toUnlock) if (await unlock(id, true)) unlocked.push(id);
    const usable = ids.filter(id => owned.includes(id) || unlocked.includes(id));
    if (usable.length === 0) { setBusy(null); showToast('لسه مفيش حاجة مفتوحة من الباكدج ده'); return; }
    const changes: Partial<Look> = {};
    for (const id of usable) changes[id.split(':')[0] as CosmeticCategory] = id;
    if (unlocked.length) {
      setCelebrate(`package:${themeKey}`);
      setTimeout(() => setCelebrate(null), 1600);
      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    }
    await applyLook(changes, `package:${themeKey}`, usable.length === 4 ? 'الباكدج كله اتفعّل — الكل شايفه ✨' : `اتفعّل ${usable.length} من 4 — كمّل وافتح الباقي 💪`);
  };

  const removePackage = (themeKey: string) => {
    const changes: Partial<Look> = {};
    for (const c of CATEGORY_KEYS) if (equipped[c] === cosmeticId(c, themeKey)) changes[c] = 'none';
    applyLook(changes, `package:${themeKey}`, 'رجعت لستايل الستريك 🔥');
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
        showToast(id === 'none' ? 'رجعت لستايل الستريك 🔥' : 'اتفعّل — الكل شايفه دلوقتي ✨');
        setTryOn(null);
      } else {
        setUser((prev: any) => (prev ? { ...prev, cosmetics: prevLook } : prev));
        showToast(data.error || 'معرفناش نفعّله');
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
      {!embedded && (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/15 border border-fuchsia-400/30 flex items-center justify-center">
          <Palette className="w-[18px] h-[18px] text-fuchsia-300" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-black text-white leading-tight">استوديو الستايل 🎨</h2>
          <p className="text-[11px] text-zinc-500 font-bold">افتح بالـ XP، جرّب على نفسك، واستخدمه — والكل يشوفه في ساعتها</p>
        </div>
      </div>
      )}

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
        <button
          type="button"
          onClick={() => { setCategory('package'); setTryOn(null); }}
          className={`shrink-0 flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            category === 'package'
              ? 'text-black border-transparent shadow-lg'
              : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white'
          }`}
          style={category === 'package' ? { background: 'linear-gradient(90deg,#f0abfc,#67e8f9,#fde047)' } : undefined}
        >
          🎁 الباكدج كامل
        </button>
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
      <p className="text-[11px] text-zinc-500 font-bold -mt-2">
        {cat ? cat.hint : 'غيّر كل حاجة مرة واحدة بنفس الستايل: النيم بليت والرسايل والبروفايل واسمك'}
      </p>

      {/* Packages */}
      {category === 'package' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Default: everything follows your streak */}
          {(() => {
            const active = CATEGORY_KEYS.every(c => equipped[c] === 'none');
            const sTheme = getStreakTheme(user?.streak_count || 0);
            return (
              <div
                className={`relative rounded-3xl border p-3 flex flex-col gap-2.5 bg-zinc-900/70 ${tryOn === 'package:streak' ? 'ring-2 ring-white/40' : ''}`}
                style={{ borderColor: active ? `rgb(${sTheme.glow} / 0.75)` : 'rgba(255,255,255,0.1)', boxShadow: active ? `0 0 28px -6px rgb(${sTheme.glow} / 0.6)` : undefined }}
              >
                <button type="button" onClick={() => setTryOn(tryOn === 'package:streak' ? null : 'package:streak')} className="relative overflow-hidden rounded-2xl text-start cursor-pointer" aria-label="جرّب ستايل الستريك">
                  <StreakAura days={user?.streak_count || 0} density="lite" />
                  <div className="relative z-10 p-2.5 space-y-2">
                    <NameplatePreview user={user} look={EMPTY} compact />
                    <BubblePreview user={user} look={EMPTY} text="الستريك بيلوّن كل حاجة 🔥" compact />
                  </div>
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white leading-tight">ستايل الستريك 🔥</p>
                  <p className="text-[10px] text-zinc-500 font-bold">الافتراضي — كل حاجة بلون الستريك بتاعك ({sTheme.name})</p>
                </div>
                {active ? (
                  <div className="h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border" style={{ color: sTheme.text, borderColor: `rgb(${sTheme.glow} / 0.5)`, background: `rgb(${sTheme.glow} / 0.12)` }}>
                    <Check className="w-3.5 h-3.5" /> مستخدَم
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => applyLook({ nameplate: 'none', bubble: 'none', profile: 'none', name: 'none' }, 'package:streak', 'رجعت لستايل الستريك 🔥')}
                    className="h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer bg-white text-black hover:bg-zinc-200 disabled:opacity-60"
                  >
                    {busy === 'package:streak' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🔥'} استخدم ستايل الستريك
                  </button>
                )}
              </div>
            );
          })()}
          {COSMETIC_THEMES.map((t, i) => {
            const ids = CATEGORY_KEYS.map(c => cosmeticId(c, t.key));
            const ownedN = ids.filter(id => owned.includes(id)).length;
            const total = CATEGORY_KEYS.reduce((sum, c) => sum + cosmeticPrice(c, t.key), 0);
            const maxPrice = Math.max(...CATEGORY_KEYS.map(c => cosmeticPrice(c, t.key)));
            const affordableN = ids.filter(id => owned.includes(id) || xp >= cosmeticPrice(id.split(':')[0] as CosmeticCategory, t.key)).length;
            const fullyActive = CATEGORY_KEYS.every(c => equipped[c] === cosmeticId(c, t.key));
            const vis = cosmeticVisual(cosmeticId('profile', t.key)) as CosmeticVisual;
            const rarity = RARITY[t.rarity];
            const key = `package:${t.key}`;
            const look: Look = { nameplate: ids[0], bubble: ids[1], profile: ids[2], name: ids[3] };
            const pct = Math.min(100, Math.round((xp / maxPrice) * 100));
            return (
              <m.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`relative rounded-3xl border p-3 flex flex-col gap-2.5 bg-zinc-900/70 ${tryOn === key ? 'ring-2 ring-white/40' : ''}`}
                style={{ borderColor: fullyActive ? `rgb(${vis.glow} / 0.75)` : `rgb(${vis.glow} / 0.22)`, boxShadow: fullyActive ? `0 0 28px -6px rgb(${vis.glow} / 0.65)` : undefined }}
              >
                <button type="button" onClick={() => setTryOn(tryOn === key ? null : key)} className="relative overflow-hidden rounded-2xl text-start cursor-pointer" aria-label={`جرّب باكدج ${t.name}`}>
                  <StreakAura days={0} override={vis} density="lite" />
                  <div className="relative z-10 p-2.5 space-y-2">
                    <NameplatePreview user={user} look={look} compact />
                    <BubblePreview user={user} look={look} text="الباكدج ده عليا 🔥" compact />
                  </div>
                </button>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white leading-tight">باكدج {t.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">{t.vibe} · {ownedN}/4 مفتوحين</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5" style={{ color: rarity.color, background: rarity.bg }}>
                    {t.rarity === 'mythic' && <Crown className="w-3 h-3" />}
                    {rarity.label}
                  </span>
                </div>
                {affordableN < 4 && (
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-zinc-400" dir="ltr">{Math.min(xp, maxPrice).toLocaleString()} / {maxPrice.toLocaleString()} XP</span>
                      <span className="text-zinc-500">الباكدج كامل</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${vis.c1}, ${vis.c2})` }} />
                    </div>
                  </div>
                )}
                {fullyActive ? (
                  <button type="button" disabled={!!busy} onClick={() => removePackage(t.key)} className="h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer border" style={{ color: vis.text, borderColor: `rgb(${vis.glow} / 0.5)`, background: `rgb(${vis.glow} / 0.12)` }}>
                    {busy === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    مستخدَم — دوس ترجع للستريك
                  </button>
                ) : affordableN > 0 ? (
                  <m.button type="button" disabled={!!busy} whileTap={{ scale: 0.97 }} onClick={() => applyPackage(t.key)} className="h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer text-black disabled:opacity-60" style={{ background: `linear-gradient(90deg, ${vis.c2}, ${vis.c3})`, boxShadow: `0 6px 18px -6px rgb(${vis.glow} / 0.8)` }}>
                    {busy === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {affordableN === 4
                      ? (ownedN === 4 ? 'استخدم الباكدج كله' : 'افتح واستخدم الباكدج كله')
                      : `استخدم المتاح (${affordableN}/4)`}
                  </m.button>
                ) : (
                  <div className="h-10 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 bg-white/[0.04] border border-white/8 text-zinc-500">
                    <Lock className="w-3.5 h-3.5" /> أول قطعة بتتفتح عند {Math.min(...CATEGORY_KEYS.map(c => cosmeticPrice(c, t.key))).toLocaleString()} XP
                  </div>
                )}
                <AnimatePresence>
                  {celebrate === key && (
                    <m.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.3 }} className="pointer-events-none absolute inset-0 rounded-3xl flex items-center justify-center" style={{ background: `radial-gradient(circle, rgb(${vis.glow} / 0.45), transparent 70%)` }}>
                      <span className="text-5xl drop-shadow-lg">🎉</span>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            );
          })}
        </div>
      )}

      {/* Items */}
      {category !== 'package' && (
      <div className="grid grid-cols-2 gap-3">
        {/* Default for this category: follow the streak */}
        {(() => {
          const c = category as CosmeticCategory;
          const active = equipped[c] === 'none';
          const sTheme = getStreakTheme(user?.streak_count || 0);
          return (
            <div
              className="relative rounded-2xl border p-2.5 flex flex-col gap-2.5 bg-zinc-900/60"
              style={{ borderColor: active ? `rgb(${sTheme.glow} / 0.7)` : 'rgba(255,255,255,0.1)', boxShadow: active ? `0 0 24px -6px rgb(${sTheme.glow} / 0.55)` : undefined }}
            >
              <div>
                {c === 'nameplate' && <NameplatePreview user={user} look={EMPTY} compact />}
                {c === 'bubble' && (
                  <div className="h-[72px] rounded-xl bg-black/30 border border-white/5 p-2 flex items-center">
                    <BubblePreview user={user} look={EMPTY} text="بلون الستريك 🔥" compact />
                  </div>
                )}
                {c === 'profile' && <ProfilePreview user={user} look={EMPTY} compact />}
                {c === 'name' && <NamePreview user={user} look={EMPTY} />}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-white leading-tight">ستايل الستريك 🔥</p>
                <p className="text-[10px] text-zinc-500 font-bold truncate">الافتراضي — بيتغير مع الستريك</p>
              </div>
              {active ? (
                <div className="h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border" style={{ color: sTheme.text, borderColor: `rgb(${sTheme.glow} / 0.5)`, background: `rgb(${sTheme.glow} / 0.12)` }}>
                  <Check className="w-3.5 h-3.5" /> مستخدَم
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => equip('none', c)}
                  className="h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer bg-white text-black hover:bg-zinc-200 disabled:opacity-60"
                >
                  {busy === `${c}:none` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🔥'} استخدمه
                </button>
              )}
            </div>
          );
        })()}
        {COSMETIC_THEMES.map((t, i) => {
          const itemCat = category as CosmeticCategory;
          const id = cosmeticId(itemCat, t.key);
          const price = cosmeticPrice(itemCat, t.key);
          const isOwned = owned.includes(id);
          const isEquipped = equipped[itemCat] === id;
          const canUnlock = !isOwned && xp >= price;
          const pct = Math.min(100, Math.round((xp / price) * 100));
          const rarity = RARITY[t.rarity];
          const vis = cosmeticVisual(id) as CosmeticVisual;
          const look: Look = { ...EMPTY, [itemCat]: id };
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
                {itemCat === 'nameplate' && <NameplatePreview user={user} look={look} compact />}
                {itemCat === 'bubble' && (
                  <div className="h-[72px] rounded-xl bg-black/30 border border-white/5 p-2 flex items-center">
                    <BubblePreview user={user} look={look} text="يا عم إنت جامد 🔥" compact />
                  </div>
                )}
                {itemCat === 'profile' && <ProfilePreview user={user} look={look} compact />}
                {itemCat === 'name' && <NamePreview user={user} look={look} />}
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
                  onClick={() => equip('none', itemCat)}
                  className="h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer border transition-colors"
                  style={{ color: vis.text, borderColor: `rgb(${vis.glow} / 0.5)`, background: `rgb(${vis.glow} / 0.12)` }}
                >
                  {busy === `${itemCat}:none` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  مستخدَم — دوس ترجع للستريك
                </button>
              ) : isOwned ? (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => equip(id, itemCat)}
                  className="h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-60"
                >
                  {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  استخدمه
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
      )}

      <p className="text-center text-[11px] text-zinc-500 font-bold">
        ✨ الفتح عمره ما بيخصم من الـ XP بتاعك — كل ما تكبر، حاجات أكتر بتتفتحلك
      </p>
    </section>
  );
};
