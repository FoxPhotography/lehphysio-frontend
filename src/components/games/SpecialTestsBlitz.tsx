import React, { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Flame, CheckCircle, XCircle, Play } from 'lucide-react';
import { playChatSound } from '../../utils/helpers';
import { fireStreakBurst } from '../../utils/confetti';
import { GameResultScreen } from './ui/GameResultScreen';
import { haptic } from './ui/feedback';

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

  // Additional 35 High-Yield OSCE Tests across all regions
  { prompt: 'سحب الرأس لأعلى برفق والمريض مستلقي لتخفيف الضغط على جذور أعصاب الرقبة', region: 'Cervical', correct: 'Cervical Distraction Test' },
  { prompt: 'ثني الرقبة للأمام وظهور صدمة كهربائية نازلة في العمود الفقري (MS / Myelopathy)', region: 'Cervical / Neuro', correct: "Lhermitte's Sign" },
  { prompt: 'ثني العقلة الطرفية للوسطى ونقرها — انثناء الإبهام والسبابة يكشف إصابة UMN عنقية', region: 'Cervical / Neuro', correct: "Hoffmann's Sign" },
  { prompt: 'اختبار أمان الشريان الفقري بعمل Extension + Rotation للرقبة 30 ثانية قبل الـ Manipulation', region: 'Cervical / Vascular', correct: 'Vertebral Artery (VBI) Test' },
  { prompt: 'شد الرأس للأمام والورك مثني لقياس تيبس الفقرات القطنية في Ankylosing Spondylitis', region: 'Spine', correct: "Schober's Test" },
  { prompt: 'الوقوف على رجل واحدة وعمل Lumbar Extension للخلف لاكتشاف Spondylolisthesis', region: 'Spine', correct: 'Stork Standing Test' },
  { prompt: 'رفع الرجل السليمة والمريض مستلقي — ظهور ألم في الرجل المصابة يدل على Large Disc Herniation', region: 'Spine / Neuro', correct: 'Crossed Straight Leg Raise' },
  { prompt: 'المريض جالس والظهر ممدود، ثني الصدر والأطراف السفلية للبحث عن ألم الجذر العصبي', region: 'Spine / Neuro', correct: 'Bragard’s Sign' },
  { prompt: 'النوم على طرف السرير مع ترك رجل تنزل لأسفل والأخرى مضمومة للصدر لفحص مفصل SIJ', region: 'Hip / SIJ', correct: "Gaenslen's Test" },
  { prompt: 'ثني الورك والركبة 90° ودفع عظمة الفخذ عمودياً للخلف نحو السرير لاستفزاز SIJ', region: 'Hip / SIJ', correct: 'Thigh Thrust (POSH) Test' },
  { prompt: 'الضغط على حافتي الحوض للداخل والمريض نائم على جنبه لتقييم مفصل SIJ', region: 'Hip / SIJ', correct: 'SIJ Compression Test' },
  { prompt: 'دفع الحوض للخارج والأسفل عند ASIS والمريض على ظهره لتقييم أربطة SIJ الأمامية', region: 'Hip / SIJ', correct: 'SIJ Distraction (Gapping) Test' },
  { prompt: 'ثني الورك 90° مع Adduction و Internal Rotation لإحداث قرصة أمامية في مفصل الحوض (FAI)', region: 'Hip', correct: 'FADIR Test' },
  { prompt: 'ثني الورك والركبة مع Adduction و Internal Rotation لشد عضلة Piriformis على العصب الوركي', region: 'Hip / Neuro', correct: 'FAIR Test' },
  { prompt: 'مراقبة نزول الحوض للجهة المعاكسة عند الوقوف على رجل واحدة لكشف ضعف Gluteus Medius', region: 'Hip / Gait', correct: 'Trendelenburg Test' },
  { prompt: 'قياس الزاوية بين اتجاه الفخذ واتجاه الساق لتقدير زاوية دوران عنق الفخذ (Anteversion)', region: 'Hip', correct: "Craig's Test" },
  { prompt: 'المريض مستلقي على ظهره — ثني الركبة 90° وقياس قِصَر عضلة Rectus Femoris عند نزول الساق', region: 'Hip / Knee', correct: "Ely's Test" },
  { prompt: 'دفع الكعب للخارج أثناء ثني الركبة مع لمس جانب الصابونة لكشف ميلها للخلع (Patellar Instability)', region: 'Knee', correct: 'Patellar Apprehension Test' },
  { prompt: 'المريض جالس والركبة متنية 30° — سحب القصبة للأمام مع دوران للخارج للكشف عن PCL/Posterolateral', region: 'Knee', correct: 'Dial Test (Posterolateral)' },
  { prompt: 'مسك الكعب وسحب عظمة الـ Talus للأمام والقدم مثنية قليلاً للأسفل لاختبار رباط ATFL بالكاحل', region: 'Ankle', correct: 'Anterior Drawer Test (Ankle)' },
  { prompt: 'تدوير الكعب للداخل (Inversion) والقدم في الوضع المحايد لاختبار رباط CFL بالكاحل', region: 'Ankle', correct: 'Talar Tilt Test' },
  { prompt: 'الضغط على عظمتي القصبة والشظية معاً في منتصف الساق لكشف High Ankle Sprain (Syndesmosis)', region: 'Ankle', correct: 'Squeeze Test (Syndesmosis)' },
  { prompt: 'تدوير القدم للخارج (External Rotation) والركبة مثنية 90° لاستفزاز أربطة الـ Syndesmosis', region: 'Ankle', correct: 'Kleiger’s (External Rotation) Test' },
  { prompt: 'رفع إصبع القدم الكبير لأعلى (Dorsiflexion) لتوتير اللفافة الأخمصية وإثارة ألم الكعب', region: 'Foot', correct: 'Windlass Test' },
  { prompt: 'عصر مشط القدم عرضياً من الجانبين لإحداث طقطقة مؤلمة بين الأصابع (Morton’s Neuroma)', region: 'Foot', correct: "Mulder's Squeeze Test" },
  { prompt: 'مسك الكعبين والمريض واقف — انحراف الكعب للداخل يكشف وجود قوس قدم طبيعي مرن', region: 'Foot', correct: 'Too Many Toes / Feiss Line' },
  { prompt: 'ثني الذراعين للداخل على الحيط (Wall Push-Up) لملاحظة بروز لوح الكتف (Long Thoracic Nerve)', region: 'Shoulder / Scapula', correct: 'Wall Push-Up Test' },
  { prompt: 'تحريك عظمة الترقوة عند AC Joint أو الضغط عليها لأسفل بعد خلع المفصل (Piano Key Sign)', region: 'Shoulder', correct: 'AC Shear / Piano Key Test' },
  { prompt: 'دفع رأس العضد للأمام والخلف بإمساكه في الـ Glenoid لتقييم مدى ارتخاء الكتف (Load & Shift)', region: 'Shoulder', correct: 'Load and Shift Test' },
  { prompt: 'ثني الكوع لأقصى مدى لمدة 60 ثانية لاستفزاز تنميل العصب الزندي في الخنصر والبنصر', region: 'Elbow / Nerve', correct: 'Elbow Flexion Test' },
  { prompt: 'دفع الساعد للخارج والداخل والكوع مثني 20° لاختبار أربطة الكوع الجانبية (UCL / RCL)', region: 'Elbow', correct: 'Valgus/Varus Stress (Elbow)' },
  { prompt: 'وضع ظهر الكفين على الترابيزة أو فرد الصوابع لتحديد انكماش الـ Palmar Fascia (Dupuytren)', region: 'Hand', correct: 'Tabletop (Hueston) Test' },
  { prompt: 'الوقوف بقدمين مضمومتين وإغلاق العينين 30 ثانية لتقييم التوازن الحسي العميق (Dorsal Column)', region: 'Neurology', correct: 'Romberg Test' },
  { prompt: 'خدش باطن القدم من الكعب للخارج ثم للداخل — فرد الصباع الكبير لأعلى يدل على إصابة UMN', region: 'Neurology', correct: 'Babinski Sign (Plantar Reflex)' },
  { prompt: 'الاستلقاء السريع للخلف والرأس مدورة 45° ومائلة للأسفل 20° لإثارة النيستجمس في BPPV', region: 'Vestibular', correct: 'Dix-Hallpike Maneuver' },
];

