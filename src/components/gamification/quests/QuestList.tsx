import { motion } from 'framer-motion';
import { Trophy, Calendar, CalendarDays } from 'lucide-react';
import { cn } from '@/utils/cn';
import { QuestCard } from './QuestCard';
import type { UserQuest } from '@/store';

interface QuestListProps {
  quests: UserQuest[];
  type: 'daily' | 'weekly';
  onClaimReward?: (questId: string) => void;
  className?: string;
}

/**
 * QuestList Component
 * 
 * Displays a list of quests (daily or weekly) with completion status
 * 
 * Requirements:
 * - 3.1-3.8: Display daily quests list
 * - 4.1-4.7: Display weekly quests list
 * - 3.5, 4.5: Show bonus reward indicator when all quests completed
 */
export function QuestList({ quests, type, onClaimReward, className }: QuestListProps) {
  const completedCount = quests.filter(q => q.completed).length;
  const totalCount = quests.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  const typeConfig = {
    daily: {
      title: 'Daily Quests',
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      text: 'text-blue-700',
    },
    weekly: {
      title: 'Weekly Quests',
      icon: CalendarDays,
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      text: 'text-purple-700',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
            config.gradient
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={cn('text-xl font-bold', config.text)}>
              {config.title}
            </h2>
            <p className="text-sm text-slate-600">
              {completedCount} of {totalCount} completed
            </p>
          </div>
        </div>

        {/* Completion badge */}
        {allCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full shadow-lg',
              'bg-gradient-to-r',
              config.gradient
            )}
          >
            <Trophy className="w-5 h-5 text-white" />
            <span className="text-sm font-bold text-white">All Complete!</span>
          </motion.div>
        )}
      </div>

      {/* Bonus reward banner */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-xl bg-gradient-to-br border-2 border-amber-300',
            'from-amber-50 to-orange-50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-0.5">
                Bonus Reward Unlocked!
              </h3>
              <p className="text-sm text-amber-700">
                You've completed all {type} quests and earned a bonus reward!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quest cards */}
      {quests.length === 0 ? (
        <div className={cn(
          'p-8 rounded-2xl text-center bg-gradient-to-br',
          config.bg
        )}>
          <Icon className={cn('w-12 h-12 mx-auto mb-3', config.text, 'opacity-50')} />
          <p className={cn('font-medium', config.text)}>
            No {type} quests available
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Check back later for new quests!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quests.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <QuestCard
                userQuest={quest}
                onClaimReward={onClaimReward}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
