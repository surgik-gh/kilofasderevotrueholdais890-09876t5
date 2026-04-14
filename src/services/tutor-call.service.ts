/**
 * Tutor Call Service
 * Handles voice calls with AI tutor using LMNT API
 * 
 * Features:
 * - Real-time voice conversation with AI tutor
 * - Token-based billing (10 coins per minute)
 * - Call duration tracking
 * - Subscription tier discounts
 */

import { supabase } from '../lib/supabase';
import { tokenEconomyService } from './token-economy.service';
import type { SubscriptionTier } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface TutorCallSession {
  id: string;
  user_id: string;
  subject?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  coins_charged: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface CallError {
  code: string;
  message: string;
  currentBalance?: number;
  requiredAmount?: number;
}

export interface LMNTVoiceConfig {
  voice: string; // Voice ID from LMNT
  speed: number; // 0.5 - 2.0
  stability: number; // 0.0 - 1.0
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LMNT_API_KEY = import.meta.env.VITE_TTS_STT_API_KEY || '';
const LMNT_API_URL = 'https://api.lmnt.com/v1';

// Pricing
const COINS_PER_MINUTE = 10;
const MIN_CALL_DURATION_MINUTES = 5;
const MAX_CALL_DURATION_MINUTES = 60;
const MIN_CALL_COST = COINS_PER_MINUTE * MIN_CALL_DURATION_MINUTES; // 50 coins

// Subscription discounts
const SUBSCRIPTION_DISCOUNTS: Record<SubscriptionTier, number> = {
  student_freemium: 0,
  student_promium: 0.1, // 10% discount
  student_premium: 0.2, // 20% discount
  student_legend: 0.3, // 30% discount
  teacher_freemium: 0.1,
  teacher_promium: 0.15,
  teacher_premium: 0.25,
  teacher_maxi: 0.3,
};

// Available tutor voices
export const TUTOR_VOICES = {
  female_friendly: 'lily', // Friendly female voice
  male_professional: 'daniel', // Professional male voice
  female_energetic: 'emma', // Energetic female voice
  male_calm: 'alex', // Calm male voice
};

// ============================================================================
// TUTOR CALL SERVICE
// ============================================================================

export class TutorCallService {
  private activeSession: TutorCallSession | null = null;
  private sessionStartTime: number = 0;
  private billingInterval: NodeJS.Timeout | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;

  /**
   * Check if user can afford a call
   * @param userId User ID
   * @returns Object with canAfford flag and details
   */
  async canAffordCall(userId: string): Promise<{
    canAfford: boolean;
    currentBalance: number;
    minCost: number;
    discountedCost: number;
    discount: number;
  }> {
    try {
      // Get user balance
      const balance = await tokenEconomyService.getBalance(userId);

      // Get user subscription tier
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      const tier = profile?.subscription_tier || 'student_freemium';
      const discount = SUBSCRIPTION_DISCOUNTS[tier as SubscriptionTier] || 0;
      const discountedCost = Math.ceil(MIN_CALL_COST * (1 - discount));

      return {
        canAfford: balance >= discountedCost,
        currentBalance: balance,
        minCost: MIN_CALL_COST,
        discountedCost,
        discount: discount * 100, // Convert to percentage
      };
    } catch (error) {
      console.error('Failed to check call affordability:', error);
      throw this.createError('CHECK_FAILED', 'Failed to check balance');
    }
  }

  /**
   * Start a tutor call session
   * @param userId User ID
   * @param subject Optional subject for the call
   * @returns Call session
   */
  async startCall(userId: string, subject?: string): Promise<TutorCallSession> {
    // Check if there's already an active session
    if (this.activeSession) {
      throw this.createError('CALL_IN_PROGRESS', 'A call is already in progress');
    }

    // Check if user can afford the call
    const affordability = await this.canAffordCall(userId);
    if (!affordability.canAfford) {
      throw this.createError(
        'INSUFFICIENT_BALANCE',
        `Insufficient balance. Need ${affordability.discountedCost} coins, have ${affordability.currentBalance}`,
        affordability.currentBalance,
        affordability.discountedCost
      );
    }

    try {
      // Create call session in database
      const { data: session, error } = await supabase
        .from('tutor_call_sessions')
        .insert({
          user_id: userId,
          subject: subject || null,
          started_at: new Date().toISOString(),
          duration_seconds: 0,
          coins_charged: 0,
          status: 'active',
        })
        .select()
        .single();

      if (error || !session) {
        throw this.createError('SESSION_CREATE_FAILED', 'Failed to create call session');
      }

      this.activeSession = session as TutorCallSession;
      this.sessionStartTime = Date.now();

      // Start billing interval (charge every minute)
      this.startBillingInterval(userId);

      return this.activeSession;
    } catch (error) {
      if (this.isCallError(error)) {
        throw error;
      }
      throw this.createError('START_FAILED', `Failed to start call: ${(error as Error).message}`);
    }
  }

  /**
   * End the current call session
   * @param userId User ID
   * @returns Final call session with total charges
   */
  async endCall(userId: string): Promise<TutorCallSession> {
    if (!this.activeSession) {
      throw this.createError('NO_ACTIVE_CALL', 'No active call to end');
    }

    if (this.activeSession.user_id !== userId) {
      throw this.createError('UNAUTHORIZED', 'Cannot end another user\'s call');
    }

    try {
      // Stop billing interval
      if (this.billingInterval) {
        clearInterval(this.billingInterval);
        this.billingInterval = null;
      }

      // Calculate final duration and charges
      const durationSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      const durationMinutes = Math.ceil(durationSeconds / 60);
      
      // Get user subscription tier for discount
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      const tier = profile?.subscription_tier || 'student_freemium';
      const discount = SUBSCRIPTION_DISCOUNTS[tier as SubscriptionTier] || 0;
      
      // Calculate final charge (minimum 5 minutes)
      const chargeableMinutes = Math.max(durationMinutes, MIN_CALL_DURATION_MINUTES);
      const baseCharge = chargeableMinutes * COINS_PER_MINUTE;
      const finalCharge = Math.ceil(baseCharge * (1 - discount));

      // Deduct remaining balance if not already charged
      const alreadyCharged = this.activeSession.coins_charged;
      const remainingCharge = finalCharge - alreadyCharged;

      if (remainingCharge > 0) {
        await tokenEconomyService.deductTokens(
          userId,
          remainingCharge,
          'tutor_call_usage'
        );
      }

      // Update session in database
      const { data: updatedSession, error } = await supabase
        .from('tutor_call_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          coins_charged: finalCharge,
          status: 'completed',
        })
        .eq('id', this.activeSession.id)
        .select()
        .single();

      if (error || !updatedSession) {
        throw this.createError('SESSION_UPDATE_FAILED', 'Failed to update call session');
      }

      const finalSession = updatedSession as TutorCallSession;
      this.activeSession = null;
      this.sessionStartTime = 0;

      // Clean up audio resources
      this.cleanupAudioResources();

      return finalSession;
    } catch (error) {
      if (this.isCallError(error)) {
        throw error;
      }
      throw this.createError('END_FAILED', `Failed to end call: ${(error as Error).message}`);
    }
  }

  /**
   * Get current call status
   * @returns Current session or null
   */
  getCurrentCall(): TutorCallSession | null {
    if (!this.activeSession) {
      return null;
    }

    // Update duration in real-time
    const durationSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    return {
      ...this.activeSession,
      duration_seconds: durationSeconds,
    };
  }

  /**
   * Synthesize speech using LMNT API
   * @param text Text to synthesize
   * @param voiceConfig Voice configuration
   * @returns Audio blob
   */
  async synthesizeSpeech(
    text: string,
    voiceConfig: Partial<LMNTVoiceConfig> = {}
  ): Promise<Blob> {
    if (!LMNT_API_KEY) {
      throw this.createError('API_KEY_MISSING', 'LMNT API key not configured');
    }

    const config: LMNTVoiceConfig = {
      voice: voiceConfig.voice || TUTOR_VOICES.female_friendly,
      speed: voiceConfig.speed || 1.0,
      stability: voiceConfig.stability || 0.5,
    };

    try {
      const response = await fetch(`${LMNT_API_URL}/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': LMNT_API_KEY,
        },
        body: JSON.stringify({
          text,
          voice: config.voice,
          speed: config.speed,
          stability: config.stability,
          format: 'mp3',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw this.createError(
          'TTS_FAILED',
          error.message || `TTS request failed: ${response.status}`
        );
      }

      return await response.blob();
    } catch (error) {
      if (this.isCallError(error)) {
        throw error;
      }
      throw this.createError('TTS_FAILED', `Speech synthesis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Start recording user audio
   * @returns MediaStream
   */
  async startAudioRecording(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioContext = new AudioContext();
      this.mediaRecorder = new MediaRecorder(stream);

      return stream;
    } catch (error) {
      throw this.createError('RECORDING_FAILED', 'Failed to start audio recording');
    }
  }

  /**
   * Stop audio recording
   */
  stopAudioRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Get call history for user
   * @param userId User ID
   * @param limit Number of records to return
   * @returns Array of call sessions
   */
  async getCallHistory(userId: string, limit: number = 20): Promise<TutorCallSession[]> {
    try {
      const { data, error } = await supabase
        .from('tutor_call_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw this.createError('FETCH_FAILED', 'Failed to fetch call history');
      }

      return (data || []) as TutorCallSession[];
    } catch (error) {
      if (this.isCallError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch call history: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Start billing interval - charges user every minute
   */
  private startBillingInterval(userId: string): void {
    this.billingInterval = setInterval(async () => {
      if (!this.activeSession) {
        if (this.billingInterval) {
          clearInterval(this.billingInterval);
        }
        return;
      }

      try {
        // Get user subscription tier for discount
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier')
          .eq('id', userId)
          .single();

        const tier = profile?.subscription_tier || 'student_freemium';
        const discount = SUBSCRIPTION_DISCOUNTS[tier as SubscriptionTier] || 0;
        const chargeAmount = Math.ceil(COINS_PER_MINUTE * (1 - discount));

        // Check if user has enough balance
        const hasEnough = await tokenEconomyService.hasEnoughTokens(userId, chargeAmount);
        
        if (!hasEnough) {
          // Insufficient balance - end call
          console.warn('Insufficient balance during call, ending session');
          await this.endCall(userId);
          return;
        }

        // Deduct coins for this minute
        await tokenEconomyService.deductTokens(userId, chargeAmount, 'tutor_call_usage');

        // Update session charges
        this.activeSession!.coins_charged += chargeAmount;

        // Update database
        await supabase
          .from('tutor_call_sessions')
          .update({
            coins_charged: this.activeSession!.coins_charged,
            duration_seconds: Math.floor((Date.now() - this.sessionStartTime) / 1000),
          })
          .eq('id', this.activeSession!.id);

      } catch (error) {
        console.error('Billing interval error:', error);
        // End call on billing error
        await this.endCall(userId).catch(console.error);
      }
    }, 60000); // Every minute
  }

  /**
   * Clean up audio resources
   */
  private cleanupAudioResources(): void {
    if (this.mediaRecorder) {
      this.stopAudioRecording();
      this.mediaRecorder = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Create a CallError
   */
  private createError(
    code: string,
    message: string,
    currentBalance?: number,
    requiredAmount?: number
  ): CallError {
    return { code, message, currentBalance, requiredAmount };
  }

  /**
   * Check if error is a CallError
   */
  private isCallError(error: unknown): error is CallError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }
}

// Export singleton instance
export const tutorCallService = new TutorCallService();
