import React, { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, Zap, RotateCcw, Stethoscope, AlertCircle } from 'lucide-react';
import { fireWinConfetti } from '../../utils/confetti';
import { playChatSound } from '../../utils/helpers';

interface KinesiologyCase {
  id: string;
  movement: string;
  arHint: string;
  muscle: string;
  muscleDistractors: string[];
  nerve: string;
  nerveDistractors: string[];
  origin: string;
  originDistractors: string[];
  insertion: string;
  insertionDistractors: string[];
}

const CASES_BANK: KinesiologyCase[] = [
  {
    id: 'deltoid',
    movement: 'Shoulder Abduction (15°–90°)',
    arHint: 'رفع الذراع جانبياً بعد أول 15 درجة',
    muscle: 'Middle Deltoid',
    muscleDistractors: ['Supraspinatus', 'Pectoralis Major', 'Latissimus Dorsi'],
    nerve: 'Axillary Nerve (C5–C6)',
    nerveDistractors: ['Radial Nerve (C5–T1)', 'Suprascapular Nerve (C5–C6)'],
    origin: 'Acromion Process of Scapula',
    originDistractors: ['Supraspinous Fossa', 'Coracoid Process'],
    insertion: 'Deltoid Tuberosity of Humerus',
    insertionDistractors: ['Greater Tubercle of Humerus', 'Bicipital Groove'],
  },
  {
    id: 'biceps',
    movement: 'Elbow Flexion + Forearm Supination',
    arHint: 'ثني الكوع مع لف الساعد للخارج (Supination)',
    muscle: 'Biceps Brachii',
    muscleDistractors: ['Brachialis', 'Brachioradialis', 'Pronator Teres'],
    nerve: 'Musculocutaneous Nerve (C5–C6)',
    nerveDistractors: ['Median Nerve (C6–T1)', 'Radial Nerve (C5–T1)'],
    origin: 'Supraglenoid Tubercle & Coracoid Process',
    originDistractors: ['Infraglenoid Tubercle', 'Lateral Epicondyle'],
    insertion: 'Radial Tuberosity & Bicipital Aponeurosis',
    insertionDistractors: ['Coronoid Process of Ulna', 'Olecranon Process'],
  },
  {
    id: 'quads',
    movement: 'Knee Extension (Terminal & Full)',
    arHint: 'فرد مفصل الركبة بالكامل',
    muscle: 'Quadriceps Femoris',
    muscleDistractors: ['Hamstrings', 'Sartorius', 'Gastrocnemius'],
    nerve: 'Femoral Nerve (L2–L4)',
    nerveDistractors: ['Sciatic Nerve (L4–S3)', 'Obturator Nerve (L2–L4)'],
    origin: 'AIIS & Anterior/Lateral Femur',
    originDistractors: ['Ischial Tuberosity', 'ASIS'],
    insertion: 'Tibial Tuberosity (via Patellar Ligament)',
    insertionDistractors: ['Head of Fibula', 'Medial Condyle of Tibia'],
  },
  {
    id: 'tibialis_ant',
    movement: 'Ankle Dorsiflexion & Foot Inversion',
    arHint: 'رفع مشط القدم لفوق مع لفه للداخل',
    muscle: 'Tibialis Anterior',
    muscleDistractors: ['Gastrocnemius', 'Peroneus Longus', 'Tibialis Posterior'],
    nerve: 'Deep Peroneal Nerve (L4–L5)',
    nerveDistractors: ['Tibial Nerve (S1–S2)', 'Superficial Peroneal Nerve'],
    origin: 'Lateral Condyle & Proximal Lateral Tibia',
    originDistractors: ['Posterior Fibula', 'Medial Femoral Condyle'],
    insertion: 'Medial Cuneiform & 1st Metatarsal Base',
    insertionDistractors: ['Calcaneal Tuberosity', '5th Metatarsal Base'],
  },
  {
    id: 'serratus',
    movement: 'Scapular Protraction & Upward Rotation',
    arHint: 'دفع لوح الكتف للأمام وتثبيته (Punching Muscle)',
    muscle: 'Serratus Anterior',
    muscleDistractors: ['Rhomboids', 'Middle Trapezius', 'Levator Scapulae'],
    nerve: 'Long Thoracic Nerve (C5–C7)',
    nerveDistractors: ['Spinal Accessory Nerve (CN XI)', 'Dorsal Scapular Nerve'],
    origin: 'Outer Surfaces of Ribs 1–8',
    originDistractors: ['Spinous Processes T2–T5', 'Transverse Processes C1–C4'],
    insertion: 'Medial Border of Scapula (Anterior)',
    insertionDistractors: ['Spine of Scapula', 'Lesser Tubercle of Humerus'],
  },
  {
    id: 'glute_med',
    movement: 'Hip Abduction & Pelvic Stabilization',
    arHint: 'إبعاد الفخذ جانبياً ومنع سقوط الحوض أثناء المشي',
    muscle: 'Gluteus Medius',
    muscleDistractors: ['Gluteus Maximus', 'Adductor Longus', 'Iliopsoas'],
    nerve: 'Superior Gluteal Nerve (L4–S1)',
    nerveDistractors: ['Inferior Gluteal Nerve (L5–S2)', 'Femoral Nerve (L2–L4)'],
    origin: 'External Ilium (between Ant. & Post. Gluteal Lines)',
    originDistractors: ['Posterior Sacrum & Coccyx', 'Inferior Pubic Ramus'],
    insertion: 'Greater Trochanter of Femur',
    insertionDistractors: ['Lesser Trochanter of Femur', 'Linea Aspera'],
  },
  {
    id: 'opponens',
    movement: 'Thumb Opposition (Pinch Grip)',
    arHint: 'تقريب الإبهام لباقي الأصابع للقبض الدقيق',
    muscle: 'Opponens Pollicis',
    muscleDistractors: ['Adductor Pollicis', 'Extensor Pollicis Longus', 'Flexor Carpi Ulnaris'],
    nerve: 'Recurrent Branch of Median Nerve',
    nerveDistractors: ['Deep Branch of Ulnar Nerve', 'Posterior Interosseous Nerve'],
    origin: 'Flexor Retinaculum & Trapezium',
    originDistractors: ['Pisiform & Hamate', '3rd Metacarpal Shaft'],
    insertion: 'Lateral Border of 1st Metacarpal',
    insertionDistractors: ['Base of Proximal Phalanx', 'Distal Phalanx of Thumb'],
  },
  {
    id: 'iliopsoas',
    movement: 'Powerful Hip Flexion (Above 90°)',
    arHint: 'ثني مفصل الفخذ بقوة ورفع الركبة للصدر',
    muscle: 'Iliopsoas',
    muscleDistractors: ['Gluteus Maximus', 'Biceps Femoris', 'Piriformis'],
    nerve: 'Femoral Nerve & L1–L3 Anterior Rami',
    nerveDistractors: ['Obturator Nerve', 'Superior Gluteal Nerve'],
    origin: 'T12–L5 Vertebrae & Iliac Fossa',
    originDistractors: ['Ischial Tuberosity', 'Anterior Sacral Surface'],
    insertion: 'Lesser Trochanter of Femur',
    insertionDistractors: ['Greater Trochanter of Femur', 'Gluteal Tuberosity'],
  },
];

