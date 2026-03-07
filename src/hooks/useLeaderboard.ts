import { useEffect } from 'react';
import { useStore } from '../store';
import { leaderboardService } from '../services/leaderboard.service';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Custom hook for leaderboard operations
 */
export function useLeaderboard() {
  const {
    profile,
    leaderboard,
    currentUserRank,
    setLeaderboard,
    setCurrentUserRank,
    updateLeaderboardScore,
    setLoading,
  } = useStore();

  // Load leaderboard data
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    loadLeaderboard();
  }, []);

  const loadLeaderboard = async (date?: string) => {
    setLoading(true);
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const entries = await leaderboardService.getDailyLeaderboard(targetDate);
      setLeaderboard(entries);

      // Update current user rank if they're a student
      if (profile?.role === 'student') {
        const userEntry = entries.find(e => e.student_id === profile.id);
        if (userEntry && userEntry.rank !== null) {
          setCurrentUserRank(userEntry.rank);
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateScore = async (points: number) => {
    if (!profile || profile.role !== 'student') return;

    // Optimistic update
    updateLeaderboardScore(profile.id, points);

    try {
      await leaderboardService.updateScore(profile.id, points);
      // Reload to get accurate rankings
      await loadLeaderboard();
    } catch (error) {
      console.error('Failed to update score:', error);
      // Reload to revert optimistic update
      await loadLeaderboard();
    }
  };

  const getStudentRank = async (studentId: string): Promise<number> => {
    if (!isSupabaseConfigured()) {
      const entry = leaderboard.find(e => e.student_id === studentId);
      return entry?.rank || 0;
    }

    return await leaderboardService.getStudentRank(studentId);
  };

  const getStudentHistory = async (studentId: string, days: number = 7) => {
    if (!isSupabaseConfigured()) return [];

    return await leaderboardService.getStudentHistory(studentId, days);
  };

  return {
    leaderboard,
    currentUserRank,
    loadLeaderboard,
    updateScore,
    getStudentRank,
    getStudentHistory,
  };
}
