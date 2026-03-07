/**
 * Analytics Service
 * Handles progress analytics for students, classes, and schools
 * 
 * Requirements:
 * - 6.1: Analyze quiz results for each student
 * - 6.2: Calculate average score per subject
 * - 6.3: Determine weak subjects (< 60%)
 * - 6.4: Determine strong subjects (> 80%)
 * - 6.5: Parent can view child progress analytics
 * - 6.6: Teacher can view class analytics
 * - 6.7: Display progress charts over time
 * - 6.8: Compare with class/school averages
 * - 6.9: Generate recommendations
 * - 6.10: Real-time updates after quiz attempts
 */

import { supabase } from '../lib/supabase';
import type { ProgressAnalytics, SubjectScore } from '../types/platform';

// ============================================================================
// TYPES
// ============================================================================

export interface QuizAttemptData {
  id: string;
  quiz_id: string;
  student_id: string;
  score_percentage: number;
  completed_at: string;
  lesson?: {
    subject: string;
  };
}

export interface ClassAnalytics {
  class_id: string;
  school_id: string;
  average_scores_by_subject: Record<string, number>;
  student_count: number;
  weak_students: WeakStudentInfo[];
  recommendations: string[];
}

export interface WeakStudentInfo {
  student_id: string;
  student_name: string;
  weak_subjects: string[];
  overall_average: number;
}

export interface SchoolAnalytics {
  school_id: string;
  average_scores_by_subject: Record<string, number>;
  student_count: number;
  teacher_count: number;
  total_quiz_attempts: number;
  top_subjects: string[];
  struggling_subjects: string[];
}

