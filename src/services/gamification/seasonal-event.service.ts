/**
 * Seasonal Event Service
 * Handles seasonal events, user progress, leaderboards, and rewards
 * 
 * Requirements:
 * - 13.1-13.7: Seasonal events with special quests and achievements
 * - 7.2: Event progress display
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  theme: string; // CSS class for theme
  start_date: string;
  end_date: string;
  active: boolean;
  special_quests: string[]; // Array of quest IDs
  special_achievements: string[]; // Array of achievement IDs
  created_at: string;
}

export interface UserSeasonalProgress {
  id: string;
  user_id: string;
  event_id: string;
  seasonal_points: number;
  rank: number | null;
  rewards_claimed: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventReward {
  coins: number;
  xp: number;
  special_badges: string[];
}

export interface SeasonalEventError {
  code: string;
  message: string;
}

// ============================================================================
// SEASONAL EVENT SERVICE
// ============================================================================

export class SeasonalEventService {
  /**
   * Get the currently active seasonal event
   * - Returns the event that is currently active
   * - Returns null if no event is active
   * 
   * @returns Active seasonal event or null
   * @throws Error if fetch fails
   * 
   * Requirements: 13.1, 13.2
   */
  async getActiveEvent(): Promise<SeasonalEvent | null> {
    try {
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .eq('active', true)
        .single();

      // Handle "no rows" error gracefully
      if (error && error.code !== 'PGRST116') {
        // If table doesn't exist or RLS blocks access, return null instead of throwing
        if (error.code === '42P01' || error.message?.includes('406') || error.message?.includes('relation')) {
          console.warn('Seasonal events table not available:', error.message);
          return null;
        }
        throw this.handleSupabaseError(error);
      }

      return data ? (data as SeasonalEvent) : null;
    } catch (error) {
      if (this.isSeasonalEventError(error)) {
        throw error;
      }
      // Return null for any fetch errors - seasonal events are optional
      console.warn('Failed to fetch active event:', error);
      return null;
    }
  }

  /**
   * Get all seasonal events
   * - Returns all events (past, present, and future)
   * - Ordered by start date descending
   * 
   * @returns Array of seasonal events
   * @throws Error if fetch fails
   * 
   * Requirements: 13.1
   */
  async getAllEvents(): Promise<SeasonalEvent[]> {
    try {
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as SeasonalEvent[];
    } catch (error) {
      if (this.isSeasonalEventError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch events: ${(error as Error).message}`);
    }
  }

  /**
   * Get user's progress in a seasonal event
   * - Returns user's progress including points and rank
   * - Creates initial progress record if it doesn't exist
   * 
   * @param userId User ID
   * @param eventId Event ID
   * @returns User's seasonal progress
   * @throws Error if fetch fails
   * 
   * Requirements: 13.3
   */
  async getUserEventProgress(userId: string, eventId: string): Promise<UserSeasonalProgress> {
    if (!userId || !eventId) {
      throw this.createError('MISSING_FIELDS', 'User ID and event ID are required');
    }

    try {
      const { data, error } = await supabase
        .from('user_seasonal_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw this.handleSupabaseError(error);
      }

      // If progress doesn't exist, create it
      if (!data) {
        const { data: newProgress, error: createError } = await supabase
          .from('user_seasonal_progress')
          .insert({
            user_id: userId,
            event_id: eventId,
            seasonal_points: 0,
            rank: null,
            rewards_claimed: false,
          })
          .select()
          .single();

        if (createError) {
          throw this.handleSupabaseError(createError);
        }

        if (!newProgress) {
          throw this.createError('CREATE_FAILED', 'Failed to create event progress');
        }

        return newProgress as UserSeasonalProgress;
      }

      return data as UserSeasonalProgress;
    } catch (error) {
      if (this.isSeasonalEventError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch user event progress: ${(error as Error).message}`);
    }
  }

  /**
   * Add seasonal points to a user's progress
   * - Increments user's seasonal points
   * - Updates rank in the leaderboard
   * - Ensures points are monotonically increasing
   * 
   * @param userId User ID
   * @param eventId Event ID
   * @param points Points to add
   * @throws Error if update fails or event is not active
   * 
   * Requirements: 13.3
   */
  async addSeasonalPoints(userId: string, eventId: string, points: number): Promise<void> {
    if (!userId || !eventId) {
      throw this.createError('MISSING_FIELDS', 'User ID and event ID are required');
    }

    if (points < 0) {
      throw this.createError('INVALID_POINTS', 'Points cannot be negative');
    }

    try {
      // Check if event is active
      const { data: event, error: eventError } = await supabase
        .from('seasonal_events')
        .select('active')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw this.handleSupabaseError(eventError);
      }

      if (!event || !event.active) {
        throw this.createError('EVENT_NOT_ACTIVE', 'Event is not active');
      }

      // Get current progress
      const progress = await this.getUserEventProgress(userId, eventId);

      // Update points
      const newPoints = progress.seasonal_points + points;

      const { error: updateError } = await supabase
        .from('user_seasonal_progress')
        .update({
          seasonal_points: newPoints,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      // Update ranks for all participants
      await this.updateEventRanks(eventId);
    } catch (error) {
      if (this.isSeasonalEventError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to add seasonal points: ${(error as Error).message}`);
    }
  }

  /**
   * Get event leaderboard
   * - Returns top participants sorted by seasonal points
   * - Includes user information
   * 
   * @param eventId Event ID
   * @param limit Maximum number of results (default: 100)
   * @returns Array of user progress sorted by points
   * @throws Error if fetch fails
   * 
   * Requirements: 13.4
   */
  async getEventLeaderboard(eventId: string, limit: number = 100): Promise<UserSeasonalProgress[]> {
    if (!eventId) {
      throw this.createError('MISSING_FIELDS', 'Event ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('user_seasonal_progress')
        .select('*')
        .eq('event_id', eventId)
        .order('seasonal_points', { ascending: false })
        .limit(limit);

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as UserSeasonalProgress[];
    } catch (error) {
      if (this.isSeasonalEventError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch event leaderboard: ${(error as Error).message}`);
    }
  }

  /**
   * Claim event rewards
   * - Awards coins, XP, and special badges based on rank
   * - Can only be claimed once per event
   * - Higher ranks receive better rewards
   * 
   * @param userId User ID
   * @param eventId Event ID
   * @returns Event rewards
   * @throws Error if rewards already claimed or event still active
   * 
   * Requirements: 13.4, 13.5
   */
  async claimEventRewards(userId: string, eventId: string): Promise<EventReward> {
    if (!userId || !eventId) {
      throw this.createError('MISSING_FIELDS', 'User ID and event ID are required');
    }

    try {
      // Check if event is still active
      const { data: event, error: eventError } = await supabase
        .from('seasonal_events')
        .select('active')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw this.handleSupabaseError(eventError);
      }

      if (!event) {
        throw this.createError('NOT_FOUND', 'Event not found');
      }

      if (event.active) {
        throw this.createError('EVENT_ACTIVE', 'Cannot claim rewards while event is still active');
      }

      // Get user progress
      const progress = await this.getUserEventProgress(userId, eventId);

      // Check if rewards already claimed
      if (progress.rewards_claimed) {
        throw this.createError('REWARDS_CLAIMED', 'Rewards already claimed');
      }

      // Calculate rewards based on rank
      const reward = this.calculateEventReward(progress.rank);

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
            description: `Seasonal event reward - Rank ${progress.rank || 'N/A'}`,
          });
      }

      // Mark rewards as claimed
      await supabase
        .from('user_seasonal_progress')
        .update({
          rewards_claimed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id);

      return reward;
    } catch (error) {
      if (this.isSeasonalEventError(error)) {
        throw error;
      }
      throw this.createError('CLAIM_FAILED', `Failed to claim event rewards: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Update ranks for all participants in an event
   * - Recalculates ranks based on current points
   * - Assigns rank 1 to highest points, 2 to second, etc.
   */
  private async updateEventRanks(eventId: string): Promise<void> {
    try {
      // Get all participants sorted by points
      const leaderboard = await this.getEventLeaderboard(eventId, 1000);

      // Update ranks
      for (let i = 0; i < leaderboard.length; i++) {
        const participant = leaderboard[i];
        const newRank = i + 1;

        if (participant.rank !== newRank) {
          await supabase
            .from('user_seasonal_progress')
            .update({
              rank: newRank,
              updated_at: new Date().toISOString(),
            })
            .eq('id', participant.id);
        }
      }
    } catch (error) {
      console.error('Failed to update event ranks:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Calculate event rewards based on rank
   * - Top 3 get special badges
   * - Rewards decrease with lower ranks
   * 
   * @param rank User's rank in the event
   * @returns Event reward
   */
  private calculateEventReward(rank: number | null): EventReward {
    if (!rank) {
      // Participation reward
      return {
        coins: 50,
        xp: 100,
        special_badges: [],
      };
    }

    // Top 3 get special badges
    const special_badges: string[] = [];
    if (rank === 1) {
      special_badges.push('seasonal_champion');
    } else if (rank === 2) {
      special_badges.push('seasonal_runner_up');
    } else if (rank === 3) {
      special_badges.push('seasonal_third_place');
    }

    // Calculate coins and XP based on rank
    let coins = 50;
    let xp = 100;

    if (rank === 1) {
      coins = 500;
      xp = 1000;
    } else if (rank === 2) {
      coins = 300;
      xp = 600;
    } else if (rank === 3) {
      coins = 200;
      xp = 400;
    } else if (rank <= 10) {
      coins = 150;
      xp = 300;
    } else if (rank <= 50) {
      coins = 100;
      xp = 200;
    }

    return {
      coins,
      xp,
      special_badges,
    };
  }

  /**
   * Create a SeasonalEventError
   */
  private createError(code: string, message: string): SeasonalEventError {
    return { code, message };
  }

  /**
   * Check if error is a SeasonalEventError
   */
  private isSeasonalEventError(error: unknown): error is SeasonalEventError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to SeasonalEventError
   */
  private handleSupabaseError(error: { message: string; code?: string }): SeasonalEventError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Event not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this event');
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
export const seasonalEventService = new SeasonalEventService();
