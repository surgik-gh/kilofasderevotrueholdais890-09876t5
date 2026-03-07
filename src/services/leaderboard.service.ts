/**
 * Leaderboard Service
 * Handles daily leaderboard scoring, ranking, and reward distribution
 * 
 * Requirements:
 * - 8.1: Quiz completion updates leaderboard
 * - 8.2: Daily reset awards 50 coins to first place
 * - 8.3: Daily reset awards 25 coins to second place
 * - 8.4: Daily reset awards 10 coins to third place
 * - 8.5: Daily reset clears scores for new day
 */

import { supabase } from '../lib/supabase';
import { tokenEconomyService } from './token-economy.service';
import { gamificationOrchestratorService } from './gamification/gamification-orchestrator.service';
import type { LeaderboardEntry } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface LeaderboardError {
  code: string;
  message: string;
}

export interface StudentRankInfo {
  studentId: string;
  rank: number;
  score: number;
  totalStudents: number;
}

// ============================================================================
// LEADERBOARD SERVICE
// ============================================================================

export class LeaderboardService {
  // Reward constants for top 3 positions
  private readonly FIRST_PLACE_REWARD = 50;
  private readonly SECOND_PLACE_REWARD = 25;
  private readonly THIRD_PLACE_REWARD = 10;

  /**
   * Update a student's score on the leaderboard
   * - Creates or updates today's leaderboard entry
   * - Adds points to existing score
   * 
   * @param studentId Student ID
   * @param points Points to add to score
   * @throws Error if update fails
   * 
   * Requirements: 8.1
   */
  async updateScore(studentId: string, points: number): Promise<void> {
    if (points < 0) {
      throw this.createError('INVALID_POINTS', 'Points must be non-negative');
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get or create today's leaderboard entry
      const { data: existingEntry, error: fetchError } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw this.handleSupabaseError(fetchError);
      }

      if (existingEntry) {
        // Update existing entry
        const newScore = existingEntry.score + Math.round(points);
        const { error: updateError } = await supabase
          .from('leaderboard_entries')
          .update({
            score: newScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEntry.id);

        if (updateError) {
          throw this.handleSupabaseError(updateError);
        }
      } else {
        // Create new entry
        const { error: insertError } = await supabase
          .from('leaderboard_entries')
          .insert({
            student_id: studentId,
            date: today,
            score: Math.round(points),
            rank: null,
            reward_coins: 0,
          });

        if (insertError) {
          throw this.handleSupabaseError(insertError);
        }
      }
    } catch (error) {
      if (this.isLeaderboardError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to update score: ${(error as Error).message}`);
    }
  }

  /**
   * Get daily leaderboard for a specific date
   * - Returns entries sorted by score (highest first)
   * - Includes student profile information
   * 
   * @param date Date in YYYY-MM-DD format (defaults to today)
   * @returns Array of leaderboard entries with rankings
   * 
   * Requirements: 8.1
   */
  async getDailyLeaderboard(date?: string): Promise<LeaderboardEntry[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('date', targetDate)
        .order('score', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      // Assign ranks based on score order
      const entries = (data || []) as LeaderboardEntry[];
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    } catch (error) {
      if (this.isLeaderboardError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch leaderboard: ${(error as Error).message}`);
    }
  }

