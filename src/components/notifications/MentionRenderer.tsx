import React from 'react';

interface MentionRendererProps {
  text: string;
  onMentionClick?: (username: string) => void;
  className?: string;
}

export const MentionRenderer: React.FC<MentionRendererProps> = ({
  text,
  onMentionClick,
  className = '',
}) => {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.startsWith('@')) {
          const username = part.substring(1);
          return (
            <span
              key={idx}
              className="text-brand-orange font-extrabold cursor-pointer hover:underline transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (onMentionClick) {
                  onMentionClick(username);
                }
              }}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
};
