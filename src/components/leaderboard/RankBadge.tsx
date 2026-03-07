import { Crown, Medal } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  showReward?: boolean;
  className?: string;
}

/**
 * RankBadge Component
 * 
 * Displays rank with visual styling and special badges for top 3
 * 
 * Requirements:
 * - 8.2: First place gets special crown badge and 50 coins
 * - 8.3: Second place gets silver medal badge and 25 coins
 * - 8.4: Third place gets bronze medal badge and 10 coins
 */
export function RankBadge({ rank, size = 'md', showReward = false, className }: RankBadgeProps) {
  const getRewardAmount = (rank: number): number => {
    if (rank === 1) return 50;
    if (rank === 2) return 25;
    if (rank === 3) return 10;
    return 0;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-4 h-4',
          text: 'text-xs',
          badge: 'w-6 h-6',
        };
      case 'lg':
        return {
          icon: 'w-8 h-8',
          text: 'text-xl',
          badge: 'w-12 h-12',
        };
      default: // md
        return {
          icon: 'w-6 h-6',
          text: 'text-base',
          badge: 'w-10 h-10',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Top 3 get special badges
  if (rank === 1) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg ring-2 ring-yellow-200',
          sizeClasses.badge
        )}>
          <Crown className={cn(sizeClasses.icon, 'text-white drop-shadow')} />
        </div>
        {showReward && (
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
            +{getRewardAmount(rank)} монет
          </span>
        )}
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg',
          sizeClasses.badge
        )}>
          <Medal className={cn(sizeClasses.icon, 'text-white')} />
        </div>
        {showReward && (
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
            +{getRewardAmount(rank)} монет
          </span>
        )}
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg',
          sizeClasses.badge
        )}>
          <Medal className={cn(sizeClasses.icon, 'text-white')} />
        </div>
        {showReward && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
            +{getRewardAmount(rank)} монет
          </span>
        )}
      </div>
    );
  }

  // Ranks 4+ get simple number badge
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center font-bold text-white shadow-md',
        sizeClasses.badge
      )}>
        <span className={sizeClasses.text}>#{rank}</span>
      </div>
    </div>
  );
}
