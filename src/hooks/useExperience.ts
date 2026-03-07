import { useState } from 'react';
import { useStore } from '../store';
import { experienceService } from '../services/gamification/experience.service';

export function useExperience() {
  const {
    userLevel,
    setUserLevel,
    updateLevel,
    addNotification,
    updateWisdomCoins,
    profile,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user level
  const loadUserLevel = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const level = await experienceService.getUserLevel(profile.id);
      setUserLevel(level);
    } catch (err) {
      console.error('Failed to load user level:', err);
      setError('Failed to load user level');
    } finally {
      setIsLoading(false);
    }
  };

  // Add experience
  const addExperience = async (amount: number, reason: string) => {
    if (!profile?.id) return null;

    try {
      const updatedLevel = await experienceService.addExperience(profile.id, amount, reason);
      
      // Check if level up occurred
      const leveledUp = userLevel && updatedLevel.level > userLevel.level;
      
      updateLevel(updatedLevel);

      if (leveledUp) {
        // Get level up reward
        const reward = experienceService.getLevelUpReward(updatedLevel.level);
        
        // Update coins
        updateWisdomCoins(reward.coins);

        // Show level up notification
        addNotification({
          type: 'level_up',
          title: 'Level Up!',
          message: `You reached level ${updatedLevel.level}! Earned ${reward.coins} Wisdom Coins.`,
          animation: 'level-up',
        });
      }

      return updatedLevel;
    } catch (err) {
      console.error('Failed to add experience:', err);
      setError('Failed to add experience');
      return null;
    }
  };

  // Calculate level progress
  const calculateLevelProgress = () => {
    if (!userLevel) return null;

    return experienceService.calculateLevelProgress(
      userLevel.level,
      userLevel.experience_points
    );
  };

  // Calculate XP for next level
  const calculateXPForNextLevel = (level: number) => {
    return experienceService.calculateXPForNextLevel(level);
  };

  // Calculate level from total XP
  const calculateLevelFromXP = (totalXP: number) => {
    return experienceService.calculateLevelFromXP(totalXP);
  };

  // Get level up reward
  const getLevelUpReward = (level: number) => {
    return experienceService.getLevelUpReward(level);
  };

  // Get progress percentage
  const getProgressPercentage = () => {
    if (!userLevel) return 0;

    const progress = calculateLevelProgress();
    return progress?.progress_percentage || 0;
  };

  // Get current level
  const getCurrentLevel = () => {
    return userLevel?.level || 1;
  };

  // Get current XP
  const getCurrentXP = () => {
    return userLevel?.experience_points || 0;
  };

  // Get total XP
  const getTotalXP = () => {
    return userLevel?.total_experience || 0;
  };

  // Get XP to next level
  const getXPToNextLevel = () => {
    return userLevel?.experience_to_next_level || 100;
  };

  return {
    userLevel,
    isLoading,
    error,
    loadUserLevel,
    addExperience,
    calculateLevelProgress,
    calculateXPForNextLevel,
    calculateLevelFromXP,
    getLevelUpReward,
    getProgressPercentage,
    getCurrentLevel,
    getCurrentXP,
    getTotalXP,
    getXPToNextLevel,
  };
}
