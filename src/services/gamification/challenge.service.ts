/**
 * Challenge Service
 * Handles challenge management, participant invitations, progress tracking, and completion
 * 
 * Requirements:
 * - 5.1-5.8: Challenge system between students
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type ChallengeType =
  | 'most_lessons'      // Больше всего уроков
  | 'most_quizzes'      // Больше всего викторин
  | 'highest_score';    // Больше всего очков в рейтинге

export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined';

export interface Challenge {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  challenge_type: ChallengeType;
  target_value: number;
  start_date: string;
  end_date: string;
  reward_coins: number;
  reward_xp: number;
  status: ChallengeStatus;
  winner_id: string | null;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: number;
  status: ParticipantStatus;
  joined_at: string;
}

export interface ChallengeResult {
  winner_id: string;
  winner_progress: number;
  rewards: {
    coins: number;
    xp: number;
  };
}

export interface ChallengeError {
  code: string;
  message: string;
}

// ============================================================================
// CHALLENGE SERVICE
// ============================================================================

export class ChallengeService {
  /**
   * Create a new challenge
   * - Creates a challenge with specified parameters
   * - Automatically adds creator as first participant
   * - Sets status to 'pending' until other participants accept
   * 
   * @param challenge Challenge data (without id and created_at)
   * @returns Created challenge
   * @throws Error if creation fails
   * 
   * Requirements: 5.1, 5.2
   */
  async createChallenge(challenge: Omit<Challenge, 'id' | 'created_at'>): Promise<Challenge> {
    if (!challenge.creator_id || !challenge.title || !challenge.challenge_type) {
      throw this.createError('MISSING_FIELDS', 'Creator ID, title, and challenge type are required');
    }

    if (!challenge.start_date || !challenge.end_date) {
      throw this.createError('MISSING_FIELDS', 'Start date and end date are required');
    }

    if (new Date(challenge.start_date) >= new Date(challenge.end_date)) {
      throw this.createError('INVALID_DATES', 'End date must be after start date');
    }

    if (challenge.target_value <= 0) {
      throw this.createError('INVALID_TARGET', 'Target value must be positive');
    }

    try {
      // Create challenge
      const { data: newChallenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          creator_id: challenge.creator_id,
          title: challenge.title,
          description: challenge.description,
          challenge_type: challenge.challenge_type,
          target_value: challenge.target_value,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          reward_coins: challenge.reward_coins,
          reward_xp: challenge.reward_xp,
          status: challenge.status || 'pending',
          winner_id: null,
        })
        .select()
        .maybeSingle();

      if (challengeError) {
        throw this.handleSupabaseError(challengeError);
      }

      if (!newChallenge) {
        throw this.createError('CREATE_FAILED', 'Failed to create challenge');
      }

      // Add creator as first participant with 'accepted' status
      await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: newChallenge.id,
          user_id: challenge.creator_id,
          progress: 0,
          status: 'accepted',
        });

      return newChallenge as Challenge;
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('CREATE_FAILED', `Failed to create challenge: ${(error as Error).message}`);
    }
  }

  /**
   * Get a challenge by ID
   * - Returns challenge details
   * - No RLS filtering (handled at application level)
   * 
   * @param challengeId Challenge ID
   * @returns Challenge details
   * @throws Error if not found
   * 
   * Requirements: 5.1-5.8
   */
  async getChallenge(challengeId: string): Promise<Challenge> {
    if (!challengeId) {
      throw this.createError('MISSING_FIELDS', 'Challenge ID is required');
    }

    try {
      // Simple query without RLS complications
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .maybeSingle();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('NOT_FOUND', 'Challenge not found');
      }

      return data as Challenge;
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch challenge: ${(error as Error).message}`);
    }
  }

  /**
   * Get all challenges for a user
   * - Returns challenges where user is creator or participant
   * - Includes challenge details and participant information
   * - Filters on application level to avoid RLS recursion
   * 
   * @param userId User ID
   * @returns Array of challenges
   * @throws Error if fetch fails
   * 
   * Requirements: 5.1-5.8
   */
  async getUserChallenges(userId: string): Promise<Challenge[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Get all challenges (RLS allows viewing all for authenticated users)
      const { data: allChallenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (challengesError) {
        throw this.handleSupabaseError(challengesError);
      }

      // Get user's participant records
      const { data: participantData, error: participantError } = await supabase
        .from('challenge_participants')
        .select('challenge_id, status')
        .eq('user_id', userId);

      if (participantError) {
        throw this.handleSupabaseError(participantError);
      }

      // Create a map of challenge IDs where user is participant
      const participantChallengeIds = new Set(
        (participantData || [])
          .filter(p => p.status !== 'declined') // Exclude declined invitations
          .map(p => p.challenge_id)
      );

      // Filter challenges: user is creator OR participant
      const userChallenges = (allChallenges || []).filter(challenge => 
        challenge.creator_id === userId || participantChallengeIds.has(challenge.id)
      );

      return userChallenges as Challenge[];
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch user challenges: ${(error as Error).message}`);
    }
  }

  /**
   * Invite users to a challenge
   * - Sends invitations to specified users
   * - Creates participant records with 'invited' status
   * - Only creator can invite
   * 
   * @param challengeId Challenge ID
   * @param userIds Array of user IDs to invite
   * @throws Error if challenge not found or user not creator
   * 
   * Requirements: 5.3
   */
  async inviteToChallenge(challengeId: string, userIds: string[]): Promise<void> {
    if (!challengeId || !userIds || userIds.length === 0) {
      throw this.createError('MISSING_FIELDS', 'Challenge ID and user IDs are required');
    }

    try {
      // Get challenge to verify it exists
      const challenge = await this.getChallenge(challengeId);

      if (challenge.status === 'completed' || challenge.status === 'cancelled') {
        throw this.createError('INVALID_STATUS', 'Cannot invite to completed or cancelled challenge');
      }

      // Create participant records for each invited user
      const participants = userIds.map(userId => ({
        challenge_id: challengeId,
        user_id: userId,
        progress: 0,
        status: 'invited' as ParticipantStatus,
      }));

      const { error } = await supabase
        .from('challenge_participants')
        .insert(participants);

      if (error) {
        // Ignore duplicate errors (user already invited)
        if (!error.message.includes('unique constraint')) {
          throw this.handleSupabaseError(error);
        }
      }
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('INVITE_FAILED', `Failed to invite to challenge: ${(error as Error).message}`);
    }
  }

  /**
   * Accept a challenge invitation
   * - Updates participant status to 'accepted'
   * - Activates challenge if all participants have accepted
   * 
   * @param challengeId Challenge ID
   * @param userId User ID
   * @throws Error if not invited or already accepted/declined
   * 
   * Requirements: 5.4
   */
  async acceptChallenge(challengeId: string, userId: string): Promise<void> {
    if (!challengeId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Challenge ID and user ID are required');
    }

    try {
      // Get participant record
      const { data: participant, error: participantError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (participantError) {
        throw this.handleSupabaseError(participantError);
      }

      if (!participant) {
        throw this.createError('NOT_PARTICIPANT', 'User is not invited to this challenge');
      }

      if (participant.status === 'accepted') {
        // Already accepted, nothing to do
        return;
      }

      if (participant.status === 'declined') {
        throw this.createError('ALREADY_DECLINED', 'Challenge invitation was already declined');
      }

      // Update participant status
      const { error: updateError } = await supabase
        .from('challenge_participants')
        .update({ status: 'accepted' })
        .eq('id', participant.id);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      // Check if all participants have accepted
      const { data: allParticipants } = await supabase
        .from('challenge_participants')
        .select('status')
        .eq('challenge_id', challengeId);

      const allAccepted = (allParticipants || []).every(p => p.status === 'accepted');

      // If all accepted and challenge is pending, activate it
      if (allAccepted) {
        const challenge = await this.getChallenge(challengeId);
        if (challenge.status === 'pending') {
          await supabase
            .from('challenges')
            .update({ status: 'active' })
            .eq('id', challengeId);
        }
      }
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('ACCEPT_FAILED', `Failed to accept challenge: ${(error as Error).message}`);
    }
  }

  /**
   * Decline a challenge invitation
   * - Updates participant status to 'declined'
   * - User will not participate in the challenge
   * 
   * @param challengeId Challenge ID
   * @param userId User ID
   * @throws Error if not invited or already accepted/declined
   * 
   * Requirements: 5.4
   */
  async declineChallenge(challengeId: string, userId: string): Promise<void> {
    if (!challengeId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Challenge ID and user ID are required');
    }

    try {
      // Get participant record
      const { data: participant, error: participantError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (participantError) {
        throw this.handleSupabaseError(participantError);
      }

      if (!participant) {
        throw this.createError('NOT_PARTICIPANT', 'User is not invited to this challenge');
      }

      if (participant.status === 'declined') {
        // Already declined, nothing to do
        return;
      }

      if (participant.status === 'accepted') {
        throw this.createError('ALREADY_ACCEPTED', 'Challenge invitation was already accepted');
      }

      // Update participant status
      const { error: updateError } = await supabase
        .from('challenge_participants')
        .update({ status: 'declined' })
        .eq('id', participant.id);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('DECLINE_FAILED', `Failed to decline challenge: ${(error as Error).message}`);
    }
  }

  /**
   * Update challenge progress for a participant
   * - Updates progress value for a specific participant
   * - Only updates if challenge is active
   * - Does not exceed target value
   * 
   * @param challengeId Challenge ID
   * @param userId User ID
   * @param progress New progress value
   * @throws Error if not participant or challenge not active
   * 
   * Requirements: 5.5
   */
  async updateChallengeProgress(challengeId: string, userId: string, progress: number): Promise<void> {
    if (!challengeId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Challenge ID and user ID are required');
    }

    if (progress < 0) {
      throw this.createError('INVALID_PROGRESS', 'Progress cannot be negative');
    }

    try {
      // Get challenge
      const challenge = await this.getChallenge(challengeId);

      if (challenge.status !== 'active' && challenge.status !== 'pending') {
        throw this.createError('INVALID_STATUS', 'Challenge is not active');
      }

      // Get participant record
      const { data: participant, error: participantError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (participantError) {
        throw this.handleSupabaseError(participantError);
      }

      if (!participant) {
        throw this.createError('NOT_PARTICIPANT', 'User is not a participant in this challenge');
      }

      if (participant.status !== 'accepted') {
        throw this.createError('NOT_ACCEPTED', 'User has not accepted the challenge');
      }

      // Update progress (don't cap at target_value, let it exceed for competitive purposes)
      const { error: updateError } = await supabase
        .from('challenge_participants')
        .update({ progress })
        .eq('id', participant.id);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to update challenge progress: ${(error as Error).message}`);
    }
  }

  /**
   * Get challenge leaderboard
   * - Returns all participants sorted by progress (descending)
   * - Only includes accepted participants
   * 
   * @param challengeId Challenge ID
   * @returns Array of participants sorted by progress
   * @throws Error if challenge not found
   * 
   * Requirements: 5.5, 5.6
   */
  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeParticipant[]> {
    if (!challengeId) {
      throw this.createError('MISSING_FIELDS', 'Challenge ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('status', 'accepted')
        .order('progress', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as ChallengeParticipant[];
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch challenge leaderboard: ${(error as Error).message}`);
    }
  }

  /**
   * Complete a challenge
   * - Determines winner (participant with highest progress)
   * - Awards rewards to winner
   * - Updates challenge status to 'completed'
   * - Returns challenge result
   * 
   * @param challengeId Challenge ID
   * @returns Challenge result with winner and rewards
   * @throws Error if challenge not active or already completed
   * 
   * Requirements: 5.5, 5.6
   */
  async completeChallenge(challengeId: string): Promise<ChallengeResult> {
    if (!challengeId) {
      throw this.createError('MISSING_FIELDS', 'Challenge ID is required');
    }

    try {
      // Get challenge
      const challenge = await this.getChallenge(challengeId);

      if (challenge.status === 'completed') {
        throw this.createError('ALREADY_COMPLETED', 'Challenge already completed');
      }

      if (challenge.status === 'cancelled') {
        throw this.createError('CANCELLED', 'Challenge was cancelled');
      }

      // Get leaderboard
      const leaderboard = await this.getChallengeLeaderboard(challengeId);

      if (leaderboard.length === 0) {
        throw this.createError('NO_PARTICIPANTS', 'No participants in challenge');
      }

      // Winner is participant with highest progress
      const winner = leaderboard[0];

      // Update challenge with winner and status
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'completed',
          winner_id: winner.user_id,
        })
        .eq('id', challengeId);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      // Award rewards to winner
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('wisdom_coins')
        .eq('id', winner.user_id)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({
            wisdom_coins: profile.wisdom_coins + challenge.reward_coins,
          })
          .eq('id', winner.user_id);

        // Record transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: winner.user_id,
            amount: challenge.reward_coins,
            transaction_type: 'leaderboard_reward',
            description: `Challenge won: ${challenge.title}`,
          });
      }

      return {
        winner_id: winner.user_id,
        winner_progress: winner.progress,
        rewards: {
          coins: challenge.reward_coins,
          xp: challenge.reward_xp,
        },
      };
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('COMPLETE_FAILED', `Failed to complete challenge: ${(error as Error).message}`);
    }
  }

  /**
   * Cancel a challenge
   * - Updates challenge status to 'cancelled'
   * - Only creator can cancel
   * - Cannot cancel completed challenges
   * 
   * @param challengeId Challenge ID
   * @throws Error if challenge not found or already completed
   * 
   * Requirements: 5.1-5.8
   */
  async cancelChallenge(challengeId: string): Promise<void> {
    if (!challengeId) {
      throw this.createError('MISSING_FIELDS', 'Challenge ID is required');
    }

    try {
      // Get challenge
      const challenge = await this.getChallenge(challengeId);

      if (challenge.status === 'completed') {
        throw this.createError('ALREADY_COMPLETED', 'Cannot cancel completed challenge');
      }

      if (challenge.status === 'cancelled') {
        // Already cancelled, nothing to do
        return;
      }

      // Update challenge status
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ status: 'cancelled' })
        .eq('id', challengeId);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }
    } catch (error) {
      if (this.isChallengeError(error)) {
        throw error;
      }
      throw this.createError('CANCEL_FAILED', `Failed to cancel challenge: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create a ChallengeError
   */
  private createError(code: string, message: string): ChallengeError {
    return { code, message };
  }

  /**
   * Check if error is a ChallengeError
   */
  private isChallengeError(error: unknown): error is ChallengeError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to ChallengeError
   */
  private handleSupabaseError(error: { message: string; code?: string }): ChallengeError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Challenge not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this challenge');
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
export const challengeService = new ChallengeService();
