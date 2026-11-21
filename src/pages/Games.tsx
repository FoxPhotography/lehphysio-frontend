import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  ArrowLeft,
  Trophy,
  Users,
  Zap,
  RefreshCw,
  AlertCircle,
  Play,
  Stethoscope,
  Activity,
  Brain,
  DoorOpen,
  Sparkles,
  Clock,
  Loader2,
} from 'lucide-react';
import type { SpinResult } from '../components/games/LuckyWheel';
import { gameService } from '../services/gameService';
import { fireWinConfetti } from '../utils/confetti';
import { UserAvatar } from '../components/UserAvatar';
import { useSocket } from '../context/SocketContext';
import { StreakFlame } from '../components/streak/Streak';
import { getStreakTheme } from '../utils/streakTheme';

const LuckyWheel = lazy(() =>
  import('../components/games/LuckyWheel').then((mod) => ({ default: mod.LuckyWheel }))
);
const ClinicalDetectiveGame = lazy(() =>
  import('../components/games/ClinicalDetectiveGame').then((mod) => ({ default: mod.ClinicalDetectiveGame }))
);
const SpecialTestsBlitz = lazy(() =>
  import('../components/games/SpecialTestsBlitz').then((mod) => ({ default: mod.SpecialTestsBlitz }))
);
const NervePathGame = lazy(() =>
  import('../components/games/NervePathGame').then((mod) => ({ default: mod.NervePathGame }))
);
const WhosResponsibleGame = lazy(() =>
  import('../components/games/WhosResponsibleGame').then((mod) => ({ default: mod.WhosResponsibleGame }))
);
const AnatomySudokuGame = lazy(() =>
  import('../components/games/AnatomySudokuGame').then((mod) => ({ default: mod.AnatomySudokuGame }))
);
const PhysioWordleGame = lazy(() =>
  import('../components/games/PhysioWordleGame').then((mod) => ({ default: mod.PhysioWordleGame }))
);

type GameMode = 'anatomy' | 'clinical' | 'special_tests';

interface OpenRoom {
  code: string;
  host: string;
  gameMode: GameMode;
  rounds: number;
  roundDuration: number;
  playersCount: number;
  hostAvatar?: string | null;
}

interface GamesProps {
  user: any;
  gameTab: 'single' | 'multiplayer';
  setGameTab: (tab: 'single' | 'multiplayer') => void;
  activeGame: 'memory' | 'spin' | 'diagnosis' | 'special-tests' | 'nerve-path' | 'whos-responsible' | 'sudoku' | 'wordle' | null;
  setActiveGame: (game: 'memory' | 'spin' | 'diagnosis' | 'special-tests' | 'nerve-path' | 'whos-responsible' | 'sudoku' | 'wordle' | null) => void;
  gameFinished: boolean;
  setGameFinished: (val: boolean) => void;
  memoryMoves: number;
  memoryMatches: number;
  gamePlaySuccess: string;
  gamePlayError: string;
  initMemoryGame: () => void;
  memoryCards: any[];
  handleCardClick: (index: number) => void;
  wheelRotation: number;
  handleSpinWheelClick: () => void;
  isSpinning: boolean;
  lastSpinResult?: SpinResult | null;
  gameError: string;
  createGameRounds: number;
  setCreateGameRounds: (val: number) => void;
  createGameDuration: number;
  setCreateGameDuration: (val: number) => void;
  createGameMode: GameMode;
  setCreateGameMode: (mode: GameMode) => void;
  claimGameXP: (gameId?: number) => void;
  handleCreateGameRoom: () => void;
  gameRoomCodeInput: string;
  setGameRoomCodeInput: (val: string) => void;
  handleJoinGameRoom: (code: string) => void;
  isGameLoading: boolean;
  hasSpunToday: boolean;
  xpSettings?: any;
  dailyPlays?: Record<number, number>;
}

const MODE_META: Record<
  GameMode,
  {
    title: string;
    badge: string;
    desc: string;
    accentText: string;
    accentBorder: string;
    accentBg: string;
    icon: React.ReactNode;
  }
