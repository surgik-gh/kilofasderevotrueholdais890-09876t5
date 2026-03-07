import { useState } from 'react';
import { Star, Lock, Award, Trophy, Crown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { Achievement, UserAchievement } from '@/store';

interface BadgeCollectionProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  onFavoriteToggle?: (achievementId: string, isFavorite: boolean) => void;
  maxDisplay?: number;
  showLocked?: boolean;
  className?: string;
}

/**
 * BadgeCollection Component
 * 
 * Displays a collection of achievement badges in a compact format
 * 
 * Requirements:
 * - 8.1: Add badge to collection when achievement is unlocked
 * - 8.2: Display all unlocked and locked badges
 * - 8.4: Allow setting favorite badge for profile display
 * - 8.5: Display favorite badges in profile
 * - 8.6: Mark rare badges with special frame
 */
export function BadgeCollection({ 
  achievements, 
  userAchievements,
  onFavoriteToggle,
  maxDisplay,
  showLocked = true,
  className 
}: BadgeCollectionProps) {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  // Merge achievements with user progress
  const mergedBadges = achievements.map(achievement => {
    const userAchievement = userAchievements.find(
      ua => ua.achievement_id === achievement.id
    );
    return {
      achievement,
      userAchievement,
      isUnlocked: userAchievement?.unlocked || false,
      isFavorite: userAchievement?.is_favorite || false,
    };
  });

  // Filter and sort
  const displayBadges = mergedBadges
    .filter(({ isUnlocked }) => showLocked || isUnlocked)
    .sort((a, b) => {
      // Favorites first
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      // Unlocked before locked
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      // Then by rarity
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
      return rarityOrder[b.achievement.rarity] - rarityOrder[a.achievement.rarity];
    })
    .slice(0, maxDisplay);

  const selectedBadgeData = displayBadges.find(
    ({ achievement }) => achievement.id === selectedBadge
  );

  const unlockedCount = userAchievements.filter(ua => ua.unlocked).length;

  // Category icons
  const categoryIcons = {
    learning: Trophy,
    social: Award,
    achievement: Star,
    special: Crown,
  };

  // Rarity frames
  const rarityFrames = {
    common: 'ring-2 ring-slate-300',
    rare: 'ring-2 ring-blue-400 shadow-lg shadow-blue-200',
    epic: 'ring-2 ring-purple-500 shadow-lg shadow-purple-200',
    legendary: 'ring-4 ring-amber-400 shadow-xl shadow-amber-300',
  };

  const rarityGradients = {
    common: 'from-slate-400 to-slate-500',
    rare: 'from-blue-400 to-cyan-500',
    epic: 'from-purple-500 to-pink-500',
    legendary: 'from-amber-400 to-orange-500',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Коллекция значков</h3>
          <p className="text-sm text-slate-600">
            {unlockedCount} разблокировано
          </p>
        </div>
        {onFavoriteToggle && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-700">
              Избранные
            </span>
          </div>
        )}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {displayBadges.map(({ achievement, userAchievement, isUnlocked, isFavorite }) => {
          const CategoryIcon = categoryIcons[achievement.category];
          
          return (
            <motion.button
              key={achievement.id}
              onClick={() => setSelectedBadge(achievement.id)}
              whileHover={{ scale: isUnlocked ? 1.1 : 1 }}
              whileTap={{ scale: isUnlocked ? 0.95 : 1 }}
              className={cn(
                'relative aspect-square rounded-2xl transition-all',
                isUnlocked 
                  ? rarityFrames[achievement.rarity]
                  : 'ring-1 ring-slate-200 opacity-50'
              )}
            >
              {/* Badge icon */}
              <div className={cn(
                'w-full h-full rounded-2xl bg-gradient-to-br flex items-center justify-center',
                isUnlocked 
                  ? rarityGradients[achievement.rarity]
                  : 'bg-slate-200'
              )}>
                {isUnlocked ? (
                  <CategoryIcon className="w-1/2 h-1/2 text-white" />
                ) : (
                  <Lock className="w-1/2 h-1/2 text-slate-400" />
                )}
              </div>

              {/* Favorite star */}
              {isFavorite && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
                >
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </motion.div>
              )}

              {/* Legendary sparkle effect */}
              {isUnlocked && achievement.rarity === 'legendary' && (
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute -top-1 -left-1"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Badge detail modal */}
      <AnimatePresence>
        {selectedBadge && selectedBadgeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass rounded-3xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className={cn(
                'p-8 bg-gradient-to-br',
                selectedBadgeData.isUnlocked
                  ? 'from-primary-50 to-purple-50'
                  : 'from-slate-50 to-slate-100'
              )}>
                <div className="flex flex-col items-center text-center">
                  {/* Large badge icon */}
                  <div className={cn(
                    'w-24 h-24 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl mb-4',
                    selectedBadgeData.isUnlocked
                      ? cn(rarityGradients[selectedBadgeData.achievement.rarity], rarityFrames[selectedBadgeData.achievement.rarity])
                      : 'bg-slate-200 ring-2 ring-slate-300'
                  )}>
                    {selectedBadgeData.isUnlocked ? (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        {(() => {
                          const Icon = categoryIcons[selectedBadgeData.achievement.category];
                          return <Icon className="w-12 h-12 text-white" />;
                        })()}
                      </motion.div>
                    ) : (
                      <Lock className="w-12 h-12 text-slate-400" />
                    )}
                  </div>

                  {/* Title and rarity */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-black text-slate-900">
                      {selectedBadgeData.achievement.title}
                    </h3>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-bold uppercase text-white',
                      `bg-gradient-to-r ${rarityGradients[selectedBadgeData.achievement.rarity]}`
                    )}>
                      {selectedBadgeData.achievement.rarity}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-4">
                    {selectedBadgeData.achievement.description}
                  </p>

                  {/* Rewards */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50">
                      <span className="text-sm font-bold text-amber-700">
                        +{selectedBadgeData.achievement.reward_coins} монет
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50">
                      <span className="text-sm font-bold text-blue-700">
                        +{selectedBadgeData.achievement.reward_xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 space-y-3">
                {selectedBadgeData.isUnlocked && onFavoriteToggle && (
                  <button
                    onClick={() => {
                      onFavoriteToggle(
                        selectedBadgeData.achievement.id,
                        !selectedBadgeData.isFavorite
                      );
                      setSelectedBadge(null);
                    }}
                    className={cn(
                      'w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                      selectedBadgeData.isFavorite
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white hover:shadow-lg'
                    )}
                  >
                    <Star className={cn(
                      'w-5 h-5',
                      selectedBadgeData.isFavorite && 'fill-current'
                    )} />
                    {selectedBadgeData.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-3 px-4 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
