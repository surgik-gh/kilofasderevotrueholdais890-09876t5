import { useState } from 'react';
import { Filter, Grid3x3, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { AchievementCard } from './AchievementCard';
import type { Achievement, UserAchievement, AchievementCategory, AchievementRarity } from '@/store';

interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  onFavoriteToggle?: (achievementId: string, isFavorite: boolean) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'unlocked' | 'locked';

/**
 * AchievementGrid Component
 * 
 * Displays a grid of achievements with filtering and sorting options
 * 
 * Requirements:
 * - 8.2: Display all achievements (unlocked and locked)
 * - 8.7: Categorize achievements by type
 */
export function AchievementGrid({ 
  achievements, 
  userAchievements,
  onFavoriteToggle,
  className 
}: AchievementGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<AchievementRarity | 'all'>('all');

  // Merge achievements with user progress
  const mergedAchievements = achievements.map(achievement => {
    const userAchievement = userAchievements.find(
      ua => ua.achievement_id === achievement.id
    );
    return {
      achievement,
      userAchievement,
    };
  });

  // Apply filters
  const filteredAchievements = mergedAchievements.filter(({ achievement, userAchievement }) => {
    // Unlock status filter
    if (filter === 'unlocked' && !userAchievement?.unlocked) return false;
    if (filter === 'locked' && userAchievement?.unlocked) return false;

    // Category filter
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;

    // Rarity filter
    if (rarityFilter !== 'all' && achievement.rarity !== rarityFilter) return false;

    return true;
  });

  // Sort: unlocked first, then by rarity, then by progress
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    // Unlocked first
    const aUnlocked = a.userAchievement?.unlocked ? 1 : 0;
    const bUnlocked = b.userAchievement?.unlocked ? 1 : 0;
    if (aUnlocked !== bUnlocked) return bUnlocked - aUnlocked;

    // Then by rarity
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    const rarityDiff = rarityOrder[b.achievement.rarity] - rarityOrder[a.achievement.rarity];
    if (rarityDiff !== 0) return rarityDiff;

    // Then by progress (for locked achievements)
    if (!a.userAchievement?.unlocked && !b.userAchievement?.unlocked) {
      const aProgress = (a.userAchievement?.progress || 0) / a.achievement.condition_value;
      const bProgress = (b.userAchievement?.progress || 0) / b.achievement.condition_value;
      return bProgress - aProgress;
    }

    return 0;
  });

  const categories: Array<{ value: AchievementCategory | 'all'; label: string }> = [
    { value: 'all', label: 'Все' },
    { value: 'learning', label: 'Обучение' },
    { value: 'social', label: 'Социальные' },
    { value: 'achievement', label: 'Достижения' },
    { value: 'special', label: 'Особые' },
  ];

  const rarities: Array<{ value: AchievementRarity | 'all'; label: string }> = [
    { value: 'all', label: 'Все' },
    { value: 'common', label: 'Обычные' },
    { value: 'rare', label: 'Редкие' },
    { value: 'epic', label: 'Эпические' },
    { value: 'legendary', label: 'Легендарные' },
  ];

  const unlockedCount = userAchievements.filter(ua => ua.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Stats header */}
      <div className="liquid-glass rounded-xl sm:rounded-2xl p-4 sm:p-6 bounce-in">
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              Достижения
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Разблокировано {unlockedCount} из {totalCount} ({completionPercentage}%)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-all tap-target tap-feedback',
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all tap-target tap-feedback',
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              aria-label="List view"
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Progress bar with animation */}
        <div className="h-2.5 sm:h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="liquid-glass rounded-xl sm:rounded-2xl p-3 sm:p-4 slide-up">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-semibold text-slate-700">Фильтры</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Status filter */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">
              Статус
            </label>
            <div className="flex gap-2">
              {(['all', 'unlocked', 'locked'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all tap-feedback',
                    filter === f
                      ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg scale-hover'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {f === 'all' ? 'Все' : f === 'unlocked' ? 'Открытые' : 'Закрытые'}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">
              Категория
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as AchievementCategory | 'all')}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium border-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              {categories.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity filter */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-medium text-slate-600 mb-2 block">
              Редкость
            </label>
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value as AchievementRarity | 'all')}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium border-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              {rarities.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Achievement grid/list */}
      <AnimatePresence mode="wait">
        {sortedAchievements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="liquid-glass rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center"
          >
            <p className="text-sm sm:text-base text-slate-500">Нет достижений, соответствующих фильтрам</p>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
                : 'space-y-3 sm:space-y-4'
            )}
          >
            {sortedAchievements.map(({ achievement, userAchievement }, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <AchievementCard
                  achievement={achievement}
                  userAchievement={userAchievement}
                  onFavoriteToggle={onFavoriteToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
