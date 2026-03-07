import { motion } from 'framer-motion';
import { TrendingUp, Target } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Milestone } from '@/store';

interface MilestoneProgressProps {
  milestone: Milestone;
  currentValue: number;
  showDetails?: boolean;
  className?: string;
}

/**
 * MilestoneProgress Component
 * 
 * Displays progress towards a specific milestone with visual indicators
 * 
 * Requirements:
 * - 6.6: Show progress to next milestone
 * - 7.6: Visual progress indicator
 */
export function MilestoneProgress({ 
  milestone, 
  currentValue,
  showDetails = true,
  className 
}: MilestoneProgressProps) {
  const progressPercentage = Math.min((currentValue / milestone.threshold) * 100, 100);
  const isAchieved = currentValue >= milestone.threshold;
  const remaining = Math.max(milestone.threshold - currentValue, 0);

  // Category colors
  const categoryConfig = {
    lessons_created: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    quizzes_completed: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
    },
    wisdom_coins: {
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    },
    level_reached: {
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
  };

  const config = categoryConfig[milestone.category as keyof typeof categoryConfig] || categoryConfig.lessons_created;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      {showDetails && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-700 mb-1">
              {milestone.title}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-1">
              {milestone.description}
            </p>
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0',
            config.bg
          )}>
            <Target className={cn('w-3.5 h-3.5', config.text)} />
            <span className={cn('text-xs font-bold', config.text)}>
              {milestone.threshold.toLocaleString('ru-RU')}
            </span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-medium">
          <span className="text-slate-600">
            {currentValue.toLocaleString('ru-RU')} / {milestone.threshold.toLocaleString('ru-RU')}
          </span>
          <span className={cn(
            'font-bold',
            isAchieved ? 'text-green-600' : config.text
          )}>
            {progressPercentage.toFixed(0)}%
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn(
              'h-full bg-gradient-to-r relative',
              isAchieved ? 'from-green-500 to-emerald-500' : config.gradient
            )}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>

          {/* Milestone marker */}
          {!isAchieved && progressPercentage > 10 && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/50"
              style={{ left: `${progressPercentage}%` }}
            />
          )}
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between text-xs">
          {isAchieved ? (
            <div className="flex items-center gap-1.5 text-green-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Веха достигнута!</span>
            </div>
          ) : (
            <div className="text-slate-500">
              Осталось: <span className="font-semibold text-slate-700">
                {remaining.toLocaleString('ru-RU')}
              </span>
            </div>
          )}

          {/* Rewards preview */}
          {showDetails && !isAchieved && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">C</span>
                </div>
                <span className="text-amber-700 font-semibold">+{milestone.reward_coins}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">XP</span>
                </div>
                <span className="text-blue-700 font-semibold">+{milestone.reward_xp}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
