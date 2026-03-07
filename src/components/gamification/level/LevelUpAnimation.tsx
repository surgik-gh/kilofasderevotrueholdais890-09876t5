import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LevelUpAnimationProps {
  isVisible: boolean;
  newLevel: number;
  coinsEarned: number;
  onClose: () => void;
}

export function LevelUpAnimation({
  isVisible,
  newLevel,
  coinsEarned,
  onClose,
}: LevelUpAnimationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Delay content appearance for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  // Auto-close after 5 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              />
            ))}
          </div>

          {/* Main content */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
            className="relative liquid-glass rounded-3xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Trophy icon with animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: 'spring',
                stiffness: 200,
              }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                
                {/* Orbiting stars */}
                {[0, 120, 240].map((rotation, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      rotate: [rotation, rotation + 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute inset-0"
                  >
                    <Star className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Text content */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4"
                >
                  <motion.h2
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      delay: 0.3,
                    }}
                    className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent"
                  >
                    Повышение уровня!
                  </motion.h2>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      delay: 0.4,
                    }}
                    className="text-6xl font-bold text-gray-800"
                  >
                    {newLevel}
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-600"
                  >
                    Вы достигли уровня {newLevel}!
                  </motion.p>

                  {/* Rewards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-xl"
                  >
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="text-lg font-semibold text-gray-800">
                      +{coinsEarned} Монет мудрости
                    </span>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
                  >
                    Продолжить
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
