import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'list';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ 
  variant = 'text', 
  count = 1,
  className = '' 
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]';

  const variants = {
    text: (
      <div className={cn('h-4 rounded', baseClasses, className)} />
    ),
    card: (
      <div className={cn('p-6 rounded-2xl liquid-glass', className)}>
        <div className={cn('h-6 w-3/4 rounded mb-4', baseClasses)} />
        <div className={cn('h-4 w-full rounded mb-2', baseClasses)} />
        <div className={cn('h-4 w-5/6 rounded mb-2', baseClasses)} />
        <div className={cn('h-4 w-4/6 rounded', baseClasses)} />
      </div>
    ),
    avatar: (
      <div className={cn('w-12 h-12 rounded-full', baseClasses, className)} />
    ),
    button: (
      <div className={cn('h-10 w-32 rounded-xl', baseClasses, className)} />
    ),
    list: (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-xl', baseClasses)} />
            <div className="flex-1 space-y-2">
              <div className={cn('h-4 w-3/4 rounded', baseClasses)} />
              <div className={cn('h-3 w-1/2 rounded', baseClasses)} />
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {variants[variant]}
        </div>
      ))}
    </motion.div>
  );
}

// Specific skeleton components for common use cases
export function LessonCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl liquid-glass">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
          <div className="h-4 w-1/2 rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="h-4 w-5/6 rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="w-10 h-10 rounded-full animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="h-4 w-full rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="h-4 w-3/4 rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
      </div>
    </div>
  );
}

export function LeaderboardEntrySkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl liquid-glass">
      <div className="w-8 h-8 rounded-lg animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
      <div className="w-10 h-10 rounded-full animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="h-3 w-24 rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
      </div>
      <div className="h-6 w-16 rounded animate-pulse bg-gradient-to-r from-slate-200 to-slate-100" />
    </div>
  );
}
