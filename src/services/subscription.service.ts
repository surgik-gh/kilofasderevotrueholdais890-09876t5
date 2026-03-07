/**
 * Subscription Service
 * Handles subscription tier management, benefit calculations, and purchases
 * 
 * Requirements:
 * - 9.1-9.12: Student subscription tiers and benefits
 * - 10.1-10.12: Teacher subscription tiers and benefits
 */

import { supabase } from '../lib/supabase';
import type { SubscriptionTier } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionDetails {
  tier: SubscriptionTier;
  price: number; // In rubles
  biweekly_tokens: number;
  daily_login_tokens: number;
  free_expert_queries: number;
}

export interface SubscriptionError {
  code: string;
  message: string;
}

// ============================================================================
// SUBSCRIPTION SERVICE
// ============================================================================

export class SubscriptionService {
  /**
   * Get subscription details for a specific tier
   * 
   * @param tier Subscription tier
   * @returns Subscription details including price and benefits
   * 
   * Requirements: 9.1-9.12, 10.1-10.12
   */
  getSubscriptionDetails(tier: SubscriptionTier): SubscriptionDetails {
    const details: Record<SubscriptionTier, SubscriptionDetails> = {
      // Student tiers
      student_freemium: {
        tier: 'student_freemium',
        price: 0,
        biweekly_tokens: 50,
        daily_login_tokens: 10,
        free_expert_queries: 5,
      },
      student_promium: {
        tier: 'student_promium',
        price: 349,
        biweekly_tokens: 150,
        daily_login_tokens: 30,
        free_expert_queries: 10,
      },
      student_premium: {
        tier: 'student_premium',
        price: 649,
        biweekly_tokens: 250,
        daily_login_tokens: 50,
        free_expert_queries: 15,
      },
      student_legend: {
        tier: 'student_legend',
        price: 1299,
        biweekly_tokens: 500,
        daily_login_tokens: 90,
        free_expert_queries: 30,
      },
      // Teacher tiers
      teacher_freemium: {
        tier: 'teacher_freemium',
        price: 0,
        biweekly_tokens: 150,
        daily_login_tokens: 15,
        free_expert_queries: 5,
      },
      teacher_promium: {
        tier: 'teacher_promium',
        price: 299,
        biweekly_tokens: 200,
        daily_login_tokens: 35,
        free_expert_queries: 10,
      },
      teacher_premium: {
        tier: 'teacher_premium',
        price: 599,
        biweekly_tokens: 350,
        daily_login_tokens: 55,
        free_expert_queries: 15,
      },
      teacher_maxi: {
        tier: 'teacher_maxi',
        price: 1399,
        biweekly_tokens: 800,
        daily_login_tokens: 100,
        free_expert_queries: 30,
      },
    };

    return details[tier];
  }

  /**
   * Get all subscription tiers for a specific role
   * 
   * @param role User role (student or teacher)
   * @returns Array of subscription details for that role
   * 
   * Requirements: 9.1-9.12, 10.1-10.12
   */
  getSubscriptionTiersByRole(role: 'student' | 'teacher'): SubscriptionDetails[] {
    const prefix = role === 'student' ? 'student_' : 'teacher_';
    const tiers: SubscriptionTier[] = [
      `${prefix}freemium` as SubscriptionTier,
      `${prefix}promium` as SubscriptionTier,
      `${prefix}premium` as SubscriptionTier,
      role === 'student' ? 'student_legend' : 'teacher_maxi',
    ];

    return tiers.map(tier => this.getSubscriptionDetails(tier));
  }

  /**
   * Get free expert queries for a subscription tier
   * 
   * @param tier Subscription tier
   * @returns Number of free expert queries
   * 
   * Requirements: 9.3, 9.6, 9.9, 9.12, 10.3, 10.6, 10.9, 10.12
   */
  getFreeExpertQueries(tier: SubscriptionTier): number {
    return this.getSubscriptionDetails(tier).free_expert_queries;
  }

  /**
   * Get daily login bonus for a subscription tier
   * 
   * @param tier Subscription tier
   * @returns Daily login bonus in Wisdom Coins
   * 
   * Requirements: 9.2, 9.5, 9.8, 9.11, 10.2, 10.5, 10.8, 10.11
   */
  getDailyLoginBonus(tier: SubscriptionTier): number {
    return this.getSubscriptionDetails(tier).daily_login_tokens;
  }

  /**
   * Get biweekly grant for a subscription tier
   * 
   * @param tier Subscription tier
   * @returns Biweekly grant in Wisdom Coins
   * 
   * Requirements: 9.1, 9.4, 9.7, 9.10, 10.1, 10.4, 10.7, 10.10
   */
  getBiweeklyGrant(tier: SubscriptionTier): number {
    return this.getSubscriptionDetails(tier).biweekly_tokens;
  }

