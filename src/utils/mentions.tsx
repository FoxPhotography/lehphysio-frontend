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
        <span
          key={idx}
          className={customClass}
          onClick={(e) => {
            if (onMentionClick) {
              e.stopPropagation();
              onMentionClick(username);
            }
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
