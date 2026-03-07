/**
 * RecommendationsSection Component
 * Displays personalized recommendations on the dashboard
 * 
 * Requirements:
 * - 14.1: Recommend 3 closest achievements
 * - 14.3: Show personalized weekly goals
 */

import { motion } from 'framer-motion';
import { Target, Trophy, TrendingUp, Star, Clock, Award } from 'lucide-react';
import { useRecommendations } from '../../../hooks/useRecommendations';
import { Link } from 'react-router-dom';

export function RecommendationsSection() {
  const {
    recommendedAchievements,
    weeklyGoals,
    loading,
    error,
  } = useRecommendations();

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - recommendations are optional
  }

  return (
    <div className="space-y-6">
      {/* Weekly Goals */}
      {weeklyGoals && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border-2 border-primary-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-100 to-purple-100 text-primary-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Цели на неделю</h3>
              <p className="text-sm text-slate-500">{weeklyGoals.motivationalMessage}</p>
            </div>
          </div>

          {/* Primary Goal */}
          <div className="mb-4 p-4 bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl border border-primary-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-primary-600 uppercase">Главная цель</span>
                </div>
                <h4 className="font-bold text-slate-900">{weeklyGoals.primaryGoal.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{weeklyGoals.primaryGoal.description}</p>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-black text-primary-600">
                  {weeklyGoals.primaryGoal.progressPercentage.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500">прогресс</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(weeklyGoals.primaryGoal.progressPercentage, 100)}%` }}
              />
            </div>

            {/* Reward */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-amber-600">
                <Award className="w-4 h-4" />
                <span className="font-semibold">{weeklyGoals.primaryGoal.reward.coins} монет</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">{weeklyGoals.primaryGoal.reward.xp} XP</span>
              </div>
              {weeklyGoals.primaryGoal.deadline && (
                <div className="flex items-center gap-1 text-slate-500 ml-auto">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">
                    до {new Date(weeklyGoals.primaryGoal.deadline).toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Goals */}
          {weeklyGoals.secondaryGoals.length > 0 && (
            <div className="space-y-2">
              {weeklyGoals.secondaryGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-slate-900 text-sm">{goal.title}</h5>
                    <span className="text-sm font-bold text-slate-600">
                      {goal.progressPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-slate-400 to-slate-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Recommended Achievements */}
      {recommendedAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Рекомендуемые достижения</h3>
                <p className="text-sm text-slate-500">Вы близки к получению этих наград</p>
              </div>
            </div>
            <Link
              to="/achievements"
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
            >
              Все →
            </Link>
          </div>

          <div className="space-y-3">
            {recommendedAchievements.map((rec, index) => (
              <motion.div
                key={rec.achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl">
                      {rec.achievement.icon || '🏆'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{rec.achievement.title}</h4>
                        <p className="text-sm text-slate-600 mt-0.5">{rec.achievement.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-black text-primary-600">
                          {rec.progressPercentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(rec.progressPercentage, 100)}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Осталось: <span className="font-semibold text-slate-700">{rec.remainingProgress}</span>
                      </span>
                      {rec.estimatedDaysToComplete < 30 && (
                        <span>
                          ~{rec.estimatedDaysToComplete} {rec.estimatedDaysToComplete === 1 ? 'день' : 'дней'}
                        </span>
                      )}
                      <span className="ml-auto">
                        <span className="font-semibold text-amber-600">+{rec.achievement.reward_coins}</span> монет
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
