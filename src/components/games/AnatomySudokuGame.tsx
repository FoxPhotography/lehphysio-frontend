import React, { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import { ArrowRight, RotateCcw, Grid3X3, Lightbulb } from 'lucide-react';
import { playSound } from '../../utils/soundEngine';
import { GameIntroScreen } from './ui/GameIntroScreen';
import { GameResultScreen } from './ui/GameResultScreen';
import { PracticeModeBanner } from './ui/PracticeModeBanner';
import { Mascot } from './ui/Mascot';
import { SudokuArt } from './ui/GameArt';
import { haptic } from './ui/feedback';

interface SudokuPuzzle {
  id: string;
  word: string;
  pearl: string;
  solution: number[]; // 36 cells (6x6)
  givens: number[];   // indices prefilled
}

const PUZZLES: SudokuPuzzle[] = [
  {
    id: 'obturator',
    word: 'OBTURATOR',
    pearl: 'الـ Obturator Externus & Internus من عضلات الـ Deep Lateral Rotators لمفصل الـ Hip، وبيمر عبر الـ Obturator Foramen العصب والأوعية.',
    solution: [
      1, 2, 3, 4, 5, 6,
      4, 5, 6, 1, 2, 3,
      2, 3, 4, 5, 6, 1,
      5, 6, 1, 2, 3, 4,
      3, 4, 5, 6, 1, 2,
      6, 1, 2, 3, 4, 5,
    ],
    givens: [0, 2, 4, 7, 9, 11, 13, 15, 18, 20, 22, 25, 27, 29, 30, 32, 34, 35],
  },
  {
    id: 'sartorius',
    word: 'SARTORIUS',
    pearl: 'الـ Sartorius هي أطول عضلة في جسم الإنسان، بتعمل Flexion + Abduction + External Rotation للـ Hip مع Flexion للـ Knee.',
    solution: [
      2, 4, 6, 1, 3, 5,
      1, 3, 5, 2, 4, 6,
      4, 6, 2, 3, 5, 1,
      3, 5, 1, 4, 6, 2,
      6, 2, 4, 5, 1, 3,
      5, 1, 3, 6, 2, 4,
    ],
    givens: [0, 3, 5, 6, 8, 10, 13, 14, 17, 19, 21, 24, 26, 28, 31, 33, 35],
  },
  {
    id: 'piriformis',
    word: 'PIRIFORMIS',
    pearl: 'الـ Piriformis عضلة مهمة في الـ Gluteal Region؛ انقباضها أو شدها الزائد ممكن يضغط على الـ Sciatic Nerve ويعمل Piriformis Syndrome.',
    solution: [
      3, 1, 5, 2, 6, 4,
      2, 6, 4, 3, 1, 5,
      1, 5, 3, 4, 2, 6,
      4, 2, 6, 1, 5, 3,
      5, 3, 1, 6, 4, 2,
      6, 4, 2, 5, 3, 1,
    ],
    givens: [1, 2, 4, 6, 9, 11, 12, 15, 16, 19, 21, 23, 24, 27, 29, 30, 32, 34],
  },
  {
    id: 'brachialis',
    word: 'BRACHIALIS',
    pearl: 'الـ Brachialis هي المحرك الأساسي لثني مفصل الكوع في جميع أوضاع الساعد (Pronation أو Supination) بعكس الـ Biceps.',
    solution: [
      4, 5, 6, 1, 2, 3,
      1, 2, 3, 4, 5, 6,
      5, 6, 1, 2, 3, 4,
      2, 3, 4, 5, 6, 1,
      6, 1, 2, 3, 4, 5,
      3, 4, 5, 6, 1, 2,
    ],
    givens: [0, 3, 5, 7, 10, 12, 14, 17, 18, 20, 22, 25, 27, 29, 31, 33, 35],
  },
  {
    id: 'trapezius',
    word: 'TRAPEZIUS',
    pearl: 'الـ Trapezius بتنقسم لـ 3 أجزاء (Upper, Middle, Lower) وبتتغذى بالعصب القحفي الحادي عشر (Spinal Accessory Nerve - CN XI).',
    solution: [
      6, 4, 2, 5, 3, 1,
      5, 3, 1, 6, 4, 2,
      4, 2, 6, 1, 5, 3,
      1, 5, 3, 4, 2, 6,
      2, 6, 4, 3, 1, 5,
      3, 1, 5, 2, 6, 4,
    ],
    givens: [0, 2, 4, 6, 8, 11, 13, 15, 19, 21, 23, 24, 26, 28, 30, 33, 35],
  },
  {
    id: 'popliteus',
    word: 'POPLITEUS',
    pearl: 'الـ Popliteus هي العضلة المسؤولة عن فتح قفل الركبة (Unlocking the Knee) عن طريق تدوير الـ Femur للخارج عند بداية الثني.',
    solution: [
      5, 1, 3, 6, 2, 4,
      6, 2, 4, 5, 1, 3,
      3, 5, 1, 4, 6, 2,
      4, 6, 2, 3, 5, 1,
      1, 3, 5, 2, 4, 6,
      2, 4, 6, 1, 3, 5,
    ],
    givens: [1, 3, 5, 6, 9, 10, 12, 14, 17, 19, 21, 25, 27, 28, 30, 32, 34],
  },
  {
    id: 'supinator',
    word: 'SUPINATOR',
    pearl: 'الـ Supinator بيلف الساعد للخارج والـ Elbow مفرود، وبيعدي خلاله الـ Posterior Interosseous Nerve في الـ Arcade of Frohse.',
    solution: [
      1, 3, 5, 2, 4, 6,
      2, 4, 6, 1, 3, 5,
      3, 5, 1, 4, 6, 2,
      4, 6, 2, 3, 5, 1,
      5, 1, 3, 6, 2, 4,
      6, 2, 4, 5, 1, 3,
    ],
    givens: [0, 2, 5, 7, 9, 11, 13, 16, 18, 20, 22, 25, 27, 29, 31, 32, 34],
  },
  {
    id: 'iliopsoas',
    word: 'ILIOPSOAS',
    pearl: 'الـ Iliopsoas هو أقوى Hip Flexor في الجسم خصوصاً فوق 90 درجة، وقِصَره الشديد بيزود الـ Lumbar Lordosis.',
    solution: [
      2, 6, 4, 3, 1, 5,
      3, 1, 5, 2, 6, 4,
      4, 2, 6, 5, 3, 1,
      5, 3, 1, 6, 4, 2,
      6, 4, 2, 1, 5, 3,
      1, 5, 3, 4, 2, 6,
    ],
    givens: [0, 1, 4, 7, 9, 10, 14, 16, 18, 21, 23, 25, 26, 28, 30, 33, 35],
  },
  {
    id: 'pectineus',
    word: 'PECTINEUS',
    pearl: 'الـ Pectineus عضلة هجينة في مقدمة الفخذ بتعمل Hip Flexion و Adduction، وغالباً بتتغذى بالـ Femoral Nerve وأحياناً الـ Obturator.',
    solution: [
      6, 1, 2, 3, 4, 5,
      3, 4, 5, 6, 1, 2,
      5, 6, 1, 2, 3, 4,
      2, 3, 4, 5, 6, 1,
      4, 5, 6, 1, 2, 3,
      1, 2, 3, 4, 5, 6,
    ],
    givens: [0, 2, 4, 7, 9, 11, 12, 15, 17, 19, 20, 22, 24, 27, 29, 31, 33],
  },
  {
    id: 'calcaneus',
    word: 'CALCANEUS',
    pearl: 'عظمة الـ Calcaneus هي أكبر عظمة في الـ Tarsal Bones، وبتنقل وزن الجسم للأرض وبيثبت فيها الـ Achilles Tendon.',
    solution: [
      5, 4, 3, 2, 1, 6,
      2, 1, 6, 5, 4, 3,
      4, 3, 2, 1, 6, 5,
      1, 6, 5, 4, 3, 2,
      3, 2, 1, 6, 5, 4,
      6, 5, 4, 3, 2, 1,
    ],
    givens: [1, 3, 5, 6, 8, 10, 13, 15, 18, 20, 22, 25, 27, 29, 30, 32, 34],
  },
  {
    id: 'quadriceps',
    word: 'QUADRICEPS',
    pearl: 'الـ Quadriceps بتتكون من 4 رؤوس (Rectus Femoris + 3 Vasti)، والـ Rectus Femoris هي الوحيدة اللي بتعدي على مفصلين (Hip & Knee).',
    solution: [
      4, 2, 6, 1, 5, 3,
      1, 5, 3, 4, 2, 6,
      6, 4, 2, 5, 3, 1,
      5, 3, 1, 6, 4, 2,
      2, 6, 4, 3, 1, 5,
      3, 1, 5, 2, 6, 4,
    ],
    givens: [0, 3, 4, 7, 9, 11, 12, 14, 17, 19, 21, 24, 26, 28, 31, 33, 35],
  },
  {
    id: 'deltoideus',
    word: 'DELTOID',
    pearl: 'عضلة الـ Deltoid بتتغذى بالـ Axillary Nerve؛ أليافها الأمامية بتعمل Flexion، الوسطى Abduction، والخلفية Extension.',
    solution: [
      3, 5, 1, 4, 6, 2,
      4, 6, 2, 3, 5, 1,
      1, 3, 5, 2, 4, 6,
      2, 4, 6, 1, 3, 5,
      5, 1, 3, 6, 2, 4,
      6, 2, 4, 5, 1, 3,
    ],
    givens: [0, 2, 4, 6, 9, 11, 13, 15, 19, 20, 22, 25, 27, 29, 30, 32, 34],
  },
  {
    id: 'masseter',
    word: 'MASSETER',
    pearl: 'الـ Masseter هي أقوى عضلة للمضغ (TMJ Elevation) نسبة لحجمها، وبتتغذى بالـ Mandibular Branch of Trigeminal Nerve (CN V3).',
    solution: [
      1, 6, 4, 2, 5, 3,
      2, 5, 3, 1, 6, 4,
      4, 1, 6, 5, 3, 2,
      5, 3, 2, 4, 1, 6,
      6, 4, 1, 3, 2, 5,
      3, 2, 5, 6, 4, 1,
    ],
    givens: [1, 2, 4, 6, 8, 11, 13, 15, 18, 20, 22, 25, 27, 29, 31, 33, 35],
  },
  {
    id: 'acromion',
    word: 'ACROMION',
    pearl: 'الـ Acromion هو الامتداد الجانبي لـ Spine of Scapula وبيعمل مفصل الـ Acromioclavicular (AC) مع عظمة الترقوة.',
    solution: [
      2, 1, 5, 6, 3, 4,
      6, 3, 4, 2, 1, 5,
      5, 2, 1, 3, 4, 6,
      3, 4, 6, 5, 2, 1,
      1, 5, 2, 4, 6, 3,
      4, 6, 3, 1, 5, 2,
    ],
    givens: [0, 2, 5, 7, 9, 11, 12, 14, 17, 19, 21, 24, 26, 28, 30, 32, 35],
  },
];

function getBoxCells(boxIdx: number): number[] {
  const boxRow = Math.floor(boxIdx / 2) * 2;
  const boxCol = (boxIdx % 2) * 3;
  const indices: number[] = [];
  for (let r = boxRow; r < boxRow + 2; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      indices.push(r * 6 + c);
    }
  }
  return indices;
}

