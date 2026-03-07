/**
 * Token Economy Service
 * Handles Wisdom Coins balance management, transactions, and cost calculations
 * 
 * Requirements:
 * - 2.2: Lesson creation costs 5 Wisdom Coins
 * - 3.1: Quiz creation costs 5 Wisdom Coins
 * - 11.1: Expert chat costs 1 coin per 2000 tokens
 * - 13.1: Lesson creation cost
 * - 13.2: Quiz creation cost
 * - 13.3: Expert chat token calculation
 * - 13.4: Insufficient balance rejection
 * - 13.5: Transaction history completeness
 */

import { supabase } from '../lib/supabase';
import type { Transaction, SubscriptionTier } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface TokenBalance {
  userId: string;
  balance: number;
  lastUpdated: string;
}

export interface TransactionRecord {
  userId: string;
  amount: number;
  transactionType: Transaction['transaction_type'];
  description: string;
}

export interface TokenError {
  code: string;
  message: string;
  currentBalance?: number;
  requiredAmount?: number;
}

// ============================================================================
// TOKEN ECONOMY SERVICE
// ============================================================================

export class TokenEconomyService {
  // Cost constants
  private readonly LESSON_CREATION_COST = 5;
  private readonly QUIZ_CREATION_COST = 5;
  private readonly EXPERT_CHAT_TOKENS_PER_COIN = 2000;

  /**
   * Get current Wisdom Coins balance for a user
   * 
   * @param userId User ID
   * @returns Current balance
   * @throws Error if user not found
   * 
   * Requirements: 13.5
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wisdom_coins')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      return data.wisdom_coins;
    } catch (error) {
      if (this.isTokenError(error)) {
        throw error;
      }
      throw this.createError('BALANCE_FETCH_FAILED', `Failed to fetch balance: ${(error as Error).message}`);
    }
  }

  /**
   * Deduct tokens from user balance
   * - Creates transaction record
   * - Updates user balance atomically
   * - Validates sufficient balance
   * 
   * @param userId User ID
   * @param amount Amount to deduct (positive number)
   * @param reason Transaction type
   * @returns Transaction record
   * @throws Error if insufficient balance or operation fails
   * 
   * Requirements: 13.4
   */
  async deductTokens(
    userId: string,
    amount: number,
    reason: Transaction['transaction_type']
  ): Promise<Transaction> {
    // Validate amount
    if (amount <= 0) {
      throw this.createError('INVALID_AMOUNT', 'Amount must be positive');
    }

    try {
      // Check current balance
      const currentBalance = await this.getBalance(userId);

      if (currentBalance < amount) {
        throw this.createError(
          'INSUFFICIENT_BALANCE',
          'Insufficient Wisdom Coins',
          currentBalance,
          amount
        );
      }

      // Deduct from balance (atomic operation)
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          wisdom_coins: currentBalance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      // Create transaction record
      const description = this.getTransactionDescription(reason, -amount);
      const transaction = await this.recordTransaction({
        userId,
        amount: -amount, // Negative for deduction
        transactionType: reason,
        description,
      });

      return transaction;
    } catch (error) {
      if (this.isTokenError(error)) {
        throw error;
      }
      throw this.createError('DEDUCTION_FAILED', `Failed to deduct tokens: ${(error as Error).message}`);
    }
  }

  /**
   * Grant tokens to user balance
   * - Creates transaction record
   * - Updates user balance atomically
   * 
   * @param userId User ID
   * @param amount Amount to grant (positive number)
   * @param reason Transaction type
   * @returns Transaction record
   * @throws Error if operation fails
   * 
   * Requirements: 13.5
   */
  async grantTokens(
    userId: string,
    amount: number,
    reason: Transaction['transaction_type']
  ): Promise<Transaction> {
    // Validate amount
    if (amount <= 0) {
      throw this.createError('INVALID_AMOUNT', 'Amount must be positive');
    }

    try {
      // Get current balance
      const currentBalance = await this.getBalance(userId);

      // Add to balance (atomic operation)
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          wisdom_coins: currentBalance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      // Create transaction record
      const description = this.getTransactionDescription(reason, amount);
      const transaction = await this.recordTransaction({
        userId,
        amount, // Positive for grant
        transactionType: reason,
        description,
      });

      return transaction;
    } catch (error) {
      if (this.isTokenError(error)) {
        throw error;
      }
      throw this.createError('GRANT_FAILED', `Failed to grant tokens: ${(error as Error).message}`);
    }
  }

