import React, { useEffect, useState } from 'react';
import { ArrowRight, Flame, Share2, Trophy, Zap } from 'lucide-react';
import { API_BASE } from '../services/api';
import { UserAvatar } from '../components/UserAvatar';
import { SkeletonBlock } from '../components/common/Skeleton';
import { rankProgress } from '../utils/ranks';
import { daysLabel } from '../utils/format';
import { shareCard } from '../utils/shareCard';

interface PublicProfileData {
  username: string;
  batch: string | null;
  role: string;
  avatar_url: string | null;
  equipped_frame: string;
  total_xp: number;
  streak_count: number;
  rank: { name_ar: string; emoji: string; tier: number };
  global_rank: number;
}

interface Props {
  setCurrentPage: (page: string) => void;
  showToast: (msg: string) => void;
}

const usernameFromUrl = () => decodeURIComponent(window.location.pathname.replace(/^\/u\//, '').split('/')[0] || '');

export const PublicProfile: React.FC<Props> = ({ setCurrentPage, showToast }) => {
  const [username] = useState(usernameFromUrl);
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/users/public/${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (!cancelled) { setData(d); setState('ok'); document.title = `${d.username} | ليه فيزيو؟`; } })
      .catch(() => { if (!cancelled) setState('missing'); });
    return () => { cancelled = true; };
  }, [username]);

  if (state === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 xl:pt-6 space-y-4 animate-pulse" role="status" aria-label="جاري التحميل">
        <SkeletonBlock className="h-72" />
        <div className="grid grid-cols-3 gap-3"><SkeletonBlock className="h-24" /><SkeletonBlock className="h-24" /><SkeletonBlock className="h-24" /></div>
      </div>
    );
  }

  if (state === 'missing' || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 xl:pt-6 text-center space-y-4 pt-10">
        <p className="text-lg font-black text-white">مفيش حساب بالاسم ده</p>
        <button onClick={() => setCurrentPage('leaderboard')} className="text-brand-orange font-bold">شوف لوحة الترتيب</button>
      </div>
    );
  }

  const { next, pct, remaining } = rankProgress(data.total_xp);
  const profileUrl = `${window.location.origin}/u/${encodeURIComponent(data.username)}`;

  const onShare = async () => {
    setSharing(true);
    const result = await shareCard(
      { username: data.username, avatarUrl: data.avatar_url, rankName: data.rank?.name_ar, rankEmoji: data.rank?.emoji, totalXp: data.total_xp, globalRank: data.global_rank, streak: data.streak_count, batch: data.batch },
      profileUrl
    );
    setSharing(false);
    if (result === 'downloaded') showToast('الكارت اتحفظ — نزّله ستوري! 📸');
    if (result === 'failed') showToast('معرفناش نعمل الكارت.');
  };

  return (
    <div className="max-w-lg mx-auto px-4 xl:pt-6 space-y-4">
      <button
        className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold text-sm"
        onClick={() => (window.history.length > 1 ? window.history.back() : setCurrentPage('leaderboard'))}
      >
        <ArrowRight className="w-4 h-4" /> رجوع
      </button>

      <section className="glass-card p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden">
        <div aria-hidden className="absolute -top-24 inset-x-0 mx-auto w-72 h-72 rounded-full bg-brand-orange/15 blur-3xl" />
        <UserAvatar username={data.username} avatarUrl={data.avatar_url} equippedFrame={data.equipped_frame} size={112} eager className="mt-2" />
        <div className="relative">
          <h1 className="text-2xl font-black text-white" dir="auto">{data.username}</h1>
          {data.batch && <p className="text-sm text-zinc-500 font-bold mt-0.5">{data.batch}</p>}
        </div>
        <span className="relative text-sm font-black text-brand-amber bg-brand-orange/10 border border-brand-orange/30 rounded-full px-4 py-1.5">
          {data.rank?.emoji} {data.rank?.name_ar}
        </span>
        <div className="w-full mt-2">
          <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
            <div className="h-full bg-gradient-to-l from-brand-orange to-brand-amber rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-zinc-500 font-bold mt-1.5">
            {next ? <>باقي <bdi dir="ltr">{remaining.toLocaleString('en-US')} XP</bdi> على {next.name}</> : 'وصل لأعلى رتبة 👑'}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3" aria-label="الإحصائيات">
        <Stat icon={<Zap className="w-5 h-5 text-brand-orange" />} value={data.total_xp.toLocaleString('en-US')} label="XP" />
        <Stat icon={<Trophy className="w-5 h-5 text-brand-amber" />} value={`#${data.global_rank}`} label="الترتيب" />
        <Stat icon={<Flame className="w-5 h-5 text-brand-orange fill-current" />} value={daysLabel(data.streak_count)} label="متتالية" />
      </section>

      <button
        onClick={onShare}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2 bg-brand-orange text-black font-black rounded-2xl py-3.5 active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        <Share2 className="w-5 h-5" />
        {sharing ? 'بنجهّز الكارت…' : 'شارك الكارت ستوري'}
      </button>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="glass-card p-3.5 flex flex-col items-center gap-1.5 text-center">
    {icon}
    <span className="text-base font-black text-white" dir="auto">{value}</span>
    <span className="text-2xs text-zinc-500 font-bold">{label}</span>
  </div>
);
