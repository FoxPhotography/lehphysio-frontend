import React from 'react';
import { Trophy, ChevronLeft, Crown, Medal, Star } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';

interface PodiumPreviewProps {
  leaderboard?: any[];
  setCurrentPage: (page: string) => void;
}

export const PodiumPreview: React.FC<PodiumPreviewProps> = ({
  leaderboard = [],
  setCurrentPage,
}) => {
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 text-lg font-black text-white">
          <Trophy className="w-5 h-5 text-brand-orange" />
          <span>Leaderboard</span>
        </span>
        <button 
          className="flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-amber cursor-pointer transition-colors" 
          onClick={() => setCurrentPage('leaderboard')}
        >
          <span>View All</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="glass-card p-6 mb-5">
        <div className="flex items-end justify-center gap-4 sm:gap-6">
          
          {/* 2nd Place */}
          <div className="flex flex-col items-center gap-1.5 order-1" style={{ opacity: second ? 1 : 0.4 }}>
            <div className="relative z-10">
              <div className="rounded-full relative z-10 ring-2 ring-zinc-400/40">
                <UserAvatar 
                  username={second ? second.username : '—'} 
                  avatarUrl={second ? second.avatar_url : null} 
                  equippedFrame={second ? second.equipped_frame : 'none'} 
                  size={56} 
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-400 text-black flex items-center justify-center shadow-lg z-20">
                <Medal className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-[11px] font-bold text-white text-center max-w-[68px] truncate leading-tight">
              {second ? second.username : '—'}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              {second ? `${second.xp.toLocaleString()} XP` : '0 XP'}
            </span>
            <div className="w-16 sm:w-20 h-16 rounded-t-xl bg-gradient-to-t from-zinc-400 to-zinc-300 opacity-80 flex items-start justify-center pt-1.5">
              <span className="text-[11px] font-black text-black/70">2</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center gap-1.5 order-2" style={{ opacity: first ? 1 : 0.4 }}>
            <div className="relative z-10 -top-3">
              <div className="rounded-full relative z-10 ring-2 ring-amber-400/50">
                <UserAvatar 
                  username={first ? first.username : '—'} 
                  avatarUrl={first ? first.avatar_url : null} 
                  equippedFrame={first ? first.equipped_frame : 'none'} 
                  size={68} 
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg z-20">
                <Crown className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-[11px] font-bold text-white text-center max-w-[68px] truncate leading-tight">
              {first ? first.username : '—'}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              {first ? `${first.xp.toLocaleString()} XP` : '0 XP'}
            </span>
            <div className="w-16 sm:w-20 h-24 rounded-t-xl bg-gradient-to-t from-amber-500 to-yellow-400 opacity-80 flex items-start justify-center pt-1.5">
              <span className="text-[11px] font-black text-black/70">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center gap-1.5 order-3" style={{ opacity: third ? 1 : 0.4 }}>
            <div className="relative z-10">
              <div className="rounded-full relative z-10 ring-2 ring-amber-700/40">
                <UserAvatar 
                  username={third ? third.username : '—'} 
                  avatarUrl={third ? third.avatar_url : null} 
                  equippedFrame={third ? third.equipped_frame : 'none'} 
                  size={52} 
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-lg z-20">
                <Star className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-[11px] font-bold text-white text-center max-w-[68px] truncate leading-tight">
              {third ? third.username : '—'}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              {third ? `${third.xp.toLocaleString()} XP` : '0 XP'}
            </span>
            <div className="w-16 sm:w-20 h-10 rounded-t-xl bg-gradient-to-t from-amber-700 to-amber-600 opacity-80 flex items-start justify-center pt-1.5">
              <span className="text-[11px] font-black text-black/70">3</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
