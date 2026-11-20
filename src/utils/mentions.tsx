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

export interface ChatTextHandlers {
  onMentionClick?: (username: string) => void;
  onChannelClick?: (channel: 'suggestions') => void;
  onGameClick?: (game: 'anatomy') => void;
}

const CHAT_LINK_TAGS = [
  { tag: '#تحدي التشريح', kind: 'game' as const, value: 'anatomy' as const },
  { tag: '#الاقتراحات', kind: 'channel' as const, value: 'suggestions' as const },
];

/** Formats user mentions and the supported chat channel/game links. */
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
  const sortedTags = [...CHAT_LINK_TAGS].sort((a, b) => b.tag.length - a.tag.length);
  const mentionAlternatives = uniqueSortedNames.map(escapeRegex).join('|');
  const tagAlternatives = sortedTags.map(({ tag }) => escapeRegex(tag)).join('|');
  const alternatives = [
    mentionAlternatives ? `@(?:${mentionAlternatives})` : '',
    '@[^\\s@]+',
    `(?:${tagAlternatives})`,
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

    const tag = sortedTags.find((item) => item.tag.toLowerCase() === part.toLowerCase());
    if (tag) {
      return (
        <button
          key={idx}
          type="button"
          className={`${customClass} inline p-0 border-0 bg-transparent`}
          onClick={(e) => {
            e.stopPropagation();
            if (tag.kind === 'channel') handlers.onChannelClick?.(tag.value);
            else handlers.onGameClick?.(tag.value);
          }}
        >
          {part}
        </button>
      );
    }

    return part;
  });
}