> = {
  anatomy: {
    title: 'تحدي التشريح السريع',
    badge: 'تشريح • عضلات وأعصاب',
    desc: 'خمن العضلة أو العصب أو العظمة من 4 تلميحات متدرجة أو اختيارات سريعة قبل صحابك.',
    accentText: 'text-brand-orange',
    accentBorder: 'hover:border-brand-orange/40',
    accentBg: 'from-brand-orange/15 via-transparent to-transparent',
    icon: <Brain className="w-5 h-5 text-brand-orange" />,
  },
  clinical: {
    title: 'عيادة الطوارئ أونلاين',
    badge: 'تشخيص إكلينيكي • Red Flags',
    desc: 'حالة مريض حقيقية بتتكشف خطوة بخطوة — اشخص الحالة أسرع من زمايلك واخطف البونص.',
    accentText: 'text-emerald-400',
    accentBorder: 'hover:border-emerald-500/40',
    accentBg: 'from-emerald-500/15 via-transparent to-transparent',
    icon: <Stethoscope className="w-5 h-5 text-emerald-400" />,
  },
  special_tests: {
    title: 'مبارزة الـ Special Tests',
    badge: 'OSCE • اختبارات المفاصل',
    desc: 'مين حافظ اختبارات العظام والأعصاب أسرع؟ جاوب من السيناريو وارفع الستريك بتاعك!',
    accentText: 'text-violet-400',
    accentBorder: 'hover:border-violet-500/40',
    accentBg: 'from-violet-500/15 via-transparent to-transparent',
    icon: <Activity className="w-5 h-5 text-violet-400" />,
  },
};

