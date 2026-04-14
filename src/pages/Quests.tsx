import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Calendar, CalendarDays, Sparkles, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useQuests } from '@/hooks/useQuests';
import { QuestList } from '@/components/gamification/quests/QuestList';
import { QuestNotification } from '@/components/gamification/quests/QuestNotification';
import {
  GamificationErrorDisplay,
  QuestCardSkeleton,
  SkeletonList,
} from '@/components/gamification/shared';
import { cn } from '@/utils/cn';
import type { UserQuest } from '@/store';
import { useStore } from '@/store';

/**
 * Quests Page
 * 
 * Displays daily and weekly quests with progress tracking and reward claiming
 * 
 * Requirements:
 * - 3.1-3.8: Display and manage daily quests
 * - 4.1-4.7: Display and manage weekly quests
 * - 3.4, 4.4: Allow claiming rewards for completed quests
 * - 3.5, 4.5: Show bonus rewards when all quests completed
 * - 3.7, 4.7: Show progress for each quest
 */
export default function Quests() {
  const profile = useStore((state) => state.profile);
  const {
    isLoading,
    error,
    loadActiveQuests,
    getDailyQuests,
    getWeeklyQuests,
    completeQuestAndClaim,
    areAllDailyQuestsCompleted,
    areAllWeeklyQuestsCompleted,
  } = useQuests();

  const [completedQuest, setCompletedQuest] = useState<UserQuest | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showBonusReward, setShowBonusReward] = useState(false);
  const [bonusCoins, setBonusCoins] = useState(0);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const dailyQuests = getDailyQuests();
  const weeklyQuests = getWeeklyQuests();

  // Load quests on mount
  useEffect(() => {
    if (profile?.id) {
      loadActiveQuests();
    }
  }, [profile?.id]);

  // Handle quest reward claim
  const handleClaimReward = async (questId: string) => {
    const quest = [...dailyQuests, ...weeklyQuests].find(q => q.quest_id === questId);
    if (!quest) return;

    const reward = await completeQuestAndClaim(questId);
    
    if (reward) {
      setCompletedQuest(quest);
      setShowBonusReward(!!reward.bonus_coins);
      setBonusCoins(reward.bonus_coins || 0);
      setShowNotification(true);
    }
  };

  // Calculate statistics
  const dailyCompletedCount = dailyQuests.filter(q => q.completed).length;
  const weeklyCompletedCount = weeklyQuests.filter(q => q.completed).length;
  const totalCompleted = dailyCompletedCount + weeklyCompletedCount;
  const totalQuests = dailyQuests.length + weeklyQuests.length;

  // Calculate total rewards
  const totalCoinsEarned = [...dailyQuests, ...weeklyQuests]
    .filter(q => q.reward_claimed)
    .reduce((sum, q) => sum + (q.quest?.reward_coins || 0), 0);

  const totalXPEarned = [...dailyQuests, ...weeklyQuests]
    .filter(q => q.reward_claimed)
    .reduce((sum, q) => sum + (q.quest?.reward_xp || 0), 0);

  // Show error with retry option
  if (error && totalQuests === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <GamificationErrorDisplay
              error={error}
              context="quests"
              onRetry={loadActiveQuests}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Show skeleton loading state
  if (isLoading && totalQuests === 0) {
    return (
      <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="liquid-glass p-6 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">Квесты</h1>
                <p className="text-sm text-slate-600">Загрузка квестов...</p>
              </div>
            </div>
          </div>
          <SkeletonList count={3} component={QuestCardSkeleton} />
        </div>
      </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-xl">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quests
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Complete daily and weekly quests to earn rewards and level up faster!
          </p>
        </motion.div>

        {/* Statistics cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Total progress */}
          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Progress</p>
                <p className="text-2xl font-bold text-slate-800">
                  {totalCompleted}/{totalQuests}
                </p>
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalQuests > 0 ? (totalCompleted / totalQuests) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              />
            </div>
          </div>

          {/* Coins earned */}
          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <div>
                <p className="text-sm text-slate-600">Coins Earned</p>
                <p className="text-2xl font-bold text-amber-700">
                  {totalCoinsEarned}
                </p>
              </div>
            </div>
          </div>

          {/* XP earned */}
          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">XP</span>
              </div>
              <div>
                <p className="text-sm text-slate-600">XP Earned</p>
                <p className="text-2xl font-bold text-blue-700">
                  {totalXPEarned}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Completion badges */}
        {(areAllDailyQuestsCompleted() || areAllWeeklyQuestsCompleted()) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {areAllDailyQuestsCompleted() && (
              <div className="liquid-glass rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-blue-900">Daily Champion!</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      You've completed all daily quests today!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {areAllWeeklyQuestsCompleted() && (
              <div className="liquid-glass rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <CalendarDays className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-purple-900">Weekly Master!</h3>
                    </div>
                    <p className="text-sm text-purple-700">
                      You've completed all weekly quests this week!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 p-2 liquid-glass rounded-2xl w-fit mx-auto"
        >
          <button
            onClick={() => setActiveTab('daily')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200',
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Calendar className="w-5 h-5" />
            Daily Quests
            {dailyQuests.length > 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-bold',
                activeTab === 'daily' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
              )}>
                {dailyCompletedCount}/{dailyQuests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200',
              activeTab === 'weekly'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <CalendarDays className="w-5 h-5" />
            Weekly Quests
            {weeklyQuests.length > 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-bold',
                activeTab === 'weekly' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
              )}>
                {weeklyCompletedCount}/{weeklyQuests.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* Quest lists */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {activeTab === 'daily' ? (
            <QuestList
              quests={dailyQuests}
              type="daily"
              onClaimReward={handleClaimReward}
            />
          ) : (
            <QuestList
              quests={weeklyQuests}
              type="weekly"
              onClaimReward={handleClaimReward}
            />
          )}
        </motion.div>

        {/* Refresh button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <button
            onClick={() => loadActiveQuests()}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold',
              'bg-white text-slate-700 shadow-lg hover:shadow-xl',
              'transition-all duration-200 hover:scale-105',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            Refresh Quests
          </button>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-center"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Quest completion notification */}
      {completedQuest && (
        <QuestNotification
          userQuest={completedQuest}
          isVisible={showNotification}
          onClose={() => {
            setShowNotification(false);
            setCompletedQuest(null);
            setShowBonusReward(false);
            setBonusCoins(0);
          }}
          showBonusReward={showBonusReward}
          bonusCoins={bonusCoins}
        />
      )}
    </Layout>
  );
}
