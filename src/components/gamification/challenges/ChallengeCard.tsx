import { Trophy, Users, Calendar, Target, Crown, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { Challenge } from '@/store';

interface ChallengeCardProps {
  challenge: Challenge;
  userProgress?: number;
  participantCount?: number;
  isCreator?: boolean;
  onViewDetails?: (challengeId: string) => void;
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
  className?: string;
}

/**
 * ChallengeCard Component
 * 
 * Displays a single challenge with its details, progress, and status
 * 
 * Requirements:
 * - 5.1-5.8: Display challenge information
 */
export function ChallengeCard({
  challenge,
  userProgress = 0,
  participantCount = 0,
  isCreator = false,
  onViewDetails,
  onAccept,
  onDecline,
  className,
}: ChallengeCardProps) {
  // Challenge type configuration
  const typeConfig: Record<string, { icon: any; label: string; color: string; gradient: string; bg: string }> = {
    most_lessons: {
      icon: Target,
      label: 'Most Lessons',
      color: 'text-blue-700',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
    },
    most_quizzes: {
      icon: Trophy,
      label: 'Most Quizzes',
      color: 'text-purple-700',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
    },
    highest_score: {
      icon: Crown,
      label: 'Highest Score',
      color: 'text-amber-700',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
    },
  };

  const config = typeConfig[challenge.challenge_type] || typeConfig.most_lessons;
  const TypeIcon = config.icon;

  // Status configuration
  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    active: { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-100' },
    completed: { label: 'Completed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    cancelled: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  };

  const statusInfo = statusConfig[challenge.status] || statusConfig.pending;

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(challenge.end_date);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    
    return `${hours}h`;
  };

  // Calculate progress percentage
  const progressPercentage = challenge.target_value > 0 
    ? Math.min((userProgress / challenge.target_value) * 100, 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative liquid-glass rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl',
        className
      )}
    >
      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className={cn(
          'px-3 py-1.5 rounded-full text-xs font-bold uppercase',
          statusInfo.bgColor,
          statusInfo.color
        )}>
          {statusInfo.label}
        </div>
      </div>

      {/* Creator badge */}
      {isCreator && (
        <div className="absolute top-3 left-3 z-10">
          <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase shadow-lg">
            Creator
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn('p-6 bg-gradient-to-br', config.bg)}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'relative w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
            config.gradient
          )}>
            <TypeIcon className="w-7 h-7 text-white" />
          </div>

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-xs font-semibold uppercase', config.color)}>
                {config.label}
              </span>
            </div>
            <h3 className={cn('text-lg font-bold mb-1', config.color)}>
              {challenge.title}
            </h3>
            <p className="text-sm text-slate-600 line-clamp-2">
              {challenge.description}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-4">
        {/* Challenge info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">
              {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">{getTimeRemaining()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">Goal: {challenge.target_value}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">
              {new Date(challenge.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Progress bar (only for active challenges) */}
        {challenge.status === 'active' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-700">Your Progress</span>
              <span className={cn('font-bold', config.color)}>
                {userProgress} / {challenge.target_value}
              </span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
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
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">C</span>
              </div>
              <span className="text-sm font-semibold text-amber-700">
                +{challenge.reward_coins}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">XP</span>
              </div>
              <span className="text-sm font-semibold text-blue-700">
                +{challenge.reward_xp}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {challenge.status === 'pending' && !isCreator && onAccept && onDecline && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAccept(challenge.id)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold shadow-lg"
                >
                  Accept
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDecline(challenge.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold"
                >
                  Decline
                </motion.button>
              </>
            )}

            {onViewDetails && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewDetails(challenge.id)}
                className={cn(
                  'px-4 py-1.5 rounded-lg font-semibold text-white text-sm shadow-lg',
                  'bg-gradient-to-r transition-all duration-200',
                  config.gradient
                )}
              >
                View Details
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Winner indicator */}
      {challenge.status === 'completed' && challenge.winner_id && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Crown className="w-16 h-16 text-amber-400 opacity-20" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
