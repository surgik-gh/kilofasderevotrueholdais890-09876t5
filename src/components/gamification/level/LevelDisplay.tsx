import { motion } from 'framer-motion';
import { Trophy, Star, Zap } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface LevelDisplayProps {
  level: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
}

export function LevelDisplay({
  level,
  className,
  size = 'md',
  showIcon = true,
  animated = true,
}: LevelDisplayProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  // Determine color based on level
  const getGradient = () => {
    if (level >= 50) return 'from-purple-500 via-pink-500 to-red-500';
    if (level >= 25) return 'from-blue-500 via-purple-500 to-pink-500';
    if (level >= 10) return 'from-green-500 via-teal-500 to-blue-500';
    return 'from-amber-400 via-orange-500 to-red-500';
  };

  const getIcon = () => {
    if (level >= 50) return Star;
    if (level >= 25) return Zap;
    return Trophy;
  };

  const Icon = getIcon();

  const content = (
    <div
      className={cn(
        'relative rounded-2xl bg-gradient-to-br shadow-lg flex flex-col items-center justify-center font-bold text-white',
        getGradient(),
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon className={cn('mb-1', iconSizes[size])} />
      )}
      <div className="flex items-baseline gap-0.5">
        <span className="text-xs opacity-80">LVL</span>
        <span>{level}</span>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-50" />
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