function shuffleArr<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface WhosResponsibleGameProps {
  onBack: () => void;
  onWin: () => void;
  dailyPlaysCount: number;
  maxDailyPlays?: number;
  xpReward?: number;
}

const ROUNDS_PER_SESSION = 3;

export const WhosResponsibleGame: React.FC<WhosResponsibleGameProps> = ({
  onBack,
  onWin,
  dailyPlaysCount,
  maxDailyPlays = 3,
  xpReward = 150,
}) => {
  const [sessionSeed, setSessionSeed] = useState(0);
  const cases = useMemo(() => shuffleArr(CASES_BANK).slice(0, ROUNDS_PER_SESSION), [sessionSeed]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const [wrongMsg, setWrongMsg] = useState('');
  const [selectedNerve, setSelectedNerve] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedInsertion, setSelectedInsertion] = useState<string | null>(null);
  const [roundCleared, setRoundCleared] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = cases[roundIdx];

  const muscleOptions = useMemo(
    () => shuffleArr([current.muscle, ...current.muscleDistractors]),
    [current]
  );
  const nerveOptions = useMemo(
    () => shuffleArr([current.nerve, ...current.nerveDistractors]),
    [current]
  );
  const originOptions = useMemo(
    () => shuffleArr([current.origin, ...current.originDistractors]),
    [current]
  );
  const insertionOptions = useMemo(
    () => shuffleArr([current.insertion, ...current.insertionDistractors]),
    [current]
  );

  const handlePickMuscle = (mName: string) => {
    if (mName === current.muscle) {
      playChatSound('success');
      setWrongMsg('');
      setStep(2);
    } else {
      playChatSound('error');
      setWrongMsg(`مش ${mName} — ركز في الحركة وجرب تاني!`);
    }
  };

  const checkPhase2Complete = (n: string | null, o: string | null, i: string | null) => {
    if (n === current.nerve && o === current.origin && i === current.insertion) {
      playChatSound('success');
      setRoundCleared(true);
      if (roundIdx + 1 >= ROUNDS_PER_SESSION) {
        setFinished(true);
        fireWinConfetti();
        onWin();
      }
    }
  };

  const handleNextRound = () => {
    setRoundIdx((r) => r + 1);
    setStep(1);
    setWrongMsg('');
    setSelectedNerve(null);
    setSelectedOrigin(null);
    setSelectedInsertion(null);
    setRoundCleared(false);
  };

  const handleRestart = () => {
    setSessionSeed((s) => s + 1);
    setRoundIdx(0);
    setStep(1);
    setWrongMsg('');
    setSelectedNerve(null);
    setSelectedOrigin(null);
    setSelectedInsertion(null);
    setRoundCleared(false);
    setFinished(false);
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

        <span className="text-2xs font-black px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 tabular-nums">
          محاولات XP: {remainingXpPlays}/{maxDailyPlays}
        </span>
      </div>

      <div className="glass-card p-4 sm:p-6 border border-emerald-500/25 relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white">مين المسؤول؟ Who&apos;s Responsible?</h2>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-emerald-300">
            حالة {roundIdx + 1} / {ROUNDS_PER_SESSION}
          </span>
        </div>

        {/* Movement Prompt */}
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 mb-5 text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block mb-1">
            الحركة المطلوبة
          </span>
          <h3 className="text-base sm:text-lg font-black text-white" dir="ltr">
            {current.movement}
          </h3>
          <p className="text-xs font-bold text-zinc-300 mt-1">{current.arHint}</p>
        </div>

        {wrongMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{wrongMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <m.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-xs font-black text-zinc-300">1️⃣ اختار العضلة المسؤولة (Prime Mover):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" dir="ltr">
                {muscleOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handlePickMuscle(opt)}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:border-emerald-400/50 hover:bg-emerald-500/10 text-white font-black text-xs text-center cursor-pointer transition-all active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </m.div>
          ) : (
            <m.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                <span className="text-[11px] font-bold text-emerald-300 block">العضلة المختارة ✓</span>
                <span className="text-sm font-black text-white" dir="ltr">{current.muscle}</span>
              </div>

              {/* Nerve */}
              <div className="space-y-2">
                <p className="text-xs font-black text-zinc-300">⚡ الـ Nerve Supply:</p>
                <div className="grid grid-cols-1 gap-2" dir="ltr">
                  {nerveOptions.map((opt) => {
                    const isPicked = selectedNerve === opt;
                    const isRight = opt === current.nerve;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={selectedNerve === current.nerve}
                        onClick={() => {
                          setSelectedNerve(opt);
                          if (isRight) {
                            setWrongMsg('');
                            checkPhase2Complete(opt, selectedOrigin, selectedInsertion);
                          } else {
                            playChatSound('error');
                            setWrongMsg('تأكد من العصب المغذي للعضلة!');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-start cursor-pointer transition-all ${
                          isPicked && isRight
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : isPicked && !isRight
                              ? 'bg-red-500/15 border-red-500/50 text-red-300'
                              : 'bg-zinc-900/70 border-zinc-800 text-zinc-200 hover:border-zinc-600'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Origin */}
              <div className="space-y-2">
                <p className="text-xs font-black text-zinc-300">📍 الـ Origin:</p>
                <div className="grid grid-cols-1 gap-2" dir="ltr">
                  {originOptions.map((opt) => {
                    const isPicked = selectedOrigin === opt;
                    const isRight = opt === current.origin;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={selectedOrigin === current.origin}
                        onClick={() => {
                          setSelectedOrigin(opt);
                          if (isRight) {
                            setWrongMsg('');
                            checkPhase2Complete(selectedNerve, opt, selectedInsertion);
                          } else {
                            playChatSound('error');
                            setWrongMsg('الـ Origin مش مظبوط، جرب اختيار تاني!');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-start cursor-pointer transition-all ${
                          isPicked && isRight
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : isPicked && !isRight
                              ? 'bg-red-500/15 border-red-500/50 text-red-300'
                              : 'bg-zinc-900/70 border-zinc-800 text-zinc-200 hover:border-zinc-600'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Insertion */}
              <div className="space-y-2">
                <p className="text-xs font-black text-zinc-300">🎯 الـ Insertion:</p>
                <div className="grid grid-cols-1 gap-2" dir="ltr">
                  {insertionOptions.map((opt) => {
                    const isPicked = selectedInsertion === opt;
                    const isRight = opt === current.insertion;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={selectedInsertion === current.insertion}
                        onClick={() => {
                          setSelectedInsertion(opt);
                          if (isRight) {
                            setWrongMsg('');
                            checkPhase2Complete(selectedNerve, selectedOrigin, opt);
                          } else {
                            playChatSound('error');
                            setWrongMsg('الـ Insertion مش مظبوط، راجع مكان الارتكاز!');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-start cursor-pointer transition-all ${
                          isPicked && isRight
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : isPicked && !isRight
                              ? 'bg-red-500/15 border-red-500/50 text-red-300'
                              : 'bg-zinc-900/70 border-zinc-800 text-zinc-200 hover:border-zinc-600'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {roundCleared && !finished && (
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs py-3 rounded-xl cursor-pointer hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>الحالة اللي بعدها</span>
                </button>
              )}

              {finished && (
                <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>ممتاز! ربطت الحركة بالعضلة والعصب صح 💪</span>
                    </span>
                    {remainingXpPlays > 0 && (
                      <span className="text-xs font-black text-brand-amber flex items-center gap-1" dir="ltr">
                        <Zap className="w-3.5 h-3.5 fill-current" />+{xpReward} XP
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer hover:bg-zinc-800 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>العب حالات جديدة</span>
                  </button>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
