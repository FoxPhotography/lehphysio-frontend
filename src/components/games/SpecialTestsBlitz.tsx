import React, { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Trophy, Flame, CheckCircle, XCircle, RefreshCw, Play } from 'lucide-react';
import { playChatSound } from '../../utils/helpers';
import { fireWinConfetti, fireStreakBurst } from '../../utils/confetti';

interface SpecialTestsBlitzProps {
  onClaimXp: () => void;
  xpReward: number;
  gamePlaySuccess?: string;
  gamePlayError?: string;
}

interface BlitzQuestion {
  prompt: string;
  region: string;
  correct: string;
  options: string[];
}

const TEST_POOL: { prompt: string; region: string; correct: string }[] = [
  // Knee
  { prompt: 'أدق اختبار لقطع الرباط الصليبي الأمامي (ACL) عند ثني الركبة 20°–30°', region: 'Knee', correct: 'Lachman Test' },
  { prompt: 'سحب القصبة للأمام والركبة مثنية 90° والقدم مثبتة لاختبار ACL', region: 'Knee', correct: 'Anterior Drawer Test (Knee)' },
  { prompt: 'دفع القصبة للخلف والركبة مثنية 90° لاكتشاف قطع الرباط الصليبي الخلفي (PCL)', region: 'Knee', correct: 'Posterior Drawer Test' },
  { prompt: 'ملاحظة سقوط القصبة للخلف تحت الجاذبية والركبة والورك مثنيين 90° (PCL)', region: 'Knee', correct: "Godfrey's (Posterior Sag) Sign" },
  { prompt: 'ضغط للداخل على جانب الركبة الوحشي (Valgus Force) لاختبار سلامة الرباط الداخلي MCL', region: 'Knee', correct: 'Valgus Stress Test (MCL)' },
  { prompt: 'ضغط للخارج على جانب الركبة الإنسي (Varus Force) لاختبار سلامة الرباط الخارجي LCL', region: 'Knee', correct: 'Varus Stress Test (LCL)' },
  { prompt: 'اختبار ثني وفرد الركبة مع دوران القصبة لاكتشاف قطع الغضروف الهلالي', region: 'Knee', correct: 'McMurray Test' },
  { prompt: 'المريض على بطنه والركبة مثنية 90° مع ضغط لأسفل ودوران لكشف الغضروف الهلالي', region: 'Knee', correct: "Apley's Compression Test" },
  { prompt: 'الوقوف على رجل واحدة مثنية 20° والالتفاف يمين وشمال لاكتشاف قطع الغضروف الهلالي', region: 'Knee', correct: 'Thessaly Test' },
  { prompt: 'تثبيت الصابونة للأسفل ثم طلب شد عضلة الفخذ للكشف عن خشونة مفصل الصابونة PFPS', region: 'Knee', correct: "Clarke's Sign (Patellar Grind)" },
  { prompt: 'اختبار ديناميكي يجمع بين Valgus و Internal Rotation وفرد الركبة لكشف عدم ثبات الـ ACL', region: 'Knee', correct: 'Pivot Shift Test' },
  { prompt: 'الضغط على الـ Lateral Femoral Condyle أثناء فرد الركبة عند 30° لكشف ITB Syndrome', region: 'Knee', correct: "Noble's Compression Test" },

  // Shoulder
  { prompt: 'رفع الذراع السلبي لأقصى مدى مع دوران داخلي لاكتشاف انحشار الكتف', region: 'Shoulder', correct: 'Neer’s Test' },
  { prompt: 'ثني الكتف 90° والكوع 90° ثم عمل دوران داخلي قسري للكتف', region: 'Shoulder', correct: 'Hawkins-Kennedy Test' },
  { prompt: 'رفع الذراعين 90° في مستوى لوح الكتف مع تدوير الإبهامين لأسفل ومقاومة النزول (Supraspinatus)', region: 'Shoulder', correct: 'Empty Can (Jobe) Test' },
  { prompt: 'رفع الذراع سلبياً لـ 90° ثم ترك المريض ينزله ببطء — سقوطه فجأة يدل على قطع كامل بالـ Rotator Cuff', region: 'Shoulder', correct: 'Drop Arm Test' },
  { prompt: 'وضع ظهر اليد على أسفل الظهر ودفعها للخلف ضد مقاومة لعزل عضلة Subscapularis', region: 'Shoulder', correct: "Lift-Off (Gerber's) Test" },
  { prompt: 'الضغط براحة اليد على البطن مع الحفاظ على المرفق للأمام لاختبار عضلة Subscapularis', region: 'Shoulder', correct: 'Belly-Press Test' },
  { prompt: 'ثني الكتف ضد مقاومة والكوع مفرود واليد Supinated لالتهاب وتر البايسبس', region: 'Shoulder', correct: 'Speed’s Test' },
  { prompt: 'مقاومة الـ Supination والدوران الخارجي والكوع مثني 90° لفحص وتر البايسبس في الـ Bicipital Groove', region: 'Shoulder', correct: "Yergason's Test" },
  { prompt: 'ثني الكتف 90° وتقريبه 15° مع تدوير الإبهام لأسفل ثم لأعلى لكشف SLAP Lesion', region: 'Shoulder', correct: "O'Brien's (Active Compression) Test" },
  { prompt: 'سحب الذراع لأسفل والمريض جالس فينتج تجويف تحت الـ Acromion (Inferior Instability)', region: 'Shoulder', correct: 'Sulcus Sign' },
  { prompt: 'فتح الكتف 90° ودوران خارجي لكشف الخلع الأمامي المتكرر للكتف', region: 'Shoulder', correct: 'Apprehension Test' },
  { prompt: 'دفع رأس عظمة العضد للخلف أثناء وضع Apprehension لتخفيف القلق والألم', region: 'Shoulder', correct: 'Relocation (Jobe) Test' },
  { prompt: 'تقريب الذراع المفرود بالعرض أمام الصدر للكتف المقابل لفحص مفصل AC Joint', region: 'Shoulder', correct: 'Scarf (Cross-Body Adduction) Test' },

  // Elbow / Wrist / Hand
  { prompt: 'فرد الرسغ ضد مقاومة لاكتشاف Tennis Elbow (Lateral Epicondylitis)', region: 'Elbow', correct: 'Cozen’s Test' },
  { prompt: 'مد الكوع بالكامل مع ثني الرسغ سلبياً وعمل Pronation لشد وتر باسطات الرسغ', region: 'Elbow', correct: "Mill's Test" },
  { prompt: 'مقاومة ثني الرسغ والكوع مفرود والساعد Supinated لاكتشاف Golfer’s Elbow', region: 'Elbow', correct: "Golfer's Elbow Test" },
  { prompt: 'ثني الرسغين لأقصى مدى لمدة 60 ثانية لتكرار تنميل متلازمة النفق الرسغي', region: 'Wrist', correct: 'Phalen’s Test' },
  { prompt: 'الخبط الخفيف فوق النفق الرسغي لإحداث كهرباء في أول 3 صوابع ونص', region: 'Wrist', correct: "Tinel's Sign at Wrist" },
  { prompt: 'ضم الإبهام داخل القبضة وثني الرسغ للناحية الزندية (De Quervain’s)', region: 'Wrist', correct: 'Finkelstein’s Test' },
  { prompt: 'مسك ورقة بين الإبهام والسبابة — ثني عقلة الإبهام يكشف ضعف Adductor Pollicis (Ulnar Nerve)', region: 'Hand', correct: "Froment's Sign" },
  { prompt: 'الضغط على الشريانين الكعبري والزندي وتفريغ الدم لفحص تروية اليد الشريانية', region: 'Hand / Vascular', correct: "Allen's Test" },
  { prompt: 'الضغط على عظمة الـ Scaphoid أثناء تحريك الرسغ من الزندي للكعبري لكشف عدم ثباتها', region: 'Wrist', correct: "Watson's (Scaphoid Shift) Test" },
  { prompt: 'تدوير وضغط قاعدة الإبهام محورياً لاكتشاف خشونة مفصل CMC للإبهام', region: 'Hand', correct: 'Grind Test (Thumb CMC)' },

  // Hip / Pelvis / Ankle / Spine / Neuro
  { prompt: 'ضم الركبة للصدر في وضع الاستلقاء لاكتشاف قِصَر عضلة الـ Iliopsoas', region: 'Hip', correct: 'Thomas Test' },
  { prompt: 'الاستلقاء على الجنب وترك الرجل العلوية تنزل لاكتشاف شد الـ IT Band', region: 'Hip', correct: 'Ober’s Test' },
  { prompt: 'وضع كعب القدم على الركبة التانية (Figure-4) لفحص مفصل الحوض والـ SIJ', region: 'Hip / SIJ', correct: 'FABER (Patrick’s) Test' },
  { prompt: 'الضغط على عضلة السمانة والمريض على بطنه لاكتشاف قطع وتر أخيل', region: 'Ankle', correct: 'Thompson Test' },
  { prompt: 'رفع الرجل مفرودة بالكامل والمريض مستلقي على ظهره لكشف شد جذور العصب الوركي (L4-S1)', region: 'Spine / Neuro', correct: "Straight Leg Raise (Lasègue's) Test" },
  { prompt: 'اختبار شد الأعصاب والمريض قاعد ومنحني الضهر مع فرد الركبة', region: 'Spine / Neuro', correct: 'Slump Test' },
  { prompt: 'ثني الركبة والمريض مستلقي على بطنه لشد العصب الفخذي (Femoral Nerve L2-L4)', region: 'Spine / Neuro', correct: 'Prone Knee Bend (Femoral Tension)' },
  { prompt: 'إمالة الرقبة للخلف وللجنب مع ضغط خفيف من أعلى لالتهاب جذور أعصاب الرقبة', region: 'Cervical', correct: 'Spurling’s Test' },
  { prompt: 'تدوير الرقبة للناحية المصابة مع تتبع النبض الكعبري وأخذ نفس عميق لفحص Thoracic Outlet', region: 'Cervical / Vascular', correct: "Adson's Test" },
  { prompt: 'رفع الذراعين بزاوية 90° وفتح وقفل القبضة 3 دقائق لاكتشاف Thoracic Outlet Syndrome', region: 'Cervical / Vascular', correct: 'Roos (EAST) Test' },
];

