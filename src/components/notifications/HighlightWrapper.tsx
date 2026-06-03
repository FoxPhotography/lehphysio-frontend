import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface HighlightWrapperProps {
  children: React.ReactNode;
  isHighlighted?: boolean;
  highlightColor?: string;
  className?: string;
}

export const HighlightWrapper: React.FC<HighlightWrapperProps> = ({
  children,
  isHighlighted = false,
  highlightColor = 'var(--orange)',
  className = '',
}) => {
  const [active, setActive] = useState(isHighlighted);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isHighlighted) {
      setActive(true);
      timeoutRef.current = setTimeout(() => setActive(false), 3000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHighlighted]);

  return (
    <div className={`relative ${className}`}>
      {active && (
        <motion.div
          initial={{ opacity: 0.6, scale: 1.02 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{ duration: 3, ease: 'easeOut' }}
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{
            boxShadow: `0 0 20px ${highlightColor}40, inset 0 0 20px ${highlightColor}15`,
            border: `2px solid ${highlightColor}50`,
          }}
        />
      )}
      {children}
    </div>
  );
};
