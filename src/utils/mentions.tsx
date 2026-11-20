import React from 'react';

function escapeRegex(str: string): string {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Parses and formats text containing @mentions (including multi-word usernames with spaces/hyphens like "@Mai Abd-Elfattah").
 */
export function formatMentions(
  text: string,
  usernamesList?: Array<string | { username: string }>,
  customClass: string = 'text-brand-orange font-extrabold hover:underline cursor-pointer transition-colors',
  onMentionClick?: (username: string) => void
): React.ReactNode {
  if (!text) return '';

  const names: string[] = (usernamesList || [])
    .map((u) => (typeof u === 'string' ? u : u?.username))
    .filter(Boolean);

  // Remove duplicates and sort descending by length so longer names match first
  const uniqueSorted = Array.from(new Set(names)).sort((a, b) => b.length - a.length);

  let regex: RegExp;
  if (uniqueSorted.length > 0) {
    const escapedNames = uniqueSorted.map(escapeRegex).join('|');
    regex = new RegExp(`(@(?:${escapedNames})|@[^\\s@]+)`, 'gi');
  } else {
    regex = /(@[^\s@]+)/g;
  }

  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <bdi
          key={idx}
          dir="ltr"
          className={customClass}
          onClick={(e) => {
            if (onMentionClick) {
              e.stopPropagation();
              onMentionClick(username);
            }
          }}
        >
          {part}
        </bdi>
      );
    }
    return part;
  });
}

export interface ChatTagItem {
  tag: string;
  label: string;
  description: string;
  category: 'صفحات' | 'تشانلز' | 'ألعاب';
  icon: string;
  kind: 'page' | 'channel' | 'game';
  target: string;
  aliases?: string[];
}

export const CHAT_DISCOVERY_TAGS: ChatTagItem[] = [
  // الرئيسية
  {
    tag: '#الرئيسية',
    label: 'الصفحة الرئيسية',
    description: 'المنشورات والتحديثات وموجز الكلية',
    category: 'صفحات',
    icon: '🏠',
    kind: 'page',
    target: 'home',
    aliases: ['#رئيسية', '#الرئيسيه', '#رئيسيه', '#home']
  },
  // الحلقات
  {
    tag: '#الحلقات',
    label: 'الحلقات والشروحات',
    description: 'شروحات الفيديوهات والكويزات الطبية',
    category: 'صفحات',
    icon: '🎬',
    kind: 'page',
    target: 'episodes',
    aliases: ['#حلقات', '#فيديوهات', '#episodes']
  },
  // الاقتراحات
  {
    tag: '#الاقتراحات',
    label: 'اقتراحات المجتمع',
    description: 'شارك أفكارك وصوّت على اقتراحات زمايلك',
    category: 'تشانلز',
    icon: '💡',
    kind: 'channel',
    target: 'suggestions',
    aliases: ['#اقتراحات', '#أفكار', '#افكار', '#suggestions']
  },
  // الألعاب
  {
    tag: '#الالعاب',
    label: 'مركز الألعاب',
    description: 'ألعاب التحدي والسرعة الطبية الفردية والجماعية',
    category: 'ألعاب',
    icon: '🎮',
    kind: 'page',
    target: 'games',
    aliases: ['#الألعاب', '#العاب', '#ألعاب', '#games']
  },
  // تحدي التشريح
  {
    tag: '#تحدي التشريح',
    label: 'تحدي التشريح السريع',
    description: 'اختبر سرعتك ومعلوماتك في عضلات وأعصاب وعظام الجسم',
    category: 'ألعاب',
    icon: '🧠',
    kind: 'game',
    target: 'anatomy',
    aliases: ['#تشريح', '#التشريح', '#تحدي_التشريح', '#anatomy']
  },
  // المحقق الإكلينيكي
  {
    tag: '#المحقق الاكلينيكي',
    label: 'المحقق الإكلينيكي',
    description: 'تشخيص الحالات السريرية والـ Red Flags التفاعلية',
    category: 'ألعاب',
    icon: '🩺',
    kind: 'game',
    target: 'clinical',
    aliases: ['#المحقق_الاكلينيكي', '#المحقق', '#كلينيكال', '#clinical']
  },
  // اختبارات الفحص الخاص
  {
    tag: '#اختبارات الفحص الخاص',
    label: 'مبارزة الـ Special Tests',
    description: 'اختبارات المفاصل والعظام والأعصاب التخصصية',
    category: 'ألعاب',
    icon: '⚡',
    kind: 'game',
    target: 'special_tests',
    aliases: ['#اختبارات_الفحص_الخاص', '#فحص_خاص', '#special_tests', '#osce']
  },
  // المتصدرين
  {
    tag: '#المتصدرين',
    label: 'لوحة المتصدرين',
    description: 'قائمة أوائل الدفعة وتنافس نقاط الـ XP',
    category: 'صفحات',
    icon: '🏆',
    kind: 'page',
    target: 'leaderboard',
    aliases: ['#متصدرين', '#ترتيب', '#leaderboard']
  },
  // المكافآت
  {
    tag: '#المكافآت',
    label: 'المكافآت والمتجر',
    description: 'إطارات البروفايل، الثيمات، وصناديق الهدايا',
    category: 'صفحات',
    icon: '🎁',
    kind: 'page',
    target: 'rewards',
    aliases: ['#مكافآت', '#المكافات', '#مكافات', '#متجر', '#rewards']
  },
  // الأخبار
  {
    tag: '#الأخبار',
    label: 'الأخبار والتنبيهات',
    description: 'آخر الأخبار الرسمية وإعلانات الكلية والدفعة',
    category: 'صفحات',
    icon: '📰',
    kind: 'page',
    target: 'news',
    aliases: ['#أخبار', '#الاخبار', '#اخبار', '#news']
  },
];

