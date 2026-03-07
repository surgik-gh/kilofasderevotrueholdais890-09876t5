import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Milestone } from '@/store';

interface MilestoneNotificationProps {
  milestone: Milestone;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * MilestoneNotification Component
 * 
 * Displays an animated notification when a milestone is achieved
 * 
 * Requirements:
 * - 6.5: Show special animation when milestone is achieved
 * - 10.4: Display milestone notifications
 */
export function MilestoneNotification({ 
  milestone, 
  isVisible, 
  onClose 
}: MilestoneNotificationProps) {
  // Category colors
  const categoryConfig = {
    lessons_created: {
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/50',
    },
    quizzes_completed: {
      gradient: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/50',
    },
    wisdom_coins: {
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/50',
    },
    level_reached: {
      gradient: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/50',
    },
  };

  const config = categoryConfig[milestone.category as keyof typeof categoryConfig] || categoryConfig.lessons_created;

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
                {/* Icon with animation */}
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
                    <Trophy className="w-12 h-12 text-white" />
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
                      <Sparkles className={cn('w-4 h-4 text-yellow-400')} />
                    </motion.div>
                  ))}
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
                    🎉 Веха достигнута!
                  </h2>
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">
                    {milestone.title}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {milestone.description}
                  </p>
                </motion.div>

                {/* Rewards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.6 }
                  }}
                  className="flex items-center justify-center gap-4 mb-6"
                >
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 shadow-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">C</span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-amber-600 font-medium">Coins</div>
                      <div className="text-lg font-bold text-amber-700">
                        +{milestone.reward_coins}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 shadow-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">XP</span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-blue-600 font-medium">Experience</div>
                      <div className="text-lg font-bold text-blue-700">
                        +{milestone.reward_xp}
                      </div>
                    </div>
                  </div>
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

              {/* Confetti effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      y: -20, 
                      x: Math.random() * 100 + '%',
                      opacity: 1 
                    }}
                    animate={{
                      y: '120%',
                      rotate: Math.random() * 360,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)]
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
