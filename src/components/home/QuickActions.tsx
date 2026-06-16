import React from 'react';
import { Play, Key, MessageSquare, Gamepad2, Store } from 'lucide-react';

interface QuickActionsProps {
  xpSettings: any;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  xpSettings = {},
  setCurrentPage,
  setCommunityTab,
}) => {
  const actions = [
    { label: 'Watch', xp: `+${xpSettings.quiz_solve || 150} XP`, icon: Play, onClick: () => setCurrentPage('episodes') },
    { label: 'Enter Code', xp: 'Custom', icon: Key, onClick: () => setCurrentPage('rewards') },
    { label: 'Comment', xp: `+${xpSettings.comment || 15} XP`, icon: MessageSquare, onClick: () => { setCurrentPage('community'); setCommunityTab('chat'); } },
    { label: 'Challenges', xp: `+${xpSettings.game_play || 50} XP`, icon: Gamepad2, onClick: () => setCurrentPage('games') },
    { label: 'Rewards Shop', xp: 'Shop', icon: Store, onClick: () => setCurrentPage('rewards') },
  ];

  return (
    <section className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
      {actions.map((act, i) => {
        const Icon = act.icon;
        return (
          <div 
            key={i} 
            className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-brand-orange/30 group"
            onClick={act.onClick}
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-brand-orange group-hover:border-brand-orange/20 transition-all">
              <Icon className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-xs font-black text-white leading-tight">{act.label}</span>
            <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full mt-1">
              {act.xp}
            </span>
          </div>
        );
      })}
    </section>
  );
};
