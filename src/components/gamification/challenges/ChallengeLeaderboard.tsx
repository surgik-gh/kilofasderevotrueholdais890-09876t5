import { Trophy, Crown, Medal, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: number;
  status: string;
  joined_at: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

interface ChallengeLeaderboardProps {
  challengeId: string;
  targetValue: number;
  currentUserId?: string;
  className?: string;
}

/**
 * ChallengeLeaderboard Component
 * 
 * Displays the leaderboard for a challenge with participant rankings
 * 
 * Requirements:
 * - 5.5: Display challenge progress
 * - 5.6: Show winner and rankings
 */
export function ChallengeLeaderboard({
  challengeId,
  targetValue,
  currentUserId,
  className,
}: ChallengeLeaderboardProps) {
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, [challengeId]);

  const loadParticipants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          user_profile:user_profiles!challenge_participants_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('challenge_id', challengeId)
        .eq('status', 'accepted')
        .order('progress', { ascending: false });

      if (error) throw error;

      setParticipants((data || []) as any);
    } catch (error) {
      console.error('Failed to load participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Rank configuration
  const getRankConfig = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: Crown,
          gradient: 'from-amber-400 to-orange-500',
          bg: 'from-amber-50 to-orange-50',
          text: 'text-amber-700',
          badge: 'bg-gradient-to-r from-amber-400 to-orange-500',
        };
      case 2:
        return {
          icon: Medal,
          gradient: 'from-slate-400 to-slate-500',
          bg: 'from-slate-50 to-slate-100',
          text: 'text-slate-700',
          badge: 'bg-gradient-to-r from-slate-400 to-slate-500',
        };
      case 3:
        return {
          icon: Medal,
          gradient: 'from-amber-600 to-amber-700',
          bg: 'from-amber-50 to-amber-100',
          text: 'text-amber-800',
          badge: 'bg-gradient-to-r from-amber-600 to-amber-700',
        };
      default:
        return {
          icon: TrendingUp,
          gradient: 'from-blue-400 to-cyan-500',
          bg: 'from-blue-50 to-cyan-50',
          text: 'text-blue-700',
          badge: 'bg-slate-200',
        };
    }
  };

  if (isLoading) {
    return (
      <div className={cn('liquid-glass rounded-xl p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className={cn('liquid-glass rounded-xl p-6 text-center', className)}>
        <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No participants yet</p>
      </div>
    );
  }

  return (
    <div className={cn('liquid-glass rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Leaderboard</h3>
            <p className="text-sm text-white/80">
              {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
            </p>
          </div>
        </div>
      </div>

      {/* Participants list */}
      <div className="p-4 space-y-3">
        {participants.map((participant, index) => {
          const rank = index + 1;
          const config = getRankConfig(rank);
          const RankIcon = config.icon;
          const isCurrentUser = participant.user_id === currentUserId;
          const progressPercentage = targetValue > 0 
            ? Math.min((participant.progress / targetValue) * 100, 100)
            : 0;

          return (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'relative rounded-xl overflow-hidden transition-all',
                isCurrentUser ? 'ring-2 ring-indigo-500 shadow-lg' : '',
                rank <= 3 ? 'shadow-md' : ''
              )}
            >
              {/* Background gradient for top 3 */}
              {rank <= 3 && (
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10', config.bg)} />
              )}

              <div className="relative p-4 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                    rank <= 3 ? config.badge : 'bg-slate-200'
                  )}>
                    {rank <= 3 ? (
                      <RankIcon className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-lg font-bold text-slate-600">#{rank}</span>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        'font-bold truncate',
                        rank <= 3 ? config.text : 'text-slate-800'
                      )}>
                        {participant.user_profile?.full_name || 'Unknown User'}
                      </h4>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                          You
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">Progress</span>
                        <span className={cn('font-bold', rank <= 3 ? config.text : 'text-slate-700')}>
                          {participant.progress} / {targetValue}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
                          className={cn(
                            'h-full',
                            rank <= 3 ? `bg-gradient-to-r ${config.gradient}` : 'bg-slate-400'
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress percentage */}
                  <div className="text-right shrink-0">
                    <div className={cn(
                      'text-2xl font-bold',
                      rank <= 3 ? config.text : 'text-slate-700'
                    )}>
                      {progressPercentage.toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-500">complete</div>
                  </div>
                </div>
              </div>

              {/* Winner crown effect */}
              {rank === 1 && (
                <div className="absolute top-0 right-0 p-2">
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Crown className="w-6 h-6 text-amber-400" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer with stats */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {participants[0]?.progress || 0}
            </div>
            <div className="text-xs text-slate-600">Top Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {Math.round(
                participants.reduce((sum, p) => sum + p.progress, 0) / participants.length
              )}
            </div>
            <div className="text-xs text-slate-600">Average</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{targetValue}</div>
            <div className="text-xs text-slate-600">Target</div>
          </div>
        </div>
      </div>
    </div>
  );
}
