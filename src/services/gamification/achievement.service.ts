/**
 * Achievement Service
 * Handles achievement CRUD operations, progress tracking, and unlocking
 * 
 * Requirements:
 * - 1.1-1.15: Achievement system with various triggers
 * - 8.1-8.7: Badge collection and display
 * - 9.1-9.7: Reward system for achievements
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type AchievementCategory = 
  | 'learning'      // Обучение
  | 'social'        // Социальные
  | 'achievement'   // Достижения
  | 'special';      // Особые

export type AchievementRarity = 
  | 'common'        // Обычное (25 монет)
  | 'rare'          // Редкое (50 монет)
  | 'epic'          // Эпическое (100 монет)
  | 'legendary';    // Легендарное (250 монет)

export type ConditionType =
  | 'lesson_created'        // Создано уроков
  | 'quiz_completed'        // Пройдено викторин
  | 'quiz_perfect'          // Викторин с 100%
  | 'login_streak'          // Дней входа подряд
  | 'leaderboard_first'     // Раз на 1 месте
  | 'subjects_studied'      // Изучено предметов
  | 'level_reached'         // Достигнут уровень
  | 'challenge_won'         // Выиграно челленджей
  | 'quest_completed';      // Выполнено квестов

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  reward_coins: number;
  reward_xp: number;
  condition_type: ConditionType;
  condition_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface AchievementStats {
  total_achievements: number;
  unlocked_achievements: number;
  completion_percentage: number;
  by_category: Record<AchievementCategory, number>;
  by_rarity: Record<AchievementRarity, number>;
}

export interface AchievementError {
  code: string;
  message: string;
}

// ============================================================================
// ACHIEVEMENT SERVICE
// ============================================================================

export class AchievementService {
  /**
   * Get all achievements
   * - Returns all available achievements in the system
   * - Publicly accessible
   * 
   * @returns Array of all achievements
   * @throws Error if fetch fails
   * 
   * Requirements: 1.1-1.15
   */
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('rarity', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Achievement[];
    } catch (error) {
      if (this.isAchievementError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch achievements: ${(error as Error).message}`);
    }
  }

  /**
   * Get user achievements
   * - Returns all achievements for a specific user
   * - Includes both unlocked and locked achievements
   * - Shows progress towards locked achievements
   * 
   * @param userId User ID
   * @returns Array of user achievements with details
   * @throws Error if fetch fails
   * 
   * Requirements: 1.1-1.15, 8.2
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked', { ascending: false })
        .order('progress', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as UserAchievement[];
    } catch (error) {
      if (this.isAchievementError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch user achievements: ${(error as Error).message}`);
    }
  }

  /**
   * Get achievement progress for a specific achievement
   * - Returns progress details for a single achievement
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns User achievement progress
   * @throws Error if not found or fetch fails
   * 
   * Requirements: 7.3
   */
  async getAchievementProgress(userId: string, achievementId: string): Promise<UserAchievement> {
    if (!userId || !achievementId) {
      throw this.createError('MISSING_FIELDS', 'User ID and Achievement ID are required');
    }

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('NOT_FOUND', 'Achievement progress not found');
      }

      return data as UserAchievement;
    } catch (error) {
      if (this.isAchievementError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch achievement progress: ${(error as Error).message}`);
    }
  }

  /**
   * Check achievements for a user based on event type and value
   * - Checks all achievements matching the event type
   * - Updates progress for relevant achievements
   * - Unlocks achievements when threshold is reached
   * - Returns newly unlocked achievements
   * 
   * @param userId User ID
   * @param eventType Type of event that occurred
   * @param value Current value for the event type
   * @returns Array of newly unlocked achievements
   * @throws Error if check fails
   * 
   * Requirements: 1.1-1.15, 15.1-15.5
   */
  async checkAchievements(
    userId: string,
    eventType: ConditionType,
    value: number
  ): Promise<UserAchievement[]> {
    if (!userId || !eventType || value === undefined) {
      throw this.createError('MISSING_FIELDS', 'User ID, event type, and value are required');
    }

    if (value < 0) {
      throw this.createError('INVALID_PROGRESS', 'Value cannot be negative');
    }

    try {
      // Get all achievements matching this event type
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('condition_type', eventType);

      if (achievementsError) {
        throw this.handleSupabaseError(achievementsError);
      }

      if (!achievements || achievements.length === 0) {
        return [];
      }

      const newlyUnlocked: UserAchievement[] = [];

      // Check each achievement
      for (const achievement of achievements) {
        // Get user's progress for this achievement
        const { data: userAchievement, error: userAchError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
          .eq('achievement_id', achievement.id)
          .single();

        if (userAchError && userAchError.code !== 'PGRST116') {
          console.error('Error fetching user achievement:', userAchError);
          continue;
        }

        // If user achievement doesn't exist, create it
        if (!userAchievement) {
          const { data: newUserAchievement, error: createError } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              progress: value,
              unlocked: value >= achievement.condition_value,
              unlocked_at: value >= achievement.condition_value ? new Date().toISOString() : null,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user achievement:', createError);
            continue;
          }

          if (newUserAchievement && newUserAchievement.unlocked) {
            newlyUnlocked.push(newUserAchievement as UserAchievement);
          }
        } else {
          // Update existing achievement if not already unlocked
          if (!userAchievement.unlocked) {
            const shouldUnlock = value >= achievement.condition_value;
            
            const { data: updatedAchievement, error: updateError } = await supabase
              .from('user_achievements')
              .update({
                progress: value,
                unlocked: shouldUnlock,
                unlocked_at: shouldUnlock ? new Date().toISOString() : null,
              })
              .eq('id', userAchievement.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating user achievement:', updateError);
              continue;
            }

            if (updatedAchievement && updatedAchievement.unlocked) {
              newlyUnlocked.push(updatedAchievement as UserAchievement);
            }
          }
        }
      }

      return newlyUnlocked;
    } catch (error) {
      if (this.isAchievementError(error)) {
        throw error;
      }
      throw this.createError('CHECK_FAILED', `Failed to check achievements: ${(error as Error).message}`);
    }
  }

  /**
   * Unlock an achievement for a user
   * - Manually unlocks a specific achievement
   * - Used for special achievements or admin actions
   * - Ignores if already unlocked
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns Updated user achievement
   * @throws Error if unlock fails
   * 
   * Requirements: 1.15
   */
  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    if (!userId || !achievementId) {
      throw this.createError('MISSING_FIELDS', 'User ID and Achievement ID are required');
    }

    try {
      // Check if achievement exists
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (achievementError) {
        throw this.handleSupabaseError(achievementError);
      }

      if (!achievement) {
        throw this.createError('NOT_FOUND', 'Achievement not found');
      }

      // Get or create user achievement
      const { data: userAchievement, error: userAchError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (userAchError && userAchError.code !== 'PGRST116') {
        throw this.handleSupabaseError(userAchError);
      }

      if (!userAchievement) {
        // Create new user achievement as unlocked
        const { data: newUserAchievement, error: createError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            progress: achievement.condition_value,
            unlocked: true,
            unlocked_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          throw this.handleSupabaseError(createError);
        }

        if (!newUserAchievement) {
          throw this.createError('UNLOCK_FAILED', 'Failed to unlock achievement');
        }

        return newUserAchievement as UserAchievement;
      } else {
        // Update existing achievement if not already unlocked
        if (userAchievement.unlocked) {
          // Already unlocked, return as is
          return userAchievement as UserAchievement;
        }

        const { data: updatedAchievement, error: updateError } = await supabase
          .from('user_achievements')
          .update({
            progress: achievement.condition_value,
            unlocked: true,
            unlocked_at: new Date().toISOString(),
          })
          .eq('id', userAchievement.id)
          .select()
          .single();

        if (updateError) {
          throw this.handleSupabaseError(updateError);
        }

        if (!updatedAchievement) {
          throw this.createError('UNLOCK_FAILED', 'Failed to unlock achievement');
        }

        return updatedAchievement as UserAchievement;
      }
    } catch (error) {
      if (this.isAchievementError(error)) {
        throw error;
      }
      throw this.createError('UNLOCK_FAILED', `Failed to unlock achievement: ${(error as Error).message}`);
    }
  }

  /**
   * Set favorite achievement
   * - Marks an achievement as favorite for display in profile
   * - Only one achievement can be favorite at a time
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param isFavorite Whether to set as favorite
   * @throws Error if update fails
   * 
   * Requirements: 8.4
   */
  async setFavoriteAchievement(
    userId: string,
    achievementId: string,
    isFavorite: boolean
  ): Promise<void> {
    if (!userId || !achievementId) {
      throw this.createError('MISSING_FIELDS', 'User ID and Achievement ID are required');
    }

    try {
      if (isFavorite) {
        // First, unfavorite all other achievements for this user
        await supabase
          .from('user_achievements')
          .update({ is_favorite: false })
          .eq('user_id', userId);
      }

      // Set the favorite status for this achievement
      const { error } = await supabase
        .from('user_achievements')
        .update({ is_favorite: isFavorite })
        .eq('user_id', userId)
        .eq('achievement_id', achievementId);

      if (error) {
        throw this.handleSupabaseError(error);
      }
    } catch (error) {
      if (this.isAchievementError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to set favorite achievement: ${(error as Error).message}`);
    }
  }

  /**
   * Get favorite achievements
   * - Returns achievements marked as favorite
   * 
   * @param userId User ID
   * @returns Array of favorite achievements
   * @throws Error if fetch fails
   * 
   * Requirements: 8.5
   */
  async getFavoriteAchievements(userId: string): Promise<UserAchievement[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true);

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as UserAchievement[];
    } catch (error) {
      if (this.isAchievementError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch favorite achievements: ${(error as Error).message}`);
    }
  }

  /**
   * Get achievement statistics for a user
   * - Returns summary statistics about user's achievements
   * - Includes completion percentage and breakdown by category/rarity
   * 
   * @param userId User ID
   * @returns Achievement statistics
   * @throws Error if fetch fails
   * 
   * Requirements: 8.2
   */
  async getAchievementStats(userId: string): Promise<AchievementStats> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Get all achievements
      const allAchievements = await this.getAllAchievements();
      
      // Get user achievements
      const userAchievements = await this.getUserAchievements(userId);

      // Calculate statistics
      const totalAchievements = allAchievements.length;
      const unlockedAchievements = userAchievements.filter(ua => ua.unlocked).length;
      const completionPercentage = totalAchievements > 0 
        ? (unlockedAchievements / totalAchievements) * 100 
        : 0;

      // Count by category
      const byCategory: Record<AchievementCategory, number> = {
        learning: 0,
        social: 0,
        achievement: 0,
        special: 0,
      };

      // Count by rarity
      const byRarity: Record<AchievementRarity, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };

      // Count unlocked achievements by category and rarity
      for (const userAch of userAchievements) {
        if (userAch.unlocked) {
          const achievement = allAchievements.find(a => a.id === userAch.achievement_id);
          if (achievement) {
            byCategory[achievement.category]++;
            byRarity[achievement.rarity]++;
          }
        }
      }

      return {
        total_achievements: totalAchievements,
        unlocked_achievements: unlockedAchievements,
        completion_percentage: Math.round(completionPercentage * 100) / 100,
        by_category: byCategory,
        by_rarity: byRarity,
      };
    } catch (error) {
      if (this.isAchievementError(error)) {
        throw error;
      }
      throw this.createError('STATS_FAILED', `Failed to get achievement stats: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create an AchievementError
   */
  private createError(code: string, message: string): AchievementError {
    return { code, message };
  }

  /**
   * Check if error is an AchievementError
   */
  private isAchievementError(error: unknown): error is AchievementError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to AchievementError
   */
  private handleSupabaseError(error: { message: string; code?: string }): AchievementError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Achievement not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this achievement');
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
export const achievementService = new AchievementService();