  /**
   * Perform daily leaderboard reset
   * - Awards coins to top 3 students (50, 25, 10)
   * - Updates reward_coins field for winners
   * - Resets scores for all students for the new day
   * 
   * This should be called by a scheduled job at 18:00 daily
   * 
   * @returns Number of students who received rewards
   * @throws Error if reset fails
   * 
   * Requirements: 8.2, 8.3, 8.4, 8.5
   */
  async performDailyReset(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's leaderboard sorted by score
      const leaderboard = await this.getDailyLeaderboard(today);

      if (leaderboard.length === 0) {
        console.log('No leaderboard entries for today, skipping reset');
        return 0;
      }

      // Award rewards to top 3
      const rewards = [
        { rank: 1, coins: this.FIRST_PLACE_REWARD },
        { rank: 2, coins: this.SECOND_PLACE_REWARD },
        { rank: 3, coins: this.THIRD_PLACE_REWARD },
      ];

      let rewardedCount = 0;

      for (const reward of rewards) {
        if (leaderboard.length >= reward.rank) {
          const entry = leaderboard[reward.rank - 1];
          
          try {
            // Grant coins to student
            await tokenEconomyService.grantTokens(
              entry.student_id,
              reward.coins,
              'leaderboard_reward'
            );

            // Update leaderboard entry with reward amount
            await supabase
              .from('leaderboard_entries')
              .update({
                reward_coins: reward.coins,
                rank: reward.rank,
                updated_at: new Date().toISOString(),
              })
              .eq('id', entry.id);

            rewardedCount++;
          } catch (error) {
            console.error(`Failed to award reward to student ${entry.student_id}:`, error);
            // Continue with other rewards even if one fails
          }

          // Trigger gamification events for top 3
          if (reward.rank <= 3) {
            try {
              const gamificationResult = await gamificationOrchestratorService.onLeaderboardRank(entry.student_id, reward.rank);
              console.log(`Gamification events triggered for rank ${reward.rank}`);
              
              // Add notifications to store
              if (gamificationResult.notifications && gamificationResult.notifications.length > 0) {
                const { useStore } = await import('@/store');
                const addNotification = useStore.getState().addNotification;
                
                for (const notification of gamificationResult.notifications) {
                  addNotification(notification);
                }
              }
            } catch (gamificationError) {
              console.warn(`Failed to trigger gamification events for rank ${reward.rank}:`, gamificationError);
              // Don't fail the reset if gamification fails
            }
          }
        }
      }

      console.log(`Daily reset complete: ${rewardedCount} students rewarded`);
      return rewardedCount;
    } catch (error) {
      if (this.isLeaderboardError(error)) {
        throw error;
      }
      throw this.createError('RESET_FAILED', `Failed to perform daily reset: ${(error as Error).message}`);
    }
  }

  /**
   * Get a student's current rank on today's leaderboard
   * 
   * @param studentId Student ID
   * @returns Student's rank (1-based) or 0 if not on leaderboard
   * 
   * Requirements: 8.1
   */
  async getStudentRank(studentId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's leaderboard
      const leaderboard = await this.getDailyLeaderboard(today);

      // Find student's position
      const studentIndex = leaderboard.findIndex(entry => entry.student_id === studentId);

      if (studentIndex === -1) {
        return 0; // Not on leaderboard
      }

      return studentIndex + 1; // 1-based rank
    } catch (error) {
      if (this.isLeaderboardError(error)) {
        throw error;
      }
      console.error('Failed to get student rank:', error);
      return 0;
    }
  }

  /**
   * Get a student's leaderboard history
   * - Returns entries for the last N days
   * - Sorted by date (most recent first)
   * 
   * @param studentId Student ID
   * @param days Number of days to retrieve (default: 7)
   * @returns Array of leaderboard entries
   * 
   * Requirements: 8.1
   */
  async getStudentHistory(studentId: string, days: number = 7): Promise<LeaderboardEntry[]> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as LeaderboardEntry[];
    } catch (error) {
      if (this.isLeaderboardError(error)) {
        throw error;
      }
      throw this.createError('HISTORY_FETCH_FAILED', `Failed to fetch student history: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed rank information for a student
   * - Includes rank, score, and total number of students
   * 
   * @param studentId Student ID
   * @returns Student rank information or null if not on leaderboard
   */
  async getStudentRankInfo(studentId: string): Promise<StudentRankInfo | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's leaderboard
      const leaderboard = await this.getDailyLeaderboard(today);

      // Find student's position
      const studentIndex = leaderboard.findIndex(entry => entry.student_id === studentId);

      if (studentIndex === -1) {
        return null; // Not on leaderboard
      }

      const entry = leaderboard[studentIndex];

      return {
        studentId: entry.student_id,
        rank: studentIndex + 1,
        score: entry.score,
        totalStudents: leaderboard.length,
      };
    } catch (error) {
      if (this.isLeaderboardError(error)) {
        throw error;
      }
      console.error('Failed to get student rank info:', error);
      return null;
    }
  }

  /**
   * Get top N students from today's leaderboard
   * 
   * @param limit Number of top students to return (default: 10)
   * @returns Array of top leaderboard entries
   */
  async getTopStudents(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('date', today)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        throw this.handleSupabaseError(error);
      }

      // Assign ranks
      const entries = (data || []) as LeaderboardEntry[];
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    } catch (error) {
      if (this.isLeaderboardError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch top students: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create a LeaderboardError
   */
  private createError(code: string, message: string): LeaderboardError {
    return { code, message };
  }

  /**
   * Check if error is a LeaderboardError
   */
  private isLeaderboardError(error: unknown): error is LeaderboardError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to LeaderboardError
   */
  private handleSupabaseError(error: { message: string; code?: string }): LeaderboardError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Leaderboard entry not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access the leaderboard');
    }

    if (error.message.includes('unique constraint')) {
      return this.createError('DUPLICATE', 'Leaderboard entry already exists');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced student not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();
