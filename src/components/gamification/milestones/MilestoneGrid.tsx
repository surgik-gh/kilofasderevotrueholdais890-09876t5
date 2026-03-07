import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { MilestoneCard } from './MilestoneCard';
import type { Milestone, UserMilestone } from '@/store';

interface MilestoneGridProps {
  milestones: Milestone[];
  userMilestones: UserMilestone[];
  currentValues?: Record<string, number>;
  className?: string;
}

/**
 * MilestoneGrid Component
 * 
 * Displays a grid of milestones organized by category
 * 
 * Requirements:
 * - 6.1-6.7: Display all milestones with progress
 * - 7.6: Show progress to next milestone
 */
export function MilestoneGrid({ 
  milestones, 
  userMilestones,
  currentValues = {},
  className 
}: MilestoneGridProps) {
  // Group milestones by category
  const groupedMilestones = milestones.reduce((acc, milestone) => {
    if (!acc[milestone.category]) {
      acc[milestone.category] = [];
    }
    acc[milestone.category].push(milestone);
    return acc;
  }, {} as Record<string, Milestone[]>);

  // Sort milestones within each category by threshold
  Object.keys(groupedMilestones).forEach(category => {
    groupedMilestones[category].sort((a, b) => a.threshold - b.threshold);
  });

  // Category display names
  const categoryNames: Record<string, string> = {
    lessons_created: 'Созданные уроки',
    quizzes_completed: 'Пройденные викторины',
    wisdom_coins: 'Wisdom Coins',
    level_reached: 'Достигнутый уровень',
  };

  // Find user milestone for a given milestone
  const getUserMilestone = (milestoneId: string) => {
    return userMilestones.find(um => um.milestone_id === milestoneId);
  };

  // Get current value for a category
  const getCurrentValue = (category: string) => {
    return currentValues[category] || 0;
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={cn('space-y-8', className)}>
      {Object.entries(groupedMilestones).map(([category, categoryMilestones]) => (
        <motion.div
          key={category}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Category header */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">
              {categoryNames[category] || category}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent" />
            <div className="text-sm text-slate-500">
              {categoryMilestones.filter(m => getUserMilestone(m.id)?.achieved).length} / {categoryMilestones.length}
            </div>
          </div>

          {/* Milestones grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {categoryMilestones.map((milestone) => (
              <motion.div key={milestone.id} variants={itemVariants}>
                <MilestoneCard
                  milestone={milestone}
                  userMilestone={getUserMilestone(milestone.id)}
                  currentValue={getCurrentValue(category)}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      ))}

      {/* Empty state */}
      {milestones.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              🎯
            </motion.div>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Нет доступных вех
          </h3>
          <p className="text-sm text-slate-500">
            Вехи появятся по мере вашего прогресса в обучении
          </p>
        </div>
      )}
    </div>
  );
}
