import React, { useMemo, useState } from 'react';
import { Thumb } from '../components/common/Thumb';
import { m } from 'framer-motion';
import { Tv, Heart, MessageCircle, Share2, Key } from 'lucide-react';
import { groupBySeason, episodeNumber, seasonName } from '../utils/episode';

interface EpisodesProps {
  episodes: any[];
  navigateToEpisode: (id: number) => void;
  handleLikeEpisode: (id: number) => void;
  handleShareEpisode: (id: number) => void;
  user: any;
}

export const Episodes: React.FC<EpisodesProps> = ({
  episodes,
  navigateToEpisode,
  handleLikeEpisode,
  handleShareEpisode,
  user
}) => {
  const seasons = useMemo(() => groupBySeason(episodes || []), [episodes]);
  const [picked, setPicked] = useState<number | null>(null);
  const activeSeason = picked ?? seasons[0]?.season ?? 1;
  const current = seasons.find(g => g.season === activeSeason) || seasons[0];
  const list = current?.episodes || [];

  return (
    <div className="space-y-6 xl:pt-6 max-w-4xl mx-auto px-4 text-start">
      <div className="flex items-center gap-2.5">
        <Tv className="w-6 h-6 text-brand-orange" />
        <h2 className="text-xl md:text-2xl font-black text-white">حلقات البودكاست</h2>
      </div>
      <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-2xl">
"        اتفرج على الحلقة، دوّر على الكود السري وحل الكويز، واكسب لحد +250 XP في كل حلقة!
      </p>

      {/* Season switcher */}
      {seasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1" role="tablist" aria-label="المواسم">
          {seasons.map(g => {
            const on = g.season === activeSeason;
            return (
              <button
                key={g.season}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPicked(g.season)}
                className={`shrink-0 flex items-center gap-2 ps-3.5 pe-2 py-2 rounded-xl border text-xs font-black cursor-pointer transition-colors ${
                  on ? 'bg-brand-orange text-black border-brand-orange' : 'bg-white/[0.03] text-zinc-300 border-white/10 hover:border-white/20'
                }`}
              >
                <span>{seasonName(g.season)}</span>
                <span className={`min-w-[22px] h-[22px] px-1.5 rounded-lg flex items-center justify-center text-2xs tabular-nums ${on ? 'bg-black/15' : 'bg-white/8 text-zinc-400'}`}>
                  {g.episodes.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {current && (
        <div className="flex items-end justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-lg font-black text-white">{seasonName(current.season)}</h3>
            <p className="text-2xs text-zinc-500 font-bold mt-0.5">
              {current.episodes.length} {current.episodes.length === 1 ? 'حلقة' : current.episodes.length <= 10 ? 'حلقات' : 'حلقة'}
              {current.season === seasons[0]?.season && seasons.length > 1 ? ' · الموسم الحالي' : ''}
            </p>
          </div>
        </div>
      )}
      
      <m.div 
        key={activeSeason}
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {list.map((ep: any, index: number) => (
          <m.div 
            key={ep.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            onClick={() => navigateToEpisode(ep.id)} 
            className="glass-card p-4 hover:border-brand-orange/30 flex flex-col gap-3.5 cursor-pointer group"
          >
            <div className="w-full aspect-[16/9] rounded-xl bg-zinc-900 relative overflow-hidden border border-zinc-800/40">
              <Thumb src={ep.thumbnail_url} width={420} eager={index === 0} />
              <div className="absolute inset-0 bg-black/20" />
              <span className="absolute top-3 end-3 flex items-center rounded-lg overflow-hidden text-2xs font-black border border-white/10 bg-black/55">
                <span className="px-2 py-1 text-zinc-300">م{current?.season}</span>
                <span className="px-2.5 py-1 bg-brand-orange text-black">الحلقة {episodeNumber(ep)}</span>
              </span>
            </div>
            
            <div className="flex-1 space-y-2">
              <h3 dir="auto" className="text-base font-black text-white leading-snug group-hover:text-brand-orange transition-colors duration-200">
                {ep.title_ar}
              </h3>
              <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-2">
                {ep.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-900/60 text-2xs">
              <span className="flex items-center gap-1.5 font-extrabold text-brand-amber">
                <Key className="w-3.5 h-3.5 fill-current" />
                <span>كود سري + كويز</span>
              </span>
              <span className="text-zinc-500 font-semibold">
                {new Date(ep.created_at).toLocaleString('ar-EG-u-nu-latn', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>

            {/* Social action feedback row */}
            <div className="flex justify-around items-center pt-3 border-t border-zinc-900/60">
              <button 
                className={`flex items-center gap-1.5 text-xs font-extrabold transition-colors cursor-pointer ${ep.isLiked ? 'text-brand-orange' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeEpisode(ep.id);
                }}
              >
                <Heart className={`w-4 h-4 ${ep.isLiked ? 'fill-current' : ''}`} /> 
                <span>{ep.likes_count || 0}</span>
              </button>

              <button 
                className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToEpisode(ep.id);
                  setTimeout(() => {
                    const inp = document.getElementById('episode-comment-input');
                    if (inp) inp.focus();
                  }, 150);
                }}
              >
                <MessageCircle className="w-4 h-4" /> 
                <span>{ep.comments_count || 0}</span>
              </button>

              <button 
                className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareEpisode(ep.id);
                }}
              >
                <Share2 className="w-4 h-4" /> 
                <span>{ep.shares_count || 0}</span>
              </button>
            </div>
          </m.div>
        ))}
      </m.div>
    </div>
  );
};
