import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { achievementService } from '../services/gamification/achievement.service';
import { useGamificationAsync } from './useGamificationAsync';
import type { Achievement } from '../store';

export function useAchievements() {
  const {
    achievements,
    setAchievements,
    updateAchievements,
    addNotification,
    profile,
  } = useStore();

  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced async operations with retry logic
  const loadUserAchievementsAsync = useGamificationAsync(
    (userId: string) => achievementService.getUserAchievements(userId),
    {
      context: 'Достижения',
      onSuccess: () => setError(null),
      onError: (err) => setError(err.message),
    }
  );

  // Load all achievements (definitions)
  useEffect(() => {
    const loadAllAchievements = async () => {
      try {
        const achievements = await achievementService.getAllAchievements();
        setAllAchievements(achievements);
      } catch (err) {
        console.error('Failed to load achievements:', err);
        setError('Failed to load achievements');
      }
    };

    loadAllAchievements();
  }, []);

  // Load user achievements with retry logic
  const loadUserAchievements = async () => {
    if (!profile?.id) return;

    const result = await loadUserAchievementsAsync.execute(profile.id);
    if (result) {
      setAchievements(result);
    }
  };

  // Retry loading achievements
  const retryLoadAchievements = async () => {
    const result = await loadUserAchievementsAsync.retry();
    if (result) {
      setAchievements(result);
    }
  };

  // Get achievement progress
  const getAchievementProgress = async (achievementId: string) => {
    if (!profile?.id) return null;

    try {
      return await achievementService.getAchievementProgress(profile.id, achievementId);
    } catch (err) {
      console.error('Failed to get achievement progress:', err);
      return null;
    }
  };

  // Check and unlock achievements
  const checkAchievements = async (eventType: string, value: number) => {
    if (!profile?.id) return;

    try {
      const unlockedAchievements = await achievementService.checkAchievements(
        profile.id,
        eventType as any, // Type assertion for flexibility
        value
      );

      if (unlockedAchievements.length > 0) {
        // Update store with newly unlocked achievements
        const updatedAchievements = achievements.map(a => {
          const unlocked = unlockedAchievements.find(ua => ua.achievement_id === a.achievement_id);
          return unlocked || a;
        });
        updateAchievements(updatedAchievements);

        // Show notifications for each unlocked achievement
        for (const achievement of unlockedAchievements) {
          // Find the achievement definition
          const achievementDef = allAchievements.find(a => a.id === achievement.achievement_id);
          if (achievementDef) {
            addNotification({
              type: 'achievement',
              title: 'Achievement Unlocked!',
              message: `You unlocked: ${achievementDef.title}`,
              icon: achievementDef.icon,
            });
          }
        }
      }

      return unlockedAchievements;
    } catch (err) {
      console.error('Failed to check achievements:', err);
      return [];
    }
  };

  // Set favorite achievement
  const setFavoriteAchievement = async (achievementId: string, isFavorite: boolean) => {
    if (!profile?.id) return;

    try {
      await achievementService.setFavoriteAchievement(profile.id, achievementId, isFavorite);
      
      // Update local state
      const updatedAchievements = achievements.map(a =>
        a.achievement_id === achievementId ? { ...a, is_favorite: isFavorite } : a
      );
      updateAchievements(updatedAchievements);
    } catch (err) {
      console.error('Failed to set favorite achievement:', err);
      setError('Failed to set favorite achievement');
    }
  };

  // Get favorite achievements
  const getFavoriteAchievements = () => {
    return achievements.filter(a => a.is_favorite);
  };

  // Get achievement stats
  const getAchievementStats = async () => {
    if (!profile?.id) return null;

    try {
      return await achievementService.getAchievementStats(profile.id);
    } catch (err) {
      console.error('Failed to get achievement stats:', err);
      return null;
    }
  };

  // Get unlocked achievements
  const getUnlockedAchievements = () => {
    return achievements.filter(a => a.unlocked);
  };

  // Get locked achievements
  const getLockedAchievements = () => {
    return achievements.filter(a => !a.unlocked);
  };

  // Get achievements by category
  const getAchievementsByCategory = (category: string) => {
    return achievements.filter(a => {
      const achievementDef = allAchievements.find(def => def.id === a.achievement_id);
      return achievementDef?.category === category;
    });
  };

  // Get achievements by rarity
  const getAchievementsByRarity = (rarity: string) => {
    return achievements.filter(a => {
      const achievementDef = allAchievements.find(def => def.id === a.achievement_id);
      return achievementDef?.rarity === rarity;
    });
  };

  return {
    achievements,
    allAchievements,
    isLoading: loadUserAchievementsAsync.isLoading || isLoading,
    error: loadUserAchievementsAsync.error || error,
    loadUserAchievements,
    retryLoadAchievements,
    getAchievementProgress,
    checkAchievements,
    setFavoriteAchievement,
    getFavoriteAchievements,
    getAchievementStats,
    getUnlockedAchievements,
    getLockedAchievements,
    getAchievementsByCategory,
    getAchievementsByRarity,
  };
}
