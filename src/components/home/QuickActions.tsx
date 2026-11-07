import React from 'react';
import { Play, Key, MessageSquare, Gamepad2, Store } from 'lucide-react';

interface QuickActionsProps {
  xpSettings: any;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ xpSettings = {}, setCurrentPage, setCommunityTab }) => {
  const actions = [
    { label: 'اتفرج', xp: `+${xpSettings.quiz_solve || 150} XP`, icon: Play, onClick: () => setCurrentPage('episodes') },
    { label: 'ادخل كود', xp: 'XP', icon: Key, onClick: () => setCurrentPage('rewards') },
    { label: 'شارك', xp: `+${xpSettings.comment || 15} XP`, icon: MessageSquare, onClick: () => { setCurrentPage('community'); setCommunityTab('chat'); } },
    { label: 'العب', xp: `+${xpSettings.game_play || 50} XP`, icon: Gamepad2, onClick: () => setCurrentPage('games') },
    { label: 'المتجر', xp: 'متجر', icon: Store, onClick: () => setCurrentPage('rewards') },
  ];

  return (
    <section aria-label="اختصارات" className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex sm:grid sm:grid-cols-5 gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              className="snap-start shrink-0 w-[30%] min-w-[104px] sm:w-auto glass-card p-3.5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-brand-orange/30 active:scale-[0.97] transition-transform group"
            >
              <span className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-brand-orange group-hover:border-brand-orange/20 transition-colors">
                <Icon className="w-5 h-5 shrink-0" />
              </span>
              <span className="text-sm font-black text-white leading-tight">{act.label}</span>
              <span className="text-2xs font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">{act.xp}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
