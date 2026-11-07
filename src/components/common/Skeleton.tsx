import React from 'react';

/** Shimmer-free skeleton block (a static tint is cheaper on low-end phones than an animated gradient). */
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden className={`rounded-2xl bg-zinc-900/80 ${className}`} />
);

/** Generic page placeholder shown while a code-split page loads. */
export const PageSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 xl:pt-6 space-y-5 animate-pulse" role="status" aria-label="جاري التحميل">
    <SkeletonBlock className="h-8 w-48" />
    <SkeletonBlock className="h-4 w-72 max-w-full" />
    <SkeletonBlock className="aspect-[16/9] w-full" />
    <div className="grid grid-cols-2 gap-4">
      <SkeletonBlock className="h-28" />
      <SkeletonBlock className="h-28" />
    </div>
    <SkeletonBlock className="h-40 w-full" />
  </div>
);

/** Feed card placeholder (avatar, two text lines, image). */
export const PostSkeleton: React.FC = () => (
  <div aria-hidden className="glass-card p-5 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-zinc-900" />
      <div className="space-y-2 flex-1">
        <div className="h-3 w-32 rounded bg-zinc-900" />
        <div className="h-3 w-20 rounded bg-zinc-900" />
      </div>
    </div>
    <div className="h-3 w-full rounded bg-zinc-900" />
    <div className="h-3 w-2/3 rounded bg-zinc-900" />
    <div className="h-48 w-full rounded-xl bg-zinc-900" />
  </div>
);
