/**
 * Parent Monitoring and School Service
 * Handles parent-child links, child progress monitoring, and school membership management
 * 
 * Requirements:
 * - 5.1: Parent-child link creation and data access
 * - 5.2: Parent progress monitoring (lessons, quizzes, leaderboard)
 * - 5.3: Parent school joining and chat access
 * - 5.4: Parent-teacher communication within schools
 * - 6.1: Teacher school assignment
 * - 6.2: Parent school joining after teacher assignment
 * - 6.3: Student school requirement
 */

import { supabase } from '../lib/supabase';
import type { 
  UserProfile,
  Lesson,
  QuizAttempt,
  LeaderboardEntry,
  Chat
} from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface ParentChildLink {
  id: string;
  parent_id: string;
  child_id: string;
  created_at: string;
}

export interface SchoolMembership {
  id: string;
  school_id: string;
  user_id: string;
  role: 'teacher' | 'parent' | 'student';
  joined_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildProgress {
  child_id: string;
  child_name: string;
  completed_lessons: Lesson[];
  quiz_results: QuizAttempt[];
  leaderboard_position: LeaderboardEntry | null;
  current_rank: number | null;
}

export interface ParentSchoolError {
  code: string;
  message: string;
}

// ============================================================================
// PARENT MONITORING AND SCHOOL SERVICE
// ============================================================================

export class ParentSchoolService {
  // ============================================================================
  // PARENT-CHILD LINK MANAGEMENT
  // ============================================================================

