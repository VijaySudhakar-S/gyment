import React from 'react';

interface SkeletonBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({ className = '', style }) => {
  return (
    <div
      style={style}
      className={`bg-black/6 dark:bg-white/8 animate-pulse rounded-md ${className}`}
    />
  );
};
