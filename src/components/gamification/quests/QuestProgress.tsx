import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { UserQuest } from '@/store';

interface QuestProgressProps {
  userQuest: UserQuest;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * QuestProgress Component
 * 
 * Displays a progress bar for a quest with percentage and status
 * 
 * Requirements:
 * - 7.2: Show progress bar for quest completion
 * - 3.7, 4.7: Display progress percentage for each quest
 */
export function QuestProgress({ 
  userQuest, 
  showLabel = true,
  size = 'md',
  className 
}: QuestProgressProps) {
  const quest = userQuest.quest;
  
  if (!quest) return null;

  const progressPercentage = Math.min((userQuest.progress / quest.condition_value) * 100, 100);
  const isCompleted = userQuest.completed;

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-1.5',
      text: 'text-xs',
      icon: 'w-3 h-3',
    },
    md: {
      height: 'h-2.5',
      text: 'text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      height: 'h-3',
      text: 'text-base',
      icon: 'w-5 h-5',
    },
  };

  const config = sizeConfig[size];

  // Quest type colors
  const typeColors = {
    daily: {
      gradient: 'from-blue-500 to-cyan-500',
      text: 'text-blue-700',
      bg: 'bg-blue-100',
    },
    weekly: {
      gradient: 'from-purple-500 to-pink-500',
      text: 'text-purple-700',
      bg: 'bg-purple-100',
    },
  };

  const colors = typeColors[quest.quest_type];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and status */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className={cn(config.icon, 'text-green-600')} />
            ) : (
              <Circle className={cn(config.icon, 'text-slate-400')} />
            )}
            <span className={cn('font-medium', config.text, colors.text)}>
              {quest.title}
            </span>
          </div>
          <span className={cn('font-bold', config.text, colors.text)}>
            {userQuest.progress} / {quest.condition_value}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className={cn(
        config.height,
        'bg-slate-200 rounded-full overflow-hidden relative'
      )}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full bg-gradient-to-r',
            colors.gradient,
            'relative'
          )}
        >
          {/* Shimmer effect */}
          {!isCompleted && progressPercentage > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </motion.div>

        {/* Completion pulse */}
        {isCompleted && (
          <motion.div
            className={cn('absolute inset-0 bg-gradient-to-r', colors.gradient)}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>

      {/* Percentage */}
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={cn('text-xs text-slate-500')}>
            {progressPercentage.toFixed(1)}% complete
          </span>
          {isCompleted && (
            <span className="text-xs font-semibold text-green-600">
              ✓ Completed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
