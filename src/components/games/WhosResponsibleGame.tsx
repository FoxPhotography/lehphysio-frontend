import React, { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Stethoscope, AlertCircle } from 'lucide-react';
import { playSound } from '../../utils/soundEngine';
import { GameIntroScreen } from './ui/GameIntroScreen';
import { GameResultScreen } from './ui/GameResultScreen';
import { PracticeModeBanner } from './ui/PracticeModeBanner';
import { Mascot } from './ui/Mascot';
import { MuscleArt } from './ui/GameArt';
import { haptic } from './ui/feedback';

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
  {
    id: 'supraspinatus',
    movement: 'Initiation of Shoulder Abduction (0°–15°)',
    arHint: 'بداية رفع الذراع جانبياً في أول 15 درجة وتثبيت رأس العضد',
    muscle: 'Supraspinatus',
    muscleDistractors: ['Infraspinatus', 'Teres Minor', 'Middle Deltoid'],
    nerve: 'Suprascapular Nerve (C5–C6)',
    nerveDistractors: ['Axillary Nerve (C5–C6)', 'Subscapular Nerve'],
    origin: 'Supraspinous Fossa of Scapula',
    originDistractors: ['Infraspinous Fossa', 'Subscapular Fossa'],
    insertion: 'Superior Facet of Greater Tubercle',
    insertionDistractors: ['Lesser Tubercle of Humerus', 'Deltoid Tuberosity'],
  },
  {
    id: 'infraspinatus',
    movement: 'Shoulder External Rotation (with Arm at Side)',
    arHint: 'لف مفصل الكتف للخارج وتثبيت مفصل الكتف من الخلف',
    muscle: 'Infraspinatus',
    muscleDistractors: ['Subscapularis', 'Pectoralis Major', 'Latissimus Dorsi'],
    nerve: 'Suprascapular Nerve (C5–C6)',
    nerveDistractors: ['Axillary Nerve (C5–C6)', 'Thoracodorsal Nerve'],
    origin: 'Infraspinous Fossa of Scapula',
    originDistractors: ['Supraspinous Fossa', 'Lateral Border of Scapula'],
    insertion: 'Middle Facet of Greater Tubercle',
    insertionDistractors: ['Lesser Tubercle of Humerus', 'Intertubercular Groove'],
  },
  {
    id: 'subscapularis',
    movement: 'Shoulder Internal Rotation (Rotator Cuff)',
    arHint: 'لف مفصل الكتف للداخل (العضلة الأمامية في الكفة المدورة)',
    muscle: 'Subscapularis',
    muscleDistractors: ['Infraspinatus', 'Teres Minor', 'Supraspinatus'],
    nerve: 'Upper & Lower Subscapular Nerves (C5–C6)',
    nerveDistractors: ['Suprascapular Nerve', 'Musculocutaneous Nerve'],
    origin: 'Subscapular Fossa (Anterior Scapula)',
    originDistractors: ['Infraspinous Fossa', 'Coracoid Process'],
    insertion: 'Lesser Tubercle of Humerus',
    insertionDistractors: ['Greater Tubercle of Humerus', 'Deltoid Tuberosity'],
  },
  {
    id: 'triceps',
    movement: 'Elbow Extension (Prime Mover)',
    arHint: 'فرد مفصل الكوع بالكامل ضد المقاومة',
    muscle: 'Triceps Brachii',
    muscleDistractors: ['Biceps Brachii', 'Brachialis', 'Coracobrachialis'],
    nerve: 'Radial Nerve (C6–C8)',
    nerveDistractors: ['Musculocutaneous Nerve', 'Ulnar Nerve'],
    origin: 'Infraglenoid Tubercle & Posterior Humerus',
    originDistractors: ['Supraglenoid Tubercle', 'Medial Epicondyle'],
    insertion: 'Olecranon Process of Ulna',
    insertionDistractors: ['Radial Tuberosity', 'Coronoid Process of Ulna'],
  },
  {
    id: 'brachialis',
    movement: 'Pure Elbow Flexion (All Forearm Positions)',
    arHint: 'ثني الكوع في أي وضع للساعد (Workhorse of Elbow Flexion)',
    muscle: 'Brachialis',
    muscleDistractors: ['Triceps Brachii', 'Pronator Quadratus', 'Anconeus'],
    nerve: 'Musculocutaneous Nerve (C5–C6)',
    nerveDistractors: ['Median Nerve', 'Ulnar Nerve'],
    origin: 'Distal Anterior Surface of Humerus',
    originDistractors: ['Supraglenoid Tubercle', 'Lateral Supracondylar Ridge'],
    insertion: 'Coronoid Process & Ulnar Tuberosity',
    insertionDistractors: ['Radial Tuberosity', 'Styloid Process of Radius'],
  },
  {
    id: 'brachioradialis',
    movement: 'Elbow Flexion in Mid-Prone (Hammer) Position',
    arHint: 'ثني الكوع والساعد في الوضع المحايد (مثل مسك الشاكوش)',
    muscle: 'Brachioradialis',
    muscleDistractors: ['Supinator', 'Flexor Carpi Radialis', 'Palmaris Longus'],
    nerve: 'Radial Nerve (C5–C6)',
    nerveDistractors: ['Median Nerve', 'Musculocutaneous Nerve'],
    origin: 'Proximal Lateral Supracondylar Ridge',
    originDistractors: ['Medial Epicondyle', 'Infraglenoid Tubercle'],
    insertion: 'Lateral Surface of Distal Radius (Styloid)',
    insertionDistractors: ['Olecranon Process', '2nd Metacarpal Base'],
  },
  {
    id: 'pronator_teres',
    movement: 'Forearm Pronation & Weak Elbow Flexion',
    arHint: 'لف الساعد للداخل (كف اليد للأسفل)',
    muscle: 'Pronator Teres',
    muscleDistractors: ['Supinator', 'Biceps Brachii', 'Brachioradialis'],
    nerve: 'Median Nerve (C6–C7)',
    nerveDistractors: ['Radial Nerve', 'Ulnar Nerve'],
    origin: 'Medial Epicondyle & Coronoid Process',
    originDistractors: ['Lateral Epicondyle', 'Olecranon Process'],
    insertion: 'Middle Lateral Surface of Radius',
    insertionDistractors: ['Ulnar Tuberosity', 'Radial Styloid Process'],
  },
  {
    id: 'supinator',
    movement: 'Forearm Supination with Elbow Extended',
    arHint: 'لف الساعد للخارج والمرفق مفرود بالكامل',
    muscle: 'Supinator',
    muscleDistractors: ['Pronator Teres', 'Pronator Quadratus', 'Flexor Carpi Ulnaris'],
    nerve: 'Posterior Interosseous Nerve (Radial, C6–C7)',
    nerveDistractors: ['Median Nerve', 'Ulnar Nerve'],
    origin: 'Lateral Epicondyle & Supinator Crest of Ulna',
    originDistractors: ['Medial Epicondyle', 'Coracoid Process'],
    insertion: 'Proximal Lateral/Anterior Radius',
    insertionDistractors: ['Distal Ulna', '1st Metacarpal Base'],
  },
  {
    id: 'fcu',
    movement: 'Wrist Flexion & Ulnar Deviation',
    arHint: 'ثني الرسغ مع إمالة اليد لناحية الخنصر (Ulnar Side)',
    muscle: 'Flexor Carpi Ulnaris',
    muscleDistractors: ['Extensor Carpi Radialis', 'Flexor Carpi Radialis', 'Palmaris Longus'],
    nerve: 'Ulnar Nerve (C7–C8)',
    nerveDistractors: ['Median Nerve', 'Radial Nerve'],
    origin: 'Medial Epicondyle & Olecranon/Posterior Ulna',
    originDistractors: ['Lateral Epicondyle', 'Anterior Radius'],
    insertion: 'Pisiform, Hook of Hamate & 5th Metacarpal',
    insertionDistractors: ['2nd & 3rd Metacarpals', 'Scaphoid & Trapezium'],
  },
  {
    id: 'glute_max',
    movement: 'Powerful Hip Extension (Climbing Stairs / Rising)',
    arHint: 'فرد مفصل الفخذ بقوة أثناء صعود السلم أو القيام من الجلوس',
    muscle: 'Gluteus Maximus',
    muscleDistractors: ['Iliopsoas', 'Rectus Femoris', 'Sartorius'],
    nerve: 'Inferior Gluteal Nerve (L5–S2)',
    nerveDistractors: ['Superior Gluteal Nerve', 'Femoral Nerve'],
    origin: 'Posterior Ilium, Sacrum & Coccyx',
    originDistractors: ['AIIS & Iliac Crest', 'Ischial Spine'],
    insertion: 'Iliotibial Tract & Gluteal Tuberosity',
    insertionDistractors: ['Lesser Trochanter', 'Tibial Tuberosity'],
  },
  {
    id: 'biceps_femoris',
    movement: 'Knee Flexion & External Rotation + Hip Extension',
    arHint: 'ثني الركبة مع لف الساق للخارج وفرد الفخذ',
    muscle: 'Biceps Femoris',
    muscleDistractors: ['Rectus Femoris', 'Vastus Medialis', 'Gracilis'],
    nerve: 'Sciatic Nerve (Tibial & Common Peroneal)',
    nerveDistractors: ['Femoral Nerve', 'Obturator Nerve'],
    origin: 'Ischial Tuberosity & Linea Aspera',
    originDistractors: ['AIIS', 'Pubic Body'],
    insertion: 'Head of Fibula',
    insertionDistractors: ['Pes Anserinus (Medial Tibia)', 'Tibial Tuberosity'],
  },
  {
    id: 'gastrocnemius',
    movement: 'Ankle Plantarflexion (with Knee Extended)',
    arHint: 'الوقوف على أطراف الأصابع والركبة مفرودة',
    muscle: 'Gastrocnemius',
    muscleDistractors: ['Tibialis Anterior', 'Extensor Hallucis Longus', 'Peroneus Tertius'],
    nerve: 'Tibial Nerve (S1–S2)',
    nerveDistractors: ['Deep Peroneal Nerve', 'Superficial Peroneal Nerve'],
    origin: 'Medial & Lateral Condyles of Femur',
    originDistractors: ['Head & Proximal Fibula', 'Soleal Line of Tibia'],
    insertion: 'Calcaneal Tuberosity (via Achilles Tendon)',
    insertionDistractors: ['Medial Cuneiform', '5th Metatarsal Base'],
  },
  {
    id: 'tibialis_post',
    movement: 'Foot Inversion & Medial Arch Support',
    arHint: 'لف باطن القدم للداخل ودعم قوس القدم الطولي',
    muscle: 'Tibialis Posterior',
    muscleDistractors: ['Peroneus Longus', 'Peroneus Brevis', 'Extensor Digitorum Longus'],
    nerve: 'Tibial Nerve (L4–L5)',
    nerveDistractors: ['Superficial Peroneal Nerve', 'Deep Peroneal Nerve'],
    origin: 'Posterior Tibia, Fibula & Interosseous Membrane',
    originDistractors: ['Lateral Condyle of Tibia', 'Anterior Fibula'],
    insertion: 'Navicular Tuberosity & Medial Cuneiform',
    insertionDistractors: ['5th Metatarsal Tuberosity', 'Calcaneal Tuberosity'],
  },
  {
    id: 'peroneus_longus',
    movement: 'Foot Eversion & 1st Ray Plantarflexion',
    arHint: 'لف باطن القدم للخارج (Eversion) وتثبيت الكاحل الجانبي',
    muscle: 'Fibularis (Peroneus) Longus',
    muscleDistractors: ['Tibialis Anterior', 'Tibialis Posterior', 'Flexor Hallucis Longus'],
    nerve: 'Superficial Peroneal Nerve (L5–S1)',
    nerveDistractors: ['Tibial Nerve', 'Deep Peroneal Nerve'],
    origin: 'Head & Upper 2/3 Lateral Fibula',
    originDistractors: ['Posterior Tibia', 'Medial Malleolus'],
    insertion: 'Medial Cuneiform & 1st Metatarsal (Plantar)',
    insertionDistractors: ['5th Metatarsal Base', 'Navicular Tuberosity'],
  },
  {
    id: 'sartorius',
    movement: 'FABER Position (Hip Flex, Abd, ER + Knee Flex)',
    arHint: 'وضع رجل على رجل (Tailor Muscle - أطول عضلة)',
    muscle: 'Sartorius',
    muscleDistractors: ['Adductor Magnus', 'Gluteus Minimus', 'Popliteus'],
    nerve: 'Femoral Nerve (L2–L3)',
    nerveDistractors: ['Obturator Nerve', 'Sciatic Nerve'],
    origin: 'Anterior Superior Iliac Spine (ASIS)',
    originDistractors: ['AIIS', 'Ischial Tuberosity'],
    insertion: 'Proximal Medial Tibia (Pes Anserinus)',
    insertionDistractors: ['Tibial Tuberosity', 'Head of Fibula'],
  },
  {
    id: 'latissimus',
    movement: 'Shoulder Extension, Adduction & Internal Rotation',
    arHint: 'سحب الذراع للخلف وللداخل (Swimmer’s / Climbing Muscle)',
    muscle: 'Latissimus Dorsi',
    muscleDistractors: ['Middle Deltoid', 'Supraspinatus', 'Serratus Anterior'],
    nerve: 'Thoracodorsal Nerve (C6–C8)',
    nerveDistractors: ['Long Thoracic Nerve', 'Axillary Nerve'],
    origin: 'T7–L5 Spinous Processes, Iliac Crest & Thoracolumbar Fascia',
    originDistractors: ['Clavicle & Sternum', 'Acromion Process'],
    insertion: 'Floor of Intertubercular Groove of Humerus',
    insertionDistractors: ['Greater Tubercle', 'Deltoid Tuberosity'],
  },
  {
    id: 'upper_trap',
    movement: 'Scapular Elevation & Upward Rotation',
    arHint: 'رفع الكتفين لأعلى (Shrugging) وتدوير لوح الكتف للأعلى',
    muscle: 'Upper Trapezius',
    muscleDistractors: ['Latissimus Dorsi', 'Pectoralis Minor', 'Subclavius'],
    nerve: 'Spinal Accessory Nerve (CN XI)',
    nerveDistractors: ['Dorsal Scapular Nerve', 'Long Thoracic Nerve'],
    origin: 'External Occipital Protuberance & Nuchal Ligament',
    originDistractors: ['Ribs 3–5', 'Spinous Processes T6–T12'],
    insertion: 'Lateral 1/3 of Clavicle & Acromion',
    insertionDistractors: ['Coracoid Process', 'Medial Border below Spine'],
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
  const [wrongOpt, setWrongOpt] = useState<string | null>(null);
  const [wrongKey, setWrongKey] = useState(0);
  const [selectedNerve, setSelectedNerve] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedInsertion, setSelectedInsertion] = useState<string | null>(null);
  const [roundCleared, setRoundCleared] = useState(false);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);

  const remainingXpPlays = Math.max(0, maxDailyPlays - dailyPlaysCount);
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
      playSound('muscle_pick');
      haptic('success');
      setWrongMsg('');
      setWrongOpt(null);
      setStep(2);
    } else {
      playSound('wrong');
      haptic('error');
      setWrongOpt(mName);
      setWrongKey((k) => k + 1);
      setWrongMsg(`مش ${mName} — ركز في الحركة وجرب تاني!`);
    }
  };

  const checkPhase2Complete = (n: string | null, o: string | null, i: string | null) => {
    if (n === current.nerve && o === current.origin && i === current.insertion) {
      const isLast = roundIdx + 1 >= ROUNDS_PER_SESSION;
      playSound(isLast ? 'game_win' : 'correct');
      haptic('success');
      setRoundCleared(true);
      if (isLast) {
        setFinished(true);
        onWin();
      }
    }
  };

  const handleNextRound = () => {
    setRoundIdx((r) => r + 1);
    setStep(1);
    setWrongMsg('');
    setWrongOpt(null);
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
    setWrongOpt(null);
    setSelectedNerve(null);
    setSelectedOrigin(null);
    setSelectedInsertion(null);
    setRoundCleared(false);
    setFinished(false);
  };

  if (!started) {
    return (
      <GameIntroScreen
        accent="green"
        character="muscle"
        art={<MuscleArt />}
        title="مين المسؤول؟ Who's Responsible?"
        titleEn="Kinesiology & Functional Anatomy"
        subtitle="اربط كل حركة بالعضلة المسؤولة عنها وحدد العصب والـ Origin والـ Insertion!"
        rules={[
          'المرحلة 1: اختار العضلة المسؤولة عن الحركة المطلوبة (Prime Mover)',
          'المرحلة 2: حدد الـ Nerve Supply والـ Origin والـ Insertion بدقة',
          `كمّل ${ROUNDS_PER_SESSION} حالات متتالية عشان تكسب مكافأة الـ XP`,
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

        <span className="text-2xs font-black px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 tabular-nums">
          {remainingXpPlays > 0 ? `محاولات XP: ${remainingXpPlays}/${maxDailyPlays}` : 'وضع التدريب'}
        </span>
      </div>

      {remainingXpPlays <= 0 && !finished && (
        <PracticeModeBanner character="muscle" />
      )}

      <div className="sm:glass-card sm:p-5 sm:border sm:border-emerald-500/25 relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <Mascot
              character="muscle"
              mood={
                finished
                  ? 'celebrating'
                  : wrongMsg
                    ? 'confused'
                    : roundCleared
                      ? 'happy'
                      : 'thinking'
              }
              size={42}
            />
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-white">مين المسؤول؟ Who&apos;s Responsible?</h2>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-emerald-300 shrink-0">
            حالة {roundIdx + 1} / {ROUNDS_PER_SESSION}
          </span>
        </div>

        {/* Phase Stepper */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-black text-center transition-colors ${
              step === 1
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {step === 2 ? '✓ ' : '1. '}العضلة (Prime Mover)
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-black text-center transition-colors ${
              step === 2
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                : 'bg-zinc-900/70 border-zinc-800 text-zinc-500'
            }`}
          >
            2. العصب والـ Origin / Insertion
          </div>
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
                    key={wrongOpt === opt ? `${opt}-${wrongKey}` : opt}
                    type="button"
                    onClick={() => handlePickMuscle(opt)}
                    className={`lp-press min-h-[44px] p-3.5 rounded-xl border font-black text-xs text-center cursor-pointer transition-colors ${
                      wrongOpt === opt
                        ? 'lp-wrong bg-red-500/15 border-red-500/50 text-red-300'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-emerald-400/50 hover:bg-emerald-500/10 text-white'
                    }`}
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
                            playSound('muscle_pick');
                            haptic('success');
                            checkPhase2Complete(opt, selectedOrigin, selectedInsertion);
                          } else {
                            playSound('wrong');
                            haptic('error');
                            setWrongMsg('تأكد من العصب المغذي للعضلة!');
                          }
                        }}
                        className={`lp-press min-h-[44px] p-2.5 rounded-xl border text-xs font-bold text-start cursor-pointer transition-colors ${
                          isPicked && isRight
                            ? 'lp-correct bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : isPicked && !isRight
                              ? 'lp-wrong bg-red-500/15 border-red-500/50 text-red-300'
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
                            playSound('muscle_pick');
                            haptic('success');
                            checkPhase2Complete(selectedNerve, opt, selectedInsertion);
                          } else {
                            playSound('wrong');
                            haptic('error');
                            setWrongMsg('الـ Origin مش مظبوط، جرب اختيار تاني!');
                          }
                        }}
                        className={`lp-press min-h-[44px] p-2.5 rounded-xl border text-xs font-bold text-start cursor-pointer transition-colors ${
                          isPicked && isRight
                            ? 'lp-correct bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : isPicked && !isRight
                              ? 'lp-wrong bg-red-500/15 border-red-500/50 text-red-300'
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
                            playSound('muscle_pick');
                            haptic('success');
                            checkPhase2Complete(selectedNerve, selectedOrigin, opt);
                          } else {
                            playSound('wrong');
                            haptic('error');
                            setWrongMsg('الـ Insertion مش مظبوط، راجع مكان الارتكاز!');
                          }
                        }}
                        className={`lp-press min-h-[44px] p-2.5 rounded-xl border text-xs font-bold text-start cursor-pointer transition-colors ${
                          isPicked && isRight
                            ? 'lp-correct bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : isPicked && !isRight
                              ? 'lp-wrong bg-red-500/15 border-red-500/50 text-red-300'
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
                  className="lp-pop lp-press min-h-[44px] w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs py-3 rounded-xl cursor-pointer hover:opacity-95 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>الحالة اللي بعدها</span>
                </button>
              )}

              {finished && (
                <div className="mt-4">
                  <GameResultScreen
                    status="won"
                    accent="green"
                    character="muscle"
                    isPractice={remainingXpPlays <= 0}
                    title="ممتاز! ربطت الحركة بالعضلة والعصب صح 💪"
                    xp={remainingXpPlays > 0 ? xpReward : 0}
                    stats={[{ label: 'الحالات', value: `${ROUNDS_PER_SESSION}/${ROUNDS_PER_SESSION}` }]}
                    onReplay={handleRestart}
                    replayLabel="العب حالات جديدة"
                    onBack={onBack}
                  />
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
