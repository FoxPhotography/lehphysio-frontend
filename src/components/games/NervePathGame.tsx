import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw, Zap, Brain, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { fireWinConfetti } from '../../utils/confetti';
import { playChatSound } from '../../utils/helpers';

type Port = 'T' | 'R' | 'B' | 'L';

interface Tile {
  id: string;
  ports: Port[];
}

interface NerveLevel {
  id: string;
  title: string;
  enTitle: string;
  rootLabel: string;
  targetLabel: string;
  clinicalTip: string;
  solvedGrid: (Tile | null)[]; // length 9 (3x3)
}

const LEVELS: NerveLevel[] = [
  {
    id: 'median',
    title: 'Median Nerve',
    enTitle: 'C6–T1 · Brachial Plexus',
    rootLabel: 'Brachial Plexus (C6–T1)',
    targetLabel: 'Thenar & Pronator Teres',
    clinicalTip: 'إصابة الـ Median Nerve عند الـ Carpal Tunnel بتسبب ضعف الـ Opposition وبتعمل علامة Ape Hand.',
    solvedGrid: [
      { id: 'm0', ports: ['T', 'R'] },
      { id: 'm1', ports: ['L', 'B'] },
      { id: 'm2', ports: ['B', 'L'] },
      { id: 'm3', ports: ['R', 'B'] },
      { id: 'm4', ports: ['T', 'L'] },
      { id: 'm5', ports: ['T', 'B'] },
      { id: 'm6', ports: ['T', 'R'] },
      { id: 'm7', ports: ['L', 'B'] },
      null,
    ],
  },
  {
    id: 'radial',
    title: 'Radial Nerve',
    enTitle: 'C5–T1 · Posterior Cord',
    rootLabel: 'Posterior Cord (C5–T1)',
    targetLabel: 'Wrist & Finger Extensors',
    clinicalTip: 'إصابة الـ Radial Nerve عند الـ Spiral Groove في الـ Humerus بتسبب Wrist Drop شهير.',
    solvedGrid: [
      { id: 'r0', ports: ['T', 'R'] },
      { id: 'r1', ports: ['L', 'R'] },
      { id: 'r2', ports: ['L', 'B'] },
      { id: 'r3', ports: ['T', 'B'] },
      { id: 'r4', ports: ['R', 'B'] },
      { id: 'r5', ports: ['T', 'L'] },
      { id: 'r6', ports: ['T', 'R'] },
      { id: 'r7', ports: ['T', 'B'] },
      null,
    ],
  },
  {
    id: 'sciatic',
    title: 'Sciatic Nerve',
    enTitle: 'L4–S3 · Lumbosacral Plexus',
    rootLabel: 'Lumbosacral Plexus (L4–S3)',
    targetLabel: 'Hamstrings & Leg',
    clinicalTip: 'أكبر وأطول عصب في جسم الإنسان؛ ضغط جذوره بيعمل ألم عرق النسا (Sciatica) بطول الطرف السفلي.',
    solvedGrid: [
      { id: 's0', ports: ['T', 'R'] },
      { id: 's1', ports: ['L', 'R'] },
      { id: 's2', ports: ['L', 'B'] },
      { id: 's3', ports: ['T', 'R'] },
      { id: 's4', ports: ['L', 'R'] },
      { id: 's5', ports: ['T', 'B'] },
      null,
      { id: 's7', ports: ['R', 'B'] },
      { id: 's8', ports: ['T', 'L'] },
    ],
  },
  {
    id: 'peroneal',
    title: 'Common Peroneal Nerve',
    enTitle: 'L4–S2 · Fibular Neck',
    rootLabel: 'Sciatic Bifurcation',
    targetLabel: 'Tibialis Anterior (Dorsiflexion)',
    clinicalTip: 'العصب الشظوي (Common Peroneal) سطحي جداً عند الـ Fibular Head، وإصابته بتعمل Foot Drop ومشية الـ Steppage Gait.',
    solvedGrid: [
      { id: 'p0', ports: ['T', 'B'] },
      { id: 'p1', ports: ['L', 'R'] },
      { id: 'p2', ports: ['L', 'B'] },
      { id: 'p3', ports: ['T', 'R'] },
      { id: 'p4', ports: ['L', 'B'] },
      { id: 'p5', ports: ['T', 'L'] },
      { id: 'p6', ports: ['T', 'R'] },
      { id: 'p7', ports: ['T', 'B'] },
      null,
    ],
  },
  {
    id: 'femoral',
    title: 'Femoral Nerve',
    enTitle: 'L2–L4 · Lumbar Plexus',
    rootLabel: 'Lumbar Plexus (L2–L4)',
    targetLabel: 'Quadriceps Femoris',
    clinicalTip: 'الـ Femoral Nerve مسؤول أساسي عن فرد الركبة (Knee Extension)؛ ضعفه بيظهر بوضوح أثناء طلوع السلم أو الوقوف من الجلوس.',
    solvedGrid: [
      { id: 'f0', ports: ['T', 'R'] },
      { id: 'f1', ports: ['L', 'B'] },
      { id: 'f2', ports: ['L', 'B'] },
      { id: 'f3', ports: ['T', 'B'] },
      { id: 'f4', ports: ['T', 'B'] },
      { id: 'f5', ports: ['T', 'L'] },
      { id: 'f6', ports: ['T', 'R'] },
      { id: 'f7', ports: ['T', 'B'] },
      null,
    ],
  },
];

