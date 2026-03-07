import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'pink';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const colorClasses = {
  primary: 'from-primary-400 to-primary-600',
  purple: 'from-purple-400 to-purple-600',
  blue: 'from-blue-400 to-blue-600',
  green: 'from-emerald-400 to-emerald-600',
  amber: 'from-amber-400 to-amber-600',
  red: 'from-red-400 to-red-600',
  pink: 'from-pink-400 to-pink-600',
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({
  current,
  max,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  animated = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const displayPercentage = Math.round(percentage);

  return (
    <div className={cn('w-full', className)}>
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-600">
              {displayPercentage}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        {/* Progress Bar Fill */}
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? {
            duration: 0.8,
            ease: 'easeOut',
          } : undefined}
          className={cn(
            'h-full bg-gradient-to-r rounded-full',
            colorClasses[color]
          )}
        />
      </div>

      {/* Current/Max Display */}
      {!showPercentage && (
        <div className="flex items-center justify-end mt-1">
          <span className="text-xs text-gray-500">
            {current} / {max}
          </span>
        </div>
      )}
    </div>
  );
}
