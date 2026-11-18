import React, { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  Lightbulb,
  CheckCircle,
  XCircle,
  Trophy,
  Flame,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { playChatSound } from '../../utils/helpers';
import { fireWinConfetti, fireStreakBurst } from '../../utils/confetti';

interface ClinicalDetectiveGameProps {
  onClaimXp: () => void;
  xpReward: number;
  gamePlaySuccess?: string;
  gamePlayError?: string;
}

interface ClinicalCase {
  id: number;
  title: string;
  specialty: string;
  isRedFlag?: boolean;
  clues: string[];
  options: string[];
  correctIndex: number;
  pearl: string;
}

const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: 1,
    title: 'ألم الكتف عند الرفع',
    specialty: 'Orthopedics',
    clues: [
      'مريض 34 سنة بيلعب سباحة بيشتكي من ألم حاد في جانب الكتف لما يرفع دراعه للجنب.',
      'الألم بيزيد بوضوح في قوس الحركة بين 60° و 120° (Painful Arc Sign).',
      'اختبار Neer واختبار Hawkins-Kennedy طلعوا إيجابيين.',
      'يوجد ضعف وألم في اختبار Empty Can (Jobe Test) لعزل وتر الـ Supraspinatus.',
    ],
    options: [
      'Subacromial Impingement (Supraspinatus Tendinopathy)',
      'Frozen Shoulder (Adhesive Capsulitis)',
      'Bankart Lesion (Anterior Instability)',
      'Acromioclavicular Joint Separation',
    ],
    correctIndex: 0,
    pearl: 'الـ Painful Arc (60°–120°) مع إيجابية Neer و Hawkins-Kennedy و Empty Can علامات كلاسيكية لـ Subacromial Impingement.',
  },
  {
    id: 2,
    title: 'تنميل الإيد بالليل',
    specialty: 'Peripheral Nerve',
    clues: [
      'سكرتيرة بتشتكي من تنميل وحرقان في كف الإيد بيصحيها من النوم وبتهز إيديها عشان يفك.',
      'التنميل متركز في الإبهام والسبابة والوسطى ونص البنصر بس، ومنطقة الـ Thenar فيها ضعف بسيط.',
      'ثني الرسغ لأقصى مدى لمدة 60 ثانية (Phalen’s Test) زود الأعراض فوراً.',
      'الخبط على عصب الرسغ (Tinel’s Sign) عمل كهرباء في الصوابع التلاتة الأولى.',
    ],
    options: [
      'Cubital Tunnel Syndrome (Ulnar Nerve)',
      'Carpal Tunnel Syndrome (Median Nerve)',
      'Guyon’s Canal Syndrome',
      'C6 Cervical Radiculopathy',
    ],
    correctIndex: 1,
    pearl: 'اختلال الإحساس في أول 3 صوابع ونص مع إيجابية Phalen و Tinel عند الرسغ يأكد ضغط الـ Median Nerve جوه الـ Carpal Tunnel.',
  },
  {
    id: 3,
    title: 'طقطقة الركبة في الملعب',
    specialty: 'Sports Rehab',
    clues: [
      'لاعب كورة لف جسمه فجأة ورجله ثابتة على الأرض وسمع صوت "طقطقة" (Pop) قوية.',
      'الركبة ورمت بسرعة جداً خلال أقل من ساعتين (Rapid Hemarthrosis).',
      'في الفحص: القصبة بتتحرك لقدام بزيادة مقارنة بالرجل التانية مع إحساس Soft End-feel.',
      'اختبار Lachman عند ثني 20°-30° واختبار Anterior Drawer طلعوا إيجابيين.',
    ],
    options: [
      'Posterior Cruciate Ligament (PCL) Tear',
      'Medial Meniscus Bucket-Handle Tear',
      'Anterior Cruciate Ligament (ACL) Tear',
      'Medial Collateral Ligament (MCL) Sprain',
    ],
    correctIndex: 2,
    pearl: 'إصابة Non-contact Pivot + صوت Pop + تورم سريع خلال ساعتين + Lachman إيجابي = قطع في الرباط الصليبي الأمامي (ACL).',
  },
  {
    id: 4,
    title: 'عرق النسا والقدم الساقطة',
    specialty: 'Spine & Neuro',
    clues: [
      'شاب شال حاجة تقيلة بضهر منحني، وحس بألم كهربا نازل من أسفل الضهر لحد وش الرجل.',
      'الألم بيزيد مع الكحة والعطس والجلوس لفترات طويلة.',
      'اختبار Straight Leg Raise (SLR) جاب ألم مسمّع في الرجل عند زاوية 40°.',
      'في اختبار العضلات لقينا ضعف واضح في رفع الصباع الكبير (Extensor Hallucis Longus).',
    ],
    options: [
      'Lumbar Disc Herniation (L4-L5)',
      'Piriformis Syndrome',
      'Sacroiliac Joint Dysfunction',
      'Lumbar Spinal Stenosis',
    ],
    correctIndex: 0,
    pearl: 'ضعف الـ Extensor Hallucis Longus (L5 Myotome) مع إيجابية SLR عند 40° يدل على انزلاق غضروفي ضاغط على جذر L5 (غالباً L4-L5).',
  },
  {
    id: 5,
    title: 'وجع الكوع مع الشيل',
    specialty: 'Orthopedics',
    clues: [
      'مريض بيشتكي من ألم في الناحية الخارجية للكوع لما يشيل كوباية أو يسلم على حد.',
      'يوجد ألم موضعي شديد عند الضغط على الـ Lateral Epicondyle.',
      'فرد الرسغ ضد مقاومة (Cozen’s Test) زوّد نفس الألم عند الكوع.',
      'ثني الرسغ والساعد مفرود (Mill’s Test) عمل شد مؤلم على وتر عضلة ECRB.',
    ],
    options: [
      'Medial Epicondylitis (Golfer’s Elbow)',
      'Lateral Epicondylitis (Tennis Elbow)',
      'Radial Tunnel Syndrome',
      'Olecranon Bursitis',
    ],
    correctIndex: 1,
    pearl: 'إيجابية Cozen’s و Mill’s Tests مع ألم على الـ Lateral Epicondyle هي الصورة الكلاسيكية لـ Tennis Elbow (التهاب وتر ECRB).',
  },
  {
    id: 6,
    title: 'حالة طوارئ أسفل الضهر',
    specialty: 'Red Flag 🚨',
    isRedFlag: true,
    clues: [
      'مريض ضهر عنده عرق نسا في الرجلين الاتنين مع تنميل متزايد بسرعة.',
      'المريض بيقول إنه مش حاسس بمنطقة الجلوس (Saddle Anesthesia).',
      'بدأ يحصل احتباس مفاجئ في البول وصعوبة في التحكم في الإخراج.',
      'ممنوع تماماً الجلسات أو المانيوال ثيرابي — محتاج تحويل طوارئ جراحي فوراً!',
    ],
    options: [
      'Lumbar Facet Joint Syndrome',
      'Cauda Equina Syndrome (Red Flag 🚨)',
      'Ankylosing Spondylitis',
      'Sciatic Nerve Entrapment at Knee',
    ],
    correctIndex: 1,
    pearl: '🚨 علامة خطر قصوى: Saddle Anesthesia + احتباس بول + أعراض ثنائية = Cauda Equina Syndrome، وتستدعي تحويل جراحي طارئ خلال ساعات.',
  },
  {
    id: 7,
    title: 'ألم الكعب الصباحي',
    specialty: 'Foot & Ankle',
    clues: [
      'موظفة بتشتكي من وجع زي المسمار في كعب رجلها أول ما تحط رجلها على الأرض الصبح.',
      'الألم بيخف شوية بعد المشي لـ 10 دقايق، لكن بيرجع يزيد آخر اليوم.',
      'الضغط على الـ Medial Calcaneal Tubercle مؤلم جداً.',
      'رفع صوابع الرجل لفوق (Windlass Test) بيكرر نفس الألم في باطن القدم.',
    ],
    options: [
      'Achilles Tendinopathy',
      'Tarsal Tunnel Syndrome',
      'Plantar Fasciitis',
      'Calcaneal Stress Fracture',
    ],
    correctIndex: 2,
    pearl: 'ألم أول خطوة الصبح + ألم عند الـ Medial Calcaneal Tubercle + Windlass Test إيجابي = التهاب اللفافة الأخمصية (Plantar Fasciitis).',
  },
  {
    id: 8,
    title: 'شلل نصفي مفاجئ في الوش',
    specialty: 'Neurology',
    clues: [
      'شاب صحي الصبح لقى نص وشه اليمين واقع ومش عارف يبتسم أو ينفخ خده.',
      'المريض مش قادر يقفل عينه اليمين ولما يحاول يقفلها النني بيطلع لفوق (Bell’s Phenomenon).',
      'تجاعيد الجبهة في الناحية المصابة اختفت تماماً (Forehead Involvement).',
      'القوة الحركية في الإيد والرجل طبيعية تماماً ومفيش أعراض جلطة مركزية.',
    ],
    options: [
      'Middle Cerebral Artery Stroke (UMN)',
      'Trigeminal Neuralgia (CN V)',
      'Bell’s Palsy (CN VII LMN Lesion)',
      'Myasthenia Gravis',
    ],
    correctIndex: 2,
    pearl: 'إصابة الجبهة كلها مع العين في نفس الجهة علامة حاسمة إن الإصابة Lower Motor Neuron للعصب السابع (Bell’s Palsy) مش جلطة دماغية (UMN).',
  },
  {
    id: 9,
    title: 'وجع الإبهام عند الأمهات الجداد',
    specialty: 'Hand & Wrist',
    clues: [
      'أم جديدة بتشتكي من ألم حاد في جانب الرسغ من ناحية الإبهام وهي بتشيل ابنها.',
      'يوجد تورم وألم عند الـ Radial Styloid Process.',
      'الشكوى بتتركز في أوتار عضلتي APL و EPB.',
      'المريضة بتقفل صوابعها على الإبهام وتثني الرسغ ناحية الصباع الصغير (Finkelstein’s Test) فبتحس بألم شديد.',
    ],
    options: [
      'De Quervain’s Tenosynovitis',
      'Scaphoid Bone Fracture',
      'Thumb CMC Osteoarthritis',
      'Intersection Syndrome',
    ],
    correctIndex: 0,
    pearl: 'اختبار Finkelstein’s Test الإيجابي مع ألم الـ Radial Styloid يشخص De Quervain’s Tenosynovitis في أوتار APL و EPB.',
  },
  {
    id: 10,
    title: 'التواء الكاحل الأشهر',
    specialty: 'Sports Rehab',
    clues: [
      'لاعبة باسكت نزلت على رجلها والتوت لجوه (Inversion + Plantarflexion).',
      'في تورم وكدمة واضحة قدام وتحت الـ Lateral Malleolus.',
      'أكتر رباط بيتصاب في الحركة دي هو الرباط الأمامي الوحشي للكاحل.',
      'اختبار Anterior Drawer للكاحل أظهر حركة زائدة للـ Talus لقدام.',
    ],
    options: [
      'Deltoid Ligament Sprain',
      'Syndesmotic (High) Ankle Sprain',
      'Lateral Ankle Sprain (ATFL Tear)',
      'Peroneal Tendon Dislocation',
    ],
    correctIndex: 2,
    pearl: 'الـ Inversion + Plantarflexion بيشد مباشرة على الـ Anterior Talofibular Ligament (ATFL)، وأكتر اختبار بيكشفه هو الـ Anterior Drawer للكاحل.',
  },
];