// Randomly distributes & scrambles the letters of `word` across 6 boxes so the player must unscramble them
function buildScrambledBoxLetters(word: string): string[] {
  const chars = word.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const boxes = ['', '', '', '', '', ''];
  chars.forEach((ch, idx) => {
    boxes[idx % 6] += ch;
  });
  return boxes;
}

interface AnatomySudokuGameProps {
  onBack: () => void;
  onWin: () => void;
  dailyPlaysCount: number;
  maxDailyPlays?: number;
  xpReward?: number;
}

export const AnatomySudokuGame: React.FC<AnatomySudokuGameProps> = ({
  onBack,
  onWin,
  dailyPlaysCount,
  maxDailyPlays = 3,
  xpReward = 150,
}) => {
  const [puzzleIdx, setPuzzleIdx] = useState(() => Math.floor(Math.random() * PUZZLES.length));
  const puzzle = PUZZLES[puzzleIdx];

  const [board, setBoard] = useState<(number | null)[]>(() =>
    puzzle.solution.map((val, idx) => (puzzle.givens.includes(idx) ? val : null))
  );
  const [boxLetters, setBoxLetters] = useState<string[]>(() => buildScrambledBoxLetters(puzzle.word));
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const MAX_HINTS = 2;
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wordGuess, setWordGuess] = useState('');
  const [wordError, setWordError] = useState('');
  const [wordShakeKey, setWordShakeKey] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [started, setStarted] = useState(false);

  const remainingXpPlays = Math.max(0, maxDailyPlays - dailyPlaysCount);
  const activeTierIdx = Math.min(dailyPlaysCount, 2);
  const TIERS = [
    { label: 'الأولى', xp: 150 },
    { label: 'التانية', xp: 300 },
    { label: 'التالتة', xp: 500 },
  ];

  const loadPuzzle = (idx: number) => {
    const p = PUZZLES[idx];
    setPuzzleIdx(idx);
    setBoard(p.solution.map((val, i) => (p.givens.includes(i) ? val : null)));
    setBoxLetters(buildScrambledBoxLetters(p.word));
    setSelectedCell(null);
    setHintsUsed(0);
    setWordGuess('');
    setWordError('');
    setWordShakeKey(0);
    setHasWon(false);
  };

  const solvedBoxes = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((bIdx) => {
      const cells = getBoxCells(bIdx);
      return cells.every((cellIdx) => board[cellIdx] === puzzle.solution[cellIdx]);
    });
  }, [board, puzzle]);

  const allBoxesSolved = solvedBoxes.every(Boolean);

  const handleNumberInput = (num: number) => {
    if (selectedCell === null || puzzle.givens.includes(selectedCell) || hasWon) return;
    const next = [...board];
    next[selectedCell] = num;
    setBoard(next);
    if (num === puzzle.solution[selectedCell]) {
      playSound('sudoku_place');
      haptic('success');
      setSelectedCell(null);
    } else {
      playSound('wrong');
      haptic('error');
    }
  };

  const handleHint = () => {
    if (hintsUsed >= MAX_HINTS || hasWon) return;
    const emptyIncorrect = board
      .map((val, idx) => (val !== puzzle.solution[idx] ? idx : -1))
      .filter((idx) => idx !== -1);
    if (emptyIncorrect.length === 0) return;
    const pick = emptyIncorrect[Math.floor(Math.random() * emptyIncorrect.length)];
    const next = [...board];
    next[pick] = puzzle.solution[pick];
    setBoard(next);
    setHintsUsed((h) => h + 1);
    setSelectedCell(null);
    playSound('sudoku_place');
    haptic('tap');
  };

  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allBoxesSolved || hasWon) return;
    if (wordGuess.trim().toUpperCase() === puzzle.word) {
      setWordError('');
      setHasWon(true);
      playSound(xpReward >= 500 ? 'jackpot' : 'game_win');
      haptic('success');
      onWin();
    } else {
      playSound('wrong');
      haptic('error');
      setWordShakeKey((k) => k + 1);
      setWordError('الكلمة مش مظبوطة! رتب الحروف العشوائية كويس واكتب المصطلح الصح.');
    }
  };

  if (!started) {
    return (
      <GameIntroScreen
        accent="purple"
        character="brain"
        art={<SudokuArt />}
        title="سودوكو التشريح"
        titleEn="Anatomy Sudoku 6×6"
        subtitle="حل شبكة الـ 6×6 وافتح كل مربع عشان تكشف حروف المصطلح الطبي السري!"
        rules={[
          'كل صف وعمود ومربع (2×3) لازم يحتوي الأرقام 1 لـ 6 بدون تكرار',
          'كل مربع يكتمل بيفك قفل حروف عشوائية من المصطلح الطبي المطلوب',
          'نظام المكافآت التصاعدي: 150 ثم 300 ثم 500 XP في أول 3 جولات يومياً!',
        ]}
        xpLabel={`+${xpReward} XP`}
        dailyPlaysCount={dailyPlaysCount}
        maxDailyPlays={maxDailyPlays}
        onStart={() => setStarted(true)}
        onBack={onBack}
        startLabel="ابدأ السودوكو"
      />
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 pb-10 text-start">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl cursor-pointer active:scale-95 transition-all"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          <span>رجوع للألعاب</span>
        </button>

        <span className="text-2xs font-black px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 tabular-nums">
          {remainingXpPlays > 0 ? `محاولات XP: ${remainingXpPlays}/${maxDailyPlays} · +${xpReward} XP` : 'وضع التدريب'}
        </span>
      </div>

      {remainingXpPlays <= 0 && !hasWon && (
        <PracticeModeBanner character="brain" />
      )}

      {/* Progressive 3-Tier Reward Ladder */}
      {remainingXpPlays > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((tier, idx) => {
            const done = dailyPlaysCount > idx;
            const currentTier = activeTierIdx === idx && !hasWon;
            return (
              <div
                key={tier.xp}
                className={`rounded-xl px-2.5 py-2 border text-center transition-all ${
                  done
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : currentTier
                      ? 'bg-purple-500/20 border-purple-400/60 text-white shadow-[0_0_16px_rgba(168,85,247,0.2)]'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-500'
                }`}
              >
                <span className="text-[10px] font-bold block">الجولة {tier.label}</span>
                <span className="text-xs font-black tabular-nums">
                  {done ? '✓ ' : ''}+{tier.xp} XP
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="sm:glass-card sm:p-5 sm:border sm:border-purple-500/25 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <Mascot
              character="brain"
              mood={hasWon ? 'celebrating' : wordError ? 'confused' : 'thinking'}
              size={40}
            />
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-purple-400" />
              <h2 className="text-base sm:text-lg font-black text-white">سودوكو التشريح (+{xpReward} XP)</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-2xs font-black bg-zinc-900 border border-zinc-800 text-zinc-300 tabular-nums">
              لغز {puzzleIdx + 1} / {PUZZLES.length}
            </span>
            <button
              type="button"
              onClick={() => {
                const candidates = PUZZLES.map((_, idx) => idx).filter((idx) => idx !== puzzleIdx);
                const next = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
                loadPuzzle(next);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-black cursor-pointer border bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              <span>لغز جديد</span>
            </button>
          </div>
        </div>

        {/* Scrambled Box Letters Bar */}
        <div className="mb-4 p-3 rounded-2xl bg-black/40 border border-white/10">
          <span className="text-[11px] font-bold text-zinc-400 block mb-2 text-center">
            كل مربع (2×3) يكمل بيكشفلك حروف عشوائية من المصطلح السري ({puzzle.word.length} حروف):
          </span>
          <div className="grid grid-cols-6 gap-1.5" dir="ltr">
            {boxLetters.map((letters, bIdx) => {
              const unlocked = solvedBoxes[bIdx];
              return (
                <div
                  key={bIdx}
                  className={`py-2 rounded-xl border text-center font-black text-xs tracking-wider transition-all ${
                    unlocked
                      ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-600'
                  }`}
                >
                  {unlocked ? letters : '🔒'}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6x6 Sudoku Grid rendered as 6 equal 2x3 boxes */}
        <div className="flex justify-center mb-4" dir="ltr">
          <div className="grid grid-cols-2 gap-2 p-2 rounded-2xl bg-zinc-950 border border-white/10 w-full max-w-[400px]">
            {[0, 1, 2, 3, 4, 5].map((bIdx) => {
              const cells = getBoxCells(bIdx);
              const boxSolved = solvedBoxes[bIdx];
              return (
                <div
                  key={`box-${bIdx}-${boxSolved ? 'ok' : 'open'}`}
                  className={`grid grid-cols-3 gap-1 p-1.5 rounded-xl border transition-colors ${
                    boxSolved
                      ? 'bg-emerald-500/10 border-emerald-500/35 lp-correct'
                      : 'bg-zinc-900/40 border-white/5'
                  }`}
                >
                  {cells.map((idx) => {
                    const val = board[idx];
                    const isGiven = puzzle.givens.includes(idx);
                    const isSelected = selectedCell === idx;
                    const isCorrect = val !== null && val === puzzle.solution[idx];
                    const isWrong = val !== null && val !== puzzle.solution[idx];

                    return (
                      <button
                        key={`${idx}-${val ?? 'empty'}`}
                        type="button"
                        disabled={isGiven || hasWon}
                        onClick={() => setSelectedCell(idx)}
                        className={`aspect-square w-full rounded-lg font-black text-base flex items-center justify-center border transition-colors ${
                          !isGiven && val !== null ? 'lp-pop' : ''
                        } ${
                          isGiven
                            ? 'bg-zinc-800/85 border-zinc-700 text-zinc-300 cursor-default'
                            : isCorrect
                              ? `bg-emerald-500/20 border-emerald-400/70 text-emerald-300 cursor-pointer ${isSelected ? 'ring-2 ring-white/70' : ''}`
                              : isWrong
                                ? `bg-red-500/20 border-red-500/70 text-red-300 cursor-pointer ${isSelected ? 'ring-2 ring-red-400' : ''}`
                                : isSelected
                                  ? 'bg-purple-500/30 border-purple-400 text-white ring-2 ring-purple-400/60 cursor-pointer'
                                  : 'bg-zinc-900/90 border-zinc-800 text-white hover:border-zinc-600 cursor-pointer'
                        }`}
                      >
                        {val ?? ''}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Number Pad + Hint */}
        {!allBoxesSolved && (
          <div className="space-y-2.5 w-full max-w-[400px] mx-auto">
            <div className="grid grid-cols-6 gap-1.5" dir="ltr">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNumberInput(n)}
                  className="py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-purple-400 text-white font-black text-base cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={hintsUsed >= MAX_HINTS}
                onClick={handleHint}
                className={`flex-1 py-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  hintsUsed >= MAX_HINTS
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed'
                    : 'bg-purple-500/15 border-purple-500/30 text-purple-300 cursor-pointer hover:bg-purple-500/25 active:scale-95'
                }`}
              >
                <Lightbulb className="w-4 h-4" /> تلميح رقم ({MAX_HINTS - hintsUsed}/{MAX_HINTS})
              </button>
              <button
                type="button"
                onClick={() => loadPuzzle(puzzleIdx)}
                className="py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-black cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> إعادة
              </button>
            </div>
          </div>
        )}

        {/* Final Word Submission */}
        {allBoxesSolved && !hasWon && (
          <m.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmitWord}
            className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 space-y-3"
          >
            <p className="text-xs font-black text-emerald-200 text-center">
              🎉 كملت السودوكو! رتّب الحروف العشوائية واكتب المصطلح الطبي:
            </p>
            <input
              key={`word-input-${wordShakeKey}`}
              type="text"
              dir="ltr"
              value={wordGuess}
              onChange={(e) => setWordGuess(e.target.value)}
              placeholder="اكتب الكلمة بالإنجليزي..."
              className={`w-full min-h-[44px] bg-zinc-950 border border-emerald-400/50 rounded-xl px-4 py-2.5 text-center font-black text-sm text-white uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-400/40 ${
                wordShakeKey > 0 ? 'lp-shake' : ''
              }`}
              required
            />
            {wordError && <p className="text-xs font-bold text-red-400 text-center">{wordError}</p>}
            <button
              type="submit"
              className="lp-press min-h-[44px] w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs py-2.5 rounded-xl cursor-pointer hover:opacity-95"
            >
              تأكيد الكلمة واكسب +{xpReward} XP ⚡
            </button>
          </m.form>
        )}

        {/* Win Celebration + Pearl */}
        {hasWon && (
          <div className="mt-4">
            <GameResultScreen
              status="won"
              accent="purple"
              character="brain"
              tier={xpReward >= 500 ? 'legendary' : 'major'}
              isPractice={remainingXpPlays <= 0}
              title={`أحسنت! الكلمة هي ${puzzle.word}`}
              subtitle={`💡 ${puzzle.pearl}`}
              xp={remainingXpPlays > 0 ? xpReward : 0}
              stats={[{ label: 'التلميحات', value: `${hintsUsed}/${MAX_HINTS}` }]}
              onReplay={() => loadPuzzle((puzzleIdx + 1) % PUZZLES.length)}
              replayLabel="اللغز اللي بعده"
              onBack={onBack}
            />
          </div>
        )}
      </div>
    </div>
  );
};
