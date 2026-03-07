import { motion } from 'framer-motion';
import { TrendingUp, Target } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Achievement, UserAchievement } from '@/store';

interface AchievementProgressProps {
  achievement: Achievement;
  userAchievement: UserAchievement;
  showDetails?: boolean;
  className?: string;
}

/**
 * AchievementProgress Component
 * 
 * Displays a progress bar for an achievement with current progress
 * 
 * Requirements:
 * - 7.3: Show progress to locked achievements
 * - 7.7: Use animated progress bars with smooth transitions
 */
export function AchievementProgress({ 
  achievement, 
  userAchievement,
  showDetails = true,
  className 
}: AchievementProgressProps) {
  const progress = userAchievement.progress;
  const target = achievement.condition_value;
  const percentage = Math.min((progress / target) * 100, 100);
  const isComplete = userAchievement.unlocked;

  // Determine color based on progress
  const getProgressColor = () => {
    if (isComplete) return 'from-green-400 to-emerald-500';
    if (percentage >= 75) return 'from-blue-400 to-cyan-500';
    if (percentage >= 50) return 'from-purple-400 to-pink-500';
    if (percentage >= 25) return 'from-amber-400 to-orange-500';
    return 'from-slate-400 to-slate-500';
  };

  const progressColor = getProgressColor();

  return (
    <div className={cn('space-y-2', className)}>
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <Target className="w-4 h-4" />
                <span className="text-sm font-semibold">Завершено!</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Прогресс</span>
              </div>
            )}
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {progress} / {target}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 0.8, 
            ease: 'easeOut',
            delay: 0.1,
          }}
          className={cn(
            'h-full bg-gradient-to-r relative',
            progressColor
          )}
        >
          {/* Shine effect */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>

        {/* Percentage label */}
        {percentage > 10 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white drop-shadow">
              {Math.round(percentage)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Milestone markers */}
      {!isComplete && target > 10 && (
        <div className="relative h-1">
          {[25, 50, 75].map((milestone) => {
            const milestoneValue = Math.round((milestone / 100) * target);
            const isPassed = progress >= milestoneValue;
            
            return (
              <motion.div
                key={milestone}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + milestone / 100 }}
                className="absolute top-0"
                style={{ left: `${milestone}%` }}
              >
                <div className="relative -translate-x-1/2">
                  <div className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    isPassed 
                      ? 'bg-primary-500' 
                      : 'bg-slate-300'
                  )} />
                  {showDetails && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-slate-500">
                        {milestoneValue}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
