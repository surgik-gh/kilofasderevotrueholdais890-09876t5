/**
 * Experience Service
 * Handles user level management, experience points, and level progression
 * 
 * Requirements:
 * - 2.1-2.12: Experience and level system
 * - 7.1: Progress visualization for levels
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface UserLevel {
  id: string;
  user_id: string;
  level: number;
  experience_points: number;
  experience_to_next_level: number;
  total_experience: number;
  updated_at: string;
}

export interface LevelProgress {
  current_level: number;
  current_xp: number;
  xp_to_next_level: number;
  progress_percentage: number;
}

export interface LevelReward {
  coins: number;
  achievement_id?: string;
}

export interface ExperienceError {
  code: string;
  message: string;
}

// ============================================================================
// EXPERIENCE SERVICE
// ============================================================================

export class ExperienceService {
  /**
   * Get user level information
   * - Returns current level, XP, and progress for a user
   * - Creates initial level record if it doesn't exist
   * 
   * @param userId User ID
   * @returns User level information
   * @throws Error if fetch fails
   * 
   * Requirements: 2.9
   */
  async getUserLevel(userId: string): Promise<UserLevel> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw this.handleSupabaseError(error);
      }

      // If user level doesn't exist, create it
      if (!data) {
        const { data: newLevel, error: createError } = await supabase
          .from('user_levels')
          .insert({
            user_id: userId,
            level: 1,
            experience_points: 0,
            experience_to_next_level: this.calculateXPForNextLevel(1),
            total_experience: 0,
          })
          .select()
          .single();

        if (createError) {
          throw this.handleSupabaseError(createError);
        }

        if (!newLevel) {
          throw this.createError('CREATE_FAILED', 'Failed to create user level');
        }

        return newLevel as UserLevel;
      }

      return data as UserLevel;
    } catch (error) {
      if (this.isExperienceError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch user level: ${(error as Error).message}`);
    }
  }

  /**
   * Add experience points to a user
   * - Adds XP and handles level ups automatically
   * - Can trigger multiple level ups if enough XP is added
   * - Returns updated level information
   * 
   * @param userId User ID
   * @param amount Amount of XP to add
   * @param reason Reason for XP gain (for logging)
   * @returns Updated user level
   * @throws Error if amount is negative or update fails
   * 
   * Requirements: 2.1-2.7
   */
  async addExperience(userId: string, amount: number, reason: string): Promise<UserLevel> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    if (amount < 0) {
      throw this.createError('INVALID_AMOUNT', 'Experience cannot be negative');
    }

    if (amount === 0) {
      // No XP to add, just return current level
      return this.getUserLevel(userId);
    }

    try {
      // Get current level
      const currentLevel = await this.getUserLevel(userId);

      // Calculate new values
      let newXP = currentLevel.experience_points + amount;
      let newTotalXP = currentLevel.total_experience + amount;
      let newLevel = currentLevel.level;
      let xpForNextLevel = currentLevel.experience_to_next_level;

      // Check for level ups
      let leveledUp = false;
      while (newXP >= xpForNextLevel) {
        newXP -= xpForNextLevel;
        newLevel++;
        xpForNextLevel = this.calculateXPForNextLevel(newLevel);
        leveledUp = true;
      }

      // Update user level
      const { data: updatedLevel, error: updateError } = await supabase
        .from('user_levels')
        .update({
          level: newLevel,
          experience_points: newXP,
          experience_to_next_level: xpForNextLevel,
          total_experience: newTotalXP,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      if (!updatedLevel) {
        throw this.createError('UPDATE_FAILED', 'Failed to update user level');
      }

      // If leveled up, grant level up rewards
      if (leveledUp) {
        const reward = this.getLevelUpReward(newLevel);
        
        // Add coins to user profile
        if (reward.coins > 0) {
          // First get current coins
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
          }

          // Record transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              amount: reward.coins,
              transaction_type: 'leaderboard_reward',
              description: `Level ${newLevel} reward: ${reward.coins} Wisdom Coins (reason: ${reason})`,
            });
        }
      }

      return updatedLevel as UserLevel;
    } catch (error) {
      if (this.isExperienceError(error)) {
        throw error;
      }
      throw this.createError('ADD_XP_FAILED', `Failed to add experience: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate level progress
   * - Returns detailed progress information for current level
   * - Includes percentage progress to next level
   * 
   * @param level Current level
   * @param currentXP Current XP in this level
   * @returns Level progress information
   * 
   * Requirements: 7.1
   */
  calculateLevelProgress(level: number, currentXP: number): LevelProgress {
    const xpToNextLevel = this.calculateXPForNextLevel(level);
    const progressPercentage = xpToNextLevel > 0 
      ? Math.round((currentXP / xpToNextLevel) * 100 * 100) / 100
      : 100;

    return {
      current_level: level,
      current_xp: currentXP,
      xp_to_next_level: xpToNextLevel,
      progress_percentage: Math.min(progressPercentage, 100),
    };
  }

  /**
   * Calculate XP required for next level
   * - Uses formula: 100 * (level ^ 1.5)
   * - Returns XP needed to reach the next level from current level
   * 
   * @param level Current level
   * @returns XP required for next level
   * 
   * Requirements: 2.8
   */
  calculateXPForNextLevel(level: number): number {
    if (level < 1) {
      return 100;
    }
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * Calculate level from total XP
   * - Reverse calculation to determine level from total accumulated XP
   * - Used for migrations or recalculations
   * 
   * @param totalXP Total accumulated XP
   * @returns Calculated level
   */
  calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    let xpNeeded = 0;

    while (xpNeeded <= totalXP) {
      xpNeeded += this.calculateXPForNextLevel(level);
      if (xpNeeded <= totalXP) {
        level++;
      }
    }

    return level;
  }

  /**
   * Get level up reward
   * - Returns coins and potential achievement for reaching a level
   * - Special achievements at levels 10, 25, 50
   * 
   * @param newLevel The level that was just reached
   * @returns Level up rewards
   * 
   * Requirements: 2.7, 2.10, 2.11, 2.12
   */
  getLevelUpReward(newLevel: number): LevelReward {
    // Base reward: 50 coins per level
    const baseCoins = 50;
    
    // Bonus coins for milestone levels
    let bonusCoins = 0;
    let achievementId: string | undefined;

    if (newLevel === 10) {
      bonusCoins = 100;
      // Achievement "Опытный" will be handled by achievement service
    } else if (newLevel === 25) {
      bonusCoins = 250;
      // Achievement "Эксперт" will be handled by achievement service
    } else if (newLevel === 50) {
      bonusCoins = 500;
      // Achievement "Мастер обучения" will be handled by achievement service
    } else if (newLevel % 10 === 0) {
      // Every 10 levels gets a small bonus
      bonusCoins = 50;
    }

    return {
      coins: baseCoins + bonusCoins,
      achievement_id: achievementId,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create an ExperienceError
   */
  private createError(code: string, message: string): ExperienceError {
    return { code, message };
  }

  /**
   * Check if error is an ExperienceError
   */
  private isExperienceError(error: unknown): error is ExperienceError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to ExperienceError
   */
  private handleSupabaseError(error: { message: string; code?: string }): ExperienceError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'User level not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this level');
    }

    if (error.message.includes('unique constraint')) {
      return this.createError('DUPLICATE', 'Duplicate entry');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const experienceService = new ExperienceService();