function pickSessionCases(): ClinicalCase[] {
  return [...CLINICAL_CASES].sort(() => Math.random() - 0.5).slice(0, 5);
}

export const ClinicalDetectiveGame: React.FC<ClinicalDetectiveGameProps> = ({
  onClaimXp,
  xpReward,
  gamePlaySuccess,
  gamePlayError,
}) => {
  const [cases, setCases] = useState<ClinicalCase[]>(() => pickSessionCases());
  const [caseIdx, setCaseIdx] = useState(0);
  const [revealedClues, setRevealedClues] = useState(1);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = cases[caseIdx];
  const potentialPts = Math.max(100, 500 - revealedClues * 100);
  const isAnswered = selectedOpt !== null;
  const isCorrect = selectedOpt === current?.correctIndex;

  const rankBadge = useMemo(() => {
    if (correctCount === 5 && score >= 1500) return { title: 'استشاري تشخيص 🏆', cls: 'text-amber-300 bg-amber-500/15 border-amber-400/40' };
    if (correctCount >= 3) return { title: 'أخصائي شاطر ⚡', cls: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40' };
    return { title: 'محتاج تدريب أكتر 📚', cls: 'text-zinc-300 bg-zinc-800 border-zinc-700' };
  }, [correctCount, score]);

  const handleRevealClue = () => {
    if (isAnswered || revealedClues >= 4) return;
    setRevealedClues((c) => c + 1);
    playChatSound('tick');
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);

    if (idx === current.correctIndex) {
      const nextStreak = streak + 1;
      const streakBonus = nextStreak >= 2 ? 50 : 0;
      setScore((s) => s + potentialPts + streakBonus);
      setCorrectCount((c) => c + 1);
      setStreak(nextStreak);
      playChatSound('success');
      if (nextStreak >= 2) fireStreakBurst();
    } else {
      setStreak(0);
      playChatSound('error');
    }
  };

  const handleNext = () => {
    if (caseIdx + 1 >= cases.length) {
      setFinished(true);
      if (correctCount >= 3) {
        playChatSound('win');
        fireWinConfetti();
        onClaimXp();
      }
      return;
    }
    setCaseIdx((i) => i + 1);
    setRevealedClues(1);
    setSelectedOpt(null);
  };

  const handleRestart = () => {
    setCases(pickSessionCases());
    setCaseIdx(0);
    setRevealedClues(1);
    setSelectedOpt(null);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-brand-orange/20 border border-emerald-500/30 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-brand-amber" />
        </div>
        <div className="space-y-1">
          <span className={`inline-block text-2xs font-black px-3 py-1 rounded-full border ${rankBadge.cls}`}>
            {rankBadge.title}
          </span>
          <h3 className="text-xl font-black text-white pt-1">خلصت الشيفت الإكلينيكي!</h3>
          <p className="text-xs text-zinc-400 font-semibold">
            شخّصت <span className="text-emerald-400 font-black">{correctCount}</span> من 5 حالات صح • مجموع النقاط:{' '}
            <span className="text-brand-orange font-black font-mono">{score}</span>
          </p>
        </div>

        {correctCount >= 3 ? (
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
              عاش! كسبت +{xpReward} XP لتشخيص 3 حالات أو أكتر صح.
            </div>
          )
        ) : (
          <div className="text-xs font-bold text-zinc-400 bg-zinc-800/70 border border-zinc-700 px-4 py-2.5 rounded-xl">
            شخّص 3 حالات صح على الأقل عشان تاخد مكافأة الـ XP!
          </div>
        )}

        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs py-3 px-6 rounded-xl cursor-pointer hover:shadow-orange-intense active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>حالات جديدة</span>
        </button>
      </m.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-400" />
            <span>شخّص الحالة (عيادة الطوارئ)</span>
          </h3>
          <p className="text-xs text-zinc-400 font-semibold">
            خمن التشخيص من أقل عدد دلائل عشان تاخد أعلى نقاط! (3 حالات صح على الأقل للـ XP)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-black text-zinc-300 tabular-nums">
            حالة {caseIdx + 1}/5
          </span>
          {streak >= 2 && (
            <m.span
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-1 rounded-xl bg-brand-orange/15 border border-brand-orange/40 text-xs font-black text-brand-orange flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>x{streak}</span>
            </m.span>
          )}
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-black text-emerald-400 font-mono tabular-nums">
            {score} pts
          </span>
        </div>
      </div>

      {/* Case Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-2xs font-black border ${
              current.isRedFlag
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            }`}>
              {current.specialty}
            </span>
            <h4 className="text-sm font-black text-white">{current.title}</h4>
          </div>
          <span className="text-2xs font-black text-brand-amber bg-brand-amber/10 border border-brand-amber/25 px-2.5 py-1 rounded-lg tabular-nums">
            قيمة الحالة: +{potentialPts} نقطة
          </span>
        </div>

        {/* Progressive Clues */}
        <div className="space-y-2">
          {current.clues.slice(0, revealedClues).map((clue, i) => (
            <m.div
              key={`${current.id}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 text-xs md:text-sm text-zinc-200 font-medium leading-relaxed"
            >
              <span className="w-5 h-5 rounded-md bg-brand-orange/15 text-brand-orange font-black text-2xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{clue}</span>
            </m.div>
          ))}
        </div>

        {!isAnswered && revealedClues < 4 && (
          <button
            type="button"
            onClick={handleRevealClue}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-amber hover:text-amber-300 bg-brand-amber/10 hover:bg-brand-amber/15 border border-brand-amber/25 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>اكشف تلميح إضافي (-100 نقطة)</span>
          </button>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {current.options.map((opt, i) => {
            const isThisCorrect = i === current.correctIndex;
            const isThisSelected = i === selectedOpt;

            let btnStyle =
              'bg-zinc-950/80 border-zinc-800 text-zinc-200 hover:border-brand-orange/50 hover:bg-zinc-900 cursor-pointer';
            if (isAnswered) {
              if (isThisCorrect) {
                btnStyle = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300';
              } else if (isThisSelected) {
                btnStyle = 'bg-red-500/15 border-red-500/60 text-red-300';
              } else {
                btnStyle = 'bg-zinc-950/40 border-zinc-800/50 text-zinc-500 opacity-60';
              }
            }

            return (
              <m.button
                key={i}
                type="button"
                dir="ltr"
                whileTap={isAnswered ? undefined : { scale: 0.98 }}
                disabled={isAnswered}
                onClick={() => handleSelectOption(i)}
                className={`p-3.5 rounded-xl border text-left text-xs font-extrabold transition-all flex items-center justify-between gap-2 ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isThisCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isAnswered && isThisSelected && !isThisCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              </m.button>
            );
          })}
        </div>

        {/* Clinical Pearl & Next Button */}
        <AnimatePresence>
          {isAnswered && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 border space-y-3 ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-start gap-2">
                {current.isRedFlag ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <Stethoscope className={`w-4 h-4 shrink-0 mt-0.5 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`} />
                )}
                <div className="space-y-1">
                  <p className={`text-xs font-black ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                    {isCorrect ? `تشخيص صح! (+${potentialPts} نقطة)` : 'تشخيص غير دقيق — اتعلّم المعلومة دي:'}
                  </p>
                  <p className="text-xs text-zinc-200 leading-relaxed">{current.pearl}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-orange-glow active:scale-[0.99] transition-all"
              >
                <span>{caseIdx + 1 >= cases.length ? 'عرض النتيجة النهائية' : 'الحالة التالية'}</span>
                <ArrowRight className="rtl:-scale-x-100 w-4 h-4" />
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
