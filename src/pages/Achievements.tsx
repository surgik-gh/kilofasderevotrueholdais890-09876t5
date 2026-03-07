import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Award, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { cn } from '@/utils/cn';
import { useAchievements } from '@/hooks/useAchievements';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useStore } from '@/store';
import type { Achievement, AchievementRarity } from '@/store';
import { 
  AchievementGrid, 
  BadgeCollection 
} from '@/components/gamification/achievements';
import {
  GamificationErrorDisplay,
  AchievementCardSkeleton,
  SkeletonGrid,
} from '@/components/gamification/shared';

/**
 * Achievements Page
 * 
 * Displays all achievements with filtering, progress tracking, and badge collection
 * 
 * Requirements:
 * - 1.1-1.15: Display all achievements (unlocked and locked)
 * - 7.3: Show progress to locked achievements
 * - 8.1-8.7: Badge collection and favorite management
 */
export default function Achievements() {
  const navigate = useNavigate();
  const { profile } = useStore();
  const {
    achievements: userAchievements,
    allAchievements,
    isLoading,
    error,
    loadUserAchievements,
    retryLoadAchievements,
    setFavoriteAchievement,
    getAchievementStats,
  } = useAchievements();

  const {
    recommendedAchievements,
    loading: recommendationsLoading,
  } = useRecommendations();

  const [stats, setStats] = useState<any>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!profile) {
      navigate('/login');
    }
  }, [profile, navigate]);

  // Load user achievements and stats
  useEffect(() => {
    if (profile) {
      loadUserAchievements();
      loadStats();
    }
  }, [profile]);

  const loadStats = async () => {
    const achievementStats = await getAchievementStats();
    setStats(achievementStats);
  };

  const handleFavoriteToggle = async (achievementId: string, isFavorite: boolean) => {
    await setFavoriteAchievement(achievementId, isFavorite);
    // Reload to update UI
    await loadUserAchievements();
  };

  if (!profile) {
    return null;
  }

  // Show error with retry option
  if (error && userAchievements.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <GamificationErrorDisplay
            error={error}
            context="achievements"
            onRetry={retryLoadAchievements}
          />
        </div>
      </div>
    );
  }

  // Show skeleton loading state
  if (isLoading && userAchievements.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <div className="liquid-glass sticky top-0 z-10 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-slate-900 mb-1">
                  Достижения
                </h1>
                <p className="text-sm text-slate-600">
                  Загрузка достижений...
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonGrid count={6} component={AchievementCardSkeleton} />
        </div>
      </div>
    );
  }

  const unlockedCount = userAchievements.filter(ua => ua.unlocked).length;
  const totalCount = allAchievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Get favorite achievements
  const favoriteAchievements = userAchievements
    .filter(ua => ua.is_favorite && ua.unlocked)
    .map(ua => allAchievements.find(a => a.id === ua.achievement_id))
    .filter(Boolean) as Achievement[];

  return (
    <Layout>
      <div className="pb-20 safe-area-inset-bottom">
        {/* Header */}
        <div className="liquid-glass sticky top-0 z-10 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-0.5 sm:mb-1">
                  Достижения
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  Отслеживайте свой прогресс и собирайте значки
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Error message */}
        {error && (
          <div className="liquid-glass rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-red-50 border border-red-200">
            <p className="text-sm sm:text-base text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="liquid-glass rounded-xl sm:rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Всего</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">{totalCount}</p>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Доступных достижений
            </div>
          </motion.div>

          {/* Unlocked achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="liquid-glass rounded-xl sm:rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Разблокировано</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">{unlockedCount}</p>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {completionPercentage}% завершено
            </div>
          </motion.div>

          {/* By category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="liquid-glass rounded-xl sm:rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Прогресс</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">
                  {stats?.completion_percentage || completionPercentage}%
                </p>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Общий прогресс
            </div>
          </motion.div>

          {/* Favorites */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="liquid-glass rounded-xl sm:rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-600">Избранные</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">
                  {favoriteAchievements.length}
                </p>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Значков в избранном
            </div>
          </motion.div>
        </div>

        {/* Recommended Achievements */}
        {recommendedAchievements.length > 0 && !recommendationsLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="liquid-glass rounded-xl sm:rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Рекомендуемые достижения
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
              Вы близки к получению этих достижений. Продолжайте в том же духе!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {recommendedAchievements.map((rec) => {
                const rarityColors: Record<string, string> = {
                  common: 'from-slate-400 to-slate-500',
                  rare: 'from-blue-400 to-cyan-500',
                  epic: 'from-purple-500 to-pink-500',
                  legendary: 'from-amber-400 to-orange-500',
                };

                return (
                  <div
                    key={rec.achievement.id}
                    className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-primary-300 transition-all tap-feedback"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className={cn(
                        'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0',
                        rarityColors[rec.achievement.rarity]
                      )}>
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm mb-1">
                          {rec.achievement.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {rec.achievement.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">Прогресс</span>
                        <span className="font-bold text-primary-600">
                          {rec.progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-500 bg-gradient-to-r',
                            rarityColors[rec.achievement.rarity]
                          )}
                          style={{ width: `${Math.min(rec.progressPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Осталось: {rec.remainingProgress}</span>
                      {rec.estimatedDaysToComplete < 30 && (
                        <span>~{rec.estimatedDaysToComplete}д</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Favorite badges showcase */}
        {favoriteAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="liquid-glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900">
                Избранные значки
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {favoriteAchievements.map((achievement) => {
                const userAchievement = userAchievements.find(
                  ua => ua.achievement_id === achievement.id
                );
                
                const rarityGradients: Record<AchievementRarity, string> = {
                  common: 'from-slate-400 to-slate-500',
                  rare: 'from-blue-400 to-cyan-500',
                  epic: 'from-purple-500 to-pink-500',
                  legendary: 'from-amber-400 to-orange-500',
                };

                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100"
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md',
                      rarityGradients[achievement.rarity]
                    )}>
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{achievement.title}</p>
                      <p className="text-xs text-slate-600">
                        {userAchievement?.unlocked_at && 
                          new Date(userAchievement.unlocked_at).toLocaleDateString('ru-RU')
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Badge collection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="liquid-glass rounded-2xl p-6"
        >
          <BadgeCollection
            achievements={allAchievements}
            userAchievements={userAchievements}
            onFavoriteToggle={handleFavoriteToggle}
            maxDisplay={24}
            showLocked={true}
          />
        </motion.div>

        {/* Achievement grid with filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <AchievementGrid
            achievements={allAchievements}
            userAchievements={userAchievements}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </motion.div>

        {/* Stats by category */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="liquid-glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Статистика по категориям
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.by_category || {}).map(([category, count]) => (
                <div key={category} className="text-center p-4 rounded-xl bg-slate-50">
                  <p className="text-2xl font-black text-slate-900">{count as number}</p>
                  <p className="text-sm text-slate-600 capitalize">{category}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        </div>
      </div>
    </Layout>
  );
}
