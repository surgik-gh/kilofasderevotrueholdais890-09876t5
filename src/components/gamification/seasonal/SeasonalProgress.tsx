import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Award } from 'lucide-react';

interface SeasonalProgressProps {
  currentPoints: number;
  rank: number | null;
  totalParticipants?: number;
  nextMilestone?: {
    points: number;
    reward: string;
  };
  className?: string;
}

export function SeasonalProgress({
  currentPoints,
  rank,
  totalParticipants,
  nextMilestone,
  className = '',
}: SeasonalProgressProps) {
  const getRankColor = (rank: number | null) => {
    if (!rank) return 'text-slate-600';
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-amber-600';
    if (rank <= 10) return 'text-purple-600';
    return 'text-blue-600';
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const progressToNextMilestone = nextMilestone
    ? Math.min((currentPoints / nextMilestone.points) * 100, 100)
    : 100;

  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary-600" />
        Ваш прогресс
      </h3>

      {/* Current Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Points */}
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary-600" />
            <span className="text-sm text-slate-600 font-medium">Очки</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{currentPoints}</p>
        </div>

        {/* Rank */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-slate-600 font-medium">Место</span>
          </div>
          <div className="flex items-center gap-2">
            {getRankBadge(rank) && (
              <span className="text-2xl">{getRankBadge(rank)}</span>
            )}
            <p className={`text-2xl font-black ${getRankColor(rank)}`}>
              {rank ? `#${rank}` : 'N/A'}
            </p>
          </div>
          {totalParticipants && (
            <p className="text-xs text-slate-500 mt-1">
              из {totalParticipants}
            </p>
          )}
        </div>
      </div>

      {/* Next Milestone */}
      {nextMilestone && currentPoints < nextMilestone.points && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700">
                Следующая награда
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-600">
              {nextMilestone.points - currentPoints} очков
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-white rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextMilestone}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>

          <p className="text-xs text-slate-600">
            {nextMilestone.reward}
          </p>
        </motion.div>
      )}

      {/* Completion Message */}
      {nextMilestone && currentPoints >= nextMilestone.points && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 text-center"
        >
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm font-bold text-green-700">
            Поздравляем! Вы достигли цели!
          </p>
        </motion.div>
      )}
    </div>
  );
}
