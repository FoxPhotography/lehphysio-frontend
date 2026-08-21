import React from 'react';
import { formatMentions } from '../../utils/mentions';

interface MentionRendererProps {
  text: string;
  onMentionClick?: (username: string) => void;
  className?: string;
  usernames?: any[];
}

export const MentionRenderer: React.FC<MentionRendererProps> = ({
  text,
  onMentionClick,
  className = '',
  usernames = []
}) => {
  if (!text) return null;
  return (
    <span className={className}>
      {formatMentions(
        text,
        usernames,
        'text-brand-orange font-extrabold cursor-pointer hover:underline transition-all',
        onMentionClick
      )}
    </span>
  );
};
