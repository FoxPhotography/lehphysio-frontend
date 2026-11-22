import type { GameAccent } from './ui/GameTile';
import type { MascotCharacter } from './ui/Mascot';

export type SingleGameKey =
  | 'diagnosis'
  | 'special-tests'
  | 'whos-responsible'
  | 'sudoku'
  | 'wordle'
  | 'nerve-path'
  | 'memory'
  | 'spin';

export type GameCategory = 'clinical' | 'anatomy' | 'puzzle' | 'daily';

export type GameArtKey =
  | 'ecg'
  | 'osce'
  | 'muscle'
  | 'sudoku'
  | 'wordle'
  | 'nerve'
  | 'memory'
  | 'wheel';

export interface GameCatalogEntry {
  key: SingleGameKey;
  gameId: number | null;
  title: string;
  titleEn?: string;
  desc: string;
  tags: string[];
  category: GameCategory;
  accent: GameAccent;
  mascot: MascotCharacter;
  practiceSupported: boolean;
  isNew: boolean;
  artKey: GameArtKey;
  ctaLabel: string;
}

export const GAME_CATEGORIES: Array<{ id: 'all' | GameCategory; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'clinical', label: 'إكلينيكي' },
  { id: 'anatomy', label: 'تشريح' },
  { id: 'puzzle', label: 'ألغاز' },
  { id: 'daily', label: 'يومي' },
];

export const FEATURED_PRIORITY: SingleGameKey[] = [
  'wordle',
  'sudoku',
  'diagnosis',
  'whos-responsible',
  'special-tests',
  'nerve-path',
  'memory',
];

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    key: 'diagnosis',
    gameId: 2,
    title: 'شخّص الحالة (عيادة الطوارئ)',
    desc: 'حالات عظام وأعصاب و Red Flags حقيقية بتتكشف على 4 دلائل. كل ما تشخّص أسرع تاخد نقاط أعلى!',
    tags: ['تفكير إكلينيكي'],
    category: 'clinical',
    accent: 'teal',
    mascot: 'doctor',
    practiceSupported: true,
    isNew: true,
    artKey: 'ecg',
    ctaLabel: 'ابدأ العيادة',
  },
  {
    key: 'special-tests',
    gameId: 3,
    title: 'سباق الـ Special Tests (OSCE)',
    desc: 'اختبارات الـ Orthopedic والـ Neuro تحت ضغط الوقت مع نظام Combo x4 وبونص ثواني!',
    tags: ['سرعة وتركيز', '60 ثانية'],
    category: 'clinical',
    accent: 'violet',
    mascot: 'doctor',
    practiceSupported: true,
    isNew: false,
    artKey: 'osce',
    ctaLabel: 'ابدأ السباق',
  },
  {
    key: 'whos-responsible',
    gameId: 5,
    title: 'مين المسؤول؟',
    titleEn: "Who's Responsible?",
    desc: 'اختار العضلة المسؤولة عن الحركة، واربطها بالـ Nerve والـ Origin والـ Insertion!',
    tags: ['كينيسيولوجي'],
    category: 'anatomy',
    accent: 'green',
    mascot: 'muscle',
    practiceSupported: true,
    isNew: true,
    artKey: 'muscle',
    ctaLabel: 'العب',
  },
  {
    key: 'sudoku',
    gameId: 6,
    title: 'سودوكو التشريح',
    desc: 'كل مربع يكمل بيكشف حروف، وفي الآخر جمّع المصطلح الطبي السري واكسب لحد 500 XP!',
    tags: ['تصاعدي · 150 → 300 → 500 XP'],
    category: 'puzzle',
    accent: 'purple',
    mascot: 'brain',
    practiceSupported: true,
    isNew: false,
    artKey: 'sudoku',
    ctaLabel: 'العب',
  },
  {
    key: 'wordle',
    gameId: 7,
    title: 'أكمل الجملة الطبية (Wordle)',
    desc: 'خمّن الكلمة الطبية الناقصة في جملة مفيدة (زي Sartorius) خلال 6 محاولات!',
    tags: ['Wordle طبي'],
    category: 'puzzle',
    accent: 'gold',
    mascot: 'brain',
    practiceSupported: true,
    isNew: true,
    artKey: 'wordle',
    ctaLabel: 'العب',
  },
  {
    key: 'nerve-path',
    gameId: 4,
    title: 'مسار الأعصاب',
    desc: 'حرّك المكعبات ورتّب المسار العصبي عشان توصل الإشارة الكهربائية من الجدع للعضلة!',
    tags: ['ألغاز عصبية'],
    category: 'anatomy',
    accent: 'cyan',
    mascot: 'nerve',
    practiceSupported: true,
    isNew: true,
    artKey: 'nerve',
    ctaLabel: 'العب',
  },
  {
    key: 'memory',
    gameId: 1,
    title: 'توصيل التشريح الإكلينيكي',
    desc: 'وصّل كل عضلة بالعصب المغذي لها أو الاختبار التشخيصي بتاعها بأقل عدد من الحركات.',
    tags: ['ذاكرة تشريحية'],
    category: 'anatomy',
    accent: 'orange',
    mascot: 'skeleton',
    practiceSupported: true,
    isNew: false,
    artKey: 'memory',
    ctaLabel: 'العب',
  },
  {
    key: 'spin',
    gameId: null,
    title: 'عجلة الحظ اليومية',
    desc: 'لفة مجانية كل يوم بفيزيكس حقيقية وجاكبوت Mystery Box بـ 500 XP!',
    tags: ['جاكبوت 500 XP'],
    category: 'daily',
    accent: 'amber',
    mascot: 'doctor',
    practiceSupported: false,
    isNew: false,
    artKey: 'wheel',
    ctaLabel: 'افتح العجلة',
  },
];