  /**
   * Purchase a subscription tier
   * - Updates user's subscription tier
   * - Resets free expert queries to tier's limit
   * - Integrates with Robokassa for payment processing
   * 
   * @param userId User ID
   * @param tier Target subscription tier
   * @param paymentData Payment data from Robokassa
   * @returns Updated subscription tier
   * @throws Error if purchase fails
   * 
   * Requirements: 9.1-9.12, 10.1-10.12
   */
  async purchaseSubscription(
    userId: string,
    tier: SubscriptionTier,
    paymentData?: {
      transactionId: string;
      amount: number;
      signature: string;
    }
  ): Promise<SubscriptionTier> {
    try {
      // Get subscription details
      const details = this.getSubscriptionDetails(tier);

      // Validate payment for paid tiers
      if (details.price > 0 && !paymentData) {
        throw this.createError(
          'PAYMENT_REQUIRED',
          'Payment data is required for paid subscriptions'
        );
      }

      // Verify payment amount matches tier price
      if (paymentData && paymentData.amount !== details.price) {
        throw this.createError(
          'INVALID_PAYMENT_AMOUNT',
          `Payment amount ${paymentData.amount} does not match tier price ${details.price}`
        );
      }

      // Get current user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw this.handleSupabaseError(profileError);
      }

      if (!profile) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Validate tier matches user role
      const userRole = profile.role;
      const tierRole = tier.startsWith('student_') ? 'student' : 'teacher';
      
      if (userRole !== tierRole && userRole !== 'administrator') {
        throw this.createError(
          'INVALID_TIER',
          `Cannot assign ${tierRole} tier to ${userRole} user`
        );
      }

      // Update user's subscription tier and reset free expert queries
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: tier,
          free_expert_queries_remaining: details.free_expert_queries,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      if (!updatedProfile) {
        throw this.createError('UPDATE_FAILED', 'Failed to update subscription');
      }

      // Record transaction if payment was made
      if (paymentData && details.price > 0) {
        await this.recordSubscriptionTransaction(
          userId,
          tier,
          details.price,
          paymentData.transactionId
        );
      }

      return updatedProfile.subscription_tier as SubscriptionTier;
    } catch (error) {
      if (this.isSubscriptionError(error)) {
        throw error;
      }
      throw this.createError(
        'PURCHASE_FAILED',
        `Failed to purchase subscription: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get user's current subscription details
   * 
   * @param userId User ID
   * @returns Current subscription details
   * @throws Error if user not found
   */
  async getUserSubscription(userId: string): Promise<SubscriptionDetails> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!profile) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      return this.getSubscriptionDetails(profile.subscription_tier);
    } catch (error) {
      if (this.isSubscriptionError(error)) {
        throw error;
      }
      throw this.createError(
        'FETCH_FAILED',
        `Failed to fetch subscription: ${(error as Error).message}`
      );
    }
  }

  /**
   * Check if a tier is an upgrade from current tier
   * 
   * @param currentTier Current subscription tier
   * @param targetTier Target subscription tier
   * @returns True if target tier is an upgrade
   */
  isUpgrade(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
    const currentDetails = this.getSubscriptionDetails(currentTier);
    const targetDetails = this.getSubscriptionDetails(targetTier);

    // Must be same role
    const currentRole = currentTier.startsWith('student_') ? 'student' : 'teacher';
    const targetRole = targetTier.startsWith('student_') ? 'student' : 'teacher';
    
    if (currentRole !== targetRole) {
      return false;
    }

    // Compare prices
    return targetDetails.price > currentDetails.price;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Record a subscription purchase transaction
   */
  private async recordSubscriptionTransaction(
    userId: string,
    tier: SubscriptionTier,
    amount: number,
    transactionId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: -amount, // Negative for purchase
        transaction_type: 'subscription_purchase',
        description: `Subscription purchase: ${tier} (${amount}₽) - Transaction ID: ${transactionId}`,
      });

    if (error) {
      console.error('Failed to record subscription transaction:', error);
      // Don't throw - subscription was already updated
    }
  }

  /**
   * Create a SubscriptionError
   */
  private createError(code: string, message: string): SubscriptionError {
    return { code, message };
  }

  /**
   * Check if error is a SubscriptionError
   */
  private isSubscriptionError(error: unknown): error is SubscriptionError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }

  /**
   * Handle Supabase errors and convert to SubscriptionError
   */
  private handleSupabaseError(error: { message: string; code?: string }): SubscriptionError {
    // Map common Supabase error codes
    if (error.message.includes('not found')) {
      return this.createError('NOT_FOUND', 'Resource not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('PERMISSION_DENIED', 'Access denied');
    }

    if (error.message.includes('unique constraint')) {
      return this.createError('DUPLICATE', 'Duplicate entry');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