export const Games: React.FC<GamesProps> = ({
  user,
  gameTab,
  setGameTab,
  activeGame,
  setActiveGame,
  gameFinished,
  setGameFinished,
  memoryMoves,
  memoryMatches,
  gamePlaySuccess,
  gamePlayError,
  initMemoryGame,
  memoryCards,
  handleCardClick,
  wheelRotation,
  handleSpinWheelClick,
  isSpinning,
  lastSpinResult,
  gameError,
  createGameRounds,
  setCreateGameRounds,
  createGameDuration,
  setCreateGameDuration,
  createGameMode,
  setCreateGameMode,
  claimGameXP,
  handleCreateGameRoom,
  gameRoomCodeInput,
  setGameRoomCodeInput,
  handleJoinGameRoom,
  isGameLoading,
  hasSpunToday,
  xpSettings = {},
  dailyPlays = {},
}) => {
  const [showMultiplayerSetup, setShowMultiplayerSetup] = useState(false);
  const [openRooms, setOpenRooms] = useState<OpenRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const memoryConfettiFiredRef = useRef(false);
  const socket = useSocket();

  const xpPerPlay = xpSettings.game_play || 20;
  const diagnosisXp = 100;
  const osceXp = 200;

  const detectivePlays = dailyPlays?.[2] ?? 0;
  const oscePlays = dailyPlays?.[3] ?? 0;
  const memoryPlays = dailyPlays?.[1] ?? 0;
  const nervePlays = dailyPlays?.[4] ?? 0;
  const responsiblePlays = dailyPlays?.[5] ?? 0;
  const sudokuPlays = dailyPlays?.[6] ?? 0;
  const wordlePlays = dailyPlays?.[7] ?? 0;

  useEffect(() => {
    setShowMultiplayerSetup(false);
  }, [gameTab]);

  // Fire confetti once when Memory Match finishes
  useEffect(() => {
    if (activeGame === 'memory' && gameFinished && !memoryConfettiFiredRef.current) {
      memoryConfettiFiredRef.current = true;
      fireWinConfetti();
    }
    if (!gameFinished) {
      memoryConfettiFiredRef.current = false;
    }
  }, [activeGame, gameFinished]);

  const loadOpenRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await gameService.fetchOpenRooms();
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOpenRooms(data);
      }
    } catch {
      // Ignore network hiccup
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (gameTab !== 'multiplayer' || showMultiplayerSetup) return undefined;
    loadOpenRooms();
    if (!socket) return undefined;
    const onRoomsUpdated = (rooms: OpenRoom[]) => {
      if (Array.isArray(rooms)) setOpenRooms(rooms);
    };
    socket.on('open_rooms_updated', onRoomsUpdated);
    return () => {
      socket.off('open_rooms_updated', onRoomsUpdated);
    };
  }, [gameTab, showMultiplayerSetup, loadOpenRooms, socket]);

  const openModeSetup = (mode: GameMode) => {
    setCreateGameMode(mode);
    setShowMultiplayerSetup(true);
  };

  return (
    <div className="space-y-6 xl:pt-6 max-w-4xl mx-auto px-4 text-start pb-8">
      {/* ── Premium Arcade Hero Header ───────────────────────────────────────── */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-brand-orange/25 bg-gradient-to-br from-brand-orange/15 via-zinc-900/90 to-amber-500/10 p-5 md:p-6 shadow-[0_12px_40px_rgba(255,106,0,0.08)]"
      >
        <div className="absolute -top-16 -end-16 w-48 h-48 rounded-full bg-brand-orange/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-2xs font-black">
              <Sparkles className="w-3 h-3" />
              <span>ساحة ألعاب ليه فيزيو</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-brand-orange" />
              <span>اتعلّم، نافس، واكسب XP</span>
            </h2>
            <p className="text-xs text-zinc-400 font-semibold max-w-lg">
              ألعاب إكلينيكية وتشريحية ممتعة تلعبها لوحدك أو أونلاين في غرف مباشرة مع صحابك.
            </p>
          </div>

          {user && (() => {
            const streakDays = user.streak_count || 0;
            const st = getStreakTheme(streakDays);
            const hasStreak = st.key !== 'none';
            return (
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <div className="px-3.5 py-2 rounded-2xl bg-zinc-950/80 border border-white/10 text-center">
                  <span className="block text-2xs font-bold text-zinc-500">مجموع XP</span>
                  <span className="text-sm font-black text-brand-amber font-mono tabular-nums">
                    {user.total_xp || 0}
                  </span>
                </div>
                <div
                  className="px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 transition-all"
                  style={{
                    backgroundColor: hasStreak ? `rgb(${st.glow} / 0.12)` : 'rgba(9, 9, 11, 0.8)',
                    borderColor: hasStreak ? `rgb(${st.glow} / 0.38)` : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: hasStreak ? `0 0 18px rgb(${st.glow} / 0.16)` : undefined,
                  }}
                >
                  <StreakFlame days={streakDays} size={22} />
                  <div className="text-start leading-tight">
                    <span className="block text-[10px] font-bold text-zinc-400 whitespace-nowrap">
                      الستريك{hasStreak ? ` · ${st.name}` : ''}
                    </span>
                    <span
                      className="block text-sm font-black whitespace-nowrap mt-0.5"
                      style={{ color: hasStreak ? st.text : '#a1a1aa' }}
                    >
                      {streakDays > 0 ? (streakDays === 1 ? 'يوم واحد' : streakDays === 2 ? 'يومين' : streakDays > 10 ? `${streakDays} يوم` : `${streakDays} أيام`) : '0 أيام'}
                    </span>
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-zinc-950/80 border border-white/10 text-center">
                  <span className="block text-2xs font-bold text-zinc-500">مكافأة اللعب</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    3 محاولات / لعبة
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </m.div>

      {/* ── Animated Tab Switcher ────────────────────────────────────────────── */}
      <div className="relative flex gap-1.5 p-1.5 bg-zinc-900/75 border border-zinc-800/80 rounded-2xl max-w-md">
        {[
          { id: 'single' as const, label: 'لعب فردي وتدريب', icon: <Gamepad2 className="w-4 h-4" /> },
          { id: 'multiplayer' as const, label: 'أونلاين مع صحابك', icon: <Users className="w-4 h-4" /> },
        ].map((tab) => {
          const active = gameTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGameTab(tab.id)}
              className={`relative flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 z-10 ${
                active ? 'text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {active && (
                <m.span
                  layoutId="gamesTabPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber shadow-md -z-10"
                />
              )}
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Single Player Area ───────────────────────────────────────────────── */}
      {gameTab === 'single' ? (
        <AnimatePresence mode="wait">
          {activeGame ? (
            <m.div
              key={`play-${activeGame}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-card p-5 md:p-7 space-y-6 border border-white/10"
            >
              <button
                type="button"
                className="inline-flex items-center gap-2 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all"
                onClick={() => {
                  setActiveGame(null);
                  setGameFinished(false);
                }}
              >
                <ArrowLeft className="rtl:-scale-x-100 w-4 h-4" />
                <span>رجوع للألعاب</span>
              </button>

              {activeGame === 'diagnosis' && (
                <Suspense
                  fallback={
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-brand-orange" />
                    </div>
                  }
                >
                  <ClinicalDetectiveGame
                    onClaimXp={() => claimGameXP(2)}
                    xpReward={diagnosisXp}
                    gamePlaySuccess={gamePlaySuccess}
                    gamePlayError={gamePlayError}
                  />
                </Suspense>
              )}

              {activeGame === 'special-tests' && (
                <Suspense
                  fallback={
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-brand-orange" />
                    </div>
                  }
                >
                  <SpecialTestsBlitz
                    onClaimXp={() => claimGameXP(3)}
                    xpReward={osceXp}
                    gamePlaySuccess={gamePlaySuccess}
                    gamePlayError={gamePlayError}
                  />
                </Suspense>
              )}

              {activeGame === 'nerve-path' && (
                <Suspense
                  fallback={
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
                    </div>
                  }
                >
                  <NervePathGame
                    onBack={() => setActiveGame(null)}
                    onWin={() => claimGameXP(4)}
                    dailyPlaysCount={nervePlays}
                    maxDailyPlays={3}
                    xpReward={120}
                  />
                </Suspense>
              )}

              {activeGame === 'whos-responsible' && (
                <Suspense
                  fallback={
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                    </div>
                  }
                >
                  <WhosResponsibleGame
                    onBack={() => setActiveGame(null)}
                    onWin={() => claimGameXP(5)}
                    dailyPlaysCount={responsiblePlays}
                    maxDailyPlays={3}
                    xpReward={150}
                  />
                </Suspense>
              )}

              {activeGame === 'sudoku' && (
                <Suspense
                  fallback={
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
                    </div>
                  }
                >
                  <AnatomySudokuGame
                    onBack={() => setActiveGame(null)}
                    onWin={() => claimGameXP(6)}
                    dailyPlaysCount={sudokuPlays}
                    maxDailyPlays={3}
                    xpReward={[150, 300, 500][Math.min(sudokuPlays, 2)]}
                  />
                </Suspense>
              )}

              {activeGame === 'wordle' && (
                <Suspense
                  fallback={
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                    </div>
                  }
                >
                  <PhysioWordleGame
                    onBack={() => setActiveGame(null)}
                    onWin={() => claimGameXP(7)}
                    dailyPlaysCount={wordlePlays}
                    maxDailyPlays={3}
                    xpReward={150}
                  />
                </Suspense>
              )}

              {activeGame === 'memory' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Brain className="w-5 h-5 text-brand-orange" />
                        <span>توصيل التشريح الإكلينيكي</span>
                      </h3>
                      <p className="text-xs text-zinc-400 font-semibold">
                        وصّل كل عضلة أو رباط بالعصب المغذي أو الاختبار الخاص بيه!
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black">
                      <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 tabular-nums">
                        حركات: {memoryMoves}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 tabular-nums">
                        {memoryMatches}/8 أزواج
                      </span>
                    </div>
                  </div>

                  {gameFinished ? (
                    <m.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl gap-4"
                    >
                      <Trophy className="w-14 h-14 text-brand-amber fill-brand-amber/10 drop-shadow-[0_0_15px_rgba(255,176,0,0.4)]" />
                      <h2 className="text-brand-orange font-black text-lg">مبروك! وصّلت كل الأزواج في {memoryMoves} حركة!</h2>
                      {gamePlaySuccess ? (
                        <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                          {gamePlaySuccess}
                        </div>
                      ) : gamePlayError ? (
                        <div className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                          {gamePlayError}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3 px-6 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow"
                        onClick={initMemoryGame}
                      >
                        العب تاني
                      </button>
                    </m.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2.5 max-w-lg mx-auto">
                        {memoryCards.map((card, idx) => {
                          const flipped = card.isFlipped || card.isMatched;
                          return (
                            <m.div
                              key={card.id}
                              whileTap={flipped ? undefined : { scale: 0.94 }}
                              className="relative rounded-2xl cursor-pointer overflow-hidden aspect-square select-none [perspective:1000px]"
                              onClick={() => handleCardClick(idx)}
                            >
                              <div
                                className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] ${
                                  flipped ? '[transform:rotateY(180deg)]' : ''
                                }`}
                              >
                                {/* Card Back */}
                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-brand-orange/50 flex flex-col items-center justify-center text-brand-orange rounded-2xl [backface-visibility:hidden] shadow-inner">
                                  <Brain className="w-5 h-5 opacity-70" />
                                  <span className="text-[9px] font-black text-zinc-600 mt-1">PHYSIO</span>
                                </div>
                                {/* Card Front */}
                                <div
                                  className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center px-1.5 [transform:rotateY(180deg)] [backface-visibility:hidden] border-2 transition-colors ${
                                    card.isMatched
                                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                      : 'bg-zinc-800/95 border-brand-orange/50 text-white'
                                  }`}
                                >
                                  <span dir="ltr" className="text-[11px] md:text-xs font-black leading-tight break-words">
                                    {card.value}
                                  </span>
                                  {card.sub && (
                                    <span className="text-[9px] font-bold text-zinc-400 mt-1 leading-tight">
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
                        className="w-full max-w-lg mx-auto block border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-3 rounded-xl cursor-pointer active:scale-95 transition-all"
                        onClick={initMemoryGame}
                      >
                        لخبط الكروت من جديد
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeGame === 'spin' && (
                <Suspense
                  fallback={
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-brand-orange" />
                    </div>
                  }
                >
                  <LuckyWheel
                    wheelRotation={wheelRotation}
                    isSpinning={isSpinning}
                    hasSpunToday={hasSpunToday}
                    onSpin={handleSpinWheelClick}
                    lastSpinResult={lastSpinResult}
                  />
                </Suspense>
              )}
            </m.div>
          ) : (
            /* Single Player Arcade Grid */
            <m.div
              key="single-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* Game 1: Clinical Detective */}
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-zinc-900/65 p-5 md:p-6 text-start flex flex-col justify-between min-h-[220px] hover:border-emerald-400/50 group shadow-lg"
              >
                <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-black tracking-wider bg-emerald-500/15 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                      تفكير إكلينيكي • جديد
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                    شخّص الحالة (عيادة الطوارئ)
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    حالات عظام وأعصاب و Red Flags حقيقية بتتكشف على 4 دلائل. كل ما تشخّص أسرع تاخد نقاط أعلى!
                  </p>
                </div>
                <div className="relative flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      +{diagnosisXp} XP
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                      detectivePlays >= 3 
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {detectivePlays >= 3 ? 'استنفدت محاولات اليوم (3/3)' : `${3 - detectivePlays}/3 محاولات XP`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
                    onClick={() => setActiveGame('diagnosis')}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> ابدأ العيادة
                  </button>
                </div>
              </m.div>

              {/* Game 2: OSCE Special Tests Blitz */}
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-zinc-900/65 p-5 md:p-6 text-start flex flex-col justify-between min-h-[220px] hover:border-violet-400/50 group shadow-lg"
              >
                <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-black tracking-wider bg-violet-500/15 text-violet-300 px-2.5 py-1 rounded-lg border border-violet-500/25">
                      سرعة وتركيز • 60 ثانية
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-violet-300 transition-colors">
                    سباق الـ Special Tests (OSCE)
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    اختبارات الـ Orthopedic والـ Neuro تحت ضغط الوقت مع نظام Combo x4 وبونص ثواني!
                  </p>
                </div>
                <div className="relative flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-full">
                      +{osceXp} XP
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                      oscePlays >= 3 
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                        : 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                    }`}>
                      {oscePlays >= 3 ? 'استنفدت محاولات اليوم (3/3)' : `${3 - oscePlays}/3 محاولات XP`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
                    onClick={() => setActiveGame('special-tests')}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> ابدأ السباق
                  </button>
                </div>
              </m.div>

              {/* Game 6: Who's Responsible */}
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-zinc-900/65 p-5 md:p-6 text-start flex flex-col justify-between min-h-[220px] hover:border-emerald-400/60 group shadow-lg"
              >
                <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-black tracking-wider bg-emerald-500/15 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                      جديد · كينيسيولوجي
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-300">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                    مين المسؤول؟ Who&apos;s Responsible?
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    اختار العضلة المسؤولة عن الحركة، واربطها بالـ Nerve والـ Origin والـ Insertion!
                  </p>
                </div>
                <div className="relative flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      +{xpSettings?.game_whos_responsible ?? 150} XP
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                      responsiblePlays >= 3 
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {responsiblePlays >= 3 ? 'استنفدت محاولات اليوم (3/3)' : `${3 - responsiblePlays}/3 محاولات XP`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                    onClick={() => setActiveGame('whos-responsible')}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> العب
                  </button>
                </div>
              </m.div>

              {/* Game 7: Anatomy Sudoku */}
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-zinc-900/65 p-5 md:p-6 text-start flex flex-col justify-between min-h-[220px] hover:border-purple-400/60 group shadow-lg"
              >
                <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-black tracking-wider bg-purple-500/15 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/25">
                      تصاعدي · {xpSettings?.game_sudoku_1 ?? 150} → {xpSettings?.game_sudoku_2 ?? 300} → {xpSettings?.game_sudoku_3 ?? 500} XP
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-300">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                    سودوكو التشريح
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    كل مربع يكمل بيكشف حروف، وفي الآخر جمّع المصطلح الطبي السري واكسب لحد {xpSettings?.game_sudoku_3 ?? 500} XP!
                  </p>
                </div>
                <div className="relative flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full">
                      +{[xpSettings?.game_sudoku_1 ?? 150, xpSettings?.game_sudoku_2 ?? 300, xpSettings?.game_sudoku_3 ?? 500][Math.min(sudokuPlays, 2)]} XP
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                      sudokuPlays >= 3 
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    }`}>
                      {sudokuPlays >= 3 ? 'استنفدت محاولات اليوم (3/3)' : `${3 - sudokuPlays}/3 محاولات XP`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                    onClick={() => setActiveGame('sudoku')}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> العب
                  </button>
                </div>
              </m.div>

              {/* Game 8: Physio Wordle */}
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-zinc-900/65 p-5 md:p-6 text-start flex flex-col justify-between min-h-[220px] hover:border-amber-400/60 group shadow-lg"
              >
                <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-black tracking-wider bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/25">
                      جديد · Wordle طبي
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    أكمل الجملة الطبية (Wordle)
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    خمّن الكلمة الطبية الناقصة في جملة مفيدة (زي Sartorius) خلال 6 محاولات!
                  </p>
                </div>
                <div className="relative flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full">
                      +{xpSettings?.game_wordle ?? 150} XP
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                      wordlePlays >= 3 
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {wordlePlays >= 3 ? 'استنفدت محاولات اليوم (3/3)' : `${3 - wordlePlays}/3 محاولات XP`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                    onClick={() => setActiveGame('wordle')}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> العب
                  </button>
                </div>
              </m.div>

              {/* Game 5: Nerve Path Sliding Puzzle */}
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-zinc-900/65 p-5 md:p-6 text-start flex flex-col justify-between min-h-[220px] hover:border-cyan-400/60 group shadow-lg"
              >
                <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-black tracking-wider bg-cyan-500/15 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/25">
                      جديد · ألغاز عصبية
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-300">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                    مسار الأعصاب
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    حرّك المكعبات ورتّب المسار العصبي عشان توصل الإشارة الكهربائية من الجدع للعضلة!
                  </p>
                </div>
                <div className="relative flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full">
                      +120 XP
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                      nervePlays >= 3 
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {nervePlays >= 3 ? 'استنفدت محاولات اليوم (3/3)' : `${3 - nervePlays}/3 محاولات XP`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 text-black font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                    onClick={() => setActiveGame('nerve-path')}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> العب
                  </button>
                </div>
              </m.div>

              {/* Game 3: Clinical Anatomy Memory Match */}
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="relative overflow-hidden rounded-3xl border border-brand-orange/20 bg-zinc-900/65 p-5 md:p-6 text-start flex flex-col justify-between min-h-[220px] hover:border-brand-orange/50 group shadow-lg"
              >
                <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-brand-orange/10 blur-2xl pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-black tracking-wider bg-brand-orange/15 text-brand-orange px-2.5 py-1 rounded-lg border border-brand-orange/25">
                      ذاكرة تشريحية
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange">
                      <Brain className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-brand-orange transition-colors">
                    توصيل التشريح الإكلينيكي
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    وصّل كل عضلة بالعصب المغذي لها أو الاختبار التشخيصي بتاعها بأقل عدد من الحركات.
                  </p>
                </div>
                <div className="relative flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full">
                      +{xpPerPlay} XP
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                      memoryPlays >= 3 
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                        : 'bg-brand-orange/15 text-brand-orange border-brand-orange/30'
                    }`}>
                      {memoryPlays >= 3 ? 'استنفدت محاولات اليوم (3/3)' : `${3 - memoryPlays}/3 محاولات XP`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="bg-zinc-950 border border-zinc-700 hover:border-brand-orange text-white font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer hover:bg-brand-orange/10 active:scale-95 transition-all flex items-center gap-1.5"
                    onClick={() => {
                      setActiveGame('memory');
                      initMemoryGame();
                    }}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> العب
                  </button>
                </div>
              </m.div>

              {/* Game 4: Lucky Wheel */}
              <m.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className={`relative overflow-hidden rounded-3xl border border-amber-500/20 bg-zinc-900/65 p-5 md:p-6 text-start flex flex-col justify-between min-h-[220px] hover:border-amber-400/50 group shadow-lg ${
                  hasSpunToday ? 'opacity-75' : ''
                }`}
              >
                <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-black tracking-wider bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/25">
                      جاكبوت 500 XP
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    عجلة الحظ اليومية
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                    لفة مجانية كل يوم بفيزيكس حقيقية وجاكبوت Mystery Box بـ 500 XP!
                  </p>
                </div>
                <div className="relative flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <span className="text-xs font-extrabold text-zinc-400 bg-zinc-950 border border-white/10 px-2.5 py-1 rounded-full">
                    {hasSpunToday ? 'لفّيت النهارده ✓' : 'جاهزة للّف'}
                  </span>
                  <button
                    type="button"
                    className="bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer hover:shadow-orange-glow active:scale-95 transition-all flex items-center gap-1.5"
                    onClick={() => setActiveGame('spin')}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> افتح العجلة
                  </button>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      ) : (
        /* ── Multiplayer Lobby Area ─────────────────────────────────────────── */
        <AnimatePresence mode="wait">
          {!showMultiplayerSetup ? (
            <m.div
              key="mp-lobby"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* 3 Online Game Mode Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['anatomy', 'clinical', 'special_tests'] as GameMode[]).map((mode) => {
                  const mMeta = MODE_META[mode];
                  return (
                    <m.div
                      key={mode}
                      whileHover={{ y: -4 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/65 p-5 text-start flex flex-col justify-between min-h-[215px] ${mMeta.accentBorder} group shadow-lg`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${mMeta.accentBg} pointer-events-none`} />
                      <div className="relative space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${mMeta.accentText}`}>
                            {mMeta.badge}
                          </span>
                          {mMeta.icon}
                        </div>
                        <h3 className="text-base font-black text-white pt-1">{mMeta.title}</h3>
                        <p className="text-zinc-400 text-xs font-semibold leading-relaxed">{mMeta.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openModeSetup(mode)}
                        className="relative mt-4 w-full py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 hover:border-brand-orange text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-brand-orange/10 active:scale-95 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>اعمل غرفة بالمود ده</span>
                      </button>
                    </m.div>
                  );
                })}
              </div>

              {/* Quick Join by Code + Live Open Rooms */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Quick Join */}
                <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-zinc-900/65 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-brand-orange" />
                      <span>معاك كود غرفة؟</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 font-medium">
                      اكتب كود الـ 4 حروف اللي صاحبك بعتهولك وادخل فوراً.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      dir="ltr"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-orange rounded-xl py-2.5 text-center text-lg font-black tracking-[6px] uppercase text-white outline-none transition-colors"
                      placeholder="ABCD"
                      value={gameRoomCodeInput}
                      onChange={(e) => setGameRoomCodeInput(e.target.value.toUpperCase())}
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => handleJoinGameRoom(gameRoomCodeInput)}
                      disabled={isGameLoading || !gameRoomCodeInput.trim()}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs cursor-pointer hover:shadow-orange-glow active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isGameLoading ? 'بندخلك…' : 'ادخل الغرفة'}
                    </button>
                  </div>
                </div>

                {/* Live Open Rooms Browser */}
                <div className="lg:col-span-3 rounded-3xl border border-white/10 bg-zinc-900/65 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="text-sm font-black text-white">غرف مفتوحة دلوقتي</h4>
                    </div>
                    <button
                      type="button"
                      onClick={loadOpenRooms}
                      disabled={loadingRooms}
                      className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
                      <span>تحديث</span>
                    </button>
                  </div>

                  {openRooms.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 py-8 px-4 text-center space-y-1.5">
                      <Users className="w-6 h-6 text-zinc-600 mx-auto" />
                      <p className="text-xs font-bold text-zinc-400">مفيش غرف مستنية لاعبين دلوقتي</p>
                      <p className="text-2xs text-zinc-600">اختار أي مود فوق واعمل غرفة وشاركها مع صحابك في الشات!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
                      {openRooms.map((r) => {
                        const meta = MODE_META[r.gameMode] || MODE_META.anatomy;
                        return (
                          <div
                            key={r.code}
                            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-brand-orange/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar username={r.host} avatarUrl={r.hostAvatar || null} size={34} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span dir="ltr" className="text-xs font-black text-white truncate">
                                    @{r.host}
                                  </span>
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-white/5 ${meta.accentText}`}>
                                    {meta.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-2xs text-zinc-500 font-bold mt-0.5">
                                  <span className="font-mono text-brand-amber">#{r.code}</span>
                                  <span>• {r.playersCount} لاعبين</span>
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" /> {r.rounds} جولات
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleJoinGameRoom(r.code)}
                              disabled={isGameLoading}
                              className="shrink-0 px-3.5 py-2 rounded-xl bg-brand-orange text-black font-black text-xs hover:bg-brand-amber transition-colors cursor-pointer active:scale-95"
                            >
                              انضم فوراً
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </m.div>
          ) : (
            /* Multiplayer Room Setup */
            <m.div
              key="mp-setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-card p-6 md:p-8 space-y-6 border border-white/10"
            >
              <button
                type="button"
                className="inline-flex items-center gap-2 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all"
                onClick={() => setShowMultiplayerSetup(false)}
              >
                <ArrowLeft className="rtl:-scale-x-100 w-4 h-4" />
                <span>رجوع لأوضاع اللعب</span>
              </button>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  {MODE_META[createGameMode].icon}
                  <span>إعداد غرفة: {MODE_META[createGameMode].title}</span>
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['anatomy', 'clinical', 'special_tests'] as GameMode[]).map((mId) => (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => setCreateGameMode(mId)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        createGameMode === mId
                          ? 'bg-brand-orange text-black border-brand-orange'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {MODE_META[mId].title}
                    </button>
                  ))}
                </div>
              </div>

              {gameError && (
                <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gameError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Host setup */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 md:p-6 text-start flex flex-col justify-between gap-4">
                  <h4 className="text-xs font-black text-brand-orange uppercase tracking-wider">إنشاء غرفة جديدة</h4>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-300">
                        <span>عدد الجولات</span>
                        <span className="text-brand-orange font-mono">{createGameRounds}</span>
                      </div>
                      <input
                        type="range"
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                        min="3"
                        max="10"
                        value={createGameRounds}
                        onChange={(e) => setCreateGameRounds(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-300">
                        <span>مدة الجولة</span>
                        <span className="text-brand-orange font-mono">{createGameDuration} ثانية</span>
                      </div>
                      <input
                        type="range"
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                        min="15"
                        max="120"
                        value={createGameDuration}
                        onChange={(e) => setCreateGameDuration(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3.5 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all shadow-orange-glow mt-4"
                    onClick={handleCreateGameRoom}
                    disabled={isGameLoading}
                  >
                    {isGameLoading ? 'بنعمل الغرفة…' : 'اعمل غرفة تحدي'}
                  </button>
                </div>

                {/* Join code setup */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 md:p-6 text-start flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black text-brand-orange uppercase tracking-wider">ادخل غرفة بكود</h4>
                    <p className="text-2xs text-zinc-500 font-semibold mt-1">
                      اكتب الكود المكوّن من 4 حروف اللي صاحبك بعتهولك.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      dir="ltr"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl py-3 text-center text-xl font-black tracking-widest uppercase outline-none transition-all duration-200"
                      placeholder="ABCD"
                      value={gameRoomCodeInput}
                      onChange={(e) => setGameRoomCodeInput(e.target.value.toUpperCase())}
                      maxLength={4}
                    />
                    <button
                      type="button"
                      className="w-full border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 text-zinc-200 font-bold text-xs py-3 rounded-xl cursor-pointer active:scale-95 transition-all"
                      onClick={() => handleJoinGameRoom(gameRoomCodeInput)}
                      disabled={isGameLoading}
                    >
                      ادخل الغرفة
                    </button>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
