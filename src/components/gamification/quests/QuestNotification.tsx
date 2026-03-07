import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trophy, X, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { UserQuest } from '@/store';

interface QuestNotificationProps {
  userQuest: UserQuest;
  isVisible: boolean;
  onClose: () => void;
  showBonusReward?: boolean;
  bonusCoins?: number;
}

/**
 * QuestNotification Component
 * 
 * Displays an animated notification when a quest is completed
 * 
 * Requirements:
 * - 10.3: Show notification when quest is completed
 * - 3.5, 4.5: Show bonus reward notification when all quests completed
 */
export function QuestNotification({ 
  userQuest, 
  isVisible, 
  onClose,
  showBonusReward = false,
  bonusCoins = 0,
}: QuestNotificationProps) {
  const quest = userQuest.quest;
  
  if (!quest) return null;

  const isDaily = quest.quest_type === 'daily';

  const typeConfig = {
    daily: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
    },
    weekly: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
    },
  };

  const config = typeConfig[quest.quest_type];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Notification card */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full"
            >
              {/* Confetti particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 1,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i / 12) * Math.PI * 2) * 150,
                    y: Math.sin((i / 12) * Math.PI * 2) * 150,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.2,
                    ease: 'easeOut',
                  }}
                  className={cn(
                    'absolute top-1/2 left-1/2 w-3 h-3 rounded-full',
                    i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? 'bg-blue-400' : 'bg-purple-400'
                  )}
                />
              ))}

              {/* Card */}
              <div className="liquid-glass rounded-3xl overflow-hidden shadow-2xl">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>

                {/* Header with gradient */}
                <div className={cn('p-8 bg-gradient-to-br text-center', config.bg)}>
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring',
                      damping: 15,
                      stiffness: 200,
                      delay: 0.2,
                    }}
                    className="inline-block mb-4"
                  >
                    <div className={cn(
                      'w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-xl',
                      config.gradient
                    )}>
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-slate-800 mb-2"
                  >
                    Quest Completed!
                  </motion.h2>

                  {/* Quest name */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg text-slate-600 font-medium"
                  >
                    {quest.title}
                  </motion.p>
                </div>

                {/* Rewards section */}
                <div className="p-6 space-y-4">
                  {/* Main rewards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-sm text-slate-600 text-center mb-3">
                      You earned:
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold text-white">C</span>
                        </div>
                        <span className="text-xl font-bold text-amber-700">
                          +{quest.reward_coins}
                        </span>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold text-white">XP</span>
                        </div>
                        <span className="text-xl font-bold text-blue-700">
                          +{quest.reward_xp}
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Bonus reward */}
                  {showBonusReward && bonusCoins > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-bold text-amber-900">
                              Bonus Reward!
                            </span>
                          </div>
                          <p className="text-xs text-amber-700">
                            All {isDaily ? 'daily' : 'weekly'} quests completed: +{bonusCoins} coins
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Continue button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className={cn(
                      'w-full py-3 rounded-xl font-bold text-white shadow-lg',
                      'bg-gradient-to-r transition-all duration-200',
                      config.gradient
                    )}
                  >
                    Continue
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
