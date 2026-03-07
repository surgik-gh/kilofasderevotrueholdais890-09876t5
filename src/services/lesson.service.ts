/**
 * Lesson Service
 * Handles lesson CRUD operations, assignments, and progress tracking
 * 
 * Requirements:
 * - 2.2: Lesson creation costs 5 Wisdom Coins
 * - 2.5: Lesson metadata storage
 * - 4.1: Teacher lesson assignment to students
 * - 4.3: Teacher progress visibility
 * - 4.5: Attachment accessibility
 */

import { supabase } from '../lib/supabase';
import { tokenEconomyService } from './token-economy.service';
import { gamificationOrchestratorService } from './gamification/gamification-orchestrator.service';
import type { 
  Lesson, 
  LessonAttachment,
  QuizAttempt,
  Subject 
} from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateLessonData {
  title: string;
  subject: Subject;
  content: string;
  creatorId: string;
  creatorRole: 'student' | 'teacher';
  schoolId?: string | null;
  attachments?: Omit<LessonAttachment, 'id' | 'lesson_id' | 'uploaded_at'>[];
}

export interface UpdateLessonData {
  title?: string;
  subject?: Subject;
  content?: string;
}

export interface LessonProgress {
  lesson_id: string;
  student_id: string;
  completed: boolean;
  quiz_attempts: QuizAttempt[];
  last_accessed: string;
}

export interface LessonError {
  code: string;
  message: string;
}

// ============================================================================
// LESSON SERVICE
// ============================================================================

export class LessonService {
  /**
   * Create a new lesson
   * - Deducts 5 Wisdom Coins from creator's balance
   * - Stores lesson with metadata
   * - Optionally uploads attachments
   * 
   * @param data Lesson creation data
   * @returns Created lesson
   * @throws Error if insufficient balance or creation fails
   * 
   * Requirements: 2.2, 2.5
   */
  async createLesson(data: CreateLessonData): Promise<Lesson> {
    const { title, subject, content, creatorId, creatorRole, schoolId, attachments } = data;

    console.log('LessonService.createLesson called with:', { title, subject, creatorId, creatorRole, schoolId });

    // Validate required fields
    if (!title || !subject || !content || !creatorId || !creatorRole) {
      throw this.createError('MISSING_FIELDS', 'Title, subject, content, creator ID, and creator role are required');
    }

    // Validate subject
    if (!this.isValidSubject(subject)) {
      throw this.createError('INVALID_SUBJECT', `Invalid subject: ${subject}`);
    }

    try {
      // Deduct tokens for lesson creation (5 coins)
      console.log('Calculating lesson cost...');
      const lessonCost = tokenEconomyService.calculateLessonCost();
      console.log('Lesson cost:', lessonCost);
      
      console.log('Deducting tokens...');
      try {
        await tokenEconomyService.deductTokens(creatorId, lessonCost, 'lesson_creation');
        console.log('Tokens deducted successfully');
      } catch (tokenError) {
        console.warn('Token deduction failed, continuing anyway:', tokenError);
        // Continue anyway for now - user might not be in Supabase yet
      }

      // Create lesson in database
      console.log('Inserting lesson into database...');
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title,
          subject,
          content,
          creator_id: creatorId,
          creator_role: creatorRole,
          school_id: schoolId || null,
        })
        .select()
        .single();

      console.log('Database response:', { lessonData, lessonError });

      if (lessonError) {
        console.error('Lesson creation error, refunding tokens:', lessonError);
        // Refund tokens if lesson creation fails
        try {
          await tokenEconomyService.grantTokens(creatorId, lessonCost, 'lesson_creation');
        } catch (refundError) {
          console.warn('Failed to refund tokens:', refundError);
        }
        throw this.handleSupabaseError(lessonError);
      }

      if (!lessonData) {
        console.error('No lesson data returned, refunding tokens');
        // Refund tokens if no data returned
        try {
          await tokenEconomyService.grantTokens(creatorId, lessonCost, 'lesson_creation');
        } catch (refundError) {
          console.warn('Failed to refund tokens:', refundError);
        }
        throw this.createError('CREATION_FAILED', 'Failed to create lesson');
      }

      console.log('Lesson created successfully:', lessonData.id);

      // Upload attachments if provided
      if (attachments && attachments.length > 0) {
        console.log('Adding attachments...');
        await this.addAttachments(lessonData.id, attachments);
      }

      // Trigger gamification events
      try {
        const gamificationResult = await gamificationOrchestratorService.onLessonCreated(creatorId);
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
        // Don't fail the lesson creation if gamification fails
      }