const ALL_TEST_NAMES = TEST_POOL.map((t) => t.correct);

function buildDeck(): BlitzQuestion[] {
  const shuffled = [...TEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.map((item) => {
    const distractors = ALL_TEST_NAMES.filter((name) => name !== item.correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [item.correct, ...distractors].sort(() => Math.random() - 0.5);
    return {
      prompt: item.prompt,
      region: item.region,
      correct: item.correct,
      options,
    };
  });
}

export const SpecialTestsBlitz: React.FC<SpecialTestsBlitzProps> = ({
  onClaimXp,
  xpReward,
  gamePlaySuccess,
  gamePlayError,
}) => {
  const [deck, setDeck] = useState<BlitzQuestion[]>(() => buildDeck());
  const [qIdx, setQIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [consecutive, setConsecutive] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ selected: string; isCorrect: boolean } | null>(null);
  const [bestScore, setBestScore] = useState<number>(() => {
    const saved = localStorage.getItem('pt_blitz_best');
    return saved ? Number(saved) || 0 : 0;
  });

  const claimedRef = useRef(false);

  useEffect(() => {
    if (!started || finished) return undefined;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, finished]);

  useEffect(() => {
    if (!finished) return;
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('pt_blitz_best', String(score));
    }
    if (correctCount >= 5 && !claimedRef.current) {
      claimedRef.current = true;
      playChatSound('win');
      fireWinConfetti();
      onClaimXp();
    }
  }, [finished, score, bestScore, correctCount, onClaimXp]);

  const current = deck[qIdx % deck.length];

  const handleStart = () => {
    setDeck(buildDeck());
    setQIdx(0);
    setTimeLeft(60);
    setScore(0);
    setCombo(1);
    setConsecutive(0);
    setCorrectCount(0);
    setFeedback(null);
    claimedRef.current = false;
    setFinished(false);
    setStarted(true);
    playChatSound('start');
  };

  const handlePick = (opt: string) => {
    if (!started || finished || feedback) return;
    const isCorrect = opt === current.correct;
    setFeedback({ selected: opt, isCorrect });

    if (isCorrect) {
      const nextConsec = consecutive + 1;
      const nextCombo = Math.min(4, 1 + Math.floor(nextConsec / 2));
      const gained = 100 * combo;
      setScore((s) => s + gained);
      setCorrectCount((c) => c + 1);
      setConsecutive(nextConsec);
      setCombo(nextCombo);
      playChatSound('success');

      if (nextConsec % 3 === 0) {
        setTimeLeft((t) => Math.min(75, t + 4));
        fireStreakBurst();
      }
    } else {
      setConsecutive(0);
      setCombo(1);
      playChatSound('error');
    }

    setTimeout(() => {
      setFeedback(null);
      setQIdx((i) => i + 1);
    }, isCorrect ? 420 : 850);
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center text-center p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
          <Zap className="w-8 h-8 text-violet-400 fill-violet-400/20" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-xl font-black text-white">سباق الـ Special Tests (OSCE Blitz)</h3>
          <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
            قدامك 60 ثانية تختار فيهم اسم الاختبار الصح لأكبر عدد ممكن من الحالات! كل 3 إجابات ورا بعض بيدوك <span className="text-emerald-400 font-black">+4 ثواني</span> ومضاعف نقاط لحد <span className="text-brand-amber font-black">x4</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300">
            أعلى سكور ليك: <strong className="text-brand-amber font-mono">{bestScore}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/30 text-brand-orange">
            جاوب 5+ صح للـ XP
          </span>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black text-sm py-3.5 px-8 rounded-xl cursor-pointer shadow-lg shadow-violet-500/25 hover:opacity-95 active:scale-95 transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>ابدأ التحدي</span>
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4"
      >
        <Trophy className="w-14 h-14 text-brand-amber drop-shadow-[0_0_16px_rgba(255,176,0,0.4)]" />
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white">انتهى الوقت! ⏱️</h3>
          <p className="text-xs text-zinc-400 font-semibold">
            جاوبت <span className="text-emerald-400 font-black">{correctCount}</span> اختبار صح • سكورك:{' '}
            <span className="text-brand-orange font-black font-mono">{score}</span> • أفضل رقم:{' '}
            <span className="text-brand-amber font-black font-mono">{bestScore}</span>
          </p>
        </div>

        {correctCount >= 5 ? (
          gamePlaySuccess ? (
            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
              {gamePlaySuccess}
            </div>
          ) : gamePlayError ? (
            <div className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl">
              {gamePlayError}
            </div>
          ) : (
            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
              عاش! حققت {correctCount} اختبارات صح وكسبت +{xpReward} XP.
            </div>
          )
        ) : (
          <div className="text-xs font-bold text-zinc-400 bg-zinc-800/70 border border-zinc-700 px-4 py-2.5 rounded-xl">
            محتاج تجاوب 5 اختبارات صح على الأقل عشان تاخد الـ XP!
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3 px-6 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>جولة جديدة</span>
        </button>
      </m.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black font-mono ${
            timeLeft <= 10
              ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse'
              : 'bg-zinc-900 border-zinc-800 text-white'
          }`}>
            <Timer className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </span>

          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/35 text-violet-300 text-xs font-black">
            <Flame className="w-3.5 h-3.5" />
            <span>Combo x{combo}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-black text-emerald-400 tabular-nums">
            ✓ {correctCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-brand-orange/15 border border-brand-orange/35 text-xs font-black text-brand-orange font-mono tabular-nums">
            {score} pts
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-amber-500' : 'bg-violet-500'
          }`}
          style={{ width: `${Math.min(100, (timeLeft / 60) * 100)}%` }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <m.div
          key={qIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 space-y-4"
        >
          <span className="inline-block px-2.5 py-0.5 rounded-md text-2xs font-black bg-violet-500/15 text-violet-300 border border-violet-500/25">
            {current.region}
          </span>
          <p className="text-sm md:text-base font-black text-white leading-relaxed">
            {current.prompt}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {current.options.map((opt) => {
              const isSelected = feedback?.selected === opt;
              const isCorrectOpt = opt === current.correct;

              let cls =
                'bg-zinc-950/80 border-zinc-800 text-zinc-200 hover:border-violet-400/60 hover:bg-zinc-900 cursor-pointer';
              if (feedback) {
                if (isCorrectOpt) {
                  cls = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300';
                } else if (isSelected) {
                  cls = 'bg-red-500/15 border-red-500/60 text-red-300';
                } else {
                  cls = 'bg-zinc-950/40 border-zinc-800/50 text-zinc-500 opacity-60';
                }
              }

              return (
                <m.button
                  key={opt}
                  type="button"
                  dir="ltr"
                  whileTap={feedback ? undefined : { scale: 0.97 }}
                  disabled={!!feedback}
                  onClick={() => handlePick(opt)}
                  className={`p-3.5 rounded-xl border text-left text-xs font-extrabold transition-all flex items-center justify-between gap-2 ${cls}`}
                >
                  <span>{opt}</span>
                  {feedback && isCorrectOpt && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {feedback && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                </m.button>
              );
            })}
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  );
};
