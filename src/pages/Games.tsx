import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  ArrowLeft,
  Users,
  RefreshCw,
  AlertCircle,
  Play,
  Stethoscope,
  Activity,
  Brain,
  DoorOpen,
  Clock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import '../styles/games.css';
import type { SpinResult } from '../components/games/LuckyWheel';
import { gameService } from '../services/gameService';
import { UserAvatar } from '../components/UserAvatar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  GAME_CATALOG,
  GAME_CATEGORIES,
  FEATURED_PRIORITY,
  type GameArtKey,
  type GameCategory,
  type SingleGameKey,
} from '../components/games/catalog';
import { PlayerProgressCard } from '../components/games/ui/PlayerProgressCard';
import { GameTile } from '../components/games/ui/GameTile';
import { Mascot } from '../components/games/ui/Mascot';
import { SoundSettingsButton } from '../components/common/SoundSettings';
import { playSound } from '../utils/soundEngine';
import { haptic } from '../components/games/ui/feedback';
import {
  EcgArt,
  OsceArt,
  MuscleArt,
  SudokuArt,
  WordleArt,
  NerveArt,
  MemoryArt,
  WheelArt,
  MpAnatomyArt,
  MpClinicalArt,
  MpOsceArt,
} from '../components/games/ui/GameArt';

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
const ClinicalMemoryGame = lazy(() =>
  import('../components/games/ClinicalMemoryGame').then((mod) => ({ default: mod.ClinicalMemoryGame }))
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
  const [selectedCategory, setSelectedCategory] = useState<'all' | GameCategory>('all');
  const [lastGameKey, setLastGameKey] = useState<SingleGameKey | null>(() => {
    try {
      const saved = localStorage.getItem('lp:lastGame') as SingleGameKey | null;
      return saved && GAME_CATALOG.some((g) => g.key === saved) ? saved : null;
    } catch {
      return null;
    }
  });
  const socket = useSocket();
  const { changePage } = useAuth();

  // Flag active single-player game for deferred PWA update prompt
  useEffect(() => {
    document.documentElement.dataset.gameActive = activeGame ? '1' : '';
    window.dispatchEvent(new Event('lp:game-active-change'));
    return () => {
      document.documentElement.dataset.gameActive = '';
      window.dispatchEvent(new Event('lp:game-active-change'));
    };
  }, [activeGame]);

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

  const getPlays = useCallback(
    (key: SingleGameKey): number | undefined => {
      switch (key) {
        case 'diagnosis':
          return detectivePlays;
        case 'special-tests':
          return oscePlays;
        case 'whos-responsible':
          return responsiblePlays;
        case 'sudoku':
          return sudokuPlays;
        case 'wordle':
          return wordlePlays;
        case 'nerve-path':
          return nervePlays;
        case 'memory':
          return memoryPlays;
        case 'spin':
          return undefined;
      }
    },
    [detectivePlays, memoryPlays, nervePlays, oscePlays, responsiblePlays, sudokuPlays, wordlePlays]
  );

  const getXpLabel = useCallback(
    (key: SingleGameKey): string => {
      switch (key) {
        case 'diagnosis':
          return `+${diagnosisXp} XP`;
        case 'special-tests':
          return `+${osceXp} XP`;
        case 'whos-responsible':
          return `+${xpSettings?.game_whos_responsible ?? 150} XP`;
        case 'sudoku': {
          const tiers = [
            xpSettings?.game_sudoku_1 ?? 150,
            xpSettings?.game_sudoku_2 ?? 300,
            xpSettings?.game_sudoku_3 ?? 500,
          ];
          return `+${tiers[Math.min(sudokuPlays, 2)]} XP`;
        }
        case 'wordle':
          return `+${xpSettings?.game_wordle ?? 150} XP`;
        case 'nerve-path':
          return '+120 XP';
        case 'memory':
          return `+${xpPerPlay} XP`;
        case 'spin':
          return 'جاكبوت 500 XP';
      }
    },
    [diagnosisXp, osceXp, sudokuPlays, xpPerPlay, xpSettings]
  );

  const launchGame = useCallback(
    (key: SingleGameKey) => {
      if (key === 'spin' && hasSpunToday) return;
      playSound('tap');
      haptic('tap');
      try {
        localStorage.setItem('lp:lastGame', key);
      } catch {
        // ignore storage restrictions
      }
      setLastGameKey(key);
      if (key === 'memory') {
        setActiveGame('memory');
        initMemoryGame();
        return;
      }
      setActiveGame(key);
    },
    [hasSpunToday, initMemoryGame, setActiveGame]
  );

  const renderArt = useCallback((artKey: GameArtKey) => {
    switch (artKey) {
      case 'ecg':
        return <EcgArt />;
      case 'osce':
        return <OsceArt />;
      case 'muscle':
        return <MuscleArt />;
      case 'sudoku':
        return <SudokuArt />;
      case 'wordle':
        return <WordleArt />;
      case 'nerve':
        return <NerveArt />;
      case 'memory':
        return <MemoryArt />;
      case 'wheel':
        return <WheelArt />;
    }
  }, []);

  const sudokuTiersTag = useMemo(
    () =>
      `تصاعدي · ${xpSettings?.game_sudoku_1 ?? 150} → ${xpSettings?.game_sudoku_2 ?? 300} → ${xpSettings?.game_sudoku_3 ?? 500} XP`,
    [xpSettings]
  );

  const sudokuDynamicDesc = useMemo(
    () =>
      `كل مربع يكمل بيكشف حروف، وفي الآخر جمّع المصطلح الطبي السري واكسب لحد ${xpSettings?.game_sudoku_3 ?? 500} XP!`,
    [xpSettings]
  );

  const skipSetupResetRef = useRef(false);

  useEffect(() => {
    if (skipSetupResetRef.current) {
      skipSetupResetRef.current = false;
      return;
    }
    setShowMultiplayerSetup(false);
  }, [gameTab]);

  // Open specific game directly when navigated via #game mention (?play=...)
  useEffect(() => {
    const MULTIPLAYER_MODES = new Set(['anatomy', 'clinical', 'special_tests']);
    const SINGLE_GAMES = new Set([
      'memory', 'spin', 'diagnosis', 'special-tests',
      'nerve-path', 'whos-responsible', 'sudoku', 'wordle',
    ]);
    const openByKey = (rawKey: string | null | undefined) => {
      if (!rawKey) return;
      if (MULTIPLAYER_MODES.has(rawKey)) {
        skipSetupResetRef.current = true;
        setActiveGame(null);
        setGameTab('multiplayer');
        setCreateGameMode(rawKey as GameMode);
        setShowMultiplayerSetup(true);
        return;
      }
      if (!SINGLE_GAMES.has(rawKey)) return;
      setGameTab('single');
      if (rawKey === 'memory') initMemoryGame();
      setActiveGame(rawKey as any);
    };

    const playParam = new URLSearchParams(window.location.search).get('play');
    if (playParam) openByKey(playParam);

    const onOpenGame = (e: Event) => {
      const gameKey = (e as CustomEvent)?.detail?.game;
      openByKey(gameKey);
    };
    window.addEventListener('open_game', onOpenGame);
    return () => window.removeEventListener('open_game', onOpenGame);
  }, []);

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
    if (showMultiplayerSetup) return undefined;
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
    <div className="lp-games space-y-5 xl:pt-6 max-w-5xl mx-auto px-4 text-start pb-10">
      {/* ── Compact Player Progress Header ────────────────────────────────────── */}
      <PlayerProgressCard
        user={user}
        dailyPlays={dailyPlays}
        hasSpunToday={hasSpunToday}
        onOpenStore={() => changePage('rewards')}
        onLoginClick={() => changePage('login')}
      />

      {/* ── Segmented Mode Switcher + Audio Controls ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex flex-1 min-w-[260px] gap-1 p-1 bg-[#111113] border border-white/[0.08] rounded-2xl max-w-md">
          {[
            { id: 'single' as const, label: 'لعب فردي وتدريب', icon: <Gamepad2 className="w-4 h-4" /> },
            { id: 'multiplayer' as const, label: 'أونلاين مع صحابك', icon: <Users className="w-4 h-4" /> },
          ].map((tab) => {
            const active = gameTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playSound('tap');
                  haptic('tap');
                  setGameTab(tab.id);
                }}
                className={`relative flex-1 min-h-[44px] py-2 px-3 rounded-xl font-black text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 z-10 ${
                  active ? 'text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {active && (
                  <m.span
                    layoutId="gamesTabPill"
                    transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber shadow-sm -z-10"
                  />
                )}
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === 'multiplayer' && openRooms.length > 0 && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black tabular-nums ${
                      active
                        ? 'bg-black/20 text-black'
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${active ? 'bg-black' : 'bg-emerald-400'}`} />
                    {openRooms.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <SoundSettingsButton />
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
              className="sm:rounded-[var(--g-radius-lg)] sm:bg-[#111113] sm:p-6 md:p-7 space-y-4 sm:space-y-6 sm:border sm:border-white/[0.08]"
            >
              {activeGame === 'spin' && (
                <button
                  type="button"
                  className="lp-press inline-flex items-center gap-2 min-h-[44px] border border-white/10 hover:border-white/25 bg-[#17171a] hover:bg-zinc-800 text-zinc-200 font-bold text-xs px-4 rounded-xl cursor-pointer"
                  onClick={() => {
                    setActiveGame(null);
                    setGameFinished(false);
                  }}
                >
                  <ArrowLeft className="rtl:-scale-x-100 w-4 h-4" />
                  <span>رجوع للألعاب</span>
                </button>
              )}

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
                    dailyPlaysCount={detectivePlays}
                    maxDailyPlays={3}
                    onBack={() => setActiveGame(null)}
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
                    dailyPlaysCount={oscePlays}
                    maxDailyPlays={3}
                    onBack={() => setActiveGame(null)}
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
                <Suspense
                  fallback={
                    <div className="py-12 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 animate-spin text-brand-orange" />
                    </div>
                  }
                >
                  <ClinicalMemoryGame
                    memoryCards={memoryCards}
                    memoryMoves={memoryMoves}
                    memoryMatches={memoryMatches}
                    gameFinished={gameFinished}
                    handleCardClick={handleCardClick}
                    initMemoryGame={initMemoryGame}
                    gamePlaySuccess={gamePlaySuccess}
                    gamePlayError={gamePlayError}
                    dailyPlaysCount={memoryPlays}
                    maxDailyPlays={3}
                    xpReward={xpPerPlay}
                    onBack={() => {
                      setActiveGame(null);
                      setGameFinished(false);
                    }}
                  />
                </Suspense>
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
            /* Single Player Discovery Experience */
            (() => {
              const isEntryExhausted = (entry: (typeof GAME_CATALOG)[number]) => {
                if (entry.key === 'spin') return hasSpunToday;
                const used = getPlays(entry.key) ?? 0;
                return used >= 3;
              };

              let featuredKey: SingleGameKey | null = null;
              if (selectedCategory === 'all') {
                const candidate = FEATURED_PRIORITY.find((k) => (getPlays(k) ?? 0) < 3);
                if (candidate) featuredKey = candidate;
                else if (!hasSpunToday) featuredKey = 'spin';
              }

              const featuredEntry = featuredKey
                ? GAME_CATALOG.find((e) => e.key === featuredKey) || null
                : null;

              const filteredEntries = GAME_CATALOG.filter(
                (entry) =>
                  selectedCategory === 'all'
                    ? entry.key !== 'spin'
                    : entry.category === selectedCategory
              ).filter((entry) => entry.key !== featuredKey);

              const sortedEntries = [...filteredEntries].sort(
                (a, b) => Number(isEntryExhausted(a)) - Number(isEntryExhausted(b))
              );

              const lastGameEntry = lastGameKey
                ? GAME_CATALOG.find((g) => g.key === lastGameKey) || null
                : null;
              const canResumeLast =
                !!lastGameEntry && !(lastGameEntry.key === 'spin' && hasSpunToday);

              return (
                <div key="single-grid" className="space-y-4">
                  {/* Dedicated Daily Lucky Wheel Ritual Card */}
                  <section
                    data-accent="amber"
                    className="lp-tile p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-500/30 bg-gradient-to-r from-brand-orange/12 via-[#141418] to-amber-500/10"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-20 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-1.5 flex items-center justify-center shrink-0">
                        <WheelArt />
                      </div>
                      <Mascot
                        character="doctor"
                        mood={hasSpunToday ? 'sleeping' : 'excited'}
                        size={42}
                      />
                      <div className="min-w-0 text-start">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-brand-amber">
                            طقس الحظ اليومي · 1 لفة / يوم
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              hasSpunToday
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {hasSpunToday ? 'لفّيت النهارده ✓' : 'متاحة دلوقتي'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white">عجلة الحظ اليومية (جاكبوت 500 XP)</h3>
                        <p className="text-xs text-zinc-400 font-semibold truncate">
                          لف العجلة واكسب XP مجاني — والـ Mystery بتوصلك لـ 500 XP!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={hasSpunToday}
                      onClick={() => launchGame('spin')}
                      className={`lp-press shrink-0 min-h-[44px] px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 ${
                        hasSpunToday
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-brand-orange to-brand-amber text-black cursor-pointer shadow-orange-glow'
                      }`}
                    >
                      {hasSpunToday ? <Clock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{hasSpunToday ? 'لفّيت النهارده ✓' : 'افتح العجلة'}</span>
                    </button>
                  </section>

                  {/* Category Rail + Resume Last Game Pill */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div
                      className="flex items-center gap-1.5 overflow-x-auto lp-no-scrollbar snap-x py-0.5"
                      role="tablist"
                      aria-label="تصنيف الألعاب"
                    >
                      {GAME_CATEGORIES.map((cat) => {
                        const active = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => {
                              playSound('tap');
                              haptic('tap');
                              setSelectedCategory(cat.id);
                            }}
                            className={`lp-press snap-start shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-black border cursor-pointer transition-colors ${
                              active
                                ? 'bg-brand-orange text-black border-brand-orange'
                                : 'bg-[#111113] text-zinc-300 border-white/[0.08] hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>

                    {canResumeLast && lastGameEntry && (
                      <button
                        type="button"
                        onClick={() => launchGame(lastGameEntry.key)}
                        className="lp-press self-start sm:self-auto shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#17171a] border border-brand-orange/35 hover:border-brand-orange text-brand-amber text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>كمّل آخر لعبة: {lastGameEntry.title}</span>
                      </button>
                    )}
                  </div>

                  {/* Featured Hero Tile */}
                  {featuredEntry && (() => {
                    const isSpin = featuredEntry.key === 'spin';
                    const used = getPlays(featuredEntry.key);
                    const isPractice = !isSpin && (used ?? 0) >= 3 && featuredEntry.practiceSupported;
                    const tags =
                      featuredEntry.key === 'sudoku'
                        ? [sudokuTiersTag]
                        : featuredEntry.tags;
                    const desc =
                      featuredEntry.key === 'sudoku'
                        ? sudokuDynamicDesc
                        : featuredEntry.desc;
                    return (
                      <GameTile
                        accent={featuredEntry.accent}
                        mascot={featuredEntry.mascot}
                        practiceMode={isPractice}
                        title={featuredEntry.title}
                        titleEn={featuredEntry.titleEn}
                        desc={desc}
                        tags={['مميز اليوم', ...tags]}
                        isNew={featuredEntry.isNew}
                        xpLabel={getXpLabel(featuredEntry.key)}
                        used={used}
                        locked={isSpin ? hasSpunToday : false}
                        lockedLabel={isSpin ? 'لفّيت النهارده ✓' : undefined}
                        disableOnLock={isSpin}
                        art={renderArt(featuredEntry.artKey)}
                        ctaLabel={featuredEntry.ctaLabel}
                        onPlay={() => launchGame(featuredEntry.key)}
                        variant="hero"
                        index={0}
                      />
                    );
                  })()}

                  {/* Bento Discovery Grid */}
                  {sortedEntries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedEntries.map((entry, idx) => {
                        const isSpin = entry.key === 'spin';
                        const used = getPlays(entry.key);
                        const exhausted = isSpin ? hasSpunToday : (used ?? 0) >= 3;
                        const isPractice = !isSpin && exhausted && entry.practiceSupported;
                        const tags =
                          entry.key === 'sudoku' ? [sudokuTiersTag] : entry.tags;
                        const desc =
                          entry.key === 'sudoku' ? sudokuDynamicDesc : entry.desc;
                        const isWideTile = idx === 0 || (sortedEntries.length > 5 && idx === 5);

                        return (
                          <GameTile
                            key={entry.key}
                            accent={entry.accent}
                            mascot={entry.mascot}
                            practiceMode={isPractice}
                            title={entry.title}
                            titleEn={entry.titleEn}
                            desc={desc}
                            tags={tags}
                            isNew={entry.isNew}
                            xpLabel={getXpLabel(entry.key)}
                            used={used}
                            locked={exhausted}
                            lockedLabel={
                              isSpin ? 'لفّيت النهارده ✓' : 'خلّصت محاولات اليوم'
                            }
                            disableOnLock={isSpin}
                            art={renderArt(entry.artKey)}
                            ctaLabel={entry.ctaLabel}
                            onPlay={() => launchGame(entry.key)}
                            variant={isWideTile ? 'wide' : 'compact'}
                            className={isWideTile ? 'lg:col-span-2' : ''}
                            index={idx + (featuredEntry ? 1 : 0)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    !featuredEntry && (
                      <div className="rounded-3xl border border-dashed border-zinc-800 bg-[#111113] py-12 px-4 text-center space-y-2">
                        <Gamepad2 className="w-7 h-7 text-zinc-600 mx-auto" />
                        <p className="text-sm font-black text-zinc-300">مفيش ألعاب في التصنيف ده حالياً</p>
                      </div>
                    )
                  )}
                </div>
              );
            })()
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
                {(['anatomy', 'clinical', 'special_tests'] as GameMode[]).map((mode, idx) => {
                  const mMeta = MODE_META[mode];
                  const accent =
                    mode === 'anatomy' ? 'orange' : mode === 'clinical' ? 'teal' : 'violet';
                  const mascot =
                    mode === 'anatomy' ? 'brain' : mode === 'clinical' ? 'doctor' : 'muscle';
                  const art =
                    mode === 'anatomy' ? (
                      <MpAnatomyArt />
                    ) : mode === 'clinical' ? (
                      <MpClinicalArt />
                    ) : (
                      <MpOsceArt />
                    );
                  return (
                    <GameTile
                      key={mode}
                      accent={accent}
                      mascot={mascot}
                      title={mMeta.title}
                      desc={mMeta.desc}
                      tags={[mMeta.badge]}
                      xpLabel="XP مفتوح"
                      art={art}
                      ctaLabel="اعمل غرفة"
                      onPlay={() => {
                        playSound('tap');
                        haptic('tap');
                        openModeSetup(mode);
                      }}
                      variant="compact"
                      index={idx}
                    />
                  );
                })}
              </div>

              {/* Quick Join by Code + Live Open Rooms */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Quick Join */}
                <div className="lg:col-span-2 rounded-[var(--g-radius-lg)] border border-white/[0.08] bg-[#111113] p-5 flex flex-col justify-between gap-4">
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
                      className="w-full min-h-[44px] bg-[#17171a] border border-white/10 focus:border-brand-orange rounded-xl py-2.5 text-center text-lg font-black tracking-[6px] uppercase text-white outline-none transition-colors"
                      placeholder="ABCD"
                      value={gameRoomCodeInput}
                      onChange={(e) => setGameRoomCodeInput(e.target.value.toUpperCase())}
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => handleJoinGameRoom(gameRoomCodeInput)}
                      disabled={isGameLoading || !gameRoomCodeInput.trim()}
                      className="lp-press w-full min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs cursor-pointer disabled:opacity-50"
                    >
                      {isGameLoading ? 'بندخلك…' : 'ادخل الغرفة'}
                    </button>
                  </div>
                </div>

                {/* Live Open Rooms Browser */}
                <div className="lg:col-span-3 rounded-[var(--g-radius-lg)] border border-white/[0.08] bg-[#111113] p-5 space-y-3">
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
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 py-8 px-4 text-center flex flex-col items-center gap-2">
                      <Mascot character="doctor" mood="happy" size={50} />
                      <p className="text-xs font-bold text-zinc-300">مفيش غرف مستنية لاعبين دلوقتي</p>
                      <p className="text-2xs text-zinc-500">اختار أي مود فوق واعمل غرفة وشاركها مع صحابك في الشات!</p>
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
                                  {(r as any).status && (r as any).status !== 'waiting' && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                      شغالة · جولة {(r as any).currentRound || 1}/{r.rounds}
                                    </span>
                                  )}
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
              className="rounded-[var(--g-radius-lg)] bg-[#111113] p-6 md:p-8 space-y-6 border border-white/[0.08]"
            >
              <button
                type="button"
                className="lp-press inline-flex items-center gap-2 min-h-[44px] border border-white/10 hover:border-white/25 bg-[#17171a] hover:bg-zinc-800 text-zinc-200 font-bold text-xs px-4 rounded-xl cursor-pointer"
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