const OPPOSITE: Record<Port, Port> = { T: 'B', B: 'T', L: 'R', R: 'L' };
const DIR_OFFSET: Record<Port, [number, number]> = {
  T: [-1, 0],
  R: [0, 1],
  B: [1, 0],
  L: [0, -1],
};

function evaluateBoard(grid: (Tile | null)[]) {
  const energized = new Set<number>();
  const startTile = grid[0];
  if (!startTile || !startTile.ports.includes('T')) {
    return { energized, won: false };
  }

  const queue: number[] = [0];
  energized.add(0);

  while (queue.length > 0) {
    const idx = queue.shift()!;
    const tile = grid[idx];
    if (!tile) continue;

    const r = Math.floor(idx / 3);
    const c = idx % 3;

    for (const port of tile.ports) {
      const [dr, dc] = DIR_OFFSET[port];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= 3 || nc < 0 || nc >= 3) continue;
      const nIdx = nr * 3 + nc;
      if (energized.has(nIdx)) continue;
      const neighbor = grid[nIdx];
      if (neighbor && neighbor.ports.includes(OPPOSITE[port])) {
        energized.add(nIdx);
        queue.push(nIdx);
      }
    }
  }

  const targetTile = grid[7];
  const won = energized.has(7) && Boolean(targetTile?.ports.includes('B'));
  return { energized, won };
}

function getAdjacentIndices(emptyIdx: number): number[] {
  const r = Math.floor(emptyIdx / 3);
  const c = emptyIdx % 3;
  const neighbors: number[] = [];
  if (r > 0) neighbors.push((r - 1) * 3 + c);
  if (r < 2) neighbors.push((r + 1) * 3 + c);
  if (c > 0) neighbors.push(r * 3 + (c - 1));
  if (c < 2) neighbors.push(r * 3 + (c + 1));
  return neighbors;
}

function generateShuffledBoard(solvedGrid: (Tile | null)[]): (Tile | null)[] {
  const grid = solvedGrid.map((t) => (t ? { ...t, ports: [...t.ports] } : null));
  let emptyIdx = grid.findIndex((t) => t === null);
  let prevEmpty = -1;

  // Perform 26 valid sliding moves so solvability is 100% mathematically guaranteed
  for (let step = 0; step < 26; step++) {
    const adj = getAdjacentIndices(emptyIdx).filter((i) => i !== prevEmpty);
    const pick = adj[Math.floor(Math.random() * adj.length)];
    grid[emptyIdx] = grid[pick];
    grid[pick] = null;
    prevEmpty = emptyIdx;
    emptyIdx = pick;
  }

  // Ensure it's not accidentally already solved
  if (evaluateBoard(grid).won) {
    const adj = getAdjacentIndices(emptyIdx);
    const pick = adj[0];
    grid[emptyIdx] = grid[pick];
    grid[pick] = null;
  }

  return grid;
}

