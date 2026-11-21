import React, { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, Zap, RotateCcw, Grid3X3, Lightbulb } from 'lucide-react';
import { fireWinConfetti } from '../../utils/confetti';
import { playChatSound } from '../../utils/helpers';

interface SudokuPuzzle {
  id: string;
  word: string;
  pearl: string;
  solution: number[]; // 36 cells (6x6)
  givens: number[];   // indices prefilled
  boxLetters: string[]; // 6 strings corresponding to the 6 (2x3) boxes
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
    boxLetters: ['OB', 'TU', 'RA', 'T', 'O', 'R'],
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
    boxLetters: ['SA', 'RT', 'OR', 'I', 'U', 'S'],
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
    boxLetters: ['PI', 'RI', 'FO', 'RM', 'I', 'S'],
  },
];

// 6x6 has 6 boxes of 2 rows x 3 cols:
// box 0: rows 0-1, cols 0-2
// box 1: rows 0-1, cols 3-5
// box 2: rows 2-3, cols 0-2
// box 3: rows 2-3, cols 3-5
// box 4: rows 4-5, cols 0-2
// box 5: rows 4-5, cols 3-5
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
  xpReward = 500,
}) => {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = PUZZLES[puzzleIdx];

  const [board, setBoard] = useState<(number | null)[]>(() =>
    puzzle.solution.map((val, idx) => (puzzle.givens.includes(idx) ? val : null))
  );
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [wordGuess, setWordGuess] = useState('');
  const [wordError, setWordError] = useState('');
  const [hasWon, setHasWon] = useState(false);

  const loadPuzzle = (idx: number) => {
    const p = PUZZLES[idx];
    setPuzzleIdx(idx);
    setBoard(p.solution.map((val, i) => (p.givens.includes(i) ? val : null)));
    setSelectedCell(null);
    setWordGuess('');
    setWordError('');
    setHasWon(false);
  };

  // Check which of the 6 boxes are completely and correctly solved
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
      playChatSound('success');
    } else {
      playChatSound('error');
    }
  };

  const handleHint = () => {
    const emptyIncorrect = board
      .map((val, idx) => (val !== puzzle.solution[idx] ? idx : -1))
      .filter((idx) => idx !== -1);
    if (emptyIncorrect.length === 0) return;
    const pick = emptyIncorrect[Math.floor(Math.random() * emptyIncorrect.length)];
    const next = [...board];
    next[pick] = puzzle.solution[pick];
    setBoard(next);
    setSelectedCell(pick);
    playChatSound('success');
  };

  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allBoxesSolved || hasWon) return;
    if (wordGuess.trim().toUpperCase() === puzzle.word) {
      setWordError('');
      setHasWon(true);
      playChatSound('success');
      fireWinConfetti();
      onWin();
    } else {
      playChatSound('error');
      setWordError('الكلمة مش مظبوطة! رتب الحروف اللي ظهرت من المربعات كويس.');
    }
  };

  const remainingXpPlays = Math.max(0, maxDailyPlays - dailyPlaysCount);

  return (
    <div className="space-y-5 xl:pt-4 max-w-2xl mx-auto px-3 sm:px-4 pb-10 text-start">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800 px-3 py-2 rounded-xl cursor-pointer transition-colors"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          <span>رجوع للألعاب</span>
        </button>

        <span className="text-2xs font-black px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 tabular-nums">
          محاولات XP: {remainingXpPlays}/{maxDailyPlays} · +{xpReward} XP
        </span>
      </div>

      <div className="glass-card p-4 sm:p-6 border border-purple-500/25 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-black text-white">سودوكو التشريح (+{xpReward} XP)</h2>
          </div>
          <div className="flex gap-1.5">
            {PUZZLES.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => loadPuzzle(i)}
                className={`px-2.5 py-1 rounded-lg text-2xs font-black cursor-pointer border transition-all ${
                  i === puzzleIdx
                    ? 'bg-purple-500 text-white border-purple-400'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                لغز {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Unlocked Box Letters Bar */}
        <div className="mb-4 p-3 rounded-2xl bg-black/40 border border-white/10">
          <span className="text-[11px] font-bold text-zinc-400 block mb-2 text-center">
            كل مربع (2×3) يكمل بيكشفلك حروف من المصطلح السري:
          </span>
          <div className="grid grid-cols-6 gap-1.5" dir="ltr">
            {puzzle.boxLetters.map((letters, bIdx) => {
              const unlocked = solvedBoxes[bIdx];
              return (
                <div
                  key={bIdx}
                  className={`py-2 rounded-xl border text-center font-black text-xs transition-all ${
                    unlocked
                      ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-600'
                  }`}
                >
                  {unlocked ? letters : '🔒'}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6x6 Sudoku Grid */}
        <div className="flex justify-center mb-4" dir="ltr">
          <div className="grid grid-cols-6 gap-1 p-2 rounded-2xl bg-zinc-950 border border-white/10 w-full max-w-[330px]">
            {board.map((val, idx) => {
              const r = Math.floor(idx / 6);
              const c = idx % 6;
              const isGiven = puzzle.givens.includes(idx);
              const isSelected = selectedCell === idx;
              const isCorrect = val !== null && val === puzzle.solution[idx];
              const isWrong = val !== null && val !== puzzle.solution[idx];

              const borderRight = c === 2 ? 'me-1.5' : '';
              const borderBottom = r === 1 || r === 3 ? 'mb-1.5' : '';

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isGiven || hasWon}
                  onClick={() => setSelectedCell(idx)}
                  className={`aspect-square rounded-lg font-black text-sm flex items-center justify-center border transition-all ${borderRight} ${borderBottom} ${
                    isGiven
                      ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 cursor-default'
                      : isSelected
                        ? 'bg-purple-500/30 border-purple-400 text-white ring-2 ring-purple-400/50 cursor-pointer'
                        : isWrong
                          ? 'bg-red-500/20 border-red-500/60 text-red-300 cursor-pointer'
                          : isCorrect
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 cursor-pointer'
                            : 'bg-zinc-900/90 border-zinc-800 text-white hover:border-zinc-600 cursor-pointer'
                  }`}
                >
                  {val ?? ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Number Pad + Hint */}
        {!allBoxesSolved && (
          <div className="space-y-2.5 max-w-[330px] mx-auto">
            <div className="grid grid-cols-6 gap-1.5" dir="ltr">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNumberInput(n)}
                  className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-purple-400 text-white font-black text-sm cursor-pointer active:scale-95 transition-all"
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleHint}
                className="flex-1 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black cursor-pointer hover:bg-purple-500/25 flex items-center justify-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" /> تلميح رقم
              </button>
              <button
                type="button"
                onClick={() => loadPuzzle(puzzleIdx)}
                className="py-2 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> إعادة
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
            className="mt-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-400/40 space-y-3"
          >
            <p className="text-xs font-black text-purple-200 text-center">
              🎉 كملت السودوكو! جمّع الحروف واكتب المصطلح الطبي:
            </p>
            <input
              type="text"
              dir="ltr"
              value={wordGuess}
              onChange={(e) => setWordGuess(e.target.value)}
              placeholder="اكتب الكلمة بالإنجليزي..."
              className="w-full bg-zinc-950 border border-purple-400/50 rounded-xl px-4 py-2.5 text-center font-black text-sm text-white uppercase tracking-widest outline-none focus:ring-2 focus:ring-purple-400/40"
              required
            />
            {wordError && <p className="text-xs font-bold text-red-400 text-center">{wordError}</p>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all"
            >
              تأكيد الكلمة واكسب +{xpReward} XP ⚡
            </button>
          </m.form>
        )}

        {/* Win Celebration + Pearl */}
        {hasWon && (
          <m.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>أحسنت! الكلمة هي {puzzle.word}</span>
              </span>
              {remainingXpPlays > 0 && (
                <span className="text-xs font-black text-brand-amber flex items-center gap-1" dir="ltr">
                  <Zap className="w-3.5 h-3.5 fill-current" />+{xpReward} XP
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-zinc-200 leading-relaxed bg-black/35 p-3 rounded-xl border border-white/5">
              💡 {puzzle.pearl}
            </p>
            <button
              type="button"
              onClick={() => loadPuzzle((puzzleIdx + 1) % PUZZLES.length)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>اللغز اللي بعده</span>
            </button>
          </m.div>
        )}
      </div>
    </div>
  );
};
