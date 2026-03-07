/**
 * useRecommendations Hook
 * Custom hook for accessing recommendation service
 * 
 * Requirements:
 * - 14.1-14.7: Personalized recommendations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  recommendationService,
  RecommendedAchievement,
  WeeklyGoals,
  UserActivityProfile,
} from '../services/gamification/recommendation.service';
import { useStore } from '../store';

export function useRecommendations() {
  const { profile } = useStore();
  const [recommendedAchievements, setRecommendedAchievements] = useState<RecommendedAchievement[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals | null>(null);
  const [activityProfile, setActivityProfile] = useState<UserActivityProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load recommended achievements
   */
  const loadRecommendedAchievements = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const recommendations = await recommendationService.getRecommendedAchievements(profile.id);
      setRecommendedAchievements(recommendations);
    } catch (err) {
      console.error('Failed to load recommended achievements:', err);
      setError((err as Error).message);
      setRecommendedAchievements([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  /**
   * Load weekly goals
   */
  const loadWeeklyGoals = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const goals = await recommendationService.getWeeklyGoals(profile.id);
      setWeeklyGoals(goals);
    } catch (err) {
      console.error('Failed to load weekly goals:', err);
      setError((err as Error).message);
      setWeeklyGoals(null); // Set null on error
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  /**
   * Load user activity profile
   */
  const loadActivityProfile = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const profileData = await recommendationService.getUserActivityProfile(profile.id);
      setActivityProfile(profileData);
    } catch (err) {
      console.error('Failed to load activity profile:', err);
      setError((err as Error).message);
      setActivityProfile(null); // Set null on error
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  /**
   * Get simple achievement suggestions
   */
  const getSuggestedAchievements = useCallback(async (): Promise<RecommendedAchievement[]> => {
    if (!profile?.id) return [];

    try {
      return await recommendationService.suggestSimpleAchievements(profile.id);
    } catch (err) {
      console.error('Failed to get suggested achievements:', err);
      return [];
    }
  }, [profile?.id]);

  /**
   * Get subject-specific recommendations
   */
  const getSubjectRecommendations = useCallback(async (): Promise<RecommendedAchievement[]> => {
    if (!profile?.id) return [];

    try {
      return await recommendationService.getSubjectSpecificRecommendations(profile.id);
    } catch (err) {
      console.error('Failed to get subject recommendations:', err);
      return [];
    }
  }, [profile?.id]);

  /**
   * Refresh all recommendations
   */
  const refreshRecommendations = useCallback(async () => {
    await Promise.allSettled([
      loadRecommendedAchievements(),
      loadWeeklyGoals(),
      loadActivityProfile(),
    ]);
  }, [loadRecommendedAchievements, loadWeeklyGoals, loadActivityProfile]);

  // Load recommendations on mount
  useEffect(() => {
    if (profile?.id) {
      refreshRecommendations();
    }
  }, [profile?.id]);

  return {
    recommendedAchievements,
    weeklyGoals,
    activityProfile,
    loading,
    error,
    loadRecommendedAchievements,
    loadWeeklyGoals,
    loadActivityProfile,
    getSuggestedAchievements,
    getSubjectRecommendations,
    refreshRecommendations,
  };
}
