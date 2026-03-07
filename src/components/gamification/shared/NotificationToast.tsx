import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, CheckCircle2, Sparkles, Flame, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { GamificationNotification } from '@/store';

interface NotificationToastProps {
  notification: GamificationNotification;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDuration?: number;
}

/**
 * NotificationToast Component
 * 
 * Universal toast notification for all gamification events
 * 
 * Requirements:
 * - 10.1: Show notification when achievement is unlocked
 * - 10.2: Show notification when level up occurs
 * - 10.3: Show notification when quest is completed
 * - 10.4: Show notification when milestone is achieved
 * - 10.5: Show notification when streak is achieved
 */
export function NotificationToast({
  notification,
  isVisible,
  onClose,
  autoCloseDuration = 5000,
}: NotificationToastProps) {
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

  // Type-specific configuration
  const typeConfig = {
    achievement: {
      icon: Trophy,
      gradient: 'from-amber-400 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      glow: 'shadow-amber-300',
      emoji: '🏆',
    },
    level_up: {
      icon: Star,
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      glow: 'shadow-purple-300',
      emoji: '⭐',
    },
    quest: {
      icon: CheckCircle2,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      glow: 'shadow-blue-300',
      emoji: '✅',
    },
    milestone: {
      icon: Trophy,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50',
      glow: 'shadow-green-300',
      emoji: '🎯',
    },
    streak: {
      icon: Flame,
      gradient: 'from-orange-500 to-red-500',
      bg: 'from-orange-50 to-red-50',
      glow: 'shadow-orange-300',
      emoji: '🔥',
    },
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;

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
          <div
            className={cn(
              'relative liquid-glass rounded-2xl overflow-hidden',
              config.glow,
              'shadow-2xl'
            )}
          >
            {/* Sparkle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
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
                    x: `${50 + Math.cos((i * Math.PI) / 3) * 100}%`,
                    y: `${50 + Math.sin((i * Math.PI) / 3) * 100}%`,
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

            {/* Content */}
            <div className={cn('p-5 bg-gradient-to-br', config.bg)}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  damping: 10,
                  stiffness: 200,
                  delay: 0.2,
                }}
                className="flex items-start gap-4"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
                    config.gradient
                  )}
                >
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
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-1">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <span>{config.emoji}</span>
                      <span>{notification.title}</span>
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {notification.message}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>

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
