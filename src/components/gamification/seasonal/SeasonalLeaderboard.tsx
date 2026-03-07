import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  seasonal_points: number;
  rank: number | null;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface SeasonalLeaderboardProps {
  eventId: string;
  currentUserId?: string;
  limit?: number;
  className?: string;
}

export function SeasonalLeaderboard({
  eventId,
  currentUserId,
  limit = 10,
  className = '',
}: SeasonalLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [eventId, limit]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_seasonal_progress')
        .select(`
          id,
          user_id,
          seasonal_points,
          rank,
          user_profiles!inner (
            full_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('seasonal_points', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      // Transform data to match our interface
      const transformedData = (data || []).map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        seasonal_points: entry.seasonal_points,
        rank: entry.rank,
        user: {
          full_name: entry.user_profiles.full_name,
          avatar_url: entry.user_profiles.avatar_url,
        },
      }));

      setLeaderboard(transformedData);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Не удалось загрузить таблицу лидеров');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-100 to-amber-100 border-yellow-300';
    if (rank === 2) return 'from-slate-100 to-gray-100 border-slate-300';
    if (rank === 3) return 'from-amber-100 to-orange-100 border-amber-300';
    if (rank <= 10) return 'from-purple-50 to-pink-50 border-purple-200';
    return 'from-blue-50 to-cyan-50 border-blue-200';
  };

  if (isLoading) {
    return (
      <div className={`glass rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass rounded-2xl p-6 ${className}`}>
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary-600" />
        Таблица лидеров
      </h3>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Пока нет участников</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative overflow-hidden rounded-xl p-4 border-2 transition-all
                  ${isCurrentUser ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                  ${rank <= 3 ? `bg-gradient-to-r ${getRankColor(rank)}` : 'bg-white border-slate-200'}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {getRankIcon(rank) || (
                      <span className="text-lg font-black text-slate-600">
                        #{rank}
                      </span>
                    )}
                    {getRankBadge(rank) && (
                      <div className="text-2xl">{getRankBadge(rank)}</div>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {entry.user?.avatar_url ? (
                      <img
                        src={entry.user.avatar_url}
                        alt={entry.user.full_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                        {entry.user?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${rank <= 3 ? 'text-slate-900' : 'text-slate-700'}`}>
                      {entry.user?.full_name || 'Неизвестный пользователь'}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs font-semibold text-primary-600">
                          (Вы)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-lg font-black ${rank <= 3 ? 'text-slate-900' : 'text-slate-700'}`}>
                      {entry.seasonal_points}
                    </p>
                    <p className="text-xs text-slate-500">очков</p>
                  </div>
                </div>

                {/* Highlight effect for current user */}
                {isCurrentUser && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-purple-500/10 pointer-events-none"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
