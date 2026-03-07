import { motion } from 'framer-motion';
import { TrendingUp, Award, Zap, Target } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface LevelStatsProps {
  level: number;
  totalXP: number;
  currentXP: number;
  xpToNextLevel: number;
  className?: string;
}

export function LevelStats({
  level,
  totalXP,
  currentXP,
  xpToNextLevel,
  className,
}: LevelStatsProps) {
  const progressPercentage = Math.min((currentXP / xpToNextLevel) * 100, 100);

  const stats = [
    {
      label: 'Текущий уровень',
      value: level,
      icon: Award,
      color: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Всего опыта',
      value: totalXP.toLocaleString(),
      icon: TrendingUp,
      color: 'from-blue-500 to-purple-500',
    },
    {
      label: 'Текущий опыт',
      value: currentXP.toLocaleString(),
      icon: Zap,
      color: 'from-green-500 to-teal-500',
    },
    {
      label: 'До следующего уровня',
      value: (xpToNextLevel - currentXP).toLocaleString(),
      icon: Target,
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="liquid-glass rounded-xl p-4"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center mb-3',
                stat.color
              )}
            >
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="liquid-glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Прогресс к уровню {level + 1}
          </h3>
          <span className="text-2xl font-bold text-gray-800">
            {Math.round(progressPercentage)}%
          </span>
        </div>

        {/* Visual progress bar */}
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 relative"
          >
            {/* Animated shine */}
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
          </motion.div>
        </div>

        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <span>{currentXP.toLocaleString()} XP</span>
          <span>{xpToNextLevel.toLocaleString()} XP</span>
        </div>
      </motion.div>

      {/* Level milestones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="liquid-glass rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Вехи уровней
        </h3>
        <div className="space-y-3">
          {[
            { level: 10, title: 'Опытный', reached: level >= 10 },
            { level: 25, title: 'Эксперт', reached: level >= 25 },
            { level: 50, title: 'Мастер обучения', reached: level >= 50 },
          ].map((milestone) => (
            <div
              key={milestone.level}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors',
                milestone.reached
                  ? 'bg-gradient-to-r from-green-50 to-teal-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center font-bold',
                    milestone.reached
                      ? 'bg-gradient-to-br from-green-400 to-teal-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {milestone.level}
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    {milestone.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    Уровень {milestone.level}
                  </div>
                </div>
              </div>
              {milestone.reached && (
                <Award className="w-5 h-5 text-green-500" />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
