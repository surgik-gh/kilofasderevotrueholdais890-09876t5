import { Lock, Star, Trophy, Award, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { Achievement, UserAchievement } from '@/store';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  onFavoriteToggle?: (achievementId: string, isFavorite: boolean) => void;
  className?: string;
}

/**
 * AchievementCard Component
 * 
 * Displays a single achievement with its progress, rarity, and unlock status
 * 
 * Requirements:
 * - 1.1-1.15: Display achievement information
 * - 8.1-8.7: Badge collection and display
 * - 9.1-9.5: Show rewards based on rarity
 */
export function AchievementCard({ 
  achievement, 
  userAchievement,
  onFavoriteToggle,
  className 
}: AchievementCardProps) {
  const isUnlocked = userAchievement?.unlocked || false;
  const progress = userAchievement?.progress || 0;
  const isFavorite = userAchievement?.is_favorite || false;
  const progressPercentage = Math.min((progress / achievement.condition_value) * 100, 100);

  // Rarity colors and gradients
  const rarityConfig = {
    common: {
      gradient: 'from-slate-400 to-slate-500',
      bg: 'from-slate-50 to-slate-100',
      text: 'text-slate-700',
      glow: 'shadow-slate-200',
    },
    rare: {
      gradient: 'from-blue-400 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      text: 'text-blue-700',
      glow: 'shadow-blue-200',
    },
    epic: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      text: 'text-purple-700',
      glow: 'shadow-purple-200',
    },
    legendary: {
      gradient: 'from-amber-400 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      text: 'text-amber-700',
      glow: 'shadow-amber-200',
    },
  };

  const config = rarityConfig[achievement.rarity];

  // Category icons
  const categoryIcons = {
    learning: Trophy,
    social: Award,
    achievement: Star,
    special: Crown,
  };

  const CategoryIcon = categoryIcons[achievement.category] || Trophy;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
      className={cn(
        'relative liquid-glass rounded-2xl overflow-hidden transition-all duration-300',
        isUnlocked ? `${config.glow} shadow-lg` : 'opacity-60',
        'mobile-compact', // Mobile-friendly padding
        className
      )}
    >
      {/* Favorite star */}
      {isUnlocked && onFavoriteToggle && (
        <button
          onClick={() => onFavoriteToggle(achievement.id, !isFavorite)}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full bg-white/80 hover:bg-white transition-colors tap-target tap-feedback"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={cn(
              'w-4 h-4 sm:w-5 sm:h-5 transition-colors',
              isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'
            )}
          />
        </button>
      )}

      {/* Header with gradient background */}
      <div className={cn('p-4 sm:p-6 bg-gradient-to-br', config.bg)}>
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={cn(
            'relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
            config.gradient
          )}>
            <CategoryIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            {!isUnlocked && (
              <div className="absolute inset-0 bg-black/40 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            )}
          </div>

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={cn(
                'text-base sm:text-lg font-bold truncate',
                isUnlocked ? config.text : 'text-slate-500'
              )}>
                {achievement.title}
              </h3>
              <span className={cn(
                'px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold uppercase',
                `bg-gradient-to-r ${config.gradient} text-white`
              )}>
                {achievement.rarity}
              </span>
            </div>
            <p className={cn(
              'text-xs sm:text-sm line-clamp-2',
              isUnlocked ? 'text-slate-600' : 'text-slate-400'
            )}>
              {achievement.description}
            </p>
          </div>
        </div>
      </div>

      {/* Progress and rewards */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Progress bar */}
        {!isUnlocked && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Progress</span>
              <span>{progress} / {achievement.condition_value}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn('h-full bg-gradient-to-r', config.gradient)}
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-50">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">C</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-amber-700">
                +{achievement.reward_coins}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-50">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">XP</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-blue-700">
                +{achievement.reward_xp}
              </span>
            </div>
          </div>

          {isUnlocked && userAchievement?.unlocked_at && (
            <div className="text-xs text-slate-500">
              {new Date(userAchievement.unlocked_at).toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>
      </div>

      {/* Unlocked overlay animation */}
      {isUnlocked && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        </div>
      )}
    </motion.div>
  );
}
