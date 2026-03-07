/**
 * Authentication Service
 * Handles user registration, login, and session management
 * 
 * Requirements:
 * - 1.1: Student registration with 50 coin grant and school assignment
 * - 1.2: Teacher/parent/administrator registration
 * - 1.3: Teacher registration with 150 coin grant
 * - 1.4: Login with valid credentials
 * - 1.5: School assignment immutability for students
 */

import { supabase } from '../lib/supabase';
import { gamificationOrchestratorService } from './gamification/gamification-orchestrator.service';
import type { UserProfile, SubscriptionTier } from '../lib/supabase';
import { handleSupabaseError, logCriticalError } from '../utils/supabase-error-handler';

// ============================================================================
// TYPES
// ============================================================================

export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
}

export interface StudentRegistrationData extends RegistrationData {
  schoolId: string;
  grade?: string;
  gradeLetter?: string;
}

export interface OtherRoleRegistrationData extends RegistrationData {
  role: 'teacher' | 'parent' | 'administrator';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
}

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export class AuthService {
  /**
   * Register a new student account
   * - Grants 50 Wisdom Coins initially
   * - Assigns student to selected school
   * - Creates school membership
   * - Records initial transaction
   * 
   * @param data Student registration data
   * @returns Created user profile
   * @throws Error if registration fails
   * 
   * Requirements: 1.1
   */
  async registerStudent(data: StudentRegistrationData): Promise<UserProfile> {
    const { email, password, fullName, schoolId, grade, gradeLetter } = data;

    // Validate required fields
    if (!email || !password || !fullName || !schoolId) {
      throw this.createError('MISSING_FIELDS', 'All fields are required for student registration');
    }

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw this.createError('INVALID_EMAIL', 'Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw this.createError('WEAK_PASSWORD', 'Password must be at least 8 characters');
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'student',
            school_id: schoolId,
            grade,
            grade_letter: gradeLetter,
          }
        }
      });

      if (authError) {
        throw this.handleSupabaseError(authError);
      }

      if (!authData.user) {
        throw this.createError('REGISTRATION_FAILED', 'Failed to create user account');
      }

      // Create user profile with initial 50 coins
      const profile = await this.createUserProfile({
        id: authData.user.id,
        email,
        fullName,
        role: 'student',
        schoolId,
        initialCoins: 50,
        subscriptionTier: 'student_freemium',
        grade,
        gradeLetter,
      });

      // Create school membership
      await this.createSchoolMembership(authData.user.id, schoolId, 'student');

      // Record initial transaction
      await this.recordTransaction({
        userId: authData.user.id,
        amount: 50,
        transactionType: 'initial_grant',
        description: 'Initial 50 Wisdom Coins grant for student',
      });

      return profile;
    } catch (error) {
      // Re-throw if already an AuthError
      if (this.isAuthError(error)) {
        throw error;
      }
      // Wrap other errors
      throw this.createError('REGISTRATION_FAILED', `Registration failed: ${(error as Error).message}`);
    }
  }

  /**
   * Register a new teacher, parent, or administrator account
   * - Teachers receive 150 Wisdom Coins initially
   * - Parents and administrators receive 0 coins
   * - Records initial transaction for teachers
   * 
   * @param data Registration data with role
   * @returns Created user profile
   * @throws Error if registration fails
   * 
   * Requirements: 1.2, 1.3
   */
  async registerOtherRole(data: OtherRoleRegistrationData): Promise<UserProfile> {
    const { email, password, fullName, role } = data;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      throw this.createError('MISSING_FIELDS', 'All fields are required for registration');
    }

    // Validate role
    if (!['teacher', 'parent', 'administrator'].includes(role)) {
      throw this.createError('INVALID_ROLE', 'Invalid role specified');
    }

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw this.createError('INVALID_EMAIL', 'Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw this.createError('WEAK_PASSWORD', 'Password must be at least 8 characters');
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          }
        }
      });

      if (authError) {
        throw this.handleSupabaseError(authError);
      }

      if (!authData.user) {
        throw this.createError('REGISTRATION_FAILED', 'Failed to create user account');
      }

      // Determine initial coins based on role
      const initialCoins = role === 'teacher' ? 150 : 0;

      // Determine subscription tier
      const subscriptionTier: SubscriptionTier = 
        role === 'teacher' ? 'teacher_freemium' : 'student_freemium';

      // Create user profile
      const profile = await this.createUserProfile({
        id: authData.user.id,
        email,
        fullName,
        role,
        schoolId: null,
        initialCoins,
        subscriptionTier,
      });

      // Record initial transaction for teachers
      if (role === 'teacher' && initialCoins > 0) {
        await this.recordTransaction({
          userId: authData.user.id,
          amount: initialCoins,
          transactionType: 'initial_grant',
          description: `Initial ${initialCoins} Wisdom Coins grant for teacher`,
        });
      }

      return profile;
    } catch (error) {
      // Re-throw if already an AuthError
      if (this.isAuthError(error)) {
        throw error;
      }
      // Wrap other errors
      throw this.createError('REGISTRATION_FAILED', `Registration failed: ${(error as Error).message}`);
    }
  }

  /**
   * Login with email and password
   * - Authenticates user credentials
   * - Updates last login date
   * - Returns user profile
   * 
   * @param credentials Login credentials
   * @returns User profile
   * @throws Error if login fails
   * 
   * Requirements: 1.4
   */
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    const { email, password } = credentials;

    // Validate required fields
    if (!email || !password) {
      throw this.createError('MISSING_FIELDS', 'Email and password are required');
    }

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw this.handleSupabaseError(authError);
      }

      if (!authData.user) {
        throw this.createError('LOGIN_FAILED', 'Invalid credentials');
      }

      // Update last login date
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_profiles')
        .update({ last_login_date: today })
        .eq('id', authData.user.id);

      // Fetch and return user profile
      const profile = await this.getUserProfile(authData.user.id);
      
      if (!profile) {
        throw this.createError('PROFILE_NOT_FOUND', 'User profile not found');
      }

      // Trigger gamification events
      try {
        const gamificationResult = await gamificationOrchestratorService.onLogin(authData.user.id);
        console.log('Gamification events triggered successfully');
        
        // Add notifications to store
        if (gamificationResult.notifications && gamificationResult.notifications.length > 0) {
          const { useStore } = await import('@/store');
          const addNotification = useStore.getState().addNotification;
          
          for (const notification of gamificationResult.notifications) {
            addNotification(notification);
          }
        }
      } catch (gamificationError) {
        console.warn('Failed to trigger gamification events:', gamificationError);
        // Don't fail the login if gamification fails
      }

      return profile;
    } catch (error) {
      // Re-throw if already an AuthError
      if (this.isAuthError(error)) {
        throw error;
      }
      // Wrap other errors
      throw this.createError('LOGIN_FAILED', `Login failed: ${(error as Error).message}`);
    }
  }

  /**
   * Logout current user
   * - Clears session
   * 
   * @throws Error if logout fails
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw this.handleSupabaseError(error);
      }
    } catch (error) {
      throw this.createError('LOGOUT_FAILED', `Logout failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get current authenticated user profile
   * 
   * @returns User profile or null if not authenticated
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      return await this.getUserProfile(user.id);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   * - Students cannot change their school_id (enforced by RLS)
   * 
   * @param userId User ID
   * @param updates Profile updates
   * @returns Updated profile
   * @throws Error if update fails
   * 
   * Requirements: 1.5
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Remove fields that shouldn't be updated directly
      const { id, email, created_at, ...allowedUpdates } = updates;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(allowedUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('UPDATE_FAILED', 'Failed to update profile');
      }

      return data as UserProfile;
    } catch (error) {
      if (this.isAuthError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Profile update failed: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create user profile in database
   */
  private async createUserProfile(params: {
    id: string;
    email: string;
    fullName: string;
    role: 'student' | 'teacher' | 'parent' | 'administrator';
    schoolId: string | null;
    initialCoins: number;
    subscriptionTier: SubscriptionTier;
    grade?: string;
    gradeLetter?: string;
  }): Promise<UserProfile> {
    const { id, email, fullName, role, schoolId, initialCoins, subscriptionTier, grade, gradeLetter } = params;

    const profileData: any = {
      id,
      email,
      full_name: fullName,
      role,
      school_id: schoolId,
      wisdom_coins: initialCoins,
      subscription_tier: subscriptionTier,
      free_expert_queries_remaining: 5,
      daily_login_streak: 0,
      last_login_date: new Date().toISOString().split('T')[0],
    };

    // Add grade fields if provided
    if (grade) {
      profileData.grade = grade;
    }
    if (gradeLetter) {
      profileData.grade_letter = gradeLetter;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw this.handleSupabaseError(error);
    }

    if (!data) {
      throw this.createError('PROFILE_CREATION_FAILED', 'Failed to create user profile');
    }

    return data as UserProfile;
  }

  /**
   * Create school membership
   */
  private async createSchoolMembership(
    userId: string,
    schoolId: string,
    role: 'student' | 'teacher' | 'parent'
  ): Promise<void> {
    const { error } = await supabase
      .from('school_memberships')
      .insert({
        school_id: schoolId,
        user_id: userId,
        role,
      });

    if (error) {
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * Record a transaction
   */
  private async recordTransaction(params: {
    userId: string;
    amount: number;
    transactionType: string;
    description: string;
  }): Promise<void> {
    const { userId, amount, transactionType, description } = params;

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount,
        transaction_type: transactionType,
        description,
      });

    if (error) {
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * Get user profile by ID
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }

    return data as UserProfile | null;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create an AuthError
   */
  private createError(code: string, message: string): AuthError {
    return { code, message };
  }

  /**
   * Check if error is an AuthError
   */
  private isAuthError(error: unknown): error is AuthError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to AuthError
   */
  private handleSupabaseError(error: { message: string; code?: string }): AuthError {
    // Use centralized error handler
    const userError = handleSupabaseError(error);
    
    // Log critical errors
    if (!userError.retryable) {
      logCriticalError('auth_operation', error);
    }
    
    return this.createError(userError.code, userError.message);
  }
}

// Export singleton instance
export const authService = new AuthService();