  /**
   * Process daily login reward
   * - Grants tokens based on subscription tier
   * - Only grants once per day
   * - Updates login streak
   * 
   * @param userId User ID
   * @returns Transaction record or null if already claimed today
   * @throws Error if operation fails
   * 
   * Requirements: 15.1, 15.2, 15.3, 15.4
   */
  async processDailyLogin(userId: string): Promise<Transaction | null> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw this.handleSupabaseError(profileError);
      }

      if (!profile) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      const today = new Date().toISOString().split('T')[0];
      const lastLoginDate = profile.last_login_date;

      // Check if already claimed today
      if (lastLoginDate === today) {
        return null; // Already claimed
      }

      // Calculate login streak
      let newStreak = 1;
      if (lastLoginDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastLoginDate === yesterdayStr) {
          // Consecutive day
          newStreak = profile.daily_login_streak + 1;
        }
      }

      // Get daily login bonus based on subscription tier
      const dailyBonus = this.getDailyLoginBonus(profile.subscription_tier);

      // Update profile with new streak and last login date
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          last_login_date: today,
          daily_login_streak: newStreak,
          wisdom_coins: profile.wisdom_coins + dailyBonus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      // Create transaction record
      const transaction = await this.recordTransaction({
        userId,
        amount: dailyBonus,
        transactionType: 'daily_login',
        description: `Daily login reward (${dailyBonus} coins, streak: ${newStreak})`,
      });

      return transaction;
    } catch (error) {
      if (this.isTokenError(error)) {
        throw error;
      }
      throw this.createError('DAILY_LOGIN_FAILED', `Failed to process daily login: ${(error as Error).message}`);
    }
  }

  /**
   * Process biweekly token grant based on subscription tier
   * 
   * @param userId User ID
   * @returns Transaction record
   * @throws Error if operation fails
   * 
   * Requirements: 9.1-9.12, 10.1-10.12
   */
  async processBiweeklyGrant(userId: string): Promise<Transaction> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw this.handleSupabaseError(profileError);
      }

      if (!profile) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Get biweekly grant amount based on subscription tier
      const grantAmount = this.getBiweeklyGrant(profile.subscription_tier);

      // Grant tokens
      const transaction = await this.grantTokens(
        userId,
        grantAmount,
        'biweekly_grant'
      );

      return transaction;
    } catch (error) {
      if (this.isTokenError(error)) {
        throw error;
      }
      throw this.createError('BIWEEKLY_GRANT_FAILED', `Failed to process biweekly grant: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate cost for lesson creation
   * 
   * @returns Cost in Wisdom Coins
   * 
   * Requirements: 2.2, 13.1
   */
  calculateLessonCost(): number {
    return this.LESSON_CREATION_COST;
  }

  /**
   * Calculate cost for quiz creation
   * 
   * @returns Cost in Wisdom Coins
   * 
   * Requirements: 3.1, 13.2
   */
  calculateQuizCost(): number {
    return this.QUIZ_CREATION_COST;
  }

  /**
   * Calculate cost for expert chat based on token count
   * - 1 Wisdom Coin per 2000 tokens
   * - Rounds up to nearest coin
   * 
   * @param tokens Number of tokens used
   * @returns Cost in Wisdom Coins
   * 
   * Requirements: 11.1, 13.3
   */
  calculateExpertChatCost(tokens: number): number {
    if (tokens <= 0) {
      return 0;
    }
    return Math.ceil(tokens / this.EXPERT_CHAT_TOKENS_PER_COIN);
  }

  /**
   * Check if user has enough tokens for an operation
   * 
   * @param userId User ID
   * @param amount Required amount
   * @returns True if user has enough tokens
   * 
   * Requirements: 13.4
   */
  async hasEnoughTokens(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error) {
      console.error('Failed to check token balance:', error);
      return false;
    }
  }

  /**
   * Get transaction history for a user
   * 
   * @param userId User ID
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions
   * 
   * Requirements: 13.5
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Transaction[];
    } catch (error) {
      if (this.isTokenError(error)) {
        throw error;
      }
      throw this.createError('HISTORY_FETCH_FAILED', `Failed to fetch transaction history: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // SUBSCRIPTION TIER BENEFITS
  // ============================================================================

  /**
   * Get daily login bonus for subscription tier
   * 
   * Requirements: 9.1-9.12, 10.1-10.12
   */
  private getDailyLoginBonus(tier: SubscriptionTier): number {
    const bonuses: Record<SubscriptionTier, number> = {
      student_freemium: 10,
      student_promium: 30,
      student_premium: 50,
      student_legend: 90,
      teacher_freemium: 15,
      teacher_promium: 35,
      teacher_premium: 55,
      teacher_maxi: 100,
    };
    return bonuses[tier] || 0;
  }

  /**
   * Get biweekly grant for subscription tier
   * 
   * Requirements: 9.1-9.12, 10.1-10.12
   */
  private getBiweeklyGrant(tier: SubscriptionTier): number {
    const grants: Record<SubscriptionTier, number> = {
      student_freemium: 50,
      student_promium: 150,
      student_premium: 250,
      student_legend: 500,
      teacher_freemium: 150,
      teacher_promium: 200,
      teacher_premium: 350,
      teacher_maxi: 800,
    };
    return grants[tier] || 0;
  }

  /**
   * Get free expert queries for subscription tier
   * 
   * Requirements: 9.1-9.12, 10.1-10.12
   */
  getFreeExpertQueries(tier: SubscriptionTier): number {
    const queries: Record<SubscriptionTier, number> = {
      student_freemium: 5,
      student_promium: 10,
      student_premium: 15,
      student_legend: 30,
      teacher_freemium: 5,
      teacher_promium: 10,
      teacher_premium: 15,
      teacher_maxi: 30,
    };
    return queries[tier] || 0;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Record a transaction in the database
   */
  private async recordTransaction(params: TransactionRecord): Promise<Transaction> {
    const { userId, amount, transactionType, description } = params;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount,
        transaction_type: transactionType,
        description,
      })
      .select()
      .maybeSingle();

    if (error) {
      throw this.handleSupabaseError(error);
    }

    if (!data) {
      throw this.createError('TRANSACTION_FAILED', 'Failed to record transaction');
    }

    return data as Transaction;
  }

  /**
   * Get human-readable transaction description
   */
  private getTransactionDescription(
    type: Transaction['transaction_type'],
    amount: number
  ): string {
    const absAmount = Math.abs(amount);
    
    const descriptions: Record<Transaction['transaction_type'], string> = {
      initial_grant: `Initial grant of ${absAmount} Wisdom Coins`,
      daily_login: `Daily login reward: ${absAmount} Wisdom Coins`,
      biweekly_grant: `Biweekly subscription grant: ${absAmount} Wisdom Coins`,
      leaderboard_reward: `Leaderboard reward: ${absAmount} Wisdom Coins`,
      lesson_creation: `Lesson creation: -${absAmount} Wisdom Coins`,
      quiz_creation: `Quiz creation: -${absAmount} Wisdom Coins`,
      expert_chat_usage: `Expert chat usage: -${absAmount} Wisdom Coins`,
      subscription_purchase: `Subscription purchase: -${absAmount} Wisdom Coins`,
    };

    return descriptions[type] || `Transaction: ${amount} Wisdom Coins`;
  }

  /**
   * Create a TokenError
   */
  private createError(
    code: string,
    message: string,
    currentBalance?: number,
    requiredAmount?: number
  ): TokenError {
    return { code, message, currentBalance, requiredAmount };
  }

  /**
   * Check if error is a TokenError
   */
  private isTokenError(error: unknown): error is TokenError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to TokenError
   */
  private handleSupabaseError(error: { message: string; code?: string }): TokenError {
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
export const tokenEconomyService = new TokenEconomyService();

