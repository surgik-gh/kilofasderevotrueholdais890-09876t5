import { useState } from 'react';
import { useStore } from '../store';
import { questService } from '../services/gamification/quest.service';
import type { UserQuest } from '../store';

export function useQuests() {
  const {
    activeQuests,
    setActiveQuests,
    updateQuests,
    completeQuest,
    addNotification,
    updateWisdomCoins,
    profile,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active quests
  const loadActiveQuests = async (type?: 'daily' | 'weekly') => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const quests = await questService.getActiveQuests(profile.id, type);
      setActiveQuests(quests);
    } catch (err) {
      console.error('Failed to load active quests:', err);
      setError('Failed to load active quests');
    } finally {
      setIsLoading(false);
    }
  };

  // Get quest progress
  const getQuestProgress = async (questId: string) => {
    if (!profile?.id) return null;

    try {
      return await questService.getUserQuestProgress(profile.id, questId);
    } catch (err) {
      console.error('Failed to get quest progress:', err);
      return null;
    }
  };

  // Update quest progress
  const updateQuestProgress = async (questId: string, progress: number) => {
    if (!profile?.id) return null;

    try {
      const updatedQuest = await questService.updateQuestProgress(profile.id, questId, progress);
      
      // Update local state
      const updatedQuests = activeQuests.map(q =>
        q.quest_id === questId ? updatedQuest : q
      );
      updateQuests(updatedQuests);

      return updatedQuest;
    } catch (err) {
      console.error('Failed to update quest progress:', err);
      setError('Failed to update quest progress');
      return null;
    }
  };

  // Complete quest and claim reward
  const completeQuestAndClaim = async (questId: string) => {
    if (!profile?.id) return null;

    try {
      const reward = await questService.completeQuest(profile.id, questId);
      
      // Update local state
      completeQuest(questId);

      // Update coins
      updateWisdomCoins(reward.coins);

      // Show notification
      const quest = activeQuests.find(q => q.quest_id === questId);
      addNotification({
        type: 'quest',
        title: 'Quest Completed!',
        message: `You completed: ${quest?.quest?.title}. Earned ${reward.coins} Wisdom Coins and ${reward.xp} XP!`,
      });

      // Check if bonus reward was earned
      if (reward.bonus_coins) {
        addNotification({
          type: 'quest',
          title: 'Bonus Reward!',
          message: `You completed all quests! Earned ${reward.bonus_coins} bonus Wisdom Coins!`,
        });
      }

      return reward;
    } catch (err) {
      console.error('Failed to complete quest:', err);
      setError('Failed to complete quest');
      return null;
    }
  };

  // Check quest completion
  const checkQuestCompletion = async (eventType: string, value: number) => {
    if (!profile?.id) return [];

    try {
      const completedQuests = await questService.checkQuestCompletion(profile.id, eventType as any, value);
      
      if (completedQuests.length > 0) {
        // Update local state
        const updatedQuests = activeQuests.map(q => {
          const completed = completedQuests.find(cq => cq.quest_id === q.quest_id);
          return completed || q;
        });
        updateQuests(updatedQuests);
      }

      return completedQuests;
    } catch (err) {
      console.error('Failed to check quest completion:', err);
      return [];
    }
  };

  // Get daily quests
  const getDailyQuests = () => {
    return activeQuests.filter(q => q.quest?.quest_type === 'daily');
  };

  // Get weekly quests
  const getWeeklyQuests = () => {
    return activeQuests.filter(q => q.quest?.quest_type === 'weekly');
  };

  // Get completed quests
  const getCompletedQuests = () => {
    return activeQuests.filter(q => q.completed);
  };

  // Get incomplete quests
  const getIncompleteQuests = () => {
    return activeQuests.filter(q => !q.completed);
  };

  // Get quest progress percentage
  const getQuestProgressPercentage = (quest: UserQuest) => {
    if (!quest.quest) return 0;
    return Math.min(100, (quest.progress / quest.quest.condition_value) * 100);
  };

  // Check if all daily quests are completed
  const areAllDailyQuestsCompleted = () => {
    const dailyQuests = getDailyQuests();
    return dailyQuests.length > 0 && dailyQuests.every(q => q.completed);
  };

  // Check if all weekly quests are completed
  const areAllWeeklyQuestsCompleted = () => {
    const weeklyQuests = getWeeklyQuests();
    return weeklyQuests.length > 0 && weeklyQuests.every(q => q.completed);
  };

  return {
    activeQuests,
    isLoading,
    error,
    loadActiveQuests,
    getQuestProgress,
    updateQuestProgress,
    completeQuestAndClaim,
    checkQuestCompletion,
    getDailyQuests,
    getWeeklyQuests,
    getCompletedQuests,
    getIncompleteQuests,
    getQuestProgressPercentage,
    areAllDailyQuestsCompleted,
    areAllWeeklyQuestsCompleted,
  };
}
