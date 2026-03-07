import { Flame, Trophy, Calendar, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { Streak } from '@/store';

interface StreakCardProps {
  streak: Streak;
  className?: string;
}

/**
 * StreakCard Component
 * 
 * Displays a detailed card for a single streak with progress and milestones
 * 
 * Requirements:
 * - 12.1-12.8: Display detailed streak information
 * - 12.4-12.5: Show milestone rewards
 */
export function StreakCard({ streak, className }: StreakCardProps) {
  const isActive = streak.current_count > 0;
  
  // Streak type configuration
  const streakConfig = {
    daily_login: {
      icon: Calendar,
      label: 'Ежедневный вход',
      description: 'Входите в систему каждый день',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      text: 'text-blue-700',
      glow: 'shadow-blue-200',
    },
    lesson_creation: {
      icon: Trophy,
      label: 'Создание уроков',
      description: 'Создавайте уроки каждый день',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      text: 'text-purple-700',
      glow: 'shadow-purple-200',
    },
    quiz_completion: {
      icon: TrendingUp,
      label: 'Прохождение викторин',
      description: 'Проходите викторины каждый день',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50',
      text: 'text-green-700',
      glow: 'shadow-green-200',
    },
    quest_completion: {
      icon: Flame,
      label: 'Выполнение квестов',
      description: 'Выполняйте все квесты каждый день',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      text: 'text-amber-700',
      glow: 'shadow-amber-200',
    },
  };

  const config = streakConfig[streak.streak_type as keyof typeof streakConfig] || streakConfig.daily_login;
  const StreakIcon = config.icon;

  // Milestone rewards
  const milestones = [
    { days: 7, reward: 'Бонусная награда', achieved: streak.current_count >= 7 },
    { days: 30, reward: 'Значительная награда', achieved: streak.current_count >= 30 },
    { days: 100, reward: 'Легендарное достижение', achieved: streak.current_count >= 100 },
  ];

  // Calculate days since last activity
  const daysSinceActivity = Math.floor(
    (new Date().getTime() - new Date(streak.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isActive ? 1.02 : 1 }}
      className={cn(
        'relative liquid-glass rounded-2xl overflow-hidden transition-all duration-300',
        isActive ? `${config.glow} shadow-lg` : 'opacity-60',
        className
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg"
          >
            <Flame className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase">Active</span>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className={cn('p-6 bg-gradient-to-br', config.bg)}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'relative w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
            config.gradient
          )}>
            <StreakIcon className="w-8 h-8 text-white" />
            {isActive && (
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-7 h-7 text-orange-500 drop-shadow-lg" />
              </motion.div>
            )}
          </div>

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <h3 className={cn('text-lg font-bold mb-1', config.text)}>
              {config.label}
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              {config.description}
            </p>
            {!isActive && daysSinceActivity > 0 && (
              <p className="text-xs text-red-600 font-medium">
                Серия прервана {daysSinceActivity} {daysSinceActivity === 1 ? 'день' : 'дней'} назад
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-4">
        {/* Current and best streak */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn('p-4 rounded-xl text-center', config.bg)}>
            <div className={cn('text-3xl font-bold mb-1', config.text)}>
              {streak.current_count}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Текущая серия
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 text-center">
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {streak.best_count}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Лучшая серия
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-semibold text-slate-700">Награды за серии</h4>
          </div>
          
          {milestones.map((milestone, index) => (
            <div
              key={milestone.days}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all',
                milestone.achieved 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-slate-50 border border-slate-200'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                milestone.achieved 
                  ? 'bg-green-500 text-white' 
                  : 'bg-slate-300 text-slate-600'
              )}>
                {milestone.achieved ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{milestone.days}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-sm font-semibold',
                  milestone.achieved ? 'text-green-700' : 'text-slate-700'
                )}>
                  {milestone.days} дней
                </div>
                <div className={cn(
                  'text-xs',
                  milestone.achieved ? 'text-green-600' : 'text-slate-500'
                )}>
                  {milestone.reward}
                </div>
              </div>

              {milestone.achieved && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: index * 0.1 }}
                  className="text-green-600 font-bold text-xs"
                >
                  ✓ Получено
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Progress to next milestone */}
        {isActive && streak.current_count < 100 && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span>До следующей награды</span>
              <span className="font-semibold">
                {streak.current_count < 7 ? `${7 - streak.current_count} дней` :
                 streak.current_count < 30 ? `${30 - streak.current_count} дней` :
                 `${100 - streak.current_count} дней`}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${
                    streak.current_count < 7 ? (streak.current_count / 7) * 100 :
                    streak.current_count < 30 ? ((streak.current_count - 7) / 23) * 100 :
                    ((streak.current_count - 30) / 70) * 100
                  }%` 
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn('h-full bg-gradient-to-r', config.gradient)}
              />
            </div>
          </div>
        )}

        {/* Last activity */}
        <div className="text-xs text-slate-500 text-center pt-2">
          Последняя активность: {new Date(streak.last_activity_date).toLocaleDateString('ru-RU')}
        </div>
      </div>

      {/* Active glow effect */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        </div>
      )}
    </motion.div>
  );
}
