import { CheckCircle2, Clock, Target, Trophy, MessageSquare, BookOpen, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { UserQuest } from '@/store';

interface QuestCardProps {
  userQuest: UserQuest;
  onClaimReward?: (questId: string) => void;
  className?: string;
}

/**
 * QuestCard Component
 * 
 * Displays a single quest with its progress, rewards, and completion status
 * 
 * Requirements:
 * - 3.1-3.8: Display daily quest information
 * - 4.1-4.7: Display weekly quest information
 * - 7.2: Show progress bar for quest completion
 */
export function QuestCard({ userQuest, onClaimReward, className }: QuestCardProps) {
  const quest = userQuest.quest;
  
  if (!quest) return null;

  const isCompleted = userQuest.completed;
  const isRewardClaimed = userQuest.reward_claimed;
  const progressPercentage = Math.min((userQuest.progress / quest.condition_value) * 100, 100);
  const isDaily = quest.quest_type === 'daily';

  // Quest type colors
  const typeConfig = {
    daily: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      text: 'text-blue-700',
      glow: 'shadow-blue-200',
      icon: Clock,
    },
    weekly: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      text: 'text-purple-700',
      glow: 'shadow-purple-200',
      icon: Target,
    },
  };

  const config = typeConfig[quest.quest_type];
  const TypeIcon = config.icon;

  // Condition type icons
  const conditionIcons: Record<string, any> = {
    create_lessons: BookOpen,
    complete_quizzes: Trophy,
    quiz_score_above: Star,
    leaderboard_top: Trophy,
    expert_chat_messages: MessageSquare,
    study_subjects: BookOpen,
  };

  const ConditionIcon = conditionIcons[quest.condition_type] || Target;

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(quest.active_until);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative liquid-glass rounded-2xl overflow-hidden transition-all duration-300',
        isCompleted ? `${config.glow} shadow-lg` : '',
        'mobile-compact', // Mobile-friendly padding
        className
      )}
    >
      {/* Completion badge */}
      {isCompleted && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
          <div className={cn(
            'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r shadow-lg',
            config.gradient
          )}>
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase hidden sm:inline">Completed</span>
            <span className="text-xs font-bold text-white uppercase sm:hidden">✓</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn('p-4 sm:p-6 bg-gradient-to-br', config.bg)}>
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={cn(
            'relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0',
            config.gradient
          )}>
            <ConditionIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <TypeIcon className={cn('w-3 h-3 sm:w-4 sm:h-4', config.text)} />
              <span className={cn('text-xs font-semibold uppercase', config.text)}>
                {quest.quest_type} Quest
              </span>
            </div>
            <h3 className={cn('text-base sm:text-lg font-bold mb-1', config.text)}>
              {quest.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
              {quest.description}
            </p>
          </div>
        </div>
      </div>

      {/* Progress and details */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="font-medium text-slate-700">Progress</span>
            <span className={cn('font-bold', config.text)}>
              {userQuest.progress} / {quest.condition_value}
            </span>
          </div>
          <div className="h-2.5 sm:h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn('h-full bg-gradient-to-r', config.gradient)}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>{progressPercentage.toFixed(0)}% complete</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getTimeRemaining()}
            </span>
          </div>
        </div>

        {/* Rewards */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-amber-50">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">C</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-amber-700">
                +{quest.reward_coins}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-blue-50">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">XP</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-blue-700">
                +{quest.reward_xp}
              </span>
            </div>
          </div>

          {/* Claim button */}
          {isCompleted && !isRewardClaimed && onClaimReward && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onClaimReward(quest.id)}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-white text-xs sm:text-sm shadow-lg',
                'bg-gradient-to-r transition-all duration-200 tap-target tap-feedback',
                'mobile-btn-full sm:w-auto',
                config.gradient
              )}
            >
              Claim Reward
            </motion.button>
          )}

          {isRewardClaimed && (
            <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Claimed
            </div>
          )}
        </div>
      </div>

      {/* Completion glow effect */}
      {isCompleted && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        </div>
      )}
    </motion.div>
  );
}
