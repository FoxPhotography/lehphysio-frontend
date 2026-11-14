import React from 'react';
import { getStreakTheme, streakVars } from '../../utils/streakTheme';
import { cosmeticVisual } from '../../utils/cosmetics';
import { StreakBubbleLayers, StreakName } from './Streak';

/**
 * Same rules as the public chat: shop cosmetics win, otherwise 3+ day streaks
 * colour the comment bubble and the name. Your own comments use your live data.
 */
export function commentLook(c: any, me?: any) {
  const mine = !!me && (c?.username === me.username || (c?.user_id != null && c.user_id === me.id));
  const days = mine ? (me?.streak_count ?? c?.streak_count ?? 0) : (c?.streak_count || 0);
  const cos = mine ? (me?.cosmetics || c?.cosmetics) : c?.cosmetics;
  const bubbleCos = cosmeticVisual(cos?.bubble);
  const nameCos = cosmeticVisual(cos?.name);
  const theme = bubbleCos || getStreakTheme(days);
  return {
    days,
    bubbleCos,
    nameCos,
    fancy: !!bubbleCos || days >= 3,
    styledName: !!nameCos || days >= 3,
    theme,
  };
}

type Look = ReturnType<typeof commentLook>;

/** Classes + style for the bubble element (layers are clipped separately so menus can overflow). */
export function bubbleProps(look: Look): { className: string; style?: React.CSSProperties } {
  if (!look.fancy) return { className: '' };
  return {
    className: `streak-bubble streak-bubble--open streak-bubble--${look.theme.key}${look.bubbleCos ? ` cos-fx cos-fx--${look.bubbleCos.fx}` : ''}`,
    style: streakVars(look.theme),
  };
}

export const CommentBubbleLayers: React.FC<{ look: Look }> = ({ look }) =>
  look.fancy ? (
    <span aria-hidden className="streak-bubble__layers">
      <StreakBubbleLayers days={look.days} override={look.bubbleCos} />
    </span>
  ) : null;

export const CommentName: React.FC<{ look: Look; children: React.ReactNode; className?: string }> = ({ look, children, className = '' }) =>
  look.styledName ? (
    <StreakName days={look.days} override={look.nameCos} className={className}>{children}</StreakName>
  ) : (
    <span className={className}>{children}</span>
  );
