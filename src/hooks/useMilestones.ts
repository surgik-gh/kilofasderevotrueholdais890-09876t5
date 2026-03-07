import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { milestoneService } from '../services/gamification/milestone.service';
import type { Milestone } from '../store';

export function useMilestones() {
  const {
    milestones,
    setMilestones,
    achieveMilestone,
    addNotification,
    updateWisdomCoins,
    profile,
  } = useStore();

  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all milestones (definitions)
  useEffect(() => {
    const loadAllMilestones = async () => {
      try {
        const milestones = await milestoneService.getAllMilestones();
        setAllMilestones(milestones);
      } catch (err) {
        console.error('Failed to load milestones:', err);
        setError('Failed to load milestones');
      }
    };

    loadAllMilestones();
  }, []);

  // Load user milestones
  const loadUserMilestones = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const userMilestones = await milestoneService.getUserMilestones(profile.id);
      setMilestones(userMilestones);
    } catch (err) {
      console.error('Failed to load user milestones:', err);
      setError('Failed to load user milestones');
    } finally {
      setIsLoading(false);
    }
  };

  // Get milestones by category
  const getMilestonesByCategory = async (category: string) => {
    try {
      return await milestoneService.getMilestonesByCategory(category as any);
    } catch (err) {
      console.error('Failed to get milestones by category:', err);
      return [];
    }
  };

  // Check milestones
  const checkMilestones = async (category: string, value: number) => {
    if (!profile?.id) return [];

    try {
      const achievedMilestones = await milestoneService.checkMilestones(profile.id, category as any, value);

      if (achievedMilestones.length > 0) {
        // Update local state
        const updatedMilestones = milestones.map(m => {
          const achieved = achievedMilestones.find(am => am.milestone_id === m.milestone_id);
          return achieved || m;
        });
        setMilestones(updatedMilestones);

        // Show notifications for each achieved milestone
        for (const milestone of achievedMilestones) {
          // Find the milestone definition
          const milestoneDef = allMilestones.find(m => m.id === milestone.milestone_id);
          if (milestoneDef) {
            addNotification({
              type: 'milestone',
              title: 'Milestone Achieved!',
              message: `You reached: ${milestoneDef.title}`,
              icon: milestoneDef.icon,
            });
          }
        }
      }

      return achievedMilestones;
    } catch (err) {
      console.error('Failed to check milestones:', err);
      return [];
    }
  };

  // Achieve milestone and claim reward
  const achieveMilestoneAndClaim = async (milestoneId: string) => {
    if (!profile?.id) return null;

    try {
      const reward = await milestoneService.achieveMilestone(profile.id, milestoneId);

      // Update local state
      achieveMilestone(milestoneId);

      // Update coins
      updateWisdomCoins(reward.coins);

      // Show notification
      const milestoneDef = allMilestones.find(m => m.id === milestoneId);
      addNotification({
        type: 'milestone',
        title: 'Milestone Reward!',
        message: `You earned ${reward.coins} Wisdom Coins and ${reward.xp} XP for reaching: ${milestoneDef?.title || 'milestone'}`,
      });

      return reward;
    } catch (err) {
      console.error('Failed to achieve milestone:', err);
      setError('Failed to achieve milestone');
      return null;
    }
  };

  // Get milestone progress
  const getMilestoneProgress = async (milestoneId: string) => {
    if (!profile?.id) return null;

    try {
      return await milestoneService.getMilestoneProgress(profile.id, milestoneId);
    } catch (err) {
      console.error('Failed to get milestone progress:', err);
      return null;
    }
  };

  // Get achieved milestones
  const getAchievedMilestones = () => {
    return milestones.filter(m => m.achieved);
  };

  // Get unachieved milestones
  const getUnachievedMilestones = () => {
    return milestones.filter(m => !m.achieved);
  };

  // Get milestones by category from user milestones
  const getUserMilestonesByCategory = (category: string) => {
    return milestones.filter(m => {
      const milestoneDef = allMilestones.find(def => def.id === m.milestone_id);
      return milestoneDef?.category === category;
    });
  };

  // Get next milestone in category
  const getNextMilestoneInCategory = (category: string) => {
    const categoryMilestones = getUserMilestonesByCategory(category)
      .filter(m => !m.achieved)
      .sort((a, b) => {
        const aDef = allMilestones.find(def => def.id === a.milestone_id);
        const bDef = allMilestones.find(def => def.id === b.milestone_id);
        return (aDef?.threshold || 0) - (bDef?.threshold || 0);
      });

    return categoryMilestones[0] || null;
  };

  return {
    milestones,
    allMilestones,
    isLoading,
    error,
    loadUserMilestones,
    getMilestonesByCategory,
    checkMilestones,
    achieveMilestoneAndClaim,
    getMilestoneProgress,
    getAchievedMilestones,
    getUnachievedMilestones,
    getUserMilestonesByCategory,
    getNextMilestoneInCategory,
  };
}
