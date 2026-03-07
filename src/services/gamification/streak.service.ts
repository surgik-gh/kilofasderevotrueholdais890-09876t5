/**
 * Streak Service
 * Handles streak management, tracking, and rewards
 * 
 * Requirements:
 * - 12.1-12.8: Streak system for various activities
 * - 7.7: Streak display in profile
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type StreakType =
  | 'daily_login'       // Ежедневный вход (уже существует)
  | 'lesson_creation'   // Создание уроков
  | 'quiz_completion'   // Прохождение викторин
  | 'quest_completion'; // Выполнение квестов

export interface Streak {
  id: string;
  user_id: string;
  streak_type: StreakType;
  current_count: number;
  best_count: number;
  last_activity_date: string; // DATE format
  created_at: string;
  updated_at: string;
}

export interface StreakReward {
  coins: number;
  xp: number;
  achievement_id?: string;
}

export interface StreakError {
  code: string;
  message: string;
}

// ============================================================================
// STREAK SERVICE
// ============================================================================

export class StreakService {
  /**
   * Get all streaks for a user
   * - Returns all streak types for the user
   * - Creates initial streak records if they don't exist
   * 
   * @param userId User ID
   * @returns Array of user streaks
   * @throws Error if fetch fails
   * 
   * Requirements: 12.7
   */
  async getUserStreaks(userId: string): Promise<Streak[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .order('streak_type', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      // If no streaks exist, create initial records
      if (!data || data.length === 0) {
        const streakTypes: StreakType[] = [
          'daily_login',
          'lesson_creation',
          'quiz_completion',
          'quest_completion',
        ];

        const createdStreaks: Streak[] = [];
        const today = this.getTodayDate();

        for (const type of streakTypes) {
          const { data: newStreak, error: createError } = await supabase
            .from('streaks')
            .insert({
              user_id: userId,
              streak_type: type,
              current_count: 0,
              best_count: 0,
              last_activity_date: today,
            })
            .select()
            .single();

          if (createError) {
            console.error(`Error creating streak ${type}:`, createError);
            continue;
          }

          if (newStreak) {
            createdStreaks.push(newStreak as Streak);
          }
        }

        return createdStreaks;
      }

      return (data || []) as Streak[];
    } catch (error) {
      if (this.isStreakError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch user streaks: ${(error as Error).message}`);
    }
  }

  /**
   * Get a specific streak for a user
   * - Returns streak information for a specific type
   * - Creates initial streak record if it doesn't exist
   * 
   * @param userId User ID
   * @param type Streak type
   * @returns Streak information
   * @throws Error if fetch fails
   * 
   * Requirements: 12.1, 12.2, 12.3
   */
  async getStreak(userId: string, type: StreakType): Promise<Streak> {
    if (!userId || !type) {
      throw this.createError('MISSING_FIELDS', 'User ID and streak type are required');
    }

    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', type)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw this.handleSupabaseError(error);
      }

      // If streak doesn't exist, create it
      if (!data) {
        const today = this.getTodayDate();
        
        const { data: newStreak, error: createError } = await supabase
          .from('streaks')
          .insert({
            user_id: userId,
            streak_type: type,
            current_count: 0,
            best_count: 0,
            last_activity_date: today,
          })
          .select()
          .single();

        if (createError) {
          throw this.handleSupabaseError(createError);
        }

        if (!newStreak) {
          throw this.createError('CREATE_FAILED', 'Failed to create streak');
        }

        return newStreak as Streak;
      }

      return data as Streak;
    } catch (error) {
      if (this.isStreakError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch streak: ${(error as Error).message}`);
    }
  }

  /**
   * Update a streak
   * - Increments streak if activity performed on a new day
   * - Resets streak if more than 1 day has passed
   * - Updates best_count if current exceeds it
   * - Returns updated streak
   * 
   * @param userId User ID
   * @param type Streak type
   * @returns Updated streak
   * @throws Error if update fails
   * 
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
   */
  async updateStreak(userId: string, type: StreakType): Promise<Streak> {
    if (!userId || !type) {
      throw this.createError('MISSING_FIELDS', 'User ID and streak type are required');
    }

    try {
      // Get current streak
      const streak = await this.getStreak(userId, type);

      const today = this.getTodayDate();
      const lastActivityDate = new Date(streak.last_activity_date);
      const todayDate = new Date(today);

      // Calculate days difference
      const daysDiff = this.getDaysDifference(lastActivityDate, todayDate);

      let newCurrentCount = streak.current_count;
      let newBestCount = streak.best_count;

      if (daysDiff === 0) {
        // Same day - no change to streak
        return streak;
      } else if (daysDiff === 1) {
        // Next day - increment streak
        newCurrentCount = streak.current_count + 1;
        
        // Update best count if current exceeds it
        if (newCurrentCount > newBestCount) {
          newBestCount = newCurrentCount;
        }
      } else {
        // More than 1 day - reset streak
        newCurrentCount = 1; // Start new streak
      }

      // Update streak in database
      const { data: updatedStreak, error: updateError } = await supabase
        .from('streaks')
        .update({
          current_count: newCurrentCount,
          best_count: newBestCount,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id)
        .select()
        .single();

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      if (!updatedStreak) {
        throw this.createError('UPDATE_FAILED', 'Failed to update streak');
      }

      // Check for streak rewards
      const reward = this.getStreakReward(type, newCurrentCount);
      if (reward && daysDiff === 1) {
        // Award coins
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('wisdom_coins')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('user_profiles')
            .update({
              wisdom_coins: profile.wisdom_coins + reward.coins,
            })
            .eq('id', userId);

          // Record transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              amount: reward.coins,
              transaction_type: 'leaderboard_reward',
              description: `${type} streak reward: ${newCurrentCount} days`,
            });
        }
      }

      return updatedStreak as Streak;
    } catch (error) {
      if (this.isStreakError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to update streak: ${(error as Error).message}`);
    }
  }

  /**
   * Break a streak
   * - Resets current_count to 0
   * - Keeps best_count unchanged
   * - Used for manual streak breaks or cron jobs
   * 
   * @param userId User ID
   * @param streakType Streak type
   * @throws Error if update fails
   * 
   * Requirements: 12.6
   */
  async breakStreak(userId: string, streakType: StreakType): Promise<void> {
    if (!userId || !streakType) {
      throw this.createError('MISSING_FIELDS', 'User ID and streak type are required');
    }

    try {
      // Get current streak
      const streak = await this.getStreak(userId, streakType);

      // Reset current count
      const { error: updateError } = await supabase
        .from('streaks')
        .update({
          current_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }
    } catch (error) {
      if (this.isStreakError(error)) {
        throw error;
      }
      throw this.createError('BREAK_FAILED', `Failed to break streak: ${(error as Error).message}`);
    }
  }

  /**
   * Get streak reward
   * - Returns reward for reaching specific streak milestones
   * - Rewards at 7 and 30 days
   * - Returns null if no reward for this count
   * 
   * @param _type Streak type (reserved for future use)
   * @param count Current streak count
   * @returns Streak reward or null
   * 
   * Requirements: 12.4, 12.5
   */
  getStreakReward(_type: StreakType, count: number): StreakReward | null {
    // Rewards at milestone days
    if (count === 7) {
      return {
        coins: 50,
        xp: 100,
      };
    } else if (count === 30) {
      return {
        coins: 200,
        xp: 400,
      };
    } else if (count === 100) {
      // Legendary achievement
      return {
        coins: 500,
        xp: 1000,
        achievement_id: 'streak_100', // Will be handled by achievement service
      };
    }

    return null;
  }

  /**
   * Claim streak reward
   * - Awards coins and XP for reaching a streak milestone
   * - Used when user manually claims a reward
   * 
   * @param userId User ID
   * @param type Streak type
   * @returns Streak reward
   * @throws Error if no reward available or claim fails
   * 
   * Requirements: 12.4, 12.5
   */
  async claimStreakReward(userId: string, type: StreakType): Promise<StreakReward> {
    if (!userId || !type) {
      throw this.createError('MISSING_FIELDS', 'User ID and streak type are required');
    }

    try {
      // Get current streak
      const streak = await this.getStreak(userId, type);

      // Check if reward is available
      const reward = this.getStreakReward(type, streak.current_count);
      if (!reward) {
        throw this.createError('NO_REWARD', 'No reward available for current streak');
      }

      // Award coins
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('wisdom_coins')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({
            wisdom_coins: profile.wisdom_coins + reward.coins,
          })
          .eq('id', userId);

        // Record transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: reward.coins,
            transaction_type: 'leaderboard_reward',
            description: `${type} streak milestone: ${streak.current_count} days`,
          });
      }

      return reward;
    } catch (error) {
      if (this.isStreakError(error)) {
        throw error;
      }
      throw this.createError('CLAIM_FAILED', `Failed to claim streak reward: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Calculate days difference between two dates
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    const diffTime = date2.getTime() - date1.getTime();
    return Math.floor(diffTime / oneDay);
  }

  /**
   * Create a StreakError
   */
  private createError(code: string, message: string): StreakError {
    return { code, message };
  }

  /**
   * Check if error is a StreakError
   */
  private isStreakError(error: unknown): error is StreakError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to StreakError
   */
  private handleSupabaseError(error: { message: string; code?: string }): StreakError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Streak not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this streak');
    }

    if (error.message.includes('unique constraint')) {
      return this.createError('DUPLICATE', 'Duplicate entry');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    if (error.message.includes('invalid input syntax for type date')) {
      return this.createError('INVALID_DATE', 'Invalid date format');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const streakService = new StreakService();
