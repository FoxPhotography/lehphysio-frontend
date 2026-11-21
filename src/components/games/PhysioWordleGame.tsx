import React, { useCallback, useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, Zap, RotateCcw, Delete, Type } from 'lucide-react';
import { fireWinConfetti } from '../../utils/confetti';
import { playChatSound } from '../../utils/helpers';

interface WordleQuestion {
  sentence: string;
  answer: string;
  arHint: string;
}

const WORDLE_BANK: WordleQuestion[] = [
  {
    sentence: 'The longest muscle in the human body is ________',
    answer: 'SARTORIUS',
    arHint: 'أطول عضلة في جسم الإنسان',
  },
  {
    sentence: 'The largest nerve in the human body is ________',
    answer: 'SCIATIC',
    arHint: 'أكبر عصب في الجسم (عرق النسا)',
  },
  {
    sentence: 'The muscle that unlocks the extended knee is ________',
    answer: 'POPLITEUS',
    arHint: 'العضلة المسؤولة عن فتح قفل الركبة',
  },
  {
    sentence: 'Carpal tunnel syndrome compresses the ________ nerve',
    answer: 'MEDIAN',
    arHint: 'العصب المضغوط في متلازمة النفق الرسغي',
  },
  {
    sentence: 'The main abductor of the shoulder (15°–90°) is ________',
    answer: 'DELTOID',
    arHint: 'العضلة الرئيسية لإبعاد الكتف',
  },
  {
    sentence: 'The lateral bone of the forearm is the ________',
    answer: 'RADIUS',
    arHint: 'العظمة الجانبية (الوحشية) في الساعد',
  },
  {
    sentence: 'The largest sesamoid bone in the body is the ________',
    answer: 'PATELLA',
    arHint: 'أكبر عظمة سمسمية في الجسم (الرضفة)',
  },
  {
    sentence: 'The primary ankle plantarflexor with knee flexed is ________',
    answer: 'SOLEUS',
    arHint: 'العضلة الأساسية لثني الكاحل للأسفل والركبة مثنية',
  },
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

const MAX_ATTEMPTS = 6;

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(target.length).fill('absent');
  const remaining: Record<string, number> = {};

  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
    } else {
      remaining[target[i]] = (remaining[target[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < target.length; i++) {
    if (result[i] === 'correct') continue;
    const ch = guess[i];
    if (remaining[ch] > 0) {
      result[i] = 'present';
      remaining[ch] -= 1;
    }
  }
  return result;
}

interface PhysioWordleGameProps {
  onBack: () => void;
  onWin: () => void;
  dailyPlaysCount: number;
  maxDailyPlays?: number;
  xpReward?: number;
}

export const PhysioWordleGame: React.FC<PhysioWordleGameProps> = ({
  onBack,
  onWin,
  dailyPlaysCount,
  maxDailyPlays = 3,
  xpReward = 150,
}) => {
  const [qIdx, setQIdx] = useState(() => Math.floor(Math.random() * WORDLE_BANK.length));
  const question = WORDLE_BANK[qIdx];
  const wordLen = question.answer.length;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const resetWithIndex = useCallback((nextIdx: number) => {
    setQIdx(nextIdx);
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
  }, []);

  const submitGuess = useCallback(() => {
    if (status !== 'playing' || currentGuess.length !== wordLen) return;
    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (currentGuess === question.answer) {
      setStatus('won');
      playChatSound('success');
      fireWinConfetti();
      onWin();
    } else if (nextGuesses.length >= MAX_ATTEMPTS) {
      setStatus('lost');
      playChatSound('error');
    } else {
      playChatSound('send');
    }
  }, [currentGuess, guesses, onWin, question.answer, status, wordLen]);

  const handleKey = useCallback(
    (key: string) => {
      if (status !== 'playing') return;
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACK') {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLen) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess.length, status, submitGuess, wordLen]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('BACK');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  // Track best state per letter for keyboard coloring
  const keyStates: Record<string, LetterState> = {};
  guesses.forEach((g) => {
    const evals = evaluateGuess(g, question.answer);
    for (let i = 0; i < g.length; i++) {
      const ch = g[i];
      const st = evals[i];
      const prev = keyStates[ch];
      if (st === 'correct' || (st === 'present' && prev !== 'correct') || (!prev && st === 'absent')) {
        keyStates[ch] = st;
      }
    }
  });

  const remainingXpPlays = Math.max(0, maxDailyPlays - dailyPlaysCount);

  return (
    <div className="space-y-4 xl:pt-4 max-w-2xl mx-auto px-2.5 sm:px-4 pb-10 text-start">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800 px-3 py-2 rounded-xl cursor-pointer transition-colors"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          <span>رجوع للألعاب</span>
        </button>

        <span className="text-2xs font-black px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 tabular-nums">
          محاولات XP: {remainingXpPlays}/{maxDailyPlays}
        </span>
      </div>

      <div className="glass-card p-3.5 sm:p-6 border border-amber-500/25 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white">أكمل الجملة الطبية (Wordle)</h2>
          </div>
          <span className="text-2xs font-black text-zinc-400">{wordLen} حروف</span>
        </div>

        {/* Medical Sentence Clue */}
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 mb-4 text-center">
          <p className="text-sm sm:text-base font-black text-white leading-relaxed" dir="ltr">
            {status === 'won'
              ? question.sentence.replace('________', question.answer)
              : question.sentence}
          </p>
          <p className="text-xs font-bold text-amber-300 mt-1">{question.arHint}</p>
        </div>

        {/* Wordle Grid */}
        <div className="flex flex-col items-center gap-1.5 mb-4" dir="ltr">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIdx) => {
            const isSubmitted = rowIdx < guesses.length;
            const isCurrent = rowIdx === guesses.length && status === 'playing';
            const rowWord = isSubmitted ? guesses[rowIdx] : isCurrent ? currentGuess : '';
            const evals = isSubmitted ? evaluateGuess(rowWord, question.answer) : [];

            return (
              <div
                key={rowIdx}
                className="grid gap-1 sm:gap-1.5 w-full max-w-[360px]"
                style={{ gridTemplateColumns: `repeat(${wordLen}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: wordLen }).map((__, colIdx) => {
                  const char = rowWord[colIdx] || '';
                  const cellState: LetterState = isSubmitted ? evals[colIdx] : 'empty';

                  const cls =
                    cellState === 'correct'
                      ? 'bg-emerald-500 border-emerald-400 text-black'
                      : cellState === 'present'
                        ? 'bg-amber-500 border-amber-400 text-black'
                        : cellState === 'absent'
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          : char
                            ? 'bg-zinc-900 border-amber-400/70 text-white'
                            : 'bg-zinc-950/80 border-zinc-800 text-white';

                  return (
                    <div
                      key={colIdx}
                      className={`aspect-square rounded-lg border-2 font-black text-xs sm:text-sm flex items-center justify-center transition-all ${cls}`}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Status Banners */}
        {status === 'won' && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 text-emerald-300 font-black text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>برافو! الجملة اكتملت: {question.answer} 🎉</span>
            </div>
            {remainingXpPlays > 0 && (
              <span className="text-xs font-black text-brand-amber flex items-center gap-1" dir="ltr">
                <Zap className="w-3.5 h-3.5 fill-current" />+{xpReward} XP
              </span>
            )}
            <button
              type="button"
              onClick={() => resetWithIndex((qIdx + 1) % WORDLE_BANK.length)}
              className="w-full mt-1 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>جملة جديدة</span>
            </button>
          </m.div>
        )}

        {status === 'lost' && (
          <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-center space-y-2.5">
            <p className="text-xs font-black text-red-300">
              انتهت المحاولات! الإجابة الصح هي: <span className="text-white" dir="ltr">{question.answer}</span>
            </p>
            <button
              type="button"
              onClick={() => resetWithIndex((qIdx + 1) % WORDLE_BANK.length)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>جرب جملة تانية</span>
            </button>
          </div>
        )}

        {/* On-Screen QWERTY Keyboard */}
        {status === 'playing' && (
          <div className="space-y-1.5 select-none" dir="ltr">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1">
                {row.map((key) => {
                  const st = keyStates[key];
                  const isAction = key === 'ENTER' || key === 'BACK';
                  const bg =
                    st === 'correct'
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : st === 'present'
                        ? 'bg-amber-500 text-black border-amber-400'
                        : st === 'absent'
                          ? 'bg-zinc-900 text-zinc-600 border-zinc-800'
                          : isAction
                            ? 'bg-brand-orange/20 text-brand-amber border-brand-orange/40'
                            : 'bg-zinc-800/90 text-white border-zinc-700 hover:bg-zinc-700';

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKey(key)}
                      className={`h-10 sm:h-11 rounded-lg border font-black text-[11px] sm:text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
                        isAction ? 'px-2.5 sm:px-3.5' : 'flex-1 max-w-[36px]'
                      } ${bg}`}
                    >
                      {key === 'BACK' ? <Delete className="w-4 h-4" /> : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
