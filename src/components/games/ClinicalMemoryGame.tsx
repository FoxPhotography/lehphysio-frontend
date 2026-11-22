import React, { useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { ArrowRight, Brain, RotateCcw } from 'lucide-react';
import { playSound } from '../../utils/soundEngine';
import { GameIntroScreen } from './ui/GameIntroScreen';
import { GameResultScreen } from './ui/GameResultScreen';
import { PracticeModeBanner } from './ui/PracticeModeBanner';
import { Mascot } from './ui/Mascot';
import { MemoryArt } from './ui/GameArt';
import { haptic } from './ui/feedback';

interface MemoryCard {
  id: string | number;
  value: string;
  sub?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface ClinicalMemoryGameProps {
  memoryCards: MemoryCard[];
  memoryMoves: number;
  memoryMatches: number;
  gameFinished: boolean;
  handleCardClick: (index: number) => void;
  initMemoryGame: () => void;
  gamePlaySuccess?: string;
  gamePlayError?: string;
  dailyPlaysCount: number;
  maxDailyPlays?: number;
  xpReward: number;
  onBack: () => void;
}

export const ClinicalMemoryGame: React.FC<ClinicalMemoryGameProps> = ({
  memoryCards,
  memoryMoves,
  memoryMatches,
  gameFinished,
  handleCardClick,
  initMemoryGame,
  gamePlaySuccess,
  gamePlayError,
  dailyPlaysCount,
  maxDailyPlays = 3,
  xpReward,
  onBack,
}) => {
  const [started, setStarted] = useState(false);
  const prevMatchesRef = useRef(memoryMatches);

  useEffect(() => {
    if (memoryMatches > prevMatchesRef.current) {
      playSound('match_connect');
      haptic('success');
    }
    prevMatchesRef.current = memoryMatches;
  }, [memoryMatches]);

  const isPractice = dailyPlaysCount >= maxDailyPlays;
  const remainingXpPlays = Math.max(0, maxDailyPlays - dailyPlaysCount);

  if (!started) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 pb-10">
        <GameIntroScreen
          accent="orange"
          character="skeleton"
          art={<MemoryArt />}
          title="توصيل التشريح الإكلينيكي"
          subtitle="وصّل كل عضلة بالعصب المغذي لها أو الاختبار التشخيصي بتاعها بأقل عدد من الحركات."
          xpLabel={`+${xpReward} XP`}
          dailyPlaysCount={dailyPlaysCount}
          maxDailyPlays={maxDailyPlays}
          rules={[
            'اقلب كارتين في كل حركة واجمع الـ 8 أزواج الصح',
            'كل عضلة متوصلة بعصبها أو الـ Special Test بتاعها',
            'العب بأقل عدد حركات عشان تكسب الـ XP',
          ]}
          startLabel="ابدأ التوصيل"
          onStart={() => {
            if (memoryCards.length === 0 || gameFinished) {
              initMemoryGame();
            }
            setStarted(true);
          }}
          onBack={onBack}
        />
      </div>
    );
  }

  return (
    <div data-accent="orange" className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 pb-10 text-start">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            playSound('tap');
            onBack();
          }}
          className="lp-press min-h-[42px] inline-flex items-center gap-1.5 text-xs font-black text-zinc-200 hover:text-white bg-[#17171a] border border-white/10 px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          <span>رجوع للألعاب</span>
        </button>

        <span className="text-2xs font-black px-3 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-amber tabular-nums">
          {isPractice ? 'وضع التدريب · بدون XP' : `محاولات XP: ${remainingXpPlays}/${maxDailyPlays}`}
        </span>
      </div>

      {isPractice && <PracticeModeBanner character="skeleton" />}

      <div className="sm:rounded-[var(--g-radius-lg)] sm:bg-[#111113] sm:p-5 sm:border sm:border-brand-orange/25 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Mascot character="skeleton" mood={gameFinished ? 'celebrating' : 'thinking'} size={42} />
            <div>
              <h3 className="text-base md:text-lg font-black text-white flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-brand-orange" />
                <span>توصيل التشريح الإكلينيكي</span>
              </h3>
              <p className="text-xs text-zinc-400 font-semibold">
                وصّل كل عضلة بالعصب أو الاختبار الخاص بيها!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-black">
            <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 tabular-nums">
              حركات: {memoryMoves}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 tabular-nums">
              {memoryMatches}/8 أزواج
            </span>
          </div>
        </div>

        {/* Pair Progress Bar */}
        <div className="h-2 rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-orange to-emerald-400 transition-all duration-300"
            style={{ width: `${Math.min(100, (memoryMatches / 8) * 100)}%` }}
          />
        </div>

        {gameFinished ? (
          <GameResultScreen
            status="won"
            accent="orange"
            character="skeleton"
            isPractice={isPractice}
            title={`مبروك! وصّلت كل الأزواج في ${memoryMoves} حركة!`}
            xp={!isPractice ? xpReward : 0}
            stats={[
              { label: 'الحركات', value: String(memoryMoves) },
              { label: 'الأزواج', value: `${memoryMatches}/8` },
            ]}
            successMsg={gamePlaySuccess || undefined}
            errorMsg={gamePlayError || undefined}
            onReplay={() => {
              initMemoryGame();
              playSound('game_start');
            }}
            replayLabel="العب تاني"
            onBack={onBack}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5 max-w-lg mx-auto">
              {memoryCards.map((card, idx) => {
                const flipped = card.isFlipped || card.isMatched;
                return (
                  <m.div
                    key={card.id}
                    whileTap={flipped ? undefined : { scale: 0.94 }}
                    className="relative rounded-2xl cursor-pointer overflow-hidden aspect-square select-none [perspective:1000px]"
                    onClick={() => {
                      if (!flipped) {
                        haptic('tap');
                        playSound('tap');
                      }
                      handleCardClick(idx);
                    }}
                  >
                    <div
                      className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] ${
                        flipped ? '[transform:rotateY(180deg)]' : ''
                      }`}
                    >
                      {/* Card Back */}
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-brand-orange/50 flex flex-col items-center justify-center text-brand-orange rounded-2xl [backface-visibility:hidden] shadow-inner">
                        <Brain className="w-5 h-5 opacity-75" />
                        <span className="text-[9px] font-black text-zinc-500 mt-1">PHYSIO</span>
                      </div>
                      {/* Card Front */}
                      <div
                        className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center px-1.5 [transform:rotateY(180deg)] [backface-visibility:hidden] border-2 transition-colors ${
                          card.isMatched
                            ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200'
                            : 'bg-zinc-800/95 border-brand-orange/60 text-white'
                        }`}
                      >
                        <span dir="ltr" className="text-[11px] md:text-xs font-black leading-tight break-words">
                          {card.value}
                        </span>
                        {card.sub && (
                          <span className="text-[9px] font-bold text-zinc-300 mt-1 leading-tight">
                            {card.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>

            <button
              type="button"
              className="lp-press min-h-[44px] w-full max-w-lg mx-auto flex items-center justify-center gap-2 border border-white/10 hover:border-white/25 bg-[#17171a] text-zinc-200 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              onClick={() => {
                haptic('tap');
                playSound('tap');
                initMemoryGame();
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>لخبط الكروت من جديد</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
