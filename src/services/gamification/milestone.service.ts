/**
 * Milestone Service
 * Handles milestone management, progress tracking, and achievement
 * 
 * Requirements:
 * - 6.1-6.7: Milestone system for tracking important learning achievements
 * - 7.6: Progress visualization for milestones
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type MilestoneCategory =
  | 'lessons_created'
  | 'quizzes_completed'
  | 'wisdom_coins'
  | 'level_reached';

export interface Milestone {
  id: string;
  code: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  threshold: number;
  reward_coins: number;
  reward_xp: number;
  icon: string;
  created_at: string;
}

export interface UserMilestone {
  id: string;
  user_id: string;
  milestone_id: string;
  achieved: boolean;
  achieved_at: string | null;
  created_at: string;
}

export interface MilestoneProgress {
  milestone: Milestone;
  current_value: number;
  progress_percentage: number;
  achieved: boolean;
}

export interface MilestoneReward {
  coins: number;
  xp: number;
  special_achievement_id?: string;
}

export interface MilestoneError {
  code: string;
  message: string;
}

// ============================================================================
// MILESTONE SERVICE
// ============================================================================

export class MilestoneService {
  /**
   * Get all milestones
   * - Returns all available milestones in the system
   * - Publicly accessible
   * - Ordered by category and threshold
   * 
   * @returns Array of all milestones
   * @throws Error if fetch fails
   * 
   * Requirements: 6.6
   */
  async getAllMilestones(): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('category', { ascending: true })
        .order('threshold', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Milestone[];
    } catch (error) {
      if (this.isMilestoneError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch milestones: ${(error as Error).message}`);
    }
  }

  /**
   * Get user milestones
   * - Returns all milestones for a specific user
   * - Includes both achieved and not achieved milestones
   * - Shows progress towards not achieved milestones
   * 
   * @param userId User ID
   * @returns Array of user milestones
   * @throws Error if fetch fails
   * 
   * Requirements: 6.6
   */
  async getUserMilestones(userId: string): Promise<UserMilestone[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', userId)
        .order('achieved', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as UserMilestone[];
    } catch (error) {
      if (this.isMilestoneError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch user milestones: ${(error as Error).message}`);
    }
  }

  /**
   * Get milestones by category
   * - Returns all milestones in a specific category
   * - Useful for filtering milestones by type
   * 
   * @param category Milestone category
   * @returns Array of milestones in the category
   * @throws Error if fetch fails
   * 
   * Requirements: 6.1-6.4
   */
  async getMilestonesByCategory(category: MilestoneCategory): Promise<Milestone[]> {
    if (!category) {
      throw this.createError('MISSING_FIELDS', 'Category is required');
    }

    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('category', category)
        .order('threshold', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Milestone[];
    } catch (error) {
      if (this.isMilestoneError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch milestones by category: ${(error as Error).message}`);
    }
  }

  /**
   * Check milestones for a user based on category and value
   * - Checks all milestones in the specified category
   * - Marks milestones as achieved when threshold is reached
   * - Returns newly achieved milestones
   * 
   * @param userId User ID
   * @param category Milestone category to check
   * @param value Current value for the category
   * @returns Array of newly achieved milestones
   * @throws Error if check fails
   * 
   * Requirements: 6.1-6.4, 15.1-15.5
   */
  async checkMilestones(
    userId: string,
    category: MilestoneCategory,
    value: number
  ): Promise<UserMilestone[]> {
    if (!userId || !category || value === undefined) {
      throw this.createError('MISSING_FIELDS', 'User ID, category, and value are required');
    }

    if (value < 0) {
      throw this.createError('INVALID_VALUE', 'Value cannot be negative');
    }

    try {
      // Get all milestones in this category
      const milestones = await this.getMilestonesByCategory(category);

      if (milestones.length === 0) {
        return [];
      }

      const newlyAchieved: UserMilestone[] = [];

      // Check each milestone
      for (const milestone of milestones) {
        // Get user's milestone record
        const { data: userMilestone, error: userMilestoneError } = await supabase
          .from('user_milestones')
          .select('*')
          .eq('user_id', userId)
          .eq('milestone_id', milestone.id)
          .single();

        if (userMilestoneError && userMilestoneError.code !== 'PGRST116') {
          console.error('Error fetching user milestone:', userMilestoneError);
          continue;
        }

        // If user milestone doesn't exist, create it
        if (!userMilestone) {
          const shouldAchieve = value >= milestone.threshold;

          const { data: newUserMilestone, error: createError } = await supabase
            .from('user_milestones')
            .insert({
              user_id: userId,
              milestone_id: milestone.id,
              achieved: shouldAchieve,
              achieved_at: shouldAchieve ? new Date().toISOString() : null,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user milestone:', createError);
            continue;
          }

          if (newUserMilestone && newUserMilestone.achieved) {
            newlyAchieved.push(newUserMilestone as UserMilestone);
          }
        } else {
          // Update existing milestone if not already achieved
          if (!userMilestone.achieved && value >= milestone.threshold) {
            const { data: updatedMilestone, error: updateError } = await supabase
              .from('user_milestones')
              .update({
                achieved: true,
                achieved_at: new Date().toISOString(),
              })
              .eq('id', userMilestone.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating user milestone:', updateError);
              continue;
            }

            if (updatedMilestone) {
              newlyAchieved.push(updatedMilestone as UserMilestone);
            }
          }
        }
      }

      return newlyAchieved;
    } catch (error) {
      if (this.isMilestoneError(error)) {
        throw error;
      }
      throw this.createError('CHECK_FAILED', `Failed to check milestones: ${(error as Error).message}`);
    }
  }

  /**
   * Achieve a milestone and grant rewards
   * - Marks milestone as achieved
   * - Awards coins and XP
   * - Checks for special achievement if all milestones in category are achieved
   * - Returns reward information
   * 
   * @param userId User ID
   * @param milestoneId Milestone ID
   * @returns Milestone rewards
   * @throws Error if milestone already achieved or achievement fails
   * 
   * Requirements: 6.5, 6.7
   */
  async achieveMilestone(userId: string, milestoneId: string): Promise<MilestoneReward> {
    if (!userId || !milestoneId) {
      throw this.createError('MISSING_FIELDS', 'User ID and Milestone ID are required');
    }

    try {
      // Get milestone details
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', milestoneId)
        .single();

      if (milestoneError) {
        throw this.handleSupabaseError(milestoneError);
      }

      if (!milestone) {
        throw this.createError('NOT_FOUND', 'Milestone not found');
      }

      // Get user milestone
      const { data: userMilestone, error: userMilestoneError } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', userId)
        .eq('milestone_id', milestoneId)
        .single();

      if (userMilestoneError && userMilestoneError.code !== 'PGRST116') {
        throw this.handleSupabaseError(userMilestoneError);
      }

      // If already achieved, ignore
      if (userMilestone && userMilestone.achieved) {
        return {
          coins: milestone.reward_coins,
          xp: milestone.reward_xp,
        };
      }

      // Mark as achieved
      if (userMilestone) {
        await supabase
          .from('user_milestones')
          .update({
            achieved: true,
            achieved_at: new Date().toISOString(),
          })
          .eq('id', userMilestone.id);
      } else {
        await supabase
          .from('user_milestones')
          .insert({
            user_id: userId,
            milestone_id: milestoneId,
            achieved: true,
            achieved_at: new Date().toISOString(),
          });
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
            wisdom_coins: profile.wisdom_coins + milestone.reward_coins,
          })
          .eq('id', userId);

        // Record transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: milestone.reward_coins,
            transaction_type: 'leaderboard_reward',
            description: `Milestone achieved: ${milestone.title}`,
          });
      }

      // Check if all milestones in this category are achieved
      const categoryMilestones = await this.getMilestonesByCategory(milestone.category);
      const userMilestones = await this.getUserMilestones(userId);

      const categoryUserMilestones = userMilestones.filter(um => 
        categoryMilestones.some(m => m.id === um.milestone_id)
      );

      const allAchieved = categoryUserMilestones.length === categoryMilestones.length &&
                         categoryUserMilestones.every(um => um.achieved);

      let specialAchievementId: string | undefined;
      if (allAchieved) {
        // Award special achievement for completing all milestones in category
        // This will be handled by the achievement service
        specialAchievementId = `all_milestones_${milestone.category}`;
      }

      return {
        coins: milestone.reward_coins,
        xp: milestone.reward_xp,
        special_achievement_id: specialAchievementId,
      };
    } catch (error) {
      if (this.isMilestoneError(error)) {
        throw error;
      }
      throw this.createError('ACHIEVE_FAILED', `Failed to achieve milestone: ${(error as Error).message}`);
    }
  }

  /**
   * Get milestone progress for a specific milestone
   * - Returns progress details including current value and percentage
   * - Calculates current value based on milestone category
   * 
   * @param userId User ID
   * @param milestoneId Milestone ID
   * @returns Milestone progress information
   * @throws Error if not found or fetch fails
   * 
   * Requirements: 7.6
   */
  async getMilestoneProgress(userId: string, milestoneId: string): Promise<MilestoneProgress> {
    if (!userId || !milestoneId) {
      throw this.createError('MISSING_FIELDS', 'User ID and Milestone ID are required');
    }

    try {
      // Get milestone details
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', milestoneId)
        .single();

      if (milestoneError) {
        throw this.handleSupabaseError(milestoneError);
      }

      if (!milestone) {
        throw this.createError('NOT_FOUND', 'Milestone not found');
      }

      // Get user milestone
      const { data: userMilestone, error: userMilestoneError } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', userId)
        .eq('milestone_id', milestoneId)
        .single();

      if (userMilestoneError && userMilestoneError.code !== 'PGRST116') {
        throw this.handleSupabaseError(userMilestoneError);
      }

      // Get current value based on category
      const currentValue = await this.getCurrentValueForCategory(userId, milestone.category);

      // Calculate progress percentage
      const progressPercentage = milestone.threshold > 0
        ? Math.min((currentValue / milestone.threshold) * 100, 100)
        : 100;

      return {
        milestone: milestone as Milestone,
        current_value: currentValue,
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        achieved: userMilestone ? userMilestone.achieved : false,
      };
    } catch (error) {
      if (this.isMilestoneError(error)) {
        throw error;
      }
      throw this.createError('PROGRESS_FAILED', `Failed to get milestone progress: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get current value for a milestone category
   * - Queries the appropriate table based on category
   * - Returns the current count/value for the user
   * 
   * @param userId User ID
   * @param category Milestone category
   * @returns Current value for the category
   */
  private async getCurrentValueForCategory(userId: string, category: MilestoneCategory): Promise<number> {
    try {
      switch (category) {
        case 'lessons_created': {
          const { count, error } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId);

          if (error) {
            console.error('Error counting lessons:', error);
            return 0;
          }

          return count || 0;
        }

        case 'quizzes_completed': {
          const { count, error } = await supabase
            .from('quiz_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', userId);

          if (error) {
            console.error('Error counting quiz attempts:', error);
            return 0;
          }

          return count || 0;
        }

        case 'wisdom_coins': {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('wisdom_coins')
            .eq('id', userId)
            .single();

          if (error) {
            console.error('Error fetching wisdom coins:', error);
            return 0;
          }

          return data?.wisdom_coins || 0;
        }

        case 'level_reached': {
          const { data, error } = await supabase
            .from('user_levels')
            .select('level')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.error('Error fetching user level:', error);
            return 1;
          }

          return data?.level || 1;
        }

        default:
          return 0;
      }
    } catch (error) {
      console.error('Error getting current value for category:', error);
      return 0;
    }
  }

  /**
   * Create a MilestoneError
   */
  private createError(code: string, message: string): MilestoneError {
    return { code, message };
  }

  /**
   * Check if error is a MilestoneError
   */
  private isMilestoneError(error: unknown): error is MilestoneError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to MilestoneError
   */
  private handleSupabaseError(error: { message: string; code?: string }): MilestoneError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Milestone not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this milestone');
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
export const milestoneService = new MilestoneService();
