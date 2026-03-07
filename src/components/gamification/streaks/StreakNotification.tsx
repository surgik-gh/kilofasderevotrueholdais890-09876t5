import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Streak } from '@/store';

interface StreakNotificationProps {
  streak: Streak;
  milestone?: number; // 7, 30, or 100
  isVisible: boolean;
  onClose: () => void;
}

/**
 * StreakNotification Component
 * 
 * Displays an animated notification when a streak milestone is reached
 * 
 * Requirements:
 * - 12.4-12.5: Show notification when streak milestone is reached
 * - 10.5: Display streak notifications
 */
export function StreakNotification({ 
  streak, 
  milestone,
  isVisible, 
  onClose 
}: StreakNotificationProps) {
  // Streak type configuration
  const streakConfig = {
    daily_login: {
      label: 'Ежедневный вход',
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/50',
    },
    lesson_creation: {
      label: 'Создание уроков',
      gradient: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/50',
    },
    quiz_completion: {
      label: 'Прохождение викторин',
      gradient: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/50',
    },
    quest_completion: {
      label: 'Выполнение квестов',
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/50',
    },
  };

  const config = streakConfig[streak.streak_type as keyof typeof streakConfig] || streakConfig.daily_login;

  // Milestone messages
  const getMilestoneMessage = () => {
    if (milestone === 100) return 'Легендарная серия!';
    if (milestone === 30) return 'Невероятная серия!';
    if (milestone === 7) return 'Отличная серия!';
    return 'Серия продолжается!';
  };

  const getMilestoneDescription = () => {
    if (milestone === 100) return 'Вы достигли легендарной серии в 100 дней!';
    if (milestone === 30) return 'Вы достигли впечатляющей серии в 30 дней!';
    if (milestone === 7) return 'Вы достигли серии в 7 дней!';
    return `Ваша серия: ${streak.current_count} дней`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Notification card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                type: 'spring',
                damping: 15,
                stiffness: 300
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              y: 20,
              transition: { duration: 0.2 }
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className={cn(
              'relative liquid-glass rounded-3xl overflow-hidden shadow-2xl',
              config.glow
            )}>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              {/* Animated background */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className={cn('absolute inset-0 bg-gradient-to-br opacity-10', config.gradient)}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </div>

              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Flame icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: 1, 
                    rotate: 0,
                    transition: {
                      type: 'spring',
                      damping: 10,
                      stiffness: 200,
                      delay: 0.2
                    }
                  }}
                  className="relative mx-auto mb-6"
                >
                  <div className={cn(
                    'w-24 h-24 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center shadow-2xl',
                    config.gradient,
                    config.glow
                  )}>
                    <Flame className="w-12 h-12 text-white" />
                  </div>

                  {/* Sparkles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        x: Math.cos((i * Math.PI * 2) / 8) * 60,
                        y: Math.sin((i * Math.PI * 2) / 8) * 60,
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 0.3 + i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="absolute top-1/2 left-1/2"
                    >
                      <Sparkles className="w-4 h-4 text-orange-400" />
                    </motion.div>
                  ))}

                  {/* Milestone badge */}
                  {milestone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                    >
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white shadow-lg">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-bold text-slate-800">
                          {milestone} дней
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.4 }
                  }}
                >
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    🔥 {getMilestoneMessage()}
                  </h2>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {config.label}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {getMilestoneDescription()}
                  </p>
                </motion.div>

                {/* Streak stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.6 }
                  }}
                  className="grid grid-cols-2 gap-4 mb-6"
                >
                  <div className={cn(
                    'p-4 rounded-xl bg-gradient-to-br shadow-lg',
                    config.gradient
                  )}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {streak.current_count}
                    </div>
                    <div className="text-xs text-white/80 font-medium">
                      Текущая серия
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-100 shadow-lg">
                    <div className="text-3xl font-bold text-slate-800 mb-1">
                      {streak.best_count}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      Лучшая серия
                    </div>
                  </div>
                </motion.div>

                {/* Encouragement message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.7 }
                  }}
                  className="mb-6 p-4 rounded-xl bg-amber-50"
                >
                  <p className="text-sm text-amber-800 font-medium">
                    {milestone === 100 ? '🎉 Вы легенда! Продолжайте в том же духе!' :
                     milestone === 30 ? '💪 Отличная работа! Вы на пути к легенде!' :
                     milestone === 7 ? '🌟 Так держать! Продолжайте серию!' :
                     '🔥 Не останавливайтесь! Каждый день на счету!'}
                  </p>
                </motion.div>

                {/* Continue button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.8 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={cn(
                    'w-full px-6 py-3 rounded-xl font-semibold text-white shadow-lg',
                    'bg-gradient-to-r transition-all duration-200',
                    config.gradient
                  )}
                >
                  Продолжить
                </motion.button>
              </div>

              {/* Flame particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      y: '100%', 
                      x: Math.random() * 100 + '%',
                      opacity: 0.8 
                    }}
                    animate={{
                      y: '-20%',
                      opacity: [0.8, 0.5, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      repeat: Infinity,
                      repeatDelay: Math.random()
                    }}
                    className="absolute"
                  >
                    <Flame 
                      className="w-4 h-4"
                      style={{
                        color: ['#f59e0b', '#f97316', '#ef4444'][Math.floor(Math.random() * 3)]
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
