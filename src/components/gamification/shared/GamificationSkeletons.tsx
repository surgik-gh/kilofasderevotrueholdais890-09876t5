import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const shimmer = 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]';

// Achievement Card Skeleton
export function AchievementCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('p-6 rounded-2xl liquid-glass', className)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn('w-16 h-16 rounded-2xl', shimmer)} />
        
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className={cn('h-5 w-3/4 rounded', shimmer)} />
          
          {/* Description */}
          <div className="space-y-2">
            <div className={cn('h-4 w-full rounded', shimmer)} />
            <div className={cn('h-4 w-5/6 rounded', shimmer)} />
          </div>
          
          {/* Progress bar */}
          <div className={cn('h-2 w-full rounded-full', shimmer)} />
          
          {/* Reward */}
          <div className="flex items-center gap-2">
            <div className={cn('h-6 w-20 rounded-lg', shimmer)} />
            <div className={cn('h-6 w-16 rounded-lg', shimmer)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Quest Card Skeleton
export function QuestCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('p-5 rounded-2xl liquid-glass', className)}
    >
      <div className="flex items-start gap-3 mb-4">
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-xl', shimmer)} />
        
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className={cn('h-5 w-2/3 rounded', shimmer)} />
          {/* Type badge */}
          <div className={cn('h-5 w-20 rounded-full', shimmer)} />
        </div>
      </div>
      
      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className={cn('h-4 w-full rounded', shimmer)} />
        <div className={cn('h-4 w-4/5 rounded', shimmer)} />
      </div>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className={cn('h-3 w-16 rounded', shimmer)} />
          <div className={cn('h-3 w-12 rounded', shimmer)} />
        </div>
        <div className={cn('h-2 w-full rounded-full', shimmer)} />
      </div>
      
      {/* Reward */}
      <div className="flex items-center gap-2 mt-4">
        <div className={cn('h-8 w-24 rounded-lg', shimmer)} />
        <div className={cn('h-8 w-20 rounded-lg', shimmer)} />
      </div>
    </motion.div>
  );
}

// Level Display Skeleton
export function LevelDisplaySkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('p-6 rounded-2xl liquid-glass', className)}
    >
      <div className="flex items-center gap-4 mb-4">
        {/* Level badge */}
        <div className={cn('w-20 h-20 rounded-2xl', shimmer)} />
        
        <div className="flex-1 space-y-2">
          {/* Level text */}
          <div className={cn('h-6 w-32 rounded', shimmer)} />
          {/* XP text */}
          <div className={cn('h-4 w-40 rounded', shimmer)} />
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className={cn('h-3 w-20 rounded', shimmer)} />
          <div className={cn('h-3 w-24 rounded', shimmer)} />
        </div>
        <div className={cn('h-3 w-full rounded-full', shimmer)} />
      </div>
    </motion.div>
  );
}

// Challenge Card Skeleton
export function ChallengeCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('p-6 rounded-2xl liquid-glass', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className={cn('h-6 w-3/4 rounded', shimmer)} />
          {/* Creator */}
          <div className={cn('h-4 w-1/2 rounded', shimmer)} />
        </div>
        {/* Status badge */}
        <div className={cn('h-6 w-20 rounded-full', shimmer)} />
      </div>
      
      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className={cn('h-4 w-full rounded', shimmer)} />
        <div className={cn('h-4 w-5/6 rounded', shimmer)} />
      </div>
      
      {/* Participants */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn('w-8 h-8 rounded-full', shimmer)} />
        <div className={cn('w-8 h-8 rounded-full', shimmer)} />
        <div className={cn('w-8 h-8 rounded-full', shimmer)} />
      </div>
      
      {/* Progress */}
      <div className={cn('h-2 w-full rounded-full mb-4', shimmer)} />
      
      {/* Actions */}
      <div className="flex gap-2">
        <div className={cn('h-10 flex-1 rounded-xl', shimmer)} />
        <div className={cn('h-10 w-24 rounded-xl', shimmer)} />
      </div>
    </motion.div>
  );
}

// Milestone Card Skeleton
export function MilestoneCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('p-5 rounded-2xl liquid-glass', className)}
    >
      <div className="flex items-center gap-4 mb-3">
        {/* Icon */}
        <div className={cn('w-14 h-14 rounded-xl', shimmer)} />
        
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className={cn('h-5 w-2/3 rounded', shimmer)} />
          {/* Category */}
          <div className={cn('h-4 w-1/3 rounded', shimmer)} />
        </div>
      </div>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className={cn('h-3 w-20 rounded', shimmer)} />
          <div className={cn('h-3 w-16 rounded', shimmer)} />
        </div>
        <div className={cn('h-2 w-full rounded-full', shimmer)} />
      </div>
    </motion.div>
  );
}

// Streak Display Skeleton
export function StreakDisplaySkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('p-5 rounded-2xl liquid-glass', className)}
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-xl', shimmer)} />
        
        <div className="flex-1 space-y-2">
          {/* Type */}
          <div className={cn('h-4 w-24 rounded', shimmer)} />
          {/* Count */}
          <div className={cn('h-6 w-16 rounded', shimmer)} />
        </div>
      </div>
      
      {/* Best streak */}
      <div className={cn('h-4 w-32 rounded', shimmer)} />
    </motion.div>
  );
}

// Seasonal Event Banner Skeleton
export function SeasonalEventBannerSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('p-8 rounded-3xl liquid-glass', className)}
    >
      <div className="flex items-center gap-6">
        {/* Icon */}
        <div className={cn('w-24 h-24 rounded-2xl', shimmer)} />
        
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className={cn('h-8 w-2/3 rounded', shimmer)} />
          {/* Description */}
          <div className="space-y-2">
            <div className={cn('h-4 w-full rounded', shimmer)} />
            <div className={cn('h-4 w-4/5 rounded', shimmer)} />
          </div>
          {/* Progress */}
          <div className={cn('h-3 w-full rounded-full', shimmer)} />
        </div>
      </div>
    </motion.div>
  );
}

// Leaderboard Entry Skeleton
export function LeaderboardEntrySkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex items-center gap-4 p-4 rounded-xl liquid-glass', className)}
    >
      {/* Rank */}
      <div className={cn('w-8 h-8 rounded-lg', shimmer)} />
      
      {/* Avatar */}
      <div className={cn('w-12 h-12 rounded-full', shimmer)} />
      
      <div className="flex-1 space-y-2">
        {/* Name */}
        <div className={cn('h-4 w-32 rounded', shimmer)} />
        {/* School */}
        <div className={cn('h-3 w-24 rounded', shimmer)} />
      </div>
      
      {/* Score */}
      <div className={cn('h-6 w-16 rounded', shimmer)} />
    </motion.div>
  );
}

// Grid of skeletons
export function SkeletonGrid({
  count = 6,
  component: Component = AchievementCardSkeleton,
  className = '',
}: {
  count?: number;
  component?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

// List of skeletons
export function SkeletonList({
  count = 5,
  component: Component = QuestCardSkeleton,
  className = '',
}: {
  count?: number;
  component?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

// Loading spinner with message
export function GamificationLoadingSpinner({
  message = 'Загрузка...',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex flex-col items-center justify-center p-12', className)}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-4 animate-pulse">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-600 font-medium">{message}</p>
    </motion.div>
  );
}
