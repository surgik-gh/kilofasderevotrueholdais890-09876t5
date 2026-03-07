import { useState } from 'react';
import { useStore } from '../store';
import { streakService } from '../services/gamification/streak.service';

export function useStreaks() {
  const {
    streaks,
    setStreaks,
    updateStreak,
    addNotification,
    updateWisdomCoins,
    profile,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user streaks
  const loadUserStreaks = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const userStreaks = await streakService.getUserStreaks(profile.id);
      setStreaks(userStreaks);
    } catch (err) {
      console.error('Failed to load streaks:', err);
      setError('Failed to load streaks');
    } finally {
      setIsLoading(false);
    }
  };

  // Get streak by type
  const getStreak = async (type: string) => {
    if (!profile?.id) return null;

    try {
      return await streakService.getStreak(profile.id, type as any);
    } catch (err) {
      console.error('Failed to get streak:', err);
      return null;
    }
  };

  // Update streak
  const updateStreakCount = async (type: string) => {
    if (!profile?.id) return null;

    try {
      const updatedStreak = await streakService.updateStreak(profile.id, type as any);
      updateStreak(updatedStreak);

      // Check if reward should be given
      const reward = streakService.getStreakReward(type as any, updatedStreak.current_count);
      if (reward) {
        updateWisdomCoins(reward.coins);

        addNotification({
          type: 'streak',
          title: 'Streak Milestone!',
          message: `${updatedStreak.current_count} day streak! Earned ${reward.coins} Wisdom Coins and ${reward.xp} XP!`,
        });
      }

      return updatedStreak;
    } catch (err) {
      console.error('Failed to update streak:', err);
      setError('Failed to update streak');
      return null;
    }
  };

  // Break streak
  const breakStreak = async (type: string) => {
    if (!profile?.id) return;

    try {
      await streakService.breakStreak(profile.id, type as any);

      // Update local state
      const updatedStreaks = streaks.map(s =>
        s.streak_type === type ? { ...s, current_count: 0 } : s
      );
      setStreaks(updatedStreaks);

      addNotification({
        type: 'streak',
        title: 'Streak Broken',
        message: `Your ${type} streak has been reset. Start a new one today!`,
      });
    } catch (err) {
      console.error('Failed to break streak:', err);
      setError('Failed to break streak');
    }
  };

  // Claim streak reward
  const claimStreakReward = async (type: string) => {
    if (!profile?.id) return null;

    try {
      const reward = await streakService.claimStreakReward(profile.id, type as any);

      updateWisdomCoins(reward.coins);

      addNotification({
        type: 'streak',
        title: 'Streak Reward Claimed!',
        message: `You earned ${reward.coins} Wisdom Coins and ${reward.xp} XP!`,
      });

      return reward;
    } catch (err) {
      console.error('Failed to claim streak reward:', err);
      setError('Failed to claim streak reward');
      return null;
    }
  };

  // Get streak by type from local state
  const getStreakByType = (type: string) => {
    return streaks.find(s => s.streak_type === type);
  };

  // Get daily login streak
  const getDailyLoginStreak = () => {
    return getStreakByType('daily_login');
  };

  // Get lesson creation streak
  const getLessonCreationStreak = () => {
    return getStreakByType('lesson_creation');
  };

  // Get quiz completion streak
  const getQuizCompletionStreak = () => {
    return getStreakByType('quiz_completion');
  };

  // Get quest completion streak
  const getQuestCompletionStreak = () => {
    return getStreakByType('quest_completion');
  };

  // Get all active streaks (count > 0)
  const getActiveStreaks = () => {
    return streaks.filter(s => s.current_count > 0);
  };

  // Get longest streak
  const getLongestStreak = () => {
    if (streaks.length === 0) return null;
    return streaks.reduce((longest, current) =>
      current.best_count > longest.best_count ? current : longest
    );
  };

  // Check if streak is at milestone (7, 30, 100 days)
  const isStreakAtMilestone = (count: number) => {
    return count === 7 || count === 30 || count === 100;
  };

  return {
    streaks,
    isLoading,
    error,
    loadUserStreaks,
    getStreak,
    updateStreakCount,
    breakStreak,
    claimStreakReward,
    getStreakByType,
    getDailyLoginStreak,
    getLessonCreationStreak,
    getQuizCompletionStreak,
    getQuestCompletionStreak,
    getActiveStreaks,
    getLongestStreak,
    isStreakAtMilestone,
  };
}
