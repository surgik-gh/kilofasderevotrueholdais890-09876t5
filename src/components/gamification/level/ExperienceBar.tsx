import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ExperienceBarProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
  className?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
}

export function ExperienceBar({
  currentXP,
  xpToNextLevel,
  level,
  className,
  showLabel = true,
  showPercentage = true,
  animated = true,
}: ExperienceBarProps) {
  const percentage = Math.min((currentXP / xpToNextLevel) * 100, 100);

  // Determine color based on level
  const getGradient = () => {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 25) return 'from-blue-500 to-purple-500';
    if (level >= 10) return 'from-green-500 to-teal-500';
    return 'from-amber-400 to-orange-500';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-600 font-medium">
            <Sparkles className="w-4 h-4" />
            Опыт
          </span>
          <span className="text-gray-500">
            {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </span>
        </div>
      )}

      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
        </div>

        {/* Progress bar */}
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 1 : 0,
            ease: 'easeOut',
          }}
          className={cn(
            'h-full bg-gradient-to-r relative',
            getGradient()
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
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </motion.div>

        {/* Percentage text */}
        {showPercentage && percentage > 10 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