const ALL_TEST_NAMES = TEST_POOL.map((t) => t.correct);

function buildDeck(): BlitzQuestion[] {
  let seenPrompts: string[] = [];
  try {
    const raw = sessionStorage.getItem('pt_blitz_seen');
    if (raw) seenPrompts = JSON.parse(raw);
  } catch {
    seenPrompts = [];
  }

  let unseen = TEST_POOL.filter((t) => !seenPrompts.includes(t.correct));
  if (unseen.length < 15) {
    seenPrompts = [];
    unseen = [...TEST_POOL];
  }

  const ordered = [
    ...unseen.sort(() => Math.random() - 0.5),
    ...TEST_POOL.filter((t) => seenPrompts.includes(t.correct)).sort(() => Math.random() - 0.5),
  ];

  try {
    const nextSeen = [...seenPrompts, ...unseen.slice(0, 15).map((t) => t.correct)];
    sessionStorage.setItem('pt_blitz_seen', JSON.stringify(nextSeen));
  } catch {
    // Ignore storage errors
  }

  return ordered.map((item) => {
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
      haptic('success');

      if (nextConsec % 3 === 0) {
        setTimeLeft((t) => Math.min(75, t + 4));
        fireStreakBurst();
      }
    } else {
      setConsecutive(0);
      setCombo(1);
      playChatSound('error');
      haptic('error');
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
      <GameResultScreen
        status={correctCount >= 5 ? 'won' : 'lost'}
        accent="violet"
        title="انتهى الوقت! ⏱️"
        subtitle={`جاوبت ${correctCount} اختبار صح`}
        xp={correctCount >= 5 ? xpReward : 0}
        stats={[
          { label: 'الاختبارات الصح', value: String(correctCount) },
          { label: 'السكور', value: String(score) },
          { label: 'أفضل رقم', value: String(bestScore) },
        ]}
        successMsg={correctCount >= 5 ? gamePlaySuccess || undefined : undefined}
        errorMsg={
          correctCount >= 5
            ? gamePlayError || undefined
            : 'محتاج تجاوب 5 اختبارات صح على الأقل عشان تاخد الـ XP!'
        }
        onReplay={handleStart}
        replayLabel="جولة جديدة"
      />
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
                  cls = `bg-emerald-500/15 border-emerald-500/60 text-emerald-300 ${isSelected ? 'lp-correct' : ''}`;
                } else if (isSelected) {
                  cls = 'lp-wrong bg-red-500/15 border-red-500/60 text-red-300';
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
