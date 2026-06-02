import React from 'react';
import { motion } from 'framer-motion';
import { Tv, Heart, MessageCircle, Share2, Key } from 'lucide-react';

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
  return (
    <div className="space-y-6 pt-20 md:pt-6 max-w-4xl mx-auto px-4 pb-20 text-left">
      <div className="flex items-center gap-2.5">
        <Tv className="w-6 h-6 text-brand-orange" />
        <h2 className="text-xl md:text-2xl font-black text-white">Podcast Episodes</h2>
      </div>
      <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-2xl">
        Watch the episodes to find the hidden secret code and solve the quiz to get +250 XP total per episode!
      </p>
      
      <motion.div 
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
        {episodes.map((ep: any) => (
          <motion.div 
            key={ep.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            onClick={() => navigateToEpisode(ep.id)} 
            className="glass-card p-4 hover:border-brand-orange/30 flex flex-col gap-3.5 cursor-pointer group"
          >
            <div 
              className="w-full aspect-[16/9] rounded-xl bg-zinc-900 bg-cover bg-center relative overflow-hidden border border-zinc-800/40" 
              style={{ backgroundImage: `url(${ep.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'})` }}
            >
              <div className="absolute inset-0 bg-black/20" />
              <span className="absolute top-3 right-3 text-[10px] font-black tracking-wider bg-brand-orange/20 text-brand-orange px-2.5 py-1 rounded-md uppercase border border-brand-orange/10">
                Episode {ep.id}
              </span>
            </div>
            
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-black text-white leading-snug group-hover:text-brand-orange transition-colors duration-200">
                {ep.title_ar}
              </h3>
              <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-2">
                {ep.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-900/60 text-[10px]">
              <span className="flex items-center gap-1.5 font-extrabold text-brand-amber">
                <Key className="w-3.5 h-3.5 fill-current" />
                <span>Secret Code + Quiz</span>
              </span>
              <span className="text-zinc-500 font-semibold">
                {new Date(ep.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
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
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
