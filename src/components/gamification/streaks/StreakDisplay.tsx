import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { Streak } from '@/store';

interface StreakDisplayProps {
  streaks: Streak[];
  className?: string;
}

/**
 * StreakDisplay Component
 * 
 * Displays all active streaks for a user in a compact format
 * 
 * Requirements:
 * - 12.1-12.8: Display streak information
 * - 12.7: Show active streaks in profile
 */
export function StreakDisplay({ streaks, className }: StreakDisplayProps) {
  // Streak type configuration
  const streakConfig = {
    daily_login: {
      icon: Calendar,
      label: 'Ежедневный вход',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    lesson_creation: {
      icon: Trophy,
      label: 'Создание уроков',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
    },
    quiz_completion: {
      icon: TrendingUp,
      label: 'Прохождение викторин',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
    quest_completion: {
      icon: Flame,
      label: 'Выполнение квестов',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    },
  };

  // Get streak milestone (7, 30, 100 days)
  const getStreakMilestone = (count: number) => {
    if (count >= 100) return { label: '100+ дней', color: 'text-purple-600' };
    if (count >= 30) return { label: '30+ дней', color: 'text-amber-600' };
    if (count >= 7) return { label: '7+ дней', color: 'text-green-600' };
    return null;
  };

  // Sort streaks by current count (highest first)
  const sortedStreaks = [...streaks].sort((a, b) => b.current_count - a.current_count);

  return (
    <div className={cn('space-y-3', className)}>
      {sortedStreaks.map((streak, index) => {
        const config = streakConfig[streak.streak_type as keyof typeof streakConfig] || streakConfig.daily_login;
        const StreakIcon = config.icon;
        const milestone = getStreakMilestone(streak.current_count);
        const isActive = streak.current_count > 0;

        return (
          <motion.div
            key={streak.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'relative liquid-glass rounded-xl p-4 transition-all duration-300',
              isActive ? 'shadow-md' : 'opacity-60'
            )}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={cn(
                'relative w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
                config.gradient
              )}>
                <StreakIcon className="w-6 h-6 text-white" />
                {isActive && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Flame className="w-5 h-5 text-orange-500 drop-shadow-lg" />
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={cn('text-sm font-semibold', config.text)}>
                    {config.label}
                  </h4>
                  {milestone && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-bold',
                      milestone.color,
                      'bg-white/80'
                    )}>
                      {milestone.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>
                    Текущая: <span className="font-bold text-slate-800">{streak.current_count} дней</span>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span>
                    Лучшая: <span className="font-bold text-slate-800">{streak.best_count} дней</span>
                  </span>
                </div>
              </div>

              {/* Current count badge */}
              <div className={cn(
                'flex flex-col items-center justify-center w-16 h-16 rounded-xl shrink-0',
                config.bg
              )}>
                <div className={cn('text-2xl font-bold', config.text)}>
                  {streak.current_count}
                </div>
                <div className="text-xs text-slate-500">дней</div>
              </div>
            </div>

            {/* Progress to next milestone */}
            {isActive && streak.current_count < 100 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>До следующей награды</span>
                  <span className="font-semibold">
                    {streak.current_count < 7 ? `${7 - streak.current_count} дней` :
                     streak.current_count < 30 ? `${30 - streak.current_count} дней` :
                     `${100 - streak.current_count} дней`}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
          </motion.div>
        );
      })}

      {/* Empty state */}
      {streaks.length === 0 && (
        <div className="text-center py-8 liquid-glass rounded-xl">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <Flame className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700 mb-1">
            Нет активных серий
          </h4>
          <p className="text-xs text-slate-500">
            Начните выполнять действия каждый день, чтобы создать серию
          </p>
        </div>
      )}
    </div>
  );
}
