import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { seasonalEventService } from '../services/gamification/seasonal-event.service';
import type { SeasonalEvent } from '../store';

interface UserEventProgress {
  id: string;
  user_id: string;
  event_id: string;
  seasonal_points: number;
  rank: number | null;
  rewards_claimed: boolean;
  created_at: string;
  updated_at: string;
}

export function useSeasonalEvent() {
  const {
    activeSeasonalEvent,
    setActiveSeasonalEvent,
    addNotification,
    updateWisdomCoins,
    profile,
  } = useStore();

  const [allEvents, setAllEvents] = useState<SeasonalEvent[]>([]);
  const [userProgress, setUserProgress] = useState<UserEventProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserEventProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active event
  useEffect(() => {
    const loadActiveEvent = async () => {
      try {
        const event = await seasonalEventService.getActiveEvent();
        setActiveSeasonalEvent(event);
      } catch (err) {
        console.error('Failed to load active event:', err);
        // Silently fail - seasonal events are optional feature
        setActiveSeasonalEvent(null);
      }
    };

    loadActiveEvent();
  }, [setActiveSeasonalEvent]);

  // Load all events
  const loadAllEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const events = await seasonalEventService.getAllEvents();
      setAllEvents(events);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user event progress
  const loadUserEventProgress = async (eventId: string) => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const progress = await seasonalEventService.getUserEventProgress(profile.id, eventId);
      setUserProgress(progress);
    } catch (err) {
      console.error('Failed to load user event progress:', err);
      setError('Failed to load user event progress');
      setUserProgress(null); // Set null on error
    } finally {
      setIsLoading(false);
    }
  };

  // Add seasonal points
  const addSeasonalPoints = async (eventId: string, points: number) => {
    if (!profile?.id) return;

    try {
      await seasonalEventService.addSeasonalPoints(profile.id, eventId, points);

      // Reload user progress
      await loadUserEventProgress(eventId);

      addNotification({
        type: 'achievement',
        title: 'Seasonal Points Earned!',
        message: `You earned ${points} seasonal points!`,
      });
    } catch (err) {
      console.error('Failed to add seasonal points:', err);
      setError('Failed to add seasonal points');
    }
  };

  // Load event leaderboard
  const loadEventLeaderboard = async (eventId: string, limit?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const leaderboardData = await seasonalEventService.getEventLeaderboard(eventId, limit);
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Failed to load event leaderboard:', err);
      setError('Failed to load event leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Claim event rewards
  const claimEventRewards = async (eventId: string) => {
    if (!profile?.id) return null;

    try {
      const rewards = await seasonalEventService.claimEventRewards(profile.id, eventId);

      updateWisdomCoins(rewards.coins);

      addNotification({
        type: 'achievement',
        title: 'Event Rewards Claimed!',
        message: `You earned ${rewards.coins} Wisdom Coins, ${rewards.xp} XP, and ${rewards.special_badges.length} special badge(s)!`,
      });

      // Reload user progress
      await loadUserEventProgress(eventId);

      return rewards;
    } catch (err) {
      console.error('Failed to claim event rewards:', err);
      setError('Failed to claim event rewards');
      return null;
    }
  };

  // Check if event is active
  const isEventActive = (event: SeasonalEvent) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    return event.active && now >= startDate && now <= endDate;
  };

  // Get days remaining in event
  const getDaysRemaining = (event: SeasonalEvent) => {
    const now = new Date();
    const endDate = new Date(event.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get user rank in event
  const getUserRank = () => {
    return userProgress?.rank || null;
  };

  // Get user points in event
  const getUserPoints = () => {
    return userProgress?.seasonal_points || 0;
  };

  // Check if rewards are claimed
  const areRewardsClaimed = () => {
    return userProgress?.rewards_claimed || false;
  };

  // Get top N users from leaderboard
  const getTopUsers = (n: number) => {
    return leaderboard.slice(0, n);
  };

  return {
    activeSeasonalEvent,
    allEvents,
    userProgress,
    leaderboard,
    isLoading,
    error,
    loadAllEvents,
    loadUserEventProgress,
    addSeasonalPoints,
    loadEventLeaderboard,
    claimEventRewards,
    isEventActive,
    getDaysRemaining,
    getUserRank,
    getUserPoints,
    areRewardsClaimed,
    getTopUsers,
  };
}