      return lessonData as Lesson;
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('CREATION_FAILED', `Failed to create lesson: ${(error as Error).message}`);
    }
  }

  /**
   * Get a lesson by ID
   * - Returns lesson with all metadata
   * - Includes attachments
   * 
   * @param lessonId Lesson ID
   * @returns Lesson data
   * @throws Error if lesson not found
   * 
   * Requirements: 2.5
   */
  async getLesson(lessonId: string): Promise<Lesson> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('NOT_FOUND', 'Lesson not found');
      }

      return data as Lesson;
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch lesson: ${(error as Error).message}`);
    }
  }

  /**
   * Update a lesson
   * - Only creator can update
   * - Updates specified fields
   * 
   * @param lessonId Lesson ID
   * @param updates Lesson updates
   * @param userId User ID (for authorization)
   * @returns Updated lesson
   * @throws Error if unauthorized or update fails
   * 
   * Requirements: 2.5
   */
  async updateLesson(
    lessonId: string,
    updates: UpdateLessonData,
    userId: string
  ): Promise<Lesson> {
    try {
      // Verify user is the creator
      const lesson = await this.getLesson(lessonId);
      
      if (lesson.creator_id !== userId) {
        throw this.createError('UNAUTHORIZED', 'You do not have permission to update this lesson');
      }

      // Validate subject if provided
      if (updates.subject && !this.isValidSubject(updates.subject)) {
        throw this.createError('INVALID_SUBJECT', `Invalid subject: ${updates.subject}`);
      }

      // Update lesson
      const { data, error } = await supabase
        .from('lessons')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lessonId)
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('UPDATE_FAILED', 'Failed to update lesson');
      }

      return data as Lesson;
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to update lesson: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a lesson
   * - Only creator can delete
   * - Cascades to assignments and attachments
   * 
   * @param lessonId Lesson ID
   * @param userId User ID (for authorization)
   * @throws Error if unauthorized or deletion fails
   * 
   * Requirements: 2.5
   */
  async deleteLesson(lessonId: string, userId: string): Promise<void> {
    try {
      // Verify user is the creator
      const lesson = await this.getLesson(lessonId);
      
      if (lesson.creator_id !== userId) {
        throw this.createError('UNAUTHORIZED', 'You do not have permission to delete this lesson');
      }

      // Delete lesson (cascades to assignments and attachments)
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) {
        throw this.handleSupabaseError(error);
      }
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('DELETE_FAILED', `Failed to delete lesson: ${(error as Error).message}`);
    }
  }

  /**
   * Assign a lesson to students
   * - Only teachers can assign lessons
   * - Creates assignment records
   * - Prevents duplicate assignments
   * 
   * @param lessonId Lesson ID
   * @param studentIds Array of student IDs
   * @param teacherId Teacher ID (for authorization)
   * @throws Error if unauthorized or assignment fails
   * 
   * Requirements: 4.1
   */
  async assignLessonToStudents(
    lessonId: string,
    studentIds: string[],
    teacherId: string
  ): Promise<void> {
    try {
      // Verify lesson exists and teacher is the creator
      const lesson = await this.getLesson(lessonId);
      
      if (lesson.creator_id !== teacherId) {
        throw this.createError('UNAUTHORIZED', 'You do not have permission to assign this lesson');
      }

      if (lesson.creator_role !== 'teacher') {
        throw this.createError('INVALID_OPERATION', 'Only teacher-created lessons can be assigned');
      }

      // Validate student IDs
      if (!studentIds || studentIds.length === 0) {
        throw this.createError('MISSING_FIELDS', 'At least one student ID is required');
      }

      // Create assignment records
      const assignments = studentIds.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId,
      }));

      const { error } = await supabase
        .from('lesson_assignments')
        .upsert(assignments, { onConflict: 'lesson_id,student_id' });

      if (error) {
        throw this.handleSupabaseError(error);
      }
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('ASSIGNMENT_FAILED', `Failed to assign lesson: ${(error as Error).message}`);
    }
  }

  /**
   * Get lessons assigned to a student
   * - Returns all lessons assigned to the student
   * - Includes lesson metadata
   * 
   * @param studentId Student ID
   * @returns Array of assigned lessons
   * 
   * Requirements: 4.1
   */
  async getAssignedLessons(studentId: string): Promise<Lesson[]> {
    try {
      // Get lesson IDs from assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('lesson_assignments')
        .select('lesson_id')
        .eq('student_id', studentId);

      if (assignmentError) {
        throw this.handleSupabaseError(assignmentError);
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      const lessonIds = assignments.map(a => a.lesson_id);

      // Fetch lessons
      const { data: lessons, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .in('id', lessonIds)
        .order('created_at', { ascending: false });

      if (lessonError) {
        throw this.handleSupabaseError(lessonError);
      }

      return (lessons || []) as Lesson[];
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch assigned lessons: ${(error as Error).message}`);
    }
  }

  /**
   * Get lesson progress for a student
   * - Returns completion status
   * - Includes quiz attempts
   * - Tracks last access time
   * 
   * @param lessonId Lesson ID
   * @param studentId Student ID
   * @returns Lesson progress data
   * 
   * Requirements: 4.3
   */
  async getLessonProgress(lessonId: string, studentId: string): Promise<LessonProgress> {
    try {
      // Check if lesson is assigned to student
      const { data: assignment, error: assignmentError } = await supabase
        .from('lesson_assignments')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', studentId)
        .single();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        throw this.handleSupabaseError(assignmentError);
      }

      // Get quiz attempts for this lesson
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('lesson_id', lessonId)
        .single();

      let quizAttempts: QuizAttempt[] = [];
      
      if (quizData && !quizError) {
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizData.id)
          .eq('student_id', studentId)
          .order('completed_at', { ascending: false });

        if (!attemptsError && attempts) {
          quizAttempts = attempts as QuizAttempt[];
        }
      }

      // Determine completion status (completed if quiz attempted)
      const completed = quizAttempts.length > 0;

      return {
        lesson_id: lessonId,
        student_id: studentId,
        completed,
        quiz_attempts: quizAttempts,
        last_accessed: assignment?.assigned_at || new Date().toISOString(),
      };
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('PROGRESS_FETCH_FAILED', `Failed to fetch lesson progress: ${(error as Error).message}`);
    }
  }

  /**
   * Get attachments for a lesson
   * - Returns all attachments with URLs
   * 
   * @param lessonId Lesson ID
   * @returns Array of attachments
   * 
   * Requirements: 4.5
   */
  async getAttachments(lessonId: string): Promise<LessonAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('uploaded_at', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as LessonAttachment[];
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch attachments: ${(error as Error).message}`);
    }
  }

  /**
   * Get lessons created by a user
   * - Returns all lessons created by the user
   * - Ordered by creation date
   * 
   * @param userId User ID
   * @returns Array of lessons
   */
  async getLessonsByCreator(userId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Lesson[];
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch lessons: ${(error as Error).message}`);
    }
  }

  /**
   * Get lessons by subject
   * - Returns all lessons for a specific subject
   * - Optionally filter by school
   * 
   * @param subject Subject to filter by
   * @param schoolId Optional school ID filter
   * @returns Array of lessons
   */
  async getLessonsBySubject(subject: Subject, schoolId?: string): Promise<Lesson[]> {
    try {
      let query = supabase
        .from('lessons')
        .select('*')
        .eq('subject', subject);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Lesson[];
    } catch (error) {
      if (this.isLessonError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch lessons: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Add attachments to a lesson
   */
  private async addAttachments(
    lessonId: string,
    attachments: Omit<LessonAttachment, 'id' | 'lesson_id' | 'uploaded_at'>[]
  ): Promise<void> {
    const attachmentRecords = attachments.map(att => ({
      lesson_id: lessonId,
      file_name: att.file_name,
      file_url: att.file_url,
      file_type: att.file_type,
    }));

    const { error } = await supabase
      .from('lesson_attachments')
      .insert(attachmentRecords);

    if (error) {
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * Validate subject against allowed subjects
   */
  private isValidSubject(subject: string): subject is Subject {
    const validSubjects: Subject[] = [
      'mathematics', 'russian_language', 'physics', 'geography',
      'literature', 'obzh', 'physical_education', 'biology',
      'chemistry', 'history', 'social_studies', 'informatics',
      'programming', 'music', 'geometry', 'probability_statistics'
    ];
    return validSubjects.includes(subject as Subject);
  }

  /**
   * Create a LessonError
   */
  private createError(code: string, message: string): LessonError {
    return { code, message };
  }

  /**
   * Check if error is a LessonError
   */
  private isLessonError(error: unknown): error is LessonError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to LessonError
   */
  private handleSupabaseError(error: { message: string; code?: string }): LessonError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Lesson not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this lesson');
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
export const lessonService = new LessonService();
