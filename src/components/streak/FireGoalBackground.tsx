import React from 'react';
import { FireGoalNameplate } from './FireGoalNameplate';

export interface FireGoalBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  loopDelay?: number;
  compact?: boolean;
  standalone?: boolean;
  height?: number | string;
}

export const FireGoalBackground: React.FC<FireGoalBackgroundProps> = ({
  children,
  className = '',
  compact = false,
  height,
}) => {
  return (
    <FireGoalNameplate
      height={height || (compact ? 120 : 160)}
      compact={compact}
      className={className}
    >
      {children}
    </FireGoalNameplate>
  );
};

export default FireGoalBackground;
