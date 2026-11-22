import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Delete, Type } from 'lucide-react';
import { playSound } from '../../utils/soundEngine';
import { GameIntroScreen } from './ui/GameIntroScreen';
import { GameResultScreen } from './ui/GameResultScreen';
import { PracticeModeBanner } from './ui/PracticeModeBanner';
import { Mascot } from './ui/Mascot';
import { WordleArt } from './ui/GameArt';
import { haptic } from './ui/feedback';

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
  {
    sentence: 'The rotator cuff muscle that initiates shoulder abduction (0°–15°) is ________',
    answer: 'SUPRASPINATUS',
    arHint: 'عضلة الكفة المدورة التي تبدأ إبعاد الكتف',
  },
  {
    sentence: 'The only rotator cuff muscle that internally rotates the shoulder is ________',
    answer: 'SUBSCAPULARIS',
    arHint: 'عضلة الكفة المدورة المسؤولة عن اللف الداخلي للكتف',
  },
  {
    sentence: 'The muscle that prevents winging of the scapula is Serratus ________',
    answer: 'ANTERIOR',
    arHint: 'تمنع بروز لوح الكتف (Scapular Winging)',
  },
  {
    sentence: 'The nerve injured at the spiral groove causing wrist drop is ________',
    answer: 'RADIAL',
    arHint: 'العصب المسؤول عن سقوط الرسغ عند إصابته',
  },
  {
    sentence: 'The nerve passing behind the medial epicondyle (funny bone) is ________',
    answer: 'ULNAR',
    arHint: 'العصب المار خلف اللقمة الإنسية للمرفق',
  },
  {
    sentence: 'The primary elbow flexor regardless of forearm position is ________',
    answer: 'BRACHIALIS',
    arHint: 'العضلة الأساسية لثني الكوع في كل أوضاع الساعد',
  },
  {
    sentence: 'The largest and strongest muscle of the buttocks is Gluteus ________',
    answer: 'MAXIMUS',
    arHint: 'أكبر وأقوى عضلة في منطقة الإلية',
  },
  {
    sentence: 'Weakness of Gluteus ________ causes a positive Trendelenburg sign',
    answer: 'MEDIUS',
    arHint: 'ضعفها يسبب علامة ترندلنبرج أثناء المشي',
  },
  {
    sentence: 'The muscle pierced by the sciatic nerve in some people is ________',
    answer: 'PIRIFORMIS',
    arHint: 'عضلة عميقة في الحوض قد تضغط على العصب الوركي',
  },
  {
    sentence: 'The nerve responsible for knee extension is the ________ nerve',
    answer: 'FEMORAL',
    arHint: 'العصب المغذي لعضلات الفخذ الأمامية وفرد الركبة',
  },
  {
    sentence: 'The nerve supplying the medial adductor compartment of the thigh is ________',
    answer: 'OBTURATOR',
    arHint: 'العصب المغذي لعضلات الفخذ الضامة',
  },
  {
    sentence: 'The heel bone is anatomically called the ________',
    answer: 'CALCANEUS',
    arHint: 'الاسم التشريحي لعظمة الكعب',
  },
  {
    sentence: 'The weight-bearing medial bone of the lower leg is the ________',
    answer: 'TIBIA',
    arHint: 'عظمة الساق الإنسية الحاملة لوزن الجسم',
  },
  {
    sentence: 'The slender lateral bone of the lower leg is the ________',
    answer: 'FIBULA',
    arHint: 'عظمة الساق الجانبية الرفيعة (الشظية)',
  },
  {
    sentence: 'The collarbone is anatomically known as the ________',
    answer: 'CLAVICLE',
    arHint: 'الاسم التشريحي لعظمة الترقوة',
  },
  {
    sentence: 'The shoulder blade is anatomically called the ________',
    answer: 'SCAPULA',
    arHint: 'الاسم التشريحي لعظمة لوح الكتف',
  },
  {
    sentence: 'The socket of the hip joint is called the ________',
    answer: 'ACETABULUM',
    arHint: 'التجويف الذي يستقبل رأس عظمة الفخذ',
  },
  {
    sentence: 'The longest and strongest bone in the human body is the ________',
    answer: 'FEMUR',
    arHint: 'أطول وأقوى عظمة في جسم الإنسان',
  },
  {
    sentence: 'The muscle that elevates the scapula and shrugs the shoulders is ________',
    answer: 'TRAPEZIUS',
    arHint: 'العضلة المسؤولة عن رفع الكتفين لأعلى',
  },
  {
    sentence: 'The major extensor of the elbow joint is ________ Brachii',
    answer: 'TRICEPS',
    arHint: 'العضلة الرئيسية لفرد مفصل الكوع',
  },
  {
    sentence: 'The tendon connecting the calf muscles to the heel is the ________ tendon',
    answer: 'ACHILLES',
    arHint: 'أقوى وتر في الجسم ويربط السمانة بالكعب',
  },
  {
    sentence: 'The muscle that flexes and laterally rotates the neck to opposite side is ________',
    answer: 'STERNOCLEIDOMASTOID',
    arHint: 'العضلة البارزة في الرقبة (SCM)',
  },
  {
    sentence: 'The prime mover for forearm pronation is ________ Teres',
    answer: 'PRONATOR',
    arHint: 'العضلة المسؤولة عن لف الساعد للداخل',
  },
  {
    sentence: 'The prime mover for forearm supination with elbow extended is ________',
    answer: 'SUPINATOR',
    arHint: 'العضلة المسؤولة عن لف الساعد للخارج والمرفق مفرود',
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
  const [lastRevealRow, setLastRevealRow] = useState<number | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [started, setStarted] = useState(false);

  const remainingXpPlays = Math.max(0, maxDailyPlays - dailyPlaysCount);

  const resetWithIndex = useCallback((nextIdx: number) => {
    setQIdx(nextIdx);
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setLastRevealRow(null);
    setShakeKey(0);
  }, []);

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return;
    if (currentGuess.length !== wordLen) {
      setShakeKey((k) => k + 1);
      playSound('wrong');
      haptic('error');
      return;
    }
    const rowIndex = guesses.length;
    const nextGuesses = [...guesses, currentGuess];
    setLastRevealRow(rowIndex);
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (currentGuess === question.answer) {
      setStatus('won');
      playSound('game_win');
      haptic('success');
      onWin();
    } else if (nextGuesses.length >= MAX_ATTEMPTS) {
      setStatus('lost');
      playSound('game_lose');
      haptic('error');
    } else {
      playSound('wordle_flip');
      haptic('tap');
    }
  }, [currentGuess, guesses, onWin, question.answer, status, wordLen]);

  const handleKey = useCallback(
    (key: string) => {
      if (!started || status !== 'playing') return;
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACK') {
        playSound('tap');
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLen) {
        playSound('wordle_key');
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess.length, started, status, submitGuess, wordLen]
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

  if (!started) {
    return (
      <GameIntroScreen
        accent="gold"
        character="brain"
        art={<WordleArt />}
        title="أكمل الجملة الطبية (Wordle)"
        titleEn="Clinical Term Wordle"
        subtitle={`خمّن الكلمة الإكلينيكية الناقصة في الجملة خلال ${MAX_ATTEMPTS} محاولات!`}
        rules={[
          'اقرأ الجملة الطبية والتلميح العربي في الصندوق فوق الشبكة',
          'الأخضر = الحرف في مكانه الصح · الأصفر = موجود في مكان تاني',
          `عندك ${MAX_ATTEMPTS} محاولات لكشف الكلمة كاملة واكتمال الجملة`,
        ]}
        xpLabel={`+${xpReward} XP`}
        dailyPlaysCount={dailyPlaysCount}
        maxDailyPlays={maxDailyPlays}
        onStart={() => setStarted(true)}
        onBack={onBack}
        startLabel="ابدأ التحدي"
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

        <span className="text-2xs font-black px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 tabular-nums">
          {remainingXpPlays > 0 ? `محاولات XP: ${remainingXpPlays}/${maxDailyPlays}` : 'وضع التدريب'}
        </span>
      </div>

      {remainingXpPlays <= 0 && status === 'playing' && (
        <PracticeModeBanner character="brain" />
      )}

      <div className="sm:glass-card sm:p-5 sm:border sm:border-amber-500/25 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <Mascot
              character="brain"
              mood={
                status === 'won'
                  ? 'celebrating'
                  : status === 'lost'
                    ? 'sad'
                    : guesses.length >= 4
                      ? 'nervous'
                      : 'thinking'
              }
              size={40}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Type className="w-4 h-4 text-amber-400" />
                <h2 className="text-base sm:text-lg font-black text-white">أكمل الجملة الطبية (Wordle)</h2>
              </div>
              <span className="text-[11px] font-bold text-zinc-400">{wordLen} حروف · {MAX_ATTEMPTS - guesses.length} محاولات متبقية</span>
            </div>
          </div>
          <span className="text-2xs font-black px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300">{wordLen} حروف</span>
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
                key={isCurrent ? `row-${rowIdx}-${shakeKey}` : `row-${rowIdx}`}
                className={`grid gap-1 sm:gap-1.5 w-full max-w-[360px] ${
                  isCurrent && shakeKey > 0 ? 'lp-shake' : ''
                }`}
                style={{ gridTemplateColumns: `repeat(${wordLen}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: wordLen }).map((__, colIdx) => {
                  const char = rowWord[colIdx] || '';
                  const cellState: LetterState = isSubmitted ? evals[colIdx] : 'empty';
                  const isNewlyTyped = isCurrent && char && colIdx === currentGuess.length - 1;
                  const isRevealing = isSubmitted && rowIdx === lastRevealRow;

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
                      key={isNewlyTyped ? `${colIdx}-pop-${char}` : colIdx}
                      className={`aspect-square rounded-lg border-2 font-black text-xs sm:text-sm flex items-center justify-center transition-colors ${cls} ${
                        isNewlyTyped ? 'lp-pop' : ''
                      } ${isRevealing ? 'lp-flip' : ''}`}
                      style={isRevealing ? { animationDelay: `${colIdx * 90}ms` } : undefined}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Status Screens */}
        {status === 'won' && (
          <div className="mb-4">
            <GameResultScreen
              status="won"
              accent="gold"
              character="brain"
              isPractice={remainingXpPlays <= 0}
              title={`برافو! الجملة اكتملت: ${question.answer}`}
              subtitle={question.arHint}
              xp={remainingXpPlays > 0 ? xpReward : 0}
              stats={[
                { label: 'المحاولات', value: `${guesses.length}/${MAX_ATTEMPTS}` },
                { label: 'الكلمة', value: question.answer },
              ]}
              onReplay={() => resetWithIndex((qIdx + 1) % WORDLE_BANK.length)}
              replayLabel="جملة جديدة"
              onBack={onBack}
            />
          </div>
        )}

        {status === 'lost' && (
          <div className="mb-4">
            <GameResultScreen
              status="lost"
              accent="gold"
              character="brain"
              isPractice={remainingXpPlays <= 0}
              title={`انتهت المحاولات! الإجابة الصح: ${question.answer}`}
              subtitle={question.arHint}
              stats={[{ label: 'الإجابة', value: question.answer }]}
              onReplay={() => resetWithIndex((qIdx + 1) % WORDLE_BANK.length)}
              replayLabel="جرب جملة تانية"
              onBack={onBack}
            />
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
