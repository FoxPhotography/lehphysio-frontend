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
  {
    id: 11,
    title: 'تنميل الذراع مع رفع اليد',
    specialty: 'Vascular & Neuro',
    clues: [
      'رسام حوائط بيشتكي من تنميل وبرودة في الذراع والصباع الصغير لما يرفع إيده فوق راسه.',
      'الأعراض بتظهر في الـ Ulnar border (C8-T1) مع ضعف قبضة اليد أحياناً.',
      'عند عمل Adson’s Test بيقل النبض الكعبري (Radial Pulse) بوضوح.',
      'اختبار Roos (EAST) برفع الذراعين وفتح وقفل الإيد 3 دقايق كرر الأعراض فوراً.',
    ],
    options: [
      'Thoracic Outlet Syndrome (TOS)',
      'Carpal Tunnel Syndrome',
      'Radial Nerve Palsy',
      'C5 Radiculopathy',
    ],
    correctIndex: 0,
    pearl: 'ضعف النبض مع Adson’s Test وإيجابية Roos (EAST) وتنميل الإيد مع رفع الذراع تشخص Thoracic Outlet Syndrome.',
  },
  {
    id: 12,
    title: 'كهرباء في الخنصر والبنصر',
    specialty: 'Peripheral Nerve',
    clues: [
      'طالب بيذاكر وساند كوعه على المكتب ساعات طويلة حاسس بتنميل في الصباع الصغير ونص البنصر.',
      'إحساس ضهر الكف من ناحية الصباع الصغير متأثر برضه.',
      'ثني الكوع لأقصى مدى لمدة دقيقة (Elbow Flexion Test) زوّد التنميل جداً.',
      'اختبار Froment’s Sign: المريض بيتني عقلة الإبهام لما يمسك ورقة بين الإبهام والسبابة.',
    ],
    options: [
      'Carpal Tunnel Syndrome',
      'Cubital Tunnel Syndrome (Ulnar Nerve)',
      'Pronator Teres Syndrome',
      'C6 Cervical Radiculopathy',
    ],
    correctIndex: 1,
    pearl: 'ضغط العصب الزندي (Ulnar Nerve) عند الكوع يعمل تنميل في الخنصر ونص البنصر مع إيجابية Froment’s Sign.',
  },
  {
    id: 13,
    title: 'إصابة التابلوه في الركبة',
    specialty: 'Sports Rehab',
    clues: [
      'راكب عربية خبطت ركبته المتنية بقوة في التابلوه أثناء حادث (Dashboard Injury).',
      'عند الفحص والركبة متنية 90° في وضع الاستلقاء، القصبة ساقطة لورا (Posterior Sag Sign).',
      'اختبار Quadriceps Active Test رجّع القصبة لمكانها لقدام لما المريض شد الكوادرسيبس.',
      'اختبار Posterior Drawer أظهر حركة زائدة للقصبة للخلف.',
    ],
    options: [
      'ACL Tear',
      'PCL Tear (Dashboard Injury)',
      'LCL Sprain',
      'Lateral Meniscus Tear',
    ],
    correctIndex: 1,
    pearl: 'خبطة التابلوه على ركبة متنية + Posterior Sag Sign + Posterior Drawer إيجابي = قطع في الرباط الصليبي الخلفي (PCL).',
  },
  {
    id: 14,
    title: 'قفل الركبة والطقطقة',
    specialty: 'Sports Rehab',
    clues: [
      'لاعب كورة بيشتكي إن ركبته بتعلق ومش بتتفرد للآخر أحياناً (Locking) مع وجع داخلي.',
      'في ألم موضعي واضح على الـ Medial Joint Line.',
      'الركبة بتورم بشكل تدريجي بعد التمرين مش فوراً (Delayed Effusion).',
      'اختبار McMurray واختبار Thessaly (اللف على رجل واحدة متنية 20°) طلعوا إيجابيين.',
    ],
    options: [
      'Medial Meniscus Tear',
      'ACL Tear',
      'Patellar Tendinopathy',
      'Baker’s Cyst Rupture',
    ],
    correctIndex: 0,
    pearl: 'الـ Locking مع التورم المتأخر وألم خط المفصل وإيجابية McMurray و Thessaly علامات كلاسيكية لقطع الغضروف الهلالي (Meniscus Tear).',
  },
  {
    id: 15,
    title: 'وجع الصابونة على السلالم',
    specialty: 'Orthopedics',
    clues: [
      'بنت 22 سنة بتشتكي من وجع قدام الركبة بيزيد مع نزول السلالم أو القعدة الطويلة في السينما (Theater Sign).',
      'يوجد ضعف واضح في عضلة VMO وعضلات الحوض الـ Hip Abductors/External Rotators.',
      'زيادة في زاوية Q-Angle وميل للـ Patella للخارج.',
      'الضغط على الصابونة أثناء شد عضلة الفخذ (Clarke’s Grind Test) أظهر ألم وخشونة.',
    ],
    options: [
      'Patellofemoral Pain Syndrome (PFPS)',
      'Osgood-Schlatter Disease',
      'PCL Tear',
      'Pes Anserinus Bursitis',
    ],
    correctIndex: 0,
    pearl: 'وجع قدام الركبة مع نزول السلالم والقعدة الطويلة (Movie/Theater Sign) وضعف VMO والـ Hip Abductors يميز الـ PFPS.',
  },
  {
    id: 16,
    title: 'وجع الجري على جانب الركبة',
    specialty: 'Sports Rehab',
    clues: [
      'عدّاء ماراثون بيجيله ألم حاد في الجنب الخارجي للركبة بعد كل مرة يجري فيها أكتر من 3 كم.',
      'الألم مركز فوق الـ Lateral Femoral Condyle بحوالي 2 سم.',
      'اختبار Ober’s Test أظهر شد قوي جداً في العضلات الوحشية للفخذ.',
      'اختبار Noble’s Compression عند ثني وفرد الركبة عند 30° كرر نفس الألم بدقة.',
    ],
    options: [
      'LCL Sprain',
      'Iliotibial Band (ITB) Syndrome',
      'Lateral Meniscus Tear',
      'Common Peroneal Entrapment',
    ],
    correctIndex: 1,
    pearl: 'ألم عدائين المسافات عند الـ Lateral Femoral Condyle عند زاوية 30° مع إيجابية Ober’s و Noble’s = متلازمة الشريط الحرقفي الظنبوبي (ITB Syndrome).',
  },
  {
    id: 17,
    title: 'ألم الجنب أثناء النوم على السرير',
    specialty: 'Hip & Pelvis',
    clues: [
      'سيدة 48 سنة مش قادرة تنام على جنبها اليمين بسبب ألم حاد في جانب الحوض الخارجي.',
      'يوجد تندرنس شديد عند الضغط على الـ Greater Trochanter.',
      'الألم بيزيد مع المشي الطويل، الوقوف على رجل واحدة، وصعود السلالم.',
      'اختبار FABER واختبار Resisted Hip Abduction زودوا الألم عند بروز الفخذ الجانبي.',
    ],
    options: [
      'Hip Osteoarthritis',
      'Greater Trochanteric Pain Syndrome (Trochanteric Bursitis)',
      'Femoroacetabular Impingement (FAI)',
      'Meralgia Paresthetica',
    ],
    correctIndex: 1,
    pearl: 'الألم الجانبي للحوض عند الضغط على الـ Greater Trochanter وعدم القدرة على النوم على الجنب هو الـ GTPS / Trochanteric Bursitis.',
  },
  {
    id: 18,
    title: 'التنميل مع المشي والراحة بالانحناء',
    specialty: 'Spine',
    clues: [
      'رجل 65 سنة بيحس بتقل وتنميل في الرجلين بعد المشي 10 دقايق بس.',
      'الألم بيختفي تماماً لما يقعد أو يوطي لقدام وهو ساند على عربية السوبرماركت (Shopping Cart Sign).',
      'الوقوف مفرود الضهر أو المشي لتحت منحدر (Extension) بيزود الأعراض جداً.',
      'النبض في القدم سليم تماماً (تفرق عن المشاكل الشريانية).',
    ],
    options: [
      'Lumbar Spinal Stenosis (Neurogenic Claudication)',
      'Acute Lumbar Disc Herniation',
      'Peripheral Artery Disease (Vascular)',
      'Sacroiliac Joint Dysfunction',
    ],
    correctIndex: 0,
    pearl: 'الـ Shopping Cart Sign (الراحة مع الانحناء والزيادة مع الفرد) في كبار السن مع نبض قدم سليم تشخص ضيق القناة الشوكية (Lumbar Spinal Stenosis).',
  },
  {
    id: 19,
    title: 'درجة سلم في أسفل الضهر',
    specialty: 'Spine',
    clues: [
      'لاعب جمباز شاب بيشتكي من ألم أسفل الضهر بيزيد مع الحركات الخلفية (Lumbar Extension).',
      'عند تحسس الفقرات القطنية بنلاقي فجوة أو خطوة محسوسة (Step-off Deformity) عند L5-S1.',
      'اختبار Stork Standing Test (الوقوف على رجل واحدة مع فرد الضهر للخلف) مؤلم جداً.',
      'الأشعة الجانبية أظهرت انزلاق فقرة L5 للأمام فوق S1.',
    ],
    options: [
      'Spondylolisthesis',
      'Lumbar Disc Herniation',
      'Piriformis Syndrome',
      'Ankylosing Spondylitis',
    ],
    correctIndex: 0,
    pearl: 'وجود Step-off Deformity وألم مع الـ Extension و Stork Test إيجابي في لاعبي الجمباز يشير إلى Spondylolisthesis.',
  },
  {
    id: 20,
    title: 'تيبس الضهر الصباحي في الشباب',
    specialty: 'Rheumatology / Spine',
    clues: [
      'شاب 26 سنة عنده ألم في أسفل الضهر والحوض بقاله أكتر من 4 شهور بيصحيه الفجر.',
      'تيبس صباحي (Morning Stiffness) بيقعد أكتر من ساعة كاملة وبيتحسن جداً مع الحركة والرياضة مش الراحة!',
      'محدودية واضحة في حركة الصدر أثناء التنفس وحركة العمود الفقري (Positive Schober’s Test).',
      'الأشعة أظهرت التهاب في مفاصل الحوض (Sacroiliitis) وبداية شكل Bamboo Spine.',
    ],
    options: [
      'Ankylosing Spondylitis',
      'Mechanical Low Back Pain',
      'Lumbar Spinal Stenosis',
      'Compression Fracture',
    ],
    correctIndex: 0,
    pearl: 'ألم ضهر التهابي في شاب يقل بالحركة ويزيد بالراحة + تيبس صباحي > ساعة + إيجابية Schober’s Test = Ankylosing Spondylitis.',
  },
  {
    id: 21,
    title: 'تنميل الإبهام وألم الرقبة',
    specialty: 'Cervical Spine',
    clues: [
      'مريض رقبة بيشتكي من ألم نازل من الرقبة للجنب الخارجي للساعد ولحد الإبهام.',
      'في ضعف في ثني الكوع (Biceps) وضعف في رد فعل الوتر بتاعها (Biceps Reflex).',
      'اختبار Spurling’s Test زوّد التنميل في الإبهام فوراً.',
      'شد الرقبة لفوق بلطف (Cervical Distraction Test) ريّح الألم في ثواني.',
    ],
    options: [
      'C6 Cervical Radiculopathy',
      'C8 Cervical Radiculopathy',
      'Carpal Tunnel Syndrome',
      'Cervical Myelopathy',
    ],
    correctIndex: 0,
    pearl: 'جذر العصب C6 مسؤول عن إحساس الإبهام + عضلة Biceps/Wrist Extensors + Biceps Reflex.',
  },
  {
    id: 22,
    title: 'عدم اتزان وصعوبة زراير القميص',
    specialty: 'Red Flag 🚨',
    isRedFlag: true,
    clues: [
      'مريض 58 سنة بيشتكي إن إيديه الاتنين بقوا تقال ومش عارف يقفل زراير القميص (Loss of Fine Motor).',
      'رجليه فيهم تشنج خفيف ومشيته بقت واسعة ومش متزنة (Broad-based Ataxic Gait).',
      'ظهرت علامات Upper Motor Neuron زي Hyperreflexia و Babinski إيجابي و Hoffmann’s Sign.',
      'تدهور عصبي مركزي في الرقبة (Red Flag) — ممنوع الـ Cervical Manipulation ويجب العرض جراحياً!',
    ],
    options: [
      'Cervical Myelopathy (Red Flag 🚨)',
      'Cervical Muscle Strain',
      'Bell’s Palsy',
      'Thoracic Outlet Syndrome',
    ],
    correctIndex: 0,
    pearl: '🚨 علامات UMN (Babinski + Hoffmann + عدم اتزان + فقدان المهارات الدقيقة لليد) تعني ضغط على الحبل الشوكي العنقي (Cervical Myelopathy).',
  },
  {
    id: 23,
    title: 'تورم وسخونة في السمانة',
    specialty: 'Red Flag 🚨',
    isRedFlag: true,
    clues: [
      'مريض لسه راجع من سفر طيران 10 ساعات (أو عامل عملية حديثة) وبيشتكي من وجع في السمانة.',
      'السمانة الشمال وارمة بفرق أكتر من 3 سم عن اليمين، وحمراء وسخنة جداً.',
      'الألم بيزيد مع المشي والضغط العميق على السمانة.',
      'حالة Red Flag خطيرة — ممنوع تماماً المساج أو الـ Calf Stretching ويجب التحويل لعمل Doppler فوراً!',
    ],
    options: [
      'Deep Vein Thrombosis (DVT) [Red Flag 🚨]',
      'Gastrocnemius Muscle Strain',
      'Achilles Tendinitis',
      'Shin Splints (MTSS)',
    ],
    correctIndex: 0,
    pearl: '🚨 تورم أحادي بالسمانة + سخونة + احمرار بعد سفر أو جراحة = اشتباه جلطة وريدية (DVT)، ممنوع المساج والتحويل للطوارئ فوراً.',
  },
  {
    id: 24,
    title: 'الكتف المجنّح بعد خبطة أو جراحة',
    specialty: 'Peripheral Nerve',
    clues: [
      'مريضة بعد عملية جراحية في الإبط (أو شيل شنطة تقيلة) مش قادرة ترفع دراعها فوق الـ 90° بالكامل.',
      'الـ Medial Border بتاع لوح الكتف بيبرز لبرا بوضوح لما تزق الحيط بإيديها (Wall Push-Up).',
      'العضلة المصابة هي الـ Serratus Anterior.',
      'إصابة في العصب الصدري الطويل (Long Thoracic Nerve).',
    ],
    options: [
      'Long Thoracic Nerve Injury (Winged Scapula)',
      'Spinal Accessory Nerve Palsy',
      'Axillary Nerve Injury',
      'Rotator Cuff Tear',
    ],
    correctIndex: 0,
    pearl: 'ضعف الـ Serratus Anterior نتيجة إصابة Long Thoracic Nerve يظهر كـ Medial Scapular Winging أثناء الـ Wall Push-Up.',
  },
  {
    id: 25,
    title: 'حرقان بين صوابع القدم في الشوز الضيق',
    specialty: 'Foot & Ankle',
    clues: [
      'سيدة بتلبس كعب عالي وشوز ضيق بتشتكي من ألم وحرقان بين الصباع التالت والرابع في مشط الرجل.',
      'بتحس كأنها ماشية على حصوة صغيرة جوه الشوز وبتضطر تقلعه وتفرك رجلها.',
      'عند عصر مشط القدم من الجنبين (Mulder’s Squeeze Test) بنسمع ونحس Click مؤلم.',
      'تضخم ليفي حميد حول العصب الأصبعي الأخمصي (Interdigital Neuroma).',
    ],
    options: [
      'Morton’s Neuroma',
      'Plantar Fasciitis',
      'Metatarsal Stress Fracture',
      'Gout Arthritis',
    ],
    correctIndex: 0,
    pearl: 'الألم الحارق بين الصباع الـ 3 والـ 4 مع إحساس الحصوة وإيجابية Mulder’s Click يشخص Morton’s Neuroma.',
  },
  {
    id: 26,
    title: 'تنميل باطن القدم من الكعب',
    specialty: 'Peripheral Nerve',
    clues: [
      'مريض فلات فوت حاسس بحرقان وتنميل في باطن القدم وأصابع القدم.',
      'الأعراض بتزيد جداً مع الوقوف والمشي الطويل.',
      'يوجد ألم عند الضغط أو الخبط (Tinel’s Sign) خلف الـ Medial Malleolus.',
      'انضغاط العصب الظنبوبي الخلفي (Posterior Tibial Nerve) تحت الـ Flexor Retinaculum.',
    ],
    options: [
      'Tarsal Tunnel Syndrome',
      'Plantar Fasciitis',
      'Morton’s Neuroma',
      'Sciatic Nerve Palsy',
    ],
    correctIndex: 0,
    pearl: 'الخبط ورا الـ Medial Malleolus (Tinel’s Sign) وتنميل باطن القدم يميز انضغاط الـ Tibial Nerve في الـ Tarsal Tunnel.',
  },
  {
    id: 27,
    title: 'بروز مؤلم تحت الركبة في مراهق',
    specialty: 'Pediatrics / Sports',
    clues: [
      'ولد 13 سنة بيلعب كورة وسلة طول الأسبوع بيشتكي من ألم وتورم قدام وتحت الركبة.',
      'يوجد بروز عظمي واضح ومؤلم جداً عند الـ Tibial Tuberosity.',
      'الألم بيزيد مع الجري والنط ومقاومة فرد الركبة (Quadriceps Contraction).',
      'حالة Traction Apophysitis شائعة في فترة الطفرة النمو (Growth Spurt).',
    ],
    options: [
      'Osgood-Schlatter Disease',
      'Sever’s Disease',
      'Meniscal Tear',
      'Patellar Dislocation',
    ],
    correctIndex: 0,
    pearl: 'ألم وتورم الـ Tibial Tuberosity في مراهق رياضي وقت النمو = Osgood-Schlatter Disease.',
  },
  {
    id: 28,
    title: 'وجع كعب طفل بيلعب كورة',
    specialty: 'Pediatrics / Sports',
    clues: [
      'طفل 10 سنين بيشتكي من ألم في مؤخرة الكعب بيزيد مع الجري واللعب حافي.',
      'الألم متركز عند الـ Calcaneal Apophysis مكان التصاق وتر أخيل.',
      'عصر الكعب من الجنبين (Calcaneal Squeeze Test) بيسبب ألم واضح.',
      'حالة Calcaneal Apophysitis حميدة بتتحسن بالراحة وتمديد عضلات السمانة.',
    ],
    options: [
      'Sever’s Disease',
      'Osgood-Schlatter Disease',
      'Achilles Rupture',
      'Plantar Fasciitis',
    ],
    correctIndex: 0,
    pearl: 'ألم كعب الأطفال النشطين (8–14 سنة) مع Calcaneal Squeeze Test إيجابي هو Sever’s Disease.',
  },
  {
    id: 29,
    title: 'دوخة شديدة عند التقلب في السرير',
    specialty: 'Vestibular Rehab',
    clues: [
      'سيدة بتشتكي من نوبات دوار شديد (Spinning Vertigo) بتقعد 20 ثانية لما تتقلب في السرير أو تبص لفوق.',
      'السمع سليم تماماً ومفيش طنين في الأذن.',
      'في اختبار Dix-Hallpike: ظهر دوران سريع للعين (Torsional Up-beating Nystagmus) بعد ثواني قليلة.',
      'بتتعالج بكفاءة عالية في جلسة أو اتنين باستخدام مناورة Epley (Canalith Repositioning).',
    ],
    options: [
      'Posterior Canal BPPV',
      'Meniere’s Disease',
      'Vertebrobasilar Insufficiency',
      'Cerebellar Stroke',
    ],
    correctIndex: 0,
    pearl: 'دوار موضعي قصير (< دقيقة) مع إيجابية Dix-Hallpike بدون فقدان سمع = BPPV ويتعالج بمناورة Epley.',
  },
  {
    id: 30,
    title: 'فقدان الدوران الخارجي وضعف العضلة فوق الشوكة',
    specialty: 'Peripheral Nerve',
    clues: [
      'لاعب كرة طائرة محترف بيشتكي من ضعف تدريجي في رفع الكتف والدوران الخارجي من غير ألم حاد.',
      'في ضمور (Atrophy) ملحوظ في منطقتي Supraspinatus و Infraspinatus Fossae.',
      'الضربات المتكررة (Overhead Smashes) عملت شد على العصب جوه الـ Suprascapular Notch.',
      'الإحساس على جلد الكتف طبيعي (عكس إصابة الـ Axillary Nerve).',
    ],
    options: [
      'Suprascapular Nerve Entrapment',
      'Axillary Nerve Palsy',
      'Long Thoracic Nerve Injury',
      'Frozen Shoulder',
    ],
    correctIndex: 0,
    pearl: 'ضمور Supraspinatus و Infraspinatus مع سلامة الإحساس في لاعبي الطائرة والتنس يدل على Suprascapular Nerve Entrapment.',
  },
  {
    id: 31,
    title: 'تجمع سوائل بالرئة وصعوبة تنفس',
    specialty: 'Cardiopulmonary',
    clues: [
      'مريض مدخن 60 سنة عنده نهجان مزمن وكحة ببلغم أبيض كل شتاء من أكتر من سنتين.',
      'الصدر واخد شكل البرميل (Barrel Chest) وبنسمع Wheezes في الزفير.',
      'المريض بيتنفس وهو ساند إيديه على ركبته (Tripod Position) وبيعمل Pursed-Lip Breathing.',
      'اختبار Spirometry أظهر نقص في نسبة FEV1/FVC (< 70%) وعدم رجوع كامل بالـ Bronchodilator.',
    ],
    options: [
      'COPD (Chronic Obstructive Pulmonary Disease)',
      'Idiopathic Pulmonary Fibrosis',
      'Pneumothorax',
      'Pleural Effusion',
    ],
    correctIndex: 0,
    pearl: 'الـ Barrel Chest + Tripod Position + Pursed-Lip Breathing + FEV1/FVC < 70% هي الصورة الكلاسيكية لـ COPD.',
  },
  {
    id: 32,
    title: 'ألم مفاجئ في الصدر ونهجان بعد جراحة',
    specialty: 'Red Flag 🚨',
    isRedFlag: true,
    clues: [
      'مريض عامل عملية ركبة من 5 أيام فجأة جاله نهجان شديد وألم حاد في الصدر بيزيد مع النفس.',
      'ضربات القلب سريعة جداً (Tachycardia) ونسبة الأكسجين SpO2 نزلت فجأة لـ 86%.',
      'مصحوب بكحة خفيفة وأحياناً دوخة شديدة أو إغماء.',
      'حالة طوارئ حرجة مهددة للحياة (Red Flag) — أوقف الجلسة فوراً واطلب الإسعاف!',
    ],
    options: [
      'Pulmonary Embolism (PE) [Red Flag 🚨]',
      'Costochondritis',
      'Intercostal Muscle Strain',
      'Bronchial Asthma',
    ],
    correctIndex: 0,
    pearl: '🚨 نهجان مفاجئ + ألم صدر حاد + انخفاض SpO2 بعد جراحة أو DVT = اشتباه جلطة رئوية (Pulmonary Embolism)، حالة طوارئ فورية.',
  },
  {
    id: 33,
    title: 'وضعية ذراع النادل في مولود',
    specialty: 'Pediatrics',
    clues: [
      'مولود جديد بعد ولادة متعسرة (Shoulder Dystocia) مش بيحرك دراعه اليمين طبيعي.',
      'الذراع مفرود بجانب الجسم في وضع Adduction و Internal Rotation والرسغ مثني للخلف.',
      'تُعرف الوضعية دي باسم Waiter’s Tip Posture.',
      'إصابة في الجذور العلوية للضفيرة العضدية (C5–C6).',
    ],
    options: [
      'Erb-Duchenne Palsy (C5-C6)',
      'Klumpke’s Palsy (C8-T1)',
      'Congenital Torticollis',
      'Cerebral Palsy Hemiplegia',
    ],
    correctIndex: 0,
    pearl: 'إصابة C5-C6 أثناء الولادة بتعمل وضعية Waiter’s Tip المميزة لـ Erb-Duchenne Palsy.',
  },
  {
    id: 34,
    title: 'يد مخلبية وجفن نازل في مولود',
    specialty: 'Pediatrics',
    clues: [
      'مولود اتشد من دراعه لفوق أثناء الولادة المتعسرة، فحصل ضعف في عضلات اليد الصغيرة.',
      'الإيد واخدة شكل المخلب (Claw Hand Deformity) وضعف في الـ Grasp Reflex.',
      'معاها سقوط خفيف في جفن العين وضيق في حدقة العين في نفس الناحية (Horner’s Syndrome).',
      'إصابة في الجذور السفلية للضفيرة العضدية (C8–T1).',
    ],
    options: [
      'Klumpke’s Palsy (C8-T1)',
      'Erb-Duchenne Palsy (C5-C6)',
      'Radial Nerve Palsy',
      'Duchenne Muscular Dystrophy',
    ],
    correctIndex: 0,
    pearl: 'إصابة C8-T1 بتعمل Claw Hand + Horner’s Syndrome وتُعرف بـ Klumpke’s Palsy.',
  },
  {
    id: 35,
    title: 'ميلان رقبة الرضيع لجهة واحدة',
    specialty: 'Pediatrics',
    clues: [
      'رضيع 3 شهور راسه مايلة ناحية اليمين وذقنه لافف ناحية الشمال.',
      'بنحس كتلة صغيرة مش مؤلمة في عضلة Sternocleidomastoid اليمين.',
      'الطفل بيفضل يرضع من ناحية واحدة ومش بيحب يبص الناحية التانية.',
      'بيتعالج بتحفيز الالتفات للجهة المعاكسة وتمارين إطالة لطيفة للـ SCM.',
    ],
    options: [
      'Congenital Muscular Torticollis',
      'Atlantoaxial Subluxation',
      'Klippel-Feil Syndrome',
      'Spastic Diplegia',
    ],
    correctIndex: 0,
    pearl: 'ميلان الرأس لنفس الجهة (Ipsilateral Side-bend) ودوران الذقن للجهة المعاكسة (Contralateral Rotation) يميز شد عضلة الـ SCM في Congenital Torticollis.',
  },
  {
    id: 36,
    title: 'مشية المقص في طفل',
    specialty: 'Pediatrics / Neuro',
    clues: [
      'طفل مولود مبكراً (Preterm) وعنده تأخر حركي وتصلب عضلي في الرجلين أكتر من الإيدين.',
      'لما بيمشي رجليه بتخبط في بعض بسبب شد عضلات الضامة (Scissoring Gait).',
      'بيمشي على أطراف صوابعه (Toe Walking) وعنده Spasticity واضحة في السمانة والهامسترينج.',
      'أشهر نوع حركي من الشلل الدماغي عند الأطفال المبتسرين.',
    ],
    options: [
      'Spastic Diplegia (Cerebral Palsy)',
      'Duchenne Muscular Dystrophy',
      'Spina Bifida (L5)',
      'Guillain-Barré Syndrome',
    ],
    correctIndex: 0,
    pearl: 'إصابة الطرفين السفليين بـ Spasticity ومشية الـ Scissoring في طفل مبتسر هي علامة Spastic Diplegia CP.',
  },
  {
    id: 37,
    title: 'انفصال عضلات البطن بعد الولادة',
    specialty: 'Women’s Health',
    clues: [
      'أم بعد الولادة بـ 3 شهور بتلاحظ بروز طولي في نص بطنها لما ترفع راسها من على السرير.',
      'عند الفحص، لقينا مسافة أكتر من صباعين (2.5 سم) بين نصفي عضلة Rectus Abdominis.',
      'الأنسجة الضامة للـ Linea Alba متمددة وضعيفة.',
      'ممنوع تبدأ بتمارين Sit-ups العنيفة، والتركيز يكون على تنشيط الـ Transverse Abdominis.',
    ],
    options: [
      'Diastasis Recti Abdominis (DRA)',
      'Umbilical Hernia',
      'Symphysis Pubis Dysfunction',
      'Rectus Sheath Hematoma',
    ],
    correctIndex: 0,
    pearl: 'انفصال عضلتي Rectus Abdominis أكتر من 2 سم عند الـ Linea Alba يشخص Diastasis Recti وعلاجه الأساسي تفعيل Core/TA.',
  },
  {
    id: 38,
    title: 'وجع عظمة العانة أثناء الحمل',
    specialty: 'Women’s Health',
    clues: [
      'سيدة حامل في الشهر السابع بتشتكي من ألم حاد في نص الحوض من قدام عند التقلب في السرير أو لبس البنطلون.',
      'الألم بيزيد جداً لما تفتح رجليها أو تنزل من العربية.',
      'يوجد تندرنس شديد عند الضغط على مفصل الـ Symphysis Pubis.',
      'حالة شائعة بسبب هرمون Relaxin وتحتاج حزام حوض (Pelvic Belt) وتعديل حركة.',
    ],
    options: [
      'Symphysis Pubis Dysfunction (SPD / PGP)',
      'Hip Labral Tear',
      'Sciatica',
      'Inguinal Hernia',
    ],
    correctIndex: 0,
    pearl: 'الألم الأمامي لمفصل العانة عند فتح الرجلين والتقلب في السرير أثناء الحمل هو Symphysis Pubis Dysfunction.',
  },
  {
    id: 39,
    title: 'رعشة السكون وخطوات قصيرة',
    specialty: 'Neurology',
    clues: [
      'رجل 68 سنة إيده بترتعش وهو مستريح (Pill-Rolling Resting Tremor) وتختفي لما يمد إيده يمسك كوباية.',
      'حركته بطيئة جداً (Bradykinesia) ومشيته خطوات صغيرة متلاحقة (Shuffling / Festinating Gait).',
      'عند تحريك ذراعه سلبياً بنحس مقاومة متقطعة زي الترس (Cogwheel Rigidity).',
      'نقص الدوبامين في الـ Substantia Nigra (Basal Ganglia).',
    ],
    options: [
      'Parkinson’s Disease',
      'Cerebellar Ataxia',
      'Essential Tremor',
      'Huntington’s Disease',
    ],
    correctIndex: 0,
    pearl: 'الرباعي الكلاسيكي: Resting Tremor + Bradykinesia + Cogwheel Rigidity + Postural Instability يشخص Parkinson’s Disease.',
  },
  {
    id: 40,
    title: 'ضعف صاعد سريع بعد دور برد',
    specialty: 'Neurology',
    clues: [
      'شاب جاله دور نزلة معوية أو برد من أسبوعين، وبعدها بدأ يحس بتنميل وضعف في رجليه الاتنين.',
      'الضعف بيطلع لفوق بسرعة (Ascending Symmetrical Paralysis) من القدمين للفخذين ثم الجذع.',
      'ردود الأفعال الوترية اختفت تماماً (Areflexia).',
      'التهاب مناعي حاد يهاجم الـ Myelin في الأعصاب الطرفية (وقد يحتاج متابعة تنفس!).',
    ],
    options: [
      'Guillain-Barré Syndrome (GBS)',
      'Multiple Sclerosis',
      'Myasthenia Gravis',
      'Poliomyelitis',
    ],
    correctIndex: 0,
    pearl: 'الضعف المتماثل الصاعد السريع بعد عدوى + غياب الـ Reflexes (Areflexia) هي علامات Guillain-Barré Syndrome.',
  },
  {
    id: 41,
    title: 'تدهور الرؤية وتعب بالحرارة في شابة',
    specialty: 'Neurology',
    clues: [
      'شابة 28 سنة جالها زغللة وألم في عين واحدة (Optic Neuritis) من سنة، ودلوقتي عندها تنميل متفرق.',
      'أعراضها بتسوء جداً لما الجو يسخن أو تاخد حمام دافي (Uhthoff’s Phenomenon).',
      'تعب شديد (Fatigue) ومثانة عصبية مع علامات Upper Motor Neuron.',
      'مرض مناعي مزمن بيعمل Demyelination في المخ والحبل الشوكي على هيئة نوبات.',
    ],
    options: [
      'Multiple Sclerosis (MS)',
      'Myasthenia Gravis',
      'GBS',
      'ALS',
    ],
    correctIndex: 0,
    pearl: 'تاريخ Optic Neuritis + نوبات متفرقة في شابة + سوء الأعراض بالحرارة (Uhthoff’s) يميز Multiple Sclerosis.',
  },
  {
    id: 42,
    title: 'الالتصاق الحشوي بعد إصابة نصف الحبل الشوكي',
    specialty: 'Neurology (SCI)',
    clues: [
      'مريض اتصاب بطعنة في نص الحبل الشوكي اليمين فقط (Hemisection).',
      'فقدان الحركة والـ Proprioception في الرجل اليمين (نفس جهة الإصابة).',
      'فقدان الإحساس بالألم والحرارة في الرجل الشمال (الجهة المعاكسة).',
      'أفضل متلازمة SCI من حيث توقعات التحسن والعودة للمشي.',
    ],
    options: [
      'Brown-Séquard Syndrome',
      'Anterior Cord Syndrome',
      'Central Cord Syndrome',
      'Posterior Cord Syndrome',
    ],
    correctIndex: 0,
    pearl: 'فقدان الحركة والاهتزاز في نفس الجهة + فقدان الألم والحرارة في الجهة المعاكسة = Brown-Séquard Syndrome.',
  },
  {
    id: 43,
    title: 'إصبع يعلق ومش بيتفرد بسهولة',
    specialty: 'Hand & Wrist',
    clues: [
      'مريض سكر بيشتكي إن صباعه البنصر بيعلق وهو متني ولما يفرده بيعمل "تكة" مؤلمة.',
      'بنحس كلكيعة صغيرة عند قاعدة الصباع على كف الإيد (A1 Pulley).',
      'المشكلة في احتكاك وتر الـ Flexor Digitorum داخل الغلاف بتاعه.',
      'يُعرف طبياً باسم Stenosing Tenosynovitis.',
    ],
    options: [
      'Trigger Finger',
      'Dupuytren’s Contracture',
      'Mallet Finger',
      'Boutonnière Deformity',
    ],
    correctIndex: 0,
    pearl: 'تعلق الصباع مع طقطقة عند الفرد ووجود عقدة عند الـ A1 Pulley يشخص Trigger Finger.',
  },
  {
    id: 44,
    title: 'شد في راحة اليد يثني البنصر والخنصر',
    specialty: 'Hand & Wrist',
    clues: [
      'رجل 60 سنة عنده حبال ليفية سميكة مشدودة في كف إيده بتشد الصباع الرابع والخامس لجوه.',
      'المريض مش قادر يفرد كف إيده مفرود على الترابيزة (Tabletop Test إيجابي).',
      'الحالة مش مؤلمة غالباً ولكنها بتعمل Fixed Flexion Contracture تدريجي.',
      'تسمك وتليف في الـ Palmar Fascia.',
    ],
    options: [
      'Dupuytren’s Contracture',
      'Trigger Finger',
      'Ulnar Nerve Claw Hand',
      'Carpal Tunnel Syndrome',
    ],
    correctIndex: 0,
    pearl: 'تليف الـ Palmar Fascia وثني البنصر والخنصر مع إيجابية Tabletop Test يميز Dupuytren’s Contracture.',
  },
  {
    id: 45,
    title: 'وجع الكوع من جوه للاعب الجولف',
    specialty: 'Orthopedics',
    clues: [
      'لاعب جولف أو بيسبول بيشتكي من ألم في الناحية الداخلية للكوع.',
      'تندرنس موضعي عند الـ Medial Epicondyle.',
      'ثني الرسغ وعمل Pronation ضد مقاومة بيكرر الألم فوراً.',
      'إجهاد في منشأ عضلات الـ Common Flexor-Pronator Mass.',
    ],
    options: [
      'Medial Epicondylitis (Golfer’s Elbow)',
      'Lateral Epicondylitis (Tennis Elbow)',
      'Cubital Tunnel Syndrome',
      'UCL Tear',
    ],
    correctIndex: 0,
    pearl: 'ألم على الـ Medial Epicondyle يزيد مع Resisted Wrist Flexion و Pronation = Golfer’s Elbow.',
  },
  {
    id: 46,
    title: 'وجع حاد تحت الصابونة عند النط',
    specialty: 'Sports Rehab',
    clues: [
      'لاعب كرة طائرة أو سلة بيشتكي من ألم محدد جداً عند القطب السفلي للصابونة (Inferior Pole of Patella).',
      'الألم بيزيد جداً أثناء النط والهبوط وعند عمل Decline Squat.',
      'تندرنس موضعي على الجزء العلوي من الـ Patellar Tendon.',
      'تُعرف الحالة باسم Jumper’s Knee وعلاجها الأساسي Heavy Slow Resistance / Eccentric.',
    ],
    options: [
      'Patellar Tendinopathy (Jumper’s Knee)',
      'Osgood-Schlatter Disease',
      'PFPS',
      'Quadriceps Rupture',
    ],
    correctIndex: 0,
    pearl: 'ألم محدد عند القطب السفلي للصابونة في لاعبي القفز يزيد بالـ Decline Squat = Patellar Tendinopathy.',
  },
  {
    id: 47,
    title: 'وجع أمام الساق عند الجري على الأسفلت',
    specialty: 'Sports Rehab',
    clues: [
      'مجند أو عدّاء جديد زوّد مسافة الجري فجأة فظهرله وجع منتشر على طول الحرف الداخلي لعظمة القصبة.',
      'التندرنس ممتد على مسافة أكتر من 5 سم في الـ Posteromedial Tibial Border (مش نقطة واحدة زي الكسر).',
      'الألم بيزيد في بداية الجري ثم يخف شوية وبعدها يرجع بعد التمرين.',
      'تُعرف طبياً باسم Medial Tibial Stress Syndrome (MTSS).',
    ],
    options: [
      'Shin Splints (MTSS)',
      'Tibial Stress Fracture',
      'Chronic Compartment Syndrome',
      'DVT',
    ],
    correctIndex: 0,
    pearl: 'الألم المنتشر (> 5 سم) على الحرف الداخلي للقصبة مع زيادة مفاجئة في الجري يميز Shin Splints (MTSS) عن كسر الإجهاد الموضعي.',
  },
  {
    id: 48,
    title: 'فرقعة في السمانة وكأن حد شاطني',
    specialty: 'Sports Rehab',
    clues: [
      'لاعب تنس 42 سنة حس فجأة بفرقعة قوية ورا الكاحل وكأن حد ضربه بمضرب أو شاطه في رجله.',
      'مش قادر يقف على أطراف صوابع رجله المصابة خالص (Single-Leg Heel Rise مستحيل).',
      'في فجوة محسوسة (Palpable Gap) فوق الكعب مباشرة.',
      'عصر السمانة والمريض على بطنه (Thompson Test) مش بيحرك القدم خالص.',
    ],
    options: [
      'Achilles Tendon Rupture',
      'Gastrocnemius Tear',
      'ATFL Sprain',
      'Sever’s Disease',
    ],
    correctIndex: 0,
    pearl: 'إحساس الضربة المفاجئة + Palpable Gap + غياب الحركة في Thompson Test = قطع كامل في وتر أخيل.',
  },
  {
    id: 49,
    title: 'قرصة في ثنية الفخذ عند القرفصاء',
    specialty: 'Hip & Pelvis',
    clues: [
      'لاعب كورة شاب بيشتكي من وجع عميق في ثنية الفخذ الأمامية (Groin C-Sign) لما يقعد أو يعمل Deep Squat.',
      'المدى الحركي للورك محدود خصوصاً في الـ Flexion + Internal Rotation.',
      'اختبار FADIR (Flexion, Adduction, Internal Rotation) جاب نفس القرصة المؤلمة فوراً.',
      'احتكاك عظمي بين رأس الفخذ وحافة الحوض (Cam or Pincer Morphology).',
    ],
    options: [
      'Femoroacetabular Impingement (FAI)',
      'Trochanteric Bursitis',
      'Hip Osteoarthritis',
      'Iliopsoas Strain',
    ],
    correctIndex: 0,
    pearl: 'ألم C-Sign في ثنية الفخذ وإيجابية اختبار FADIR في شاب رياضي تشير إلى Femoroacetabular Impingement (FAI).',
  },
  {
    id: 50,
    title: 'عرج طفل بدون خبطة ووجع في الركبة',
    specialty: 'Pediatrics / Red Flag 🚨',
    isRedFlag: true,
    clues: [
      'ولد 12 سنة وزنه زايد بدأ يعرج ويشتكي من وجع في الفخذ والركبة من غير ما يقع.',
      'عند الفحص، مفصل الركبة سليم تماماً، لكن لما نتني الحوض الرجل بتلف لوحدها للخارج (Obligate External Rotation).',
      'نقص شديد في الـ Hip Internal Rotation.',
      'حالة طوارئ عظام أطفال — ممنوع المشي على الرجل ويجب عمل أشعة حوض فوراً!',
    ],
    options: [
      'Slipped Capital Femoral Epiphysis (SCFE) [Red Flag 🚨]',
      'Osgood-Schlatter Disease',
      'Growing Pains',
      'Patellar Subluxation',
    ],
    correctIndex: 0,
    pearl: '🚨 مراهق بوزن زايد يعرج بوجع ركبة/فخذ مع Obligate External Rotation أثناء ثني الورك = SCFE، ممنوع التحميل والتحويل الفوري.',
  },
  {
    id: 51,
    title: 'ضعف العضلة فوق الشوكة وسقوط الذراع',
    specialty: 'Orthopedics',
    clues: [
      'مريض 62 سنة وقع على كتفه ومش قادر يرفع دراعه للجنب خالص من البداية (0°–15°).',
      'بيرفع كتفه لفوق (Shoulder Shrug) عشان يعوّض ضعف الكتف.',
      'في اختبار Drop Arm Test الذراع بيقع فجأة بعد ما نسيبه عند 90°.',
      'قطع كامل في وتر عضلة الـ Supraspinatus.',
    ],
    options: [
      'Full-Thickness Rotator Cuff Tear',
      'Frozen Shoulder',
      'AC Joint Arthritis',
      'Biceps Tendinitis',
    ],
    correctIndex: 0,
    pearl: 'سقوط الذراع في Drop Arm Test مع Shoulder Shrug وعدم القدرة على بدء الـ Abduction علامات Full-Thickness Rotator Cuff Tear.',
  },
  {
    id: 52,
    title: 'ألم الكتف مع تمزق الشفة العلوية',
    specialty: 'Sports Rehab',
    clues: [
      'لاعب بيسبول أو رمي بيحس بطقطقة عميقة وألم في أعلى الكتف أثناء الرمي.',
      'الألم بيزيد مع اختبار O’Brien’s (Active Compression Test) والإبهام لأسفل ويقل لما يقلب كف إيده لفوق.',
      'الأشعة بالصبغة أظهرت تمزق في أعلى حلقة الكتف الغضروفية مكان اتصال وتر البايسبس.',
      'تُعرف الإصابة اختصاراً بـ SLAP Lesion.',
    ],
    options: [
      'SLAP Lesion (Superior Labral Tear)',
      'Bankart Lesion',
      'Subacromial Bursitis',
      'Suprascapular Palsy',
    ],
    correctIndex: 0,
    pearl: 'ألم عميق بالكتف في لاعبي الرمي مع إيجابية O’Brien’s Test يشخص SLAP Lesion.',
  },
  {
    id: 53,
    title: 'نزول الحوض للجهة السليمة أثناء المشي',
    specialty: 'Biomechanics',
    clues: [
      'مريض بعد عملية مفصل الحوض بيمشي بتمايل غريب في الجذع.',
      'لما يقف على الرجل اليمين المصابة، الحوض من الناحية الشمال السليمة بينزل لتحت!',
      'أو المريض بيميل بجذعه ناحية اليمين المصابة عشان يوازن الجسم (Compensated Gait).',
      'السبب ضعف عضلة Gluteus Medius اليمين أو إصابة الـ Superior Gluteal Nerve.',
    ],
    options: [
      'Trendelenburg Gait (Gluteus Medius Weakness)',
      'Steppage Gait (Foot Drop)',
      'Antalgic Gait',
      'Circumduction Gait',
    ],
    correctIndex: 0,
    pearl: 'سقوط الحوض ناحية الرجل المرفوعة في الـ Single Leg Stance يعني ضعف الـ Gluteus Medius في الرجل الواقفة على الأرض (Trendelenburg Sign).',
  },
  {
    id: 54,
    title: 'رفع الركبة عالياً عشان المشط ميخبطش الأرض',
    specialty: 'Neuro / Gait',
    clues: [
      'مريض بعد إصابة في جنب الركبة عند عنق الـ Fibula مش قادر يرفع وش رجله لفوق (No Dorsiflexion).',
      'أثناء المشي، يرفع فخذه وركبته لفوق بزيادة عشان صوابع رجله متتحكش في الأرض.',
      'بعد الـ Heel Strike، القدم بتخبط في الأرض بصوت واضح (Foot Slap).',
      'إصابة في العصب الشظوي العام (Common Peroneal Nerve).',
    ],
    options: [
      'High Steppage Gait (Foot Drop)',
      'Trendelenburg Gait',
      'Ataxic Gait',
      'Waddling Gait',
    ],
    correctIndex: 0,
    pearl: 'ضعف Dorsiflexion نتيجة إصابة Common Peroneal Nerve يجبر المريض على رفع الركبة عالياً (Steppage Gait).',
  },
  {
    id: 55,
    title: 'تلفظ غير واضح وتكرار اللمس بالإصبع غير دقيق',
    specialty: 'Neurology',
    clues: [
      'مريض بعد جلطة في المخيخ بيمشي فاتح رجليه بزيادة وبيترنح يمين وشمال كأنه دايخ.',
      'لما يمد إيده يلمس أنفه أو صباع الدكتور، إيده بترتعش كل ما يقرب من الهدف (Intention Tremor).',
      'بيفشل في اختبار تكرار قلب الكف بسرعة (Dysdiadochokinesia).',
      'الأعراض تظهر في نفس جهة نصف المخيخ المصاب (Ipsilateral).',
    ],
    options: [
      'Cerebellar Ataxia',
      'Parkinsonism',
      'Sensory Ataxia (Tabes Dorsalis)',
      'Vestibular Neuritis',
    ],
    correctIndex: 0,
    pearl: 'Intention Tremor + Dysdiadochokinesia + Dysmetria + Broad-based Gait هي علامات إصابة المخيخ (Cerebellar Ataxia).',
  },
  {
    id: 56,
    title: 'ألم مفاجئ وتورم وسخونة في مفصل واحد مع حمى',
    specialty: 'Red Flag 🚨',
    isRedFlag: true,
    clues: [
      'مريض جاله فجأة تورم شديد جداً وسخونة واحمرار في مفصل الركبة في يوم واحد.',
      'المريض عنده سخونية عالية (Fever > 38.5°C) ومش قادر يحرك المفصل ولا ملي واحد من شدة الألم.',
      'ممنوع تماماً الجلسات أو التمارين أو الكمادات الدافية — خطر تآكل الغضروف خلال ساعات!',
      'عدوى بكتيرية حادة داخل المفصل تحتاج سحب عينة ومضادات حيوية وريدية فوراً.',
    ],
    options: [
      'Septic Arthritis [Red Flag 🚨]',
      'Osteoarthritis Flare',
      'MCL Sprain',
      'Patellar Tendinitis',
    ],
    correctIndex: 0,
    pearl: '🚨 مفصل واحد حار ومتورم ومؤلم بشدة مع حمى = Septic Arthritis، طوارئ طبية فورية.',
  },
  {
    id: 57,
    title: 'تنميل وحرقان في الفخذ الخارجي من الحزام الضيق',
    specialty: 'Peripheral Nerve',
    clues: [
      'شخص وزنه زايد أو بيلبس حزام ضيق جداً حاسس بتنميل وحرقان في جلد الجنب الخارجي للفخذ.',
      'القوة العضلية للرجل سليمة 100% ومفيش أي ضعف في العضلات أو الـ Reflexes.',
      'انضغاط عصب حسي خالص تحت الـ Inguinal Ligament.',
      'إصابة في الـ Lateral Femoral Cutaneous Nerve.',
    ],
    options: [
      'Meralgia Paresthetica',
      'Sciatica',
      'Femoral Nerve Palsy',
      'ITB Syndrome',
    ],
    correctIndex: 0,
    pearl: 'تنميل حسي فقط في الجنب الخارجي للفخذ بدون أي ضعف عضلي = انضغاط Lateral Femoral Cutaneous Nerve (Meralgia Paresthetica).',
  },
  {
    id: 58,
    title: 'ألم منتصف الفخذ الخلفي أثناء السبرينت',
    specialty: 'Sports Rehab',
    clues: [
      'عدّاء سرعات (Sprinter) حس بشد مفاجئ حاد زي السكينة في ضهر الفخذ وهو بيجري بأقصى سرعة.',
      'تندرنس موضعي في منتصف عضلة Biceps Femoris مع كدمة بعد يومين.',
      'الألم بيزيد جداً مع ثني الركبة ضد مقاومة أو فرد الركبة أثناء ثني الحوض (Active Knee Extension).',
      'العلاج يركز على التدرج بالـ Eccentric Loading (مثل Nordic Curl).',
    ],
    options: [
      'Hamstring Strain',
      'Sciatic Nerve Entrapment',
      'Adductor Longus Strain',
      'Quadriceps Contusion',
    ],
    correctIndex: 0,
    pearl: 'شد مفاجئ في ضهر الفخذ أثناء الـ Sprinting مع ألم في فرد الركبة ومقاومة ثنيها = Hamstring Strain.',
  },
  {
    id: 59,
    title: 'خشونة الركبة وتيبس صباحي أقل من نص ساعة',
    specialty: 'Geriatrics / Ortho',
    clues: [
      'سيدة 62 سنة بتشتكي من وجع في الركبتين بيزيد مع الوقوف والمشي الكتير وبيخف بالراحة.',
      'تيبس صباحي خفيف بيفك في أقل من 30 دقيقة (عكس الروماتويد).',
      'أثناء الحركة بنحس طقطقة وخشونة تحت الإيد (Crepitus) وتضخم عظمي بسيط.',
      'الأشعة بتبين ضيق في المسافة المفصلية (Joint Space Narrowing) ونتوءات عظمية (Osteophytes).',
    ],
    options: [
      'Knee Osteoarthritis (OA)',
      'Rheumatoid Arthritis (RA)',
      'Septic Arthritis',
      'Gout',
    ],
    correctIndex: 0,
    pearl: 'تيبس صباحي < 30 دقيقة + Crepitus + ألم يزيد بالحركة ويخف بالراحة في كبار السن = Osteoarthritis.',
  },
  {
    id: 60,
    title: 'انضغاط العصب في الكوع وتنميل الصوابع التلاتة',
    specialty: 'Peripheral Nerve',
    clues: [
      'نجار بيستخدم مفك بضغط متكرر حاسس بتنميل في كف الإيد والصوابع التلاتة الأولى ووجع في الساعد.',
      'على عكس النفق الرسغي، الإحساس في راحة اليد (Palmar Cutaneous Branch) متأثر كمان!',
      'ألم عند الضغط على عضلة Pronator Teres في أعلى الساعد.',
      'مقاومة الـ Pronation مع فرد الكوع بتزود الأعراض.',
    ],
    options: [
      'Pronator Teres Syndrome',
      'Carpal Tunnel Syndrome',
      'Cubital Tunnel Syndrome',
      'Radial Tunnel Syndrome',
    ],
    correctIndex: 0,
    pearl: 'تأثر إحساس راحة اليد (Palmar Cutaneous Branch) مع ألم الساعد يفرق Pronator Teres Syndrome عن Carpal Tunnel Syndrome.',
  },
];

function pickSessionCases(): ClinicalCase[] {
  let seenIds: number[] = [];
  try {
    const raw = sessionStorage.getItem('pt_detective_seen');
    if (raw) seenIds = JSON.parse(raw);
  } catch {
    seenIds = [];
  }

  let unseen = CLINICAL_CASES.filter((c) => !seenIds.includes(c.id));
  if (unseen.length < 5) {
    seenIds = [];
    unseen = [...CLINICAL_CASES];
  }

  const picked = [...unseen].sort(() => Math.random() - 0.5).slice(0, 5);
  try {
    const nextSeen = [...seenIds, ...picked.map((p) => p.id)];
    sessionStorage.setItem('pt_detective_seen', JSON.stringify(nextSeen));
  } catch {
    // Ignore storage errors
  }
  return picked;
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
