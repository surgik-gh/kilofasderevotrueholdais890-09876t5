import { Trophy, Star, BookOpen, Coins, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { Milestone, UserMilestone } from '@/store';

interface MilestoneCardProps {
  milestone: Milestone;
  userMilestone?: UserMilestone;
  currentValue?: number;
  className?: string;
}

/**
 * MilestoneCard Component
 * 
 * Displays a single milestone with its progress and achievement status
 * 
 * Requirements:
 * - 6.1-6.7: Display milestone information and progress
 * - 7.6: Show progress to next milestone
 */
export function MilestoneCard({ 
  milestone, 
  userMilestone,
  currentValue = 0,
  className 
}: MilestoneCardProps) {
  const isAchieved = userMilestone?.achieved || false;
  const progressPercentage = Math.min((currentValue / milestone.threshold) * 100, 100);

  // Category icons and colors
  const categoryConfig = {
    lessons_created: {
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      text: 'text-blue-700',
      glow: 'shadow-blue-200',
    },
    quizzes_completed: {
      icon: Trophy,
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      text: 'text-purple-700',
      glow: 'shadow-purple-200',
    },
    wisdom_coins: {
      icon: Coins,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      text: 'text-amber-700',
      glow: 'shadow-amber-200',
    },
    level_reached: {
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50',
      text: 'text-green-700',
      glow: 'shadow-green-200',
    },
  };

  const config = categoryConfig[milestone.category as keyof typeof categoryConfig] || categoryConfig.lessons_created;
  const CategoryIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isAchieved ? 1.02 : 1 }}
      className={cn(
        'relative liquid-glass rounded-2xl overflow-hidden transition-all duration-300',
        isAchieved ? `${config.glow} shadow-lg` : 'opacity-75',
        className
      )}
    >
      {/* Achievement badge */}
      {isAchieved && (
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r shadow-lg',
            config.gradient
          )}>
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase">Achieved</span>
          </div>
        </div>
      )}

      {/* Header with gradient background */}
      <div className={cn('p-6 bg-gradient-to-br', config.bg)}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'relative w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
            config.gradient
          )}>
            <CategoryIcon className="w-8 h-8 text-white" />
            {isAchieved && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'text-lg font-bold mb-1',
              isAchieved ? config.text : 'text-slate-600'
            )}>
              {milestone.title}
            </h3>
            <p className={cn(
              'text-sm line-clamp-2',
              isAchieved ? 'text-slate-600' : 'text-slate-500'
            )}>
              {milestone.description}
            </p>
          </div>
        </div>
      </div>

      {/* Progress and rewards */}
      <div className="p-4 space-y-3">
        {/* Progress bar */}
        {!isAchieved && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Progress</span>
              <span>{currentValue} / {milestone.threshold}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn('h-full bg-gradient-to-r', config.gradient)}
              />
            </div>
            <div className="text-xs text-slate-500 text-right">
              {progressPercentage.toFixed(0)}% complete
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">C</span>
              </div>
              <span className="text-sm font-semibold text-amber-700">
                +{milestone.reward_coins}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">XP</span>
              </div>
              <span className="text-sm font-semibold text-blue-700">
                +{milestone.reward_xp}
              </span>
            </div>
          </div>

          {isAchieved && userMilestone?.achieved_at && (
            <div className="text-xs text-slate-500">
              {new Date(userMilestone.achieved_at).toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>

        {/* Threshold indicator */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          isAchieved ? 'bg-green-50' : 'bg-slate-50'
        )}>
          <Star className={cn(
            'w-4 h-4',
            isAchieved ? 'text-green-600' : 'text-slate-400'
          )} />
          <span className={cn(
            'text-xs font-medium',
            isAchieved ? 'text-green-700' : 'text-slate-600'
          )}>
            Milestone: {milestone.threshold.toLocaleString('ru-RU')}
          </span>
        </div>
      </div>

      {/* Achievement glow effect */}
      {isAchieved && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        </div>
      )}
    </motion.div>
  );
}
