import { useEffect } from 'react';
import { useStore } from '../store';
import { quizService } from '../services/quiz.service';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Custom hook for quiz operations
 */
export function useQuizzes() {
  const {
    profile,
    quizzes,
    quizAttempts,
    setQuizzes,
    addQuiz,
    setQuizAttempts,
    addQuizAttempt,
    setLoading,
  } = useStore();

  // Load quizzes
  useEffect(() => {
    if (!isSupabaseConfigured() || !profile) return;

    loadQuizzes();
  }, [profile?.id]);

  const loadQuizzes = async () => {
    try {
      // Load all quizzes (filter client-side if needed)
      const { data } = await quizService.getAllQuizzes();
      if (data) setQuizzes(data);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  };

  const createQuiz = async (data: {
    lessonId: string;
    title: string;
    questions: Array<{
      question_text: string;
      options: string[];
      correct_answer_index: number;
      explanation?: string;
    }>;
  }) => {
    if (!profile) throw new Error('Not authenticated');

    setLoading(true);
    try {
      // Check if quiz already exists for this lesson
      const canCreate = await quizService.canCreateQuiz(data.lessonId);
      if (!canCreate) {
        throw new Error('A quiz already exists for this lesson');
      }

      const quiz = await quizService.createQuiz({
        lesson_id: data.lessonId,
        title: data.title,
        questions: data.questions.map((q, idx) => ({
          id: `q-${idx}`,
          ...q,
        })),
        created_by: profile.id,
      });

      addQuiz(quiz);
      return quiz;
    } catch (error) {
      console.error('Failed to create quiz:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getQuiz = async (quizId: string) => {
    try {
      return await quizService.getQuiz(quizId);
    } catch (error) {
      console.error('Failed to get quiz:', error);
      throw error;
    }
  };

  const submitAttempt = async (data: {
    quizId: string;
    answers: number[];
    countsForLeaderboard: boolean;
  }) => {
    if (!profile || profile.role !== 'student') {
      throw new Error('Only students can submit quiz attempts');
    }

    setLoading(true);
    try {
      // Check if student can attempt this quiz
      const canAttempt = await quizService.canAttemptQuiz(data.quizId, profile.id);
      if (!canAttempt) {
        throw new Error('You have already attempted this quiz');
      }

      // Get quiz to calculate score
      const quiz = await quizService.getQuiz(data.quizId);
      const correctAnswers = data.answers.filter(
        (answer, idx) => answer === quiz.questions[idx].correct_answer_index
      ).length;
      const scorePercentage = (correctAnswers / quiz.questions.length) * 100;

      const attempt = await quizService.submitQuizAttempt({
        quiz_id: data.quizId,
        student_id: profile.id,
        answers: data.answers,
        score_percentage: scorePercentage,
        counts_for_leaderboard: data.countsForLeaderboard,
      });

      addQuizAttempt(attempt);
      return attempt;
    } catch (error) {
      console.error('Failed to submit quiz attempt:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getQuizAttempts = async (quizId: string, studentId?: string) => {
    try {
      const targetStudentId = studentId || profile?.id;
      if (!targetStudentId) throw new Error('Student ID required');

      return await quizService.getQuizAttempts(quizId, targetStudentId);
    } catch (error) {
      console.error('Failed to get quiz attempts:', error);
      return [];
    }
  };

  const canCreateQuiz = async (lessonId: string): Promise<boolean> => {
    try {
      return await quizService.canCreateQuiz(lessonId);
    } catch (error) {
      console.error('Failed to check quiz creation:', error);
      return false;
    }
  };

  const canAttemptQuiz = async (quizId: string): Promise<boolean> => {
    if (!profile || profile.role !== 'student') return false;

    try {
      return await quizService.canAttemptQuiz(quizId, profile.id);
    } catch (error) {
      console.error('Failed to check quiz attempt:', error);
      return false;
    }
  };

  return {
    quizzes,
    quizAttempts,
    createQuiz,
    getQuiz,
    submitAttempt,
    getQuizAttempts,
    canCreateQuiz,
    canAttemptQuiz,
    refreshQuizzes: loadQuizzes,
  };
}