function buildSvgPath(ports: Port[]): string {
  // Tile viewBox is 0 0 100 100, center is (50, 50)
  const edgePoint: Record<Port, [number, number]> = {
    T: [50, 0],
    R: [100, 50],
    B: [50, 100],
    L: [0, 50],
  };

  if (ports.length === 2) {
    const [p1, p2] = ports;
    const [x1, y1] = edgePoint[p1];
    const [x2, y2] = edgePoint[p2];
    if ((p1 === 'T' && p2 === 'B') || (p1 === 'B' && p2 === 'T') || (p1 === 'L' && p2 === 'R') || (p1 === 'R' && p2 === 'L')) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    // Smooth quadratic curve through center (50, 50)
    return `M ${x1} ${y1} Q 50 50 ${x2} ${y2}`;
  }

  return ports
    .map((p) => {
      const [x, y] = edgePoint[p];
      return `M 50 50 L ${x} ${y}`;
    })
    .join(' ');
}

interface NervePathGameProps {
  onBack: () => void;
  onWin: () => void;
  dailyPlaysCount: number;
  maxDailyPlays?: number;
  xpReward?: number;
}

export const NervePathGame: React.FC<NervePathGameProps> = ({
  onBack,
  onWin,
  dailyPlaysCount,
  maxDailyPlays = 3,
  xpReward = 120,
}) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];

  const [grid, setGrid] = useState<(Tile | null)[]>(() => generateShuffledBoard(level.solvedGrid));
  const [moves, setMoves] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [hasWon, setHasWon] = useState(false);

  const { energized, won } = useMemo(() => evaluateBoard(grid), [grid]);

  const startLevel = useCallback((idx: number) => {
    const targetLevel = LEVELS[idx];
    setLevelIdx(idx);
    setGrid(generateShuffledBoard(targetLevel.solvedGrid));
    setMoves(0);
    setElapsedSec(0);
    setHasWon(false);
  }, []);

  useEffect(() => {
    if (hasWon) return undefined;
    const timer = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [hasWon, levelIdx]);

  useEffect(() => {
    if (won && !hasWon) {
      setHasWon(true);
      playChatSound('success');
      fireWinConfetti();
      onWin();
    }
  }, [won, hasWon, onWin]);

  const handleTileClick = (idx: number) => {
    if (hasWon) return;
    const emptyIdx = grid.findIndex((t) => t === null);
    if (emptyIdx === -1) return;
    const adj = getAdjacentIndices(emptyIdx);
    if (!adj.includes(idx)) return;

    const next = [...grid];
    next[emptyIdx] = next[idx];
    next[idx] = null;
    setGrid(next);
    setMoves((m) => m + 1);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const remainingXpPlays = Math.max(0, maxDailyPlays - dailyPlaysCount);

  return (
    <div className="space-y-5 xl:pt-4 max-w-2xl mx-auto px-3 sm:px-4 pb-10 text-start">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800 px-3 py-2 rounded-xl cursor-pointer transition-colors"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          <span>رجوع للألعاب</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xs font-black px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 tabular-nums">
            محاولات XP: {remainingXpPlays}/{maxDailyPlays}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-card p-4 sm:p-6 border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute -top-24 -end-24 w-56 h-56 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg sm:text-xl font-black text-white">مسار الأعصاب</h2>
            </div>
            <p className="text-xs font-bold text-cyan-300 mt-0.5">{level.title} · {level.enTitle}</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-black tabular-nums">
            <span className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-zinc-300">
              حركات: {moves}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-zinc-300" dir="ltr">
              {formatTime(elapsedSec)}
            </span>
          </div>
        </div>

        {/* Level Selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => startLevel(idx)}
              className={`px-3 py-1.5 rounded-xl text-2xs font-black whitespace-nowrap cursor-pointer transition-all border ${
                idx === levelIdx
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)]'
                  : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {lvl.title}
            </button>
          ))}
        </div>

        {/* Puzzle Stage */}
        <div className="flex flex-col items-center justify-center py-2 relative z-10" dir="ltr">
          {/* Source Root Marker aligned above col 0 */}
          <div className="w-full max-w-[336px] grid grid-cols-3 gap-2 mb-1.5">
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500/25 to-emerald-500/20 border border-cyan-400/50 text-[10px] font-black text-cyan-200 text-center shadow-[0_0_15px_rgba(34,211,238,0.25)]">
                ⚡ {level.rootLabel}
              </div>
              <div className="w-1 h-2.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </div>
            <div />
            <div />
          </div>

          {/* 3x3 Sliding Grid */}
          <div className="w-full max-w-[336px] aspect-square grid grid-cols-3 grid-rows-3 gap-2 p-2.5 rounded-3xl bg-zinc-950/90 border border-white/10 shadow-2xl">
            {grid.map((tile, idx) => {
              if (!tile) {
                return (
                  <div
                    key="empty-slot"
                    className="rounded-2xl border-2 border-dashed border-zinc-800/80 bg-black/40 flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-zinc-700">فارغ</span>
                  </div>
                );
              }

              const isLit = energized.has(idx);
              const emptyIdx = grid.findIndex((t) => t === null);
              const canMove = !hasWon && emptyIdx !== -1 && getAdjacentIndices(emptyIdx).includes(idx);
              const dPath = buildSvgPath(tile.ports);

              return (
                <m.button
                  key={tile.id}
                  layout
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  type="button"
                  onClick={() => handleTileClick(idx)}
                  className={`relative rounded-2xl overflow-hidden border transition-colors ${
                    hasWon && isLit
                      ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-400/70 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                      : isLit
                        ? 'bg-gradient-to-br from-cyan-500/15 to-zinc-900 border-cyan-400/50 shadow-[0_0_14px_rgba(34,211,238,0.2)]'
                        : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-600'
                  } ${canMove ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                  aria-label="حرك القطعة"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full block">
                    {/* Base sheath */}
                    <path
                      d={dPath}
                      fill="none"
                      stroke={isLit ? 'rgba(34, 211, 238, 0.28)' : 'rgba(113, 113, 122, 0.35)'}
                      strokeWidth="22"
                      strokeLinecap="round"
                    />
                    {/* Axon core */}
                    <path
                      d={dPath}
                      fill="none"
                      stroke={hasWon && isLit ? '#34d399' : isLit ? '#22d3ee' : '#52525b'}
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Animated electrical impulse along energized pathway */}
                    {isLit && (
                      <path
                        d={dPath}
                        fill="none"
                        stroke={hasWon ? '#fde047' : '#e0f2fe'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="10 14"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="24"
                          to="0"
                          dur="0.7s"
                          repeatCount="indefinite"
                        />
                      </path>
                    )}
                    {/* Center node of Ranvier */}
                    <circle
                      cx="50"
                      cy="50"
                      r="7"
                      fill={hasWon && isLit ? '#fde047' : isLit ? '#22d3ee' : '#3f3f46'}
                    />
                  </svg>
                  {canMove && (
                    <span className="absolute top-1.5 end-1.5 w-1.5 h-1.5 rounded-full bg-white/30 pointer-events-none" />
                  )}
                </m.button>
              );
            })}
          </div>

          {/* Target Muscle Marker aligned below col 1 (index 7) */}
          <div className="w-full max-w-[336px] grid grid-cols-3 gap-2 mt-1.5">
            <div />
            <div className="flex flex-col items-center">
              <div
                className={`w-1 h-2.5 transition-colors ${
                  hasWon ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-zinc-700'
                }`}
              />
              <div
                className={`px-2.5 py-1 rounded-xl border text-[10px] font-black text-center transition-all ${
                  hasWon
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.45)] scale-105'
                    : 'bg-zinc-900/90 border-zinc-700 text-zinc-400'
                }`}
              >
                💪 {level.targetLabel}
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* Instructions or Win Banner */}
        <AnimatePresence mode="wait">
          {hasWon ? (
            <m.div
              key="win-banner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>عاش! وصلت الإشارة العصبية بنجاح ⚡</span>
                </div>
                {remainingXpPlays > 0 && (
                  <span className="text-xs font-black text-brand-amber flex items-center gap-1" dir="ltr">
                    <Zap className="w-3.5 h-3.5 fill-current" />+{xpReward} XP
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-zinc-200 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                <strong className="text-cyan-300">💡 معلومة كلينيكية:</strong> {level.clinicalTip}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startLevel((levelIdx + 1) % LEVELS.length)}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 text-black font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>العصب اللي بعده</span>
                </button>
                <button
                  type="button"
                  onClick={() => startLevel(levelIdx)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>العب تاني</span>
                </button>
              </div>
            </m.div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 pt-3.5 border-t border-white/5">
              <p className="text-xs font-bold text-zinc-400 text-center leading-relaxed w-full">
                اضغط على أي مكعب جنب المكان الفاضي عشان تحركه وتوصل الكهربا من الجدع للعضلة ⚡
              </p>
              <button
                type="button"
                onClick={() => startLevel(levelIdx)}
                className="w-full inline-flex items-center justify-center gap-2 text-xs font-black text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/25 py-2.5 px-4 rounded-xl cursor-pointer active:scale-[0.99] transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>لخبط تاني</span>
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