export interface AnalyticsError {
  code: string;
  message: string;
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export class AnalyticsService {
  /**
   * Get comprehensive progress analytics for a student
   * - Analyzes all quiz attempts
   * - Calculates subject averages
   * - Identifies weak and strong subjects
   * - Determines trend
   * - Generates personalized recommendations
   * 
   * @param studentId Student ID
   * @returns Progress analytics
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 6.9, 6.10
   */
  async getProgressAnalytics(studentId: string): Promise<ProgressAnalytics> {
    if (!studentId) {
      throw this.createError('MISSING_STUDENT_ID', 'Student ID is required');
    }

    try {
      // Fetch all quiz attempts for the student with lesson information
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          quiz_id,
          student_id,
          score_percentage,
          completed_at,
          quizzes!inner (
            lesson_id,
            lessons!inner (
              subject
            )
          )
        `)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: true });

      if (attemptsError) {
        throw this.handleSupabaseError(attemptsError);
      }

      if (!attempts || attempts.length === 0) {
        // No attempts yet - return empty analytics
        return {
          student_id: studentId,
          overall_average: 0,
          subject_scores: [],
          weak_subjects: [],
          strong_subjects: [],
          trend: 'stable',
          recommendations: ['Начните проходить квизы, чтобы увидеть аналитику вашего прогресса!'],
        };
      }

      // Transform data to include subject
      const attemptsWithSubject = attempts.map((attempt: any) => ({
        id: attempt.id,
        quiz_id: attempt.quiz_id,
        student_id: attempt.student_id,
        score_percentage: attempt.score_percentage,
        completed_at: attempt.completed_at,
        subject: attempt.quizzes?.lessons?.subject || 'Unknown',
      }));

      // Calculate subject scores
      const subjectScores = this.calculateSubjectScores(attemptsWithSubject);

      // Calculate overall average
      const overallAverage = this.calculateOverallAverage(subjectScores);

      // Classify weak and strong subjects
      const weakSubjects = this.classifyWeakSubjects(subjectScores);
      const strongSubjects = this.classifyStrongSubjects(subjectScores);

      // Determine trend
      const trend = this.determineTrend(attemptsWithSubject);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        subjectScores,
        weakSubjects,
        strongSubjects,
        trend
      );

      return {
        student_id: studentId,
        overall_average: overallAverage,
        subject_scores: subjectScores,
        weak_subjects: weakSubjects,
        strong_subjects: strongSubjects,
        trend,
        recommendations,
      };
    } catch (error) {
      if (this.isAnalyticsError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Get analytics for a class (for teachers)
   * - Aggregates data for all students in the class
   * - Calculates average scores by subject
   * - Identifies students needing help
   * - Generates class-level recommendations
   * 
   * @param schoolId School ID
   * @param teacherId Teacher ID (for authorization)
   * @returns Class analytics
   * 
   * Requirements: 6.6, 6.8
   */
  async getClassAnalytics(schoolId: string, teacherId: string): Promise<ClassAnalytics> {
    if (!schoolId || !teacherId) {
      throw this.createError('MISSING_PARAMETERS', 'School ID and Teacher ID are required');
    }

    try {
      // Verify teacher belongs to this school
      const { data: teacherMembership, error: membershipError } = await supabase
        .from('school_memberships')
        .select('id')
        .eq('school_id', schoolId)
        .eq('user_id', teacherId)
        .eq('role', 'teacher')
        .single();

      if (membershipError || !teacherMembership) {
        throw this.createError('UNAUTHORIZED', 'Teacher does not belong to this school');
      }

      // Get all students in the school
      const { data: studentMemberships, error: studentsError } = await supabase
        .from('school_memberships')
        .select('user_id, user_profiles!inner(full_name)')
        .eq('school_id', schoolId)
        .eq('role', 'student');

      if (studentsError) {
        throw this.handleSupabaseError(studentsError);
      }

      if (!studentMemberships || studentMemberships.length === 0) {
        return {
          class_id: schoolId,
          school_id: schoolId,
          average_scores_by_subject: {},
          student_count: 0,
          weak_students: [],
          recommendations: ['В классе пока нет учеников'],
        };
      }

      const studentIds = studentMemberships.map((m: any) => m.user_id);

      // Get analytics for each student
      const studentAnalytics = await Promise.all(
        studentIds.map(id => this.getProgressAnalytics(id))
      );

      // Aggregate subject scores
      const subjectScoresMap: Record<string, number[]> = {};
      
      for (const analytics of studentAnalytics) {
        for (const subjectScore of analytics.subject_scores) {
          if (!subjectScoresMap[subjectScore.subject]) {
            subjectScoresMap[subjectScore.subject] = [];
          }
          subjectScoresMap[subjectScore.subject].push(subjectScore.average_score);
        }
      }

      // Calculate average scores by subject
      const averageScoresBySubject: Record<string, number> = {};
      for (const [subject, scores] of Object.entries(subjectScoresMap)) {
        averageScoresBySubject[subject] = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      // Identify weak students (overall average < 60%)
      const weakStudents: WeakStudentInfo[] = [];
      for (let i = 0; i < studentAnalytics.length; i++) {
        const analytics = studentAnalytics[i];
        if (analytics.overall_average < 60 && analytics.overall_average > 0) {
          const membership = studentMemberships[i] as any;
          weakStudents.push({
            student_id: analytics.student_id,
            student_name: membership.user_profiles?.full_name || 'Unknown',
            weak_subjects: analytics.weak_subjects,
            overall_average: analytics.overall_average,
          });
        }
      }

      // Generate class recommendations
      const recommendations = this.generateClassRecommendations(
        averageScoresBySubject,
        weakStudents
      );

      return {
        class_id: schoolId,
        school_id: schoolId,
        average_scores_by_subject: averageScoresBySubject,
        student_count: studentMemberships.length,
        weak_students: weakStudents,
        recommendations,
      };
    } catch (error) {
      if (this.isAnalyticsError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch class analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Get analytics for a school (for administrators)
   * - Aggregates data for entire school
   * - Calculates school-wide statistics
   * - Identifies top and struggling subjects
   * 
   * @param schoolId School ID
   * @returns School analytics
   * 
   * Requirements: 6.6, 6.8
   */
  async getSchoolAnalytics(schoolId: string): Promise<SchoolAnalytics> {
    if (!schoolId) {
      throw this.createError('MISSING_SCHOOL_ID', 'School ID is required');
    }

    try {
      // Get all students in the school
      const { data: studentMemberships, error: studentsError } = await supabase
        .from('school_memberships')
        .select('user_id')
        .eq('school_id', schoolId)
        .eq('role', 'student');

      if (studentsError) {
        throw this.handleSupabaseError(studentsError);
      }

      // Get all teachers in the school
      const { data: teacherMemberships, error: teachersError } = await supabase
        .from('school_memberships')
        .select('user_id')
        .eq('school_id', schoolId)
        .eq('role', 'teacher');

      if (teachersError) {
        throw this.handleSupabaseError(teachersError);
      }

      const studentCount = studentMemberships?.length || 0;
      const teacherCount = teacherMemberships?.length || 0;

      if (studentCount === 0) {
        return {
          school_id: schoolId,
          average_scores_by_subject: {},
          student_count: 0,
          teacher_count: teacherCount,
          total_quiz_attempts: 0,
          top_subjects: [],
          struggling_subjects: [],
        };
      }

      const studentIds = studentMemberships!.map((m: any) => m.user_id);

      // Get all quiz attempts for school students
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          score_percentage,
          quizzes!inner (
            lessons!inner (
              subject
            )
          )
        `)
        .in('student_id', studentIds);

      if (attemptsError) {
        throw this.handleSupabaseError(attemptsError);
      }

      const totalQuizAttempts = attempts?.length || 0;

      if (totalQuizAttempts === 0) {
        return {
          school_id: schoolId,
          average_scores_by_subject: {},
          student_count: studentCount,
          teacher_count: teacherCount,
          total_quiz_attempts: 0,
          top_subjects: [],
          struggling_subjects: [],
        };
      }

      // Aggregate scores by subject
      const subjectScoresMap: Record<string, number[]> = {};
      
      for (const attempt of attempts!) {
        const subject = (attempt as any).quizzes?.lessons?.subject || 'Unknown';
        if (!subjectScoresMap[subject]) {
          subjectScoresMap[subject] = [];
        }
        subjectScoresMap[subject].push((attempt as any).score_percentage);
      }

      // Calculate average scores by subject
      const averageScoresBySubject: Record<string, number> = {};
      for (const [subject, scores] of Object.entries(subjectScoresMap)) {
        averageScoresBySubject[subject] = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      // Identify top subjects (average > 75%)
      const topSubjects = Object.entries(averageScoresBySubject)
        .filter(([_, avg]) => avg > 75)
        .sort(([_, a], [__, b]) => b - a)
        .map(([subject]) => subject);

      // Identify struggling subjects (average < 60%)
      const strugglingSubjects = Object.entries(averageScoresBySubject)
        .filter(([_, avg]) => avg < 60)
        .sort(([_, a], [__, b]) => a - b)
        .map(([subject]) => subject);

      return {
        school_id: schoolId,
        average_scores_by_subject: averageScoresBySubject,
        student_count: studentCount,
        teacher_count: teacherCount,
        total_quiz_attempts: totalQuizAttempts,
        top_subjects: topSubjects,
        struggling_subjects: strugglingSubjects,
      };
    } catch (error) {
      if (this.isAnalyticsError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch school analytics: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate subject scores from quiz attempts
   * - Groups attempts by subject
   * - Calculates average, count, and trend for each subject
   * 
   * Requirements: 6.2, 6.7
   */
  private calculateSubjectScores(attempts: any[]): SubjectScore[] {
    // Group attempts by subject
    const subjectMap: Record<string, any[]> = {};
    
    for (const attempt of attempts) {
      const subject = attempt.subject;
      if (!subjectMap[subject]) {
        subjectMap[subject] = [];
      }
      subjectMap[subject].push(attempt);
    }

    // Calculate scores for each subject
    const subjectScores: SubjectScore[] = [];
    
    for (const [subject, subjectAttempts] of Object.entries(subjectMap)) {
      // Calculate average score
      const totalScore = subjectAttempts.reduce((sum, a) => sum + a.score_percentage, 0);
      const averageScore = totalScore / subjectAttempts.length;

      // Get last attempt date
      const lastAttemptDate = subjectAttempts[subjectAttempts.length - 1].completed_at;

      // Determine trend
      const trend = this.calculateSubjectTrend(subjectAttempts);

      subjectScores.push({
        subject,
        average_score: Math.round(averageScore * 100) / 100,
        attempts_count: subjectAttempts.length,
        last_attempt_date: lastAttemptDate,
        trend,
      });
    }

    return subjectScores.sort((a, b) => a.subject.localeCompare(b.subject));
  }

  /**
   * Calculate trend for a specific subject
   * - Compares recent attempts to older attempts
   * 
   * Requirements: 6.7
   */
  private calculateSubjectTrend(attempts: any[]): 'up' | 'down' | 'stable' {
    if (attempts.length < 2) {
      return 'stable';
    }

    // Split attempts into two halves
    const midpoint = Math.floor(attempts.length / 2);
    const olderAttempts = attempts.slice(0, midpoint);
    const recentAttempts = attempts.slice(midpoint);

    // Calculate averages
    const olderAverage = olderAttempts.reduce((sum, a) => sum + a.score_percentage, 0) / olderAttempts.length;
    const recentAverage = recentAttempts.reduce((sum, a) => sum + a.score_percentage, 0) / recentAttempts.length;

    // Determine trend (5% threshold for significance)
    const difference = recentAverage - olderAverage;
    if (difference > 5) {
      return 'up';
    } else if (difference < -5) {
      return 'down';
    } else {
      return 'stable';
    }
  }

  /**
   * Calculate overall average across all subjects
   * 
   * Requirements: 6.2
   */
  private calculateOverallAverage(subjectScores: SubjectScore[]): number {
    if (subjectScores.length === 0) {
      return 0;
    }

    const totalScore = subjectScores.reduce((sum, s) => sum + s.average_score, 0);
    return Math.round((totalScore / subjectScores.length) * 100) / 100;
  }

  /**
   * Classify weak subjects (average < 60%)
   * 
   * Requirements: 6.3
   */
  private classifyWeakSubjects(subjectScores: SubjectScore[]): string[] {
    return subjectScores
      .filter(s => s.average_score < 60)
      .map(s => s.subject);
  }

  /**
   * Classify strong subjects (average > 80%)
   * 
   * Requirements: 6.4
   */
  private classifyStrongSubjects(subjectScores: SubjectScore[]): string[] {
    return subjectScores
      .filter(s => s.average_score > 80)
      .map(s => s.subject);
  }

  /**
   * Determine overall trend across all subjects
   * 
   * Requirements: 6.7
   */
  private determineTrend(attempts: any[]): 'improving' | 'declining' | 'stable' {
    if (attempts.length < 4) {
      return 'stable';
    }

    // Split attempts into two halves
    const midpoint = Math.floor(attempts.length / 2);
    const olderAttempts = attempts.slice(0, midpoint);
    const recentAttempts = attempts.slice(midpoint);

    // Calculate averages
    const olderAverage = olderAttempts.reduce((sum, a) => sum + a.score_percentage, 0) / olderAttempts.length;
    const recentAverage = recentAttempts.reduce((sum, a) => sum + a.score_percentage, 0) / recentAttempts.length;

    // Determine trend (5% threshold for significance)
    const difference = recentAverage - olderAverage;
    if (difference > 5) {
      return 'improving';
    } else if (difference < -5) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Generate personalized recommendations
   * 
   * Requirements: 6.9
   */
  private generateRecommendations(
    subjectScores: SubjectScore[],
    weakSubjects: string[],
    strongSubjects: string[],
    trend: 'improving' | 'declining' | 'stable'
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations for weak subjects
    if (weakSubjects.length > 0) {
      recommendations.push(
        `Сосредоточьтесь на улучшении знаний по предметам: ${weakSubjects.join(', ')}. Текущий средний балл ниже 60%.`
      );
      
      // Specific recommendations for each weak subject
      for (const subject of weakSubjects.slice(0, 2)) { // Top 2 weak subjects
        const subjectScore = subjectScores.find(s => s.subject === subject);
        if (subjectScore) {
          recommendations.push(
            `${subject}: Средний балл ${subjectScore.average_score.toFixed(1)}%. Рекомендуем повторить основные темы и пройти дополнительные квизы.`
          );
        }
      }
    }

    // Recommendations for strong subjects
    if (strongSubjects.length > 0) {
      recommendations.push(
        `Отличная работа по предметам: ${strongSubjects.join(', ')}! Продолжайте в том же духе!`
      );
    }

    // Trend-based recommendations
    if (trend === 'improving') {
      recommendations.push(
        'Ваши результаты улучшаются! Продолжайте регулярно заниматься, и вы достигнете еще больших успехов.'
      );
    } else if (trend === 'declining') {
      recommendations.push(
        'Ваши результаты снижаются. Рекомендуем уделить больше времени повторению материала и обратиться за помощью к учителю.'
      );
    }

    // Recommendations for subjects with declining trend
    const decliningSubjects = subjectScores.filter(s => s.trend === 'down');
    if (decliningSubjects.length > 0) {
      recommendations.push(
        `Обратите внимание на предметы с ухудшающимися результатами: ${decliningSubjects.map(s => s.subject).join(', ')}.`
      );
    }

    // Recommendations for subjects with improving trend
    const improvingSubjects = subjectScores.filter(s => s.trend === 'up');
    if (improvingSubjects.length > 0) {
      recommendations.push(
        `Вы показываете прогресс по предметам: ${improvingSubjects.map(s => s.subject).join(', ')}. Так держать!`
      );
    }

    // General recommendation if no specific issues
    if (recommendations.length === 0) {
      recommendations.push(
        'Продолжайте регулярно проходить квизы для отслеживания вашего прогресса.'
      );
    }

    return recommendations;
  }

  /**
   * Generate class-level recommendations
   * 
   * Requirements: 6.6, 6.9
   */
  private generateClassRecommendations(
    averageScoresBySubject: Record<string, number>,
    weakStudents: WeakStudentInfo[]
  ): string[] {
    const recommendations: string[] = [];

    // Identify weak subjects for the class
    const weakClassSubjects = Object.entries(averageScoresBySubject)
      .filter(([_, avg]) => avg < 60)
      .map(([subject]) => subject);

    if (weakClassSubjects.length > 0) {
      recommendations.push(
        `Класс испытывает трудности с предметами: ${weakClassSubjects.join(', ')}. Рекомендуется дополнительная работа по этим темам.`
      );
    }

    // Recommendations for weak students
    if (weakStudents.length > 0) {
      recommendations.push(
        `${weakStudents.length} ученик(ов) нуждаются в дополнительной поддержке. Рекомендуется индивидуальная работа.`
      );
    }

    // Identify strong subjects
    const strongClassSubjects = Object.entries(averageScoresBySubject)
      .filter(([_, avg]) => avg > 80)
      .map(([subject]) => subject);

    if (strongClassSubjects.length > 0) {
      recommendations.push(
        `Класс показывает отличные результаты по предметам: ${strongClassSubjects.join(', ')}.`
      );
    }

    // General recommendation
    if (recommendations.length === 0) {
      recommendations.push(
        'Класс показывает стабильные результаты. Продолжайте регулярную работу.'
      );
    }

    return recommendations;
  }

  /**
   * Create an AnalyticsError
   */
  private createError(code: string, message: string): AnalyticsError {
    return { code, message };
  }

  /**
   * Check if error is an AnalyticsError
   */
  private isAnalyticsError(error: unknown): error is AnalyticsError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to AnalyticsError
   */
  private handleSupabaseError(error: { message: string; code?: string }): AnalyticsError {
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Data not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this data');
    }

    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
