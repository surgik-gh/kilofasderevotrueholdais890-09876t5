import { useEffect, useState } from 'react';
import { X, Sparkles, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { Achievement } from '@/store';

interface AchievementNotificationProps {
  achievement: Achievement;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDuration?: number;
}

/**
 * AchievementNotification Component
 * 
 * Displays an animated notification when an achievement is unlocked
 * 
 * Requirements:
 * - 1.15: Show animated notification when achievement is unlocked
 * - 10.1: Display achievement unlock notifications
 */
export function AchievementNotification({ 
  achievement, 
  isVisible,
  onClose,
  autoCloseDuration = 5000,
}: AchievementNotificationProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoCloseDuration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, autoCloseDuration, onClose]);

  const rarityConfig = {
    common: {
      gradient: 'from-slate-400 to-slate-500',
      bg: 'from-slate-50 to-slate-100',
      glow: 'shadow-slate-300',
    },
    rare: {
      gradient: 'from-blue-400 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      glow: 'shadow-blue-300',
    },
    epic: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      glow: 'shadow-purple-300',
    },
    legendary: {
      gradient: 'from-amber-400 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      glow: 'shadow-amber-300',
    },
  };

  const config = rarityConfig[achievement.rarity];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <div className={cn(
            'relative liquid-glass rounded-2xl overflow-hidden',
            config.glow,
            'shadow-2xl'
          )}>
            {/* Sparkle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: '50%',
                    y: '50%',
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: `${50 + Math.cos(i * Math.PI / 4) * 100}%`,
                    y: `${50 + Math.sin(i * Math.PI / 4) * 100}%`,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  className="absolute"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>

            {/* Header */}
            <div className={cn('p-6 bg-gradient-to-br', config.bg)}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring', 
                  damping: 10, 
                  stiffness: 200,
                  delay: 0.2,
                }}
                className="flex items-center gap-4"
              >
                {/* Icon */}
                <div className={cn(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
                  config.gradient
                )}>
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.1, 1.1, 1.1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: 0.6,
                      delay: 0.3,
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm font-semibold text-slate-600 mb-1">
                      🎉 Достижение разблокировано!
                    </p>
                    <h3 className="text-lg font-black text-slate-900 truncate">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                      {achievement.description}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Rewards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 bg-white/50"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-amber-700">
                    +{achievement.reward_coins} монет
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">XP</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">
                    +{achievement.reward_xp} опыта
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-200">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                className={cn('h-full bg-gradient-to-r', config.gradient)}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