/** Normalizes Arabic characters for friendly substring search */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

/** Filters chat discovery tags dynamically based on user input */
export function filterChatTags(query: string): ChatTagItem[] {
  const cleanQ = normalizeArabic(query.replace(/^#/, ''));
  if (!cleanQ) return CHAT_DISCOVERY_TAGS;

  return CHAT_DISCOVERY_TAGS.filter((item) => {
    const normTag = normalizeArabic(item.tag.replace(/^#/, ''));
    const normLabel = normalizeArabic(item.label);
    const normDesc = normalizeArabic(item.description);
    const normAliases = (item.aliases || []).map((a) => normalizeArabic(a.replace(/^#/, '')));

    return (
      normTag.includes(cleanQ) ||
      normLabel.includes(cleanQ) ||
      normDesc.includes(cleanQ) ||
      normAliases.some((a) => a.includes(cleanQ))
    );
  });
}

export interface ChatTextHandlers {
  onMentionClick?: (username: string) => void;
  onChannelClick?: (channel: 'suggestions') => void;
  onGameClick?: (game: string) => void;
  onTagClick?: (tagItem: ChatTagItem) => void;
}

/** Formats user mentions and the supported chat channel/game/page links. */
export function formatChatText(
  text: string,
  usernamesList?: Array<string | { username: string }>,
  customClass: string = 'text-brand-orange font-extrabold hover:underline cursor-pointer transition-colors',
  handlers: ChatTextHandlers = {}
): React.ReactNode {
  if (!text) return '';

  const names: string[] = (usernamesList || [])
    .map((u) => (typeof u === 'string' ? u : u?.username))
    .filter(Boolean);
  const uniqueSortedNames = Array.from(new Set(names)).sort((a, b) => b.length - a.length);

  const allTagEntries = CHAT_DISCOVERY_TAGS.flatMap((item) => [
    { text: item.tag, item },
    ...(item.aliases || []).map((alias) => ({ text: alias, item })),
  ]);
  const sortedTagEntries = allTagEntries.sort((a, b) => b.text.length - a.text.length);

  const mentionAlternatives = uniqueSortedNames.map(escapeRegex).join('|');
  const tagAlternatives = sortedTagEntries.map(({ text: t }) => escapeRegex(t)).join('|');
  const alternatives = [
    mentionAlternatives ? `@(?:${mentionAlternatives})` : '',
    '@[^\\s@]+',
    tagAlternatives ? `(?:${tagAlternatives})` : '',
  ].filter(Boolean).join('|');
  const parts = text.split(new RegExp(`(${alternatives})`, 'gi'));

  return parts.map((part, idx) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <bdi
          key={idx}
          dir="ltr"
          className={customClass}
          onClick={(e) => {
            if (handlers.onMentionClick) {
              e.stopPropagation();
              handlers.onMentionClick(username);
            }
          }}
        >
          {part}
        </bdi>
      );
    }

    const matchedEntry = sortedTagEntries.find(
      (entry) => entry.text.toLowerCase() === part.toLowerCase()
    );
    if (matchedEntry) {
      return (
        <button
          key={idx}
          type="button"
          className={`${customClass} inline p-0 border-0 bg-transparent`}
          onClick={(e) => {
            e.stopPropagation();
            if (handlers.onTagClick) {
              handlers.onTagClick(matchedEntry.item);
            } else if (matchedEntry.item.kind === 'channel') {
              handlers.onChannelClick?.(matchedEntry.item.target as any);
            } else {
              handlers.onGameClick?.(matchedEntry.item.target);
            }
          }}
        >
          {part}
        </button>
      );
    }

    return part;
  });
}