  /**
   * Create a parent-child link
   * - Links a parent account to a child (student) account
   * - Grants parent access to child's progress data
   * - Prevents duplicate links
   * 
   * @param parentId Parent user ID
   * @param childId Child (student) user ID
   * @returns Created parent-child link
   * @throws Error if link creation fails or already exists
   * 
   * Requirements: 5.1
   */
  async createParentChildLink(parentId: string, childId: string): Promise<ParentChildLink> {
    // Validate required fields
    if (!parentId || !childId) {
      throw this.createError('MISSING_FIELDS', 'Parent ID and child ID are required');
    }

    // Prevent self-linking
    if (parentId === childId) {
      throw this.createError('INVALID_LINK', 'Cannot link a user to themselves');
    }

    try {
      // Verify parent has parent role
      const { data: parentProfile, error: parentError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', parentId)
        .single();

      if (parentError || !parentProfile) {
        throw this.createError('PARENT_NOT_FOUND', 'Parent user not found');
      }

      if (parentProfile.role !== 'parent') {
        throw this.createError('INVALID_ROLE', 'User must have parent role');
      }

      // Verify child has student role
      const { data: childProfile, error: childError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', childId)
        .single();

      if (childError || !childProfile) {
        throw this.createError('CHILD_NOT_FOUND', 'Child user not found');
      }

      if (childProfile.role !== 'student') {
        throw this.createError('INVALID_ROLE', 'Child must have student role');
      }

      // Create parent-child link
      const { data, error } = await supabase
        .from('parent_child_links')
        .insert({
          parent_id: parentId,
          child_id: childId,
        })
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('LINK_CREATION_FAILED', 'Failed to create parent-child link');
      }

      return data as ParentChildLink;
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('LINK_CREATION_FAILED', `Failed to create link: ${(error as Error).message}`);
    }
  }

  /**
   * Get parent-child links for a parent
   * - Returns all children linked to the parent
   * 
   * @param parentId Parent user ID
   * @returns Array of parent-child links
   * 
   * Requirements: 5.1
   */
  async getParentChildLinks(parentId: string): Promise<ParentChildLink[]> {
    try {
      const { data, error } = await supabase
        .from('parent_child_links')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as ParentChildLink[];
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch links: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a parent-child link
   * - Removes the link between parent and child
   * - Revokes parent's access to child's data
   * 
   * @param linkId Link ID
   * @param parentId Parent user ID (for authorization)
   * @throws Error if unauthorized or deletion fails
   */
  async deleteParentChildLink(linkId: string, parentId: string): Promise<void> {
    try {
      // Verify link belongs to parent
      const { data: link, error: linkError } = await supabase
        .from('parent_child_links')
        .select('*')
        .eq('id', linkId)
        .eq('parent_id', parentId)
        .single();

      if (linkError || !link) {
        throw this.createError('LINK_NOT_FOUND', 'Parent-child link not found');
      }

      // Delete link
      const { error } = await supabase
        .from('parent_child_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        throw this.handleSupabaseError(error);
      }
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('DELETE_FAILED', `Failed to delete link: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // CHILD PROGRESS MONITORING
  // ============================================================================

  /**
   * Get child progress for a parent
   * - Returns completed lessons, quiz results, and leaderboard position
   * - Verifies parent-child link exists
   * 
   * @param parentId Parent user ID
   * @param childId Child (student) user ID
   * @returns Child progress data
   * @throws Error if link doesn't exist or fetch fails
   * 
   * Requirements: 5.1, 5.2
   */
  async getChildProgress(parentId: string, childId: string): Promise<ChildProgress> {
    try {
      // Verify parent-child link exists
      const { data: link, error: linkError } = await supabase
        .from('parent_child_links')
        .select('*')
        .eq('parent_id', parentId)
        .eq('child_id', childId)
        .single();

      if (linkError || !link) {
        throw this.createError('LINK_NOT_FOUND', 'Parent-child link not found');
      }

      // Get child profile
      const { data: childProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', childId)
        .single();

      if (profileError || !childProfile) {
        throw this.createError('CHILD_NOT_FOUND', 'Child profile not found');
      }

      // Get completed lessons (lessons with quiz attempts)
      const { data: quizAttempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes!inner(
            lesson_id,
            lessons!inner(*)
          )
        `)
        .eq('student_id', childId)
        .order('completed_at', { ascending: false });

      if (attemptsError) {
        throw this.handleSupabaseError(attemptsError);
      }

      // Extract unique completed lessons
      const completedLessonsMap = new Map<string, Lesson>();
      const allQuizResults: QuizAttempt[] = [];

      if (quizAttempts) {
        for (const attempt of quizAttempts) {
          allQuizResults.push(attempt as QuizAttempt);
          
          // Extract lesson from nested structure
          const quiz = (attempt as any).quizzes;
          if (quiz && quiz.lessons) {
            const lesson = quiz.lessons;
            if (!completedLessonsMap.has(lesson.id)) {
              completedLessonsMap.set(lesson.id, lesson as Lesson);
            }
          }
        }
      }

      const completedLessons = Array.from(completedLessonsMap.values());

      // Get current leaderboard position
      const today = new Date().toISOString().split('T')[0];
      const { data: leaderboardEntry, error: leaderboardError } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('student_id', childId)
        .eq('date', today)
        .single();

      // Get current rank (count students with higher scores)
      let currentRank: number | null = null;
      if (leaderboardEntry && !leaderboardError) {
        const { count, error: rankError } = await supabase
          .from('leaderboard_entries')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .gt('score', leaderboardEntry.score);

        if (!rankError && count !== null) {
          currentRank = count + 1;
        }
      }

      return {
        child_id: childId,
        child_name: childProfile.full_name,
        completed_lessons: completedLessons,
        quiz_results: allQuizResults,
        leaderboard_position: leaderboardEntry as LeaderboardEntry | null,
        current_rank: currentRank,
      };
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('PROGRESS_FETCH_FAILED', `Failed to fetch child progress: ${(error as Error).message}`);
    }
  }

  /**
   * Get progress for all children of a parent
   * - Returns progress data for each linked child
   * 
   * @param parentId Parent user ID
   * @returns Array of child progress data
   * 
   * Requirements: 5.1, 5.2
   */
  async getAllChildrenProgress(parentId: string): Promise<ChildProgress[]> {
    try {
      // Get all parent-child links
      const links = await this.getParentChildLinks(parentId);

      // Fetch progress for each child
      const progressPromises = links.map(link => 
        this.getChildProgress(parentId, link.child_id)
      );

      const progressData = await Promise.all(progressPromises);
      return progressData;
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('PROGRESS_FETCH_FAILED', `Failed to fetch children progress: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // SCHOOL MEMBERSHIP MANAGEMENT
  // ============================================================================

  /**
   * Create a school membership
   * - Assigns a user to a school with a specific role
   * - Teachers and administrators can create memberships
   * - Validates role and school existence
   * 
   * @param schoolId School ID
   * @param userId User ID
   * @param role User role in the school
   * @returns Created school membership
   * @throws Error if creation fails
   * 
   * Requirements: 6.1, 6.2
   */
  async createSchoolMembership(
    schoolId: string,
    userId: string,
    role: 'teacher' | 'parent' | 'student'
  ): Promise<SchoolMembership> {
    // Validate required fields
    if (!schoolId || !userId || !role) {
      throw this.createError('MISSING_FIELDS', 'School ID, user ID, and role are required');
    }

    // Validate role
    if (!['teacher', 'parent', 'student'].includes(role)) {
      throw this.createError('INVALID_ROLE', 'Invalid role specified');
    }

    try {
      // Verify school exists
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolError || !school) {
        throw this.createError('SCHOOL_NOT_FOUND', 'School not found');
      }

      // Verify user exists
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Create school membership
      const { data, error } = await supabase
        .from('school_memberships')
        .insert({
          school_id: schoolId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('MEMBERSHIP_CREATION_FAILED', 'Failed to create school membership');
      }

      return data as SchoolMembership;
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('MEMBERSHIP_CREATION_FAILED', `Failed to create membership: ${(error as Error).message}`);
    }
  }

  /**
   * Get school memberships for a user
   * - Returns all schools the user is a member of
   * 
   * @param userId User ID
   * @returns Array of school memberships
   */
  async getUserSchoolMemberships(userId: string): Promise<SchoolMembership[]> {
    try {
      const { data, error } = await supabase
        .from('school_memberships')
        .select('*')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as SchoolMembership[];
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch memberships: ${(error as Error).message}`);
    }
  }

  /**
   * Get school members
   * - Returns all users who are members of a school
   * - Optionally filter by role
   * 
   * @param schoolId School ID
   * @param role Optional role filter
   * @returns Array of user profiles
   */
  async getSchoolMembers(
    schoolId: string,
    role?: 'teacher' | 'parent' | 'student'
  ): Promise<UserProfile[]> {
    try {
      let query = supabase
        .from('school_memberships')
        .select(`
          user_id,
          user_profiles!inner(*)
        `)
        .eq('school_id', schoolId);

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;

      if (error) {
        throw this.handleSupabaseError(error);
      }

      // Extract user profiles from nested structure
      const members = (data || []).map((item: any) => item.user_profiles);
      return members as UserProfile[];
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch school members: ${(error as Error).message}`);
    }
  }

  /**
   * Get school chats for a parent
   * - Returns parent chats and teacher chats for schools the parent is a member of
   * - Verifies parent has school membership
   * 
   * @param parentId Parent user ID
   * @param schoolId School ID
   * @returns Array of chats
   * @throws Error if parent is not a member of the school
   * 
   * Requirements: 5.3, 5.4
   */
  async getSchoolChatsForParent(parentId: string, schoolId: string): Promise<Chat[]> {
    try {
      // Verify parent is a member of the school
      const { data: membership, error: membershipError } = await supabase
        .from('school_memberships')
        .select('*')
        .eq('user_id', parentId)
        .eq('school_id', schoolId)
        .eq('role', 'parent')
        .single();

      if (membershipError || !membership) {
        throw this.createError('NOT_MEMBER', 'Parent is not a member of this school');
      }

      // Get parent and teacher chats for the school
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('school_id', schoolId)
        .in('type', ['school_parent', 'school_teacher'])
        .order('created_at', { ascending: false });

      if (chatsError) {
        throw this.handleSupabaseError(chatsError);
      }

      return (chats || []) as Chat[];
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch school chats: ${(error as Error).message}`);
    }
  }

  /**
   * Get school by ID
   * - Returns school information
   * 
   * @param schoolId School ID
   * @returns School data
   * @throws Error if school not found
   */
  async getSchool(schoolId: string): Promise<School> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('SCHOOL_NOT_FOUND', 'School not found');
      }

      return data as School;
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch school: ${(error as Error).message}`);
    }
  }

  /**
   * Get all schools
   * - Returns all schools in the system
   * 
   * @returns Array of schools
   */
  async getAllSchools(): Promise<School[]> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as School[];
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch schools: ${(error as Error).message}`);
    }
  }

  /**
   * Remove school membership
   * - Removes a user from a school
   * - Only the user themselves or administrators can remove memberships
   * 
   * @param membershipId Membership ID
   * @param userId User ID (for authorization)
   * @throws Error if unauthorized or deletion fails
   */
  async removeSchoolMembership(membershipId: string, userId: string): Promise<void> {
    try {
      // Verify membership belongs to user
      const { data: membership, error: membershipError } = await supabase
        .from('school_memberships')
        .select('*')
        .eq('id', membershipId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        throw this.createError('MEMBERSHIP_NOT_FOUND', 'School membership not found');
      }

      // Delete membership
      const { error } = await supabase
        .from('school_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) {
        throw this.handleSupabaseError(error);
      }
    } catch (error) {
      if (this.isParentSchoolError(error)) {
        throw error;
      }
      throw this.createError('DELETE_FAILED', `Failed to remove membership: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create a ParentSchoolError
   */
  private createError(code: string, message: string): ParentSchoolError {
    return { code, message };
  }

  /**
   * Check if error is a ParentSchoolError
   */
  private isParentSchoolError(error: unknown): error is ParentSchoolError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to ParentSchoolError
   */
  private handleSupabaseError(error: { message: string; code?: string }): ParentSchoolError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Resource not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to perform this action');
    }

    if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
      return this.createError('DUPLICATE', 'Link or membership already exists');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const parentSchoolService = new ParentSchoolService();
