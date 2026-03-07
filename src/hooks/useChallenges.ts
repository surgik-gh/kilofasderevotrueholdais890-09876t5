import { useState } from 'react';
import { useStore } from '../store';
import { challengeService } from '../services/gamification/challenge.service';
import type { Challenge } from '../store';

export function useChallenges() {
  const {
    challenges,
    setChallenges,
    addChallenge,
    addNotification,
    updateWisdomCoins,
    profile,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user challenges
  const loadUserChallenges = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const userChallenges = await challengeService.getUserChallenges(profile.id);
      setChallenges(userChallenges);
    } catch (err: any) {
      console.error('Failed to load challenges:', err);
      const errorMessage = err?.message || 'Не удалось загрузить челленджи';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create challenge
  const createChallenge = async (challenge: Omit<Challenge, 'id' | 'created_at'>) => {
    if (!profile?.id) return null;

    try {
      const newChallenge = await challengeService.createChallenge(challenge as any);
      addChallenge(newChallenge);

      addNotification({
        type: 'achievement',
        title: 'Челлендж создан!',
        message: `Вы создали новый челлендж: ${newChallenge.title}`,
      });

      return newChallenge;
    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      const errorMessage = err?.message || 'Не удалось создать челлендж';
      setError(errorMessage);
      return null;
    }
  };

  // Get challenge
  const getChallenge = async (challengeId: string) => {
    try {
      return await challengeService.getChallenge(challengeId);
    } catch (err) {
      console.error('Failed to get challenge:', err);
      return null;
    }
  };

  // Invite to challenge
  const inviteToChallenge = async (challengeId: string, userIds: string[]) => {
    try {
      await challengeService.inviteToChallenge(challengeId, userIds);

      addNotification({
        type: 'achievement',
        title: 'Приглашения отправлены!',
        message: `Вы пригласили ${userIds.length} пользователей в челлендж.`,
      });
    } catch (err: any) {
      console.error('Failed to invite to challenge:', err);
      const errorMessage = err?.message || 'Не удалось отправить приглашения';
      setError(errorMessage);
    }
  };

  // Accept challenge
  const acceptChallenge = async (challengeId: string) => {
    if (!profile?.id) return;

    try {
      await challengeService.acceptChallenge(challengeId, profile.id);

      // Reload challenges
      await loadUserChallenges();

      addNotification({
        type: 'achievement',
        title: 'Челлендж принят!',
        message: 'Вы присоединились к челленджу. Удачи!',
      });
    } catch (err: any) {
      console.error('Failed to accept challenge:', err);
      const errorMessage = err?.message || 'Не удалось принять челлендж';
      setError(errorMessage);
    }
  };

  // Decline challenge
  const declineChallenge = async (challengeId: string) => {
    if (!profile?.id) return;

    try {
      await challengeService.declineChallenge(challengeId, profile.id);

      // Reload challenges
      await loadUserChallenges();
    } catch (err: any) {
      console.error('Failed to decline challenge:', err);
      const errorMessage = err?.message || 'Не удалось отклонить челлендж';
      setError(errorMessage);
    }
  };

  // Update challenge progress
  const updateChallengeProgress = async (challengeId: string, progress: number) => {
    if (!profile?.id) return;

    try {
      await challengeService.updateChallengeProgress(challengeId, profile.id, progress);

      // Reload challenges
      await loadUserChallenges();
    } catch (err: any) {
      console.error('Failed to update challenge progress:', err);
      const errorMessage = err?.message || 'Не удалось обновить прогресс';
      setError(errorMessage);
    }
  };

  // Get challenge leaderboard
  const getChallengeLeaderboard = async (challengeId: string) => {
    try {
      return await challengeService.getChallengeLeaderboard(challengeId);
    } catch (err) {
      console.error('Failed to get challenge leaderboard:', err);
      return [];
    }
  };

  // Complete challenge
  const completeChallenge = async (challengeId: string) => {
    try {
      const result = await challengeService.completeChallenge(challengeId);

      // Check if current user is the winner
      if (profile?.id === result.winner_id) {
        updateWisdomCoins(result.rewards.coins);

        addNotification({
          type: 'achievement',
          title: 'Челлендж выигран!',
          message: `Вы выиграли челлендж! Получено ${result.rewards.coins} монет мудрости и ${result.rewards.xp} XP!`,
        });
      }

      // Reload challenges
      await loadUserChallenges();

      return result;
    } catch (err: any) {
      console.error('Failed to complete challenge:', err);
      const errorMessage = err?.message || 'Не удалось завершить челлендж';
      setError(errorMessage);
      return null;
    }
  };

  // Cancel challenge
  const cancelChallenge = async (challengeId: string) => {
    try {
      await challengeService.cancelChallenge(challengeId);

      // Reload challenges
      await loadUserChallenges();

      addNotification({
        type: 'achievement',
        title: 'Челлендж отменен',
        message: 'Челлендж был отменен.',
      });
    } catch (err: any) {
      console.error('Failed to cancel challenge:', err);
      const errorMessage = err?.message || 'Не удалось отменить челлендж';
      setError(errorMessage);
    }
  };

  // Get active challenges
  const getActiveChallenges = () => {
    return challenges.filter(c => c.status === 'active');
  };

  // Get pending challenges
  const getPendingChallenges = () => {
    return challenges.filter(c => c.status === 'pending');
  };

  // Get completed challenges
  const getCompletedChallenges = () => {
    return challenges.filter(c => c.status === 'completed');
  };

  // Get challenges created by user
  const getCreatedChallenges = () => {
    return challenges.filter(c => c.creator_id === profile?.id);
  };

  return {
    challenges,
    isLoading,
    error,
    loadUserChallenges,
    createChallenge,
    getChallenge,
    inviteToChallenge,
    acceptChallenge,
    declineChallenge,
    updateChallengeProgress,
    getChallengeLeaderboard,
    completeChallenge,
    cancelChallenge,
    getActiveChallenges,
    getPendingChallenges,
    getCompletedChallenges,
    getCreatedChallenges,
  };
}
