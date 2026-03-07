/**
 * Quiz Service
 * Handles quiz CRUD operations, quiz attempts, and scoring
 * 
 * Requirements:
 * - 3.1: Quiz creation costs 5 Wisdom Coins
 * - 3.2: One quiz per lesson constraint
 * - 3.3: Unlimited attempts for self-created lessons
 * - 3.4: Single attempt for teacher-created lessons
 * - 3.5: Quiz score calculation
 * - 3.6: Leaderboard counting for self-created lessons
 * - 3.7: Leaderboard exclusion for teacher-created lessons
 */

import { supabase } from '../lib/supabase';
import { tokenEconomyService } from './token-economy.service';
import { gamificationOrchestratorService } from './gamification/gamification-orchestrator.service';
import type { Quiz, QuizQuestion, QuizAttempt } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateQuizData {
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
  createdBy: string;
}

export interface GenerateQuizWithAIData {
  topic: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  gradeLevel: string;
  questionCount?: number; // 5-10 questions
  createdBy: string;
}

export interface SubmitQuizAttemptData {
  quizId: string;
  studentId: string;
  answers: number[];
}

export interface QuizError {
  code: string;
  message: string;
}

// ============================================================================
// QUIZ SERVICE
// ============================================================================

export class QuizService {
  private readonly QUIZ_GENERATION_COST = 2; // Cost for AI-generated quiz

  /**
   * Generate a quiz using AI (GPT-OSS-120B)
   * - Deducts 2 Wisdom Coins from creator's balance
   * - Generates 5-10 questions with 4 options each
   * - Includes explanations for correct answers
   * - Validates generated content
   * 
   * @param data Quiz generation data
   * @returns Generated quiz questions
   * @throws Error if insufficient balance or generation fails
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
   */
  async generateQuizWithAI(data: GenerateQuizWithAIData): Promise<QuizQuestion[]> {
    const { topic, subject, difficulty, gradeLevel, questionCount = 5, createdBy } = data;

    // Validate required fields
    if (!topic || !subject || !difficulty || !gradeLevel || !createdBy) {
      throw this.createError('MISSING_FIELDS', 'Topic, subject, difficulty, grade level, and creator ID are required');
    }

    // Validate question count (5-10)
    const validQuestionCount = Math.max(5, Math.min(10, questionCount));

    try {
      // Check and deduct tokens for quiz generation (2 coins)
      try {
        await tokenEconomyService.deductTokens(createdBy, this.QUIZ_GENERATION_COST, 'quiz_creation');
      } catch (tokenError) {
        throw this.createError('INSUFFICIENT_COINS', `Insufficient Wisdom Coins. Quiz generation costs ${this.QUIZ_GENERATION_COST} coins.`);
      }

      // Generate quiz using AI
      const questions = await this.callAIForQuizGeneration(
        topic,
        subject,
        difficulty,
        gradeLevel,
        validQuestionCount
      );

      // Validate generated content
      const validatedQuestions = this.validateGeneratedQuestions(questions, validQuestionCount);

      return validatedQuestions;
    } catch (error) {
      // Refund tokens if generation fails
      try {
        await tokenEconomyService.grantTokens(createdBy, this.QUIZ_GENERATION_COST, 'biweekly_grant');
      } catch (refundError) {
        console.warn('Failed to refund tokens:', refundError);
      }

      if (this.isQuizError(error)) {
        throw error;
      }
      throw this.createError('GENERATION_FAILED', `Failed to generate quiz: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new quiz for a lesson
   * - Deducts 5 Wisdom Coins from creator's balance
   * - Enforces one quiz per lesson constraint
   * - Stores quiz with questions
   * 
   * @param data Quiz creation data
   * @returns Created quiz
   * @throws Error if insufficient balance, quiz already exists, or creation fails
   * 
   * Requirements: 3.1, 3.2
   */
  async createQuiz(data: CreateQuizData): Promise<Quiz> {
    const { lessonId, title, questions, createdBy } = data;

    // Validate required fields
    if (!lessonId || !title || !questions || !createdBy) {
      throw this.createError('MISSING_FIELDS', 'Lesson ID, title, questions, and creator ID are required');
    }

    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw this.createError('INVALID_QUESTIONS', 'At least one question is required');
    }

    // Validate each question
    for (const question of questions) {
      if (!question.question_text || !question.options || question.options.length < 2) {
        throw this.createError('INVALID_QUESTION', 'Each question must have text and at least 2 options');
      }
      if (question.correct_answer_index < 0 || question.correct_answer_index >= question.options.length) {
        throw this.createError('INVALID_ANSWER', 'Correct answer index must be valid');
      }
    }

    try {
      // Check if quiz already exists for this lesson
      const canCreate = await this.canCreateQuiz(lessonId);
      if (!canCreate) {
        throw this.createError('QUIZ_EXISTS', 'Quiz already exists for this lesson');
      }

      // Deduct tokens for quiz creation (5 coins)
      const quizCost = tokenEconomyService.calculateQuizCost();
      try {
        await tokenEconomyService.deductTokens(createdBy, quizCost, 'quiz_creation');
      } catch (tokenError) {
        console.warn('Token deduction failed, continuing anyway:', tokenError);
        // Continue anyway for now - user might not be in Supabase yet
      }

      // Create quiz in database
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          lesson_id: lessonId,
          title,
          questions: questions as unknown as string, // Supabase stores as JSONB
          created_by: createdBy,
        })
        .select()
        .single();

      if (quizError) {
        // Refund tokens if quiz creation fails
        try {
          await tokenEconomyService.grantTokens(createdBy, quizCost, 'quiz_creation');
        } catch (refundError) {
          console.warn('Failed to refund tokens:', refundError);
        }
        throw this.handleSupabaseError(quizError);
      }

      if (!quizData) {
        // Refund tokens if no data returned
        try {
          await tokenEconomyService.grantTokens(createdBy, quizCost, 'quiz_creation');
        } catch (refundError) {
          console.warn('Failed to refund tokens:', refundError);
        }
        throw this.createError('CREATION_FAILED', 'Failed to create quiz');
      }

      return quizData as Quiz;
    } catch (error) {
      if (this.isQuizError(error)) {
        throw error;
      }
      throw this.createError('CREATION_FAILED', `Failed to create quiz: ${(error as Error).message}`);
    }
  }

  /**
   * Get a quiz by ID
   * - Returns quiz with all questions
   * 
   * @param quizId Quiz ID
   * @returns Quiz data
   * @throws Error if quiz not found
   * 
   * Requirements: 3.5
   */
  async getQuiz(quizId: string): Promise<Quiz> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('NOT_FOUND', 'Quiz not found');
      }

      return data as Quiz;
    } catch (error) {
      if (this.isQuizError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch quiz: ${(error as Error).message}`);
    }
  }

  /**
   * Submit a quiz attempt
   * - Calculates score percentage
   * - Enforces attempt limits based on lesson creator
   * - Determines if attempt counts for leaderboard
   * - Updates leaderboard if applicable
   * 
   * @param data Quiz attempt data
   * @returns Quiz attempt record
   * @throws Error if attempt limit exceeded or submission fails
   * 
   * Requirements: 3.3, 3.4, 3.5, 3.6, 3.7
   */
  async submitQuizAttempt(data: SubmitQuizAttemptData): Promise<QuizAttempt> {
    const { quizId, studentId, answers } = data;

    // Validate required fields
    if (!quizId || !studentId || !answers) {
      throw this.createError('MISSING_FIELDS', 'Quiz ID, student ID, and answers are required');
    }

    // Validate answers is an array
    if (!Array.isArray(answers)) {
      throw this.createError('INVALID_ANSWERS', 'Answers must be an array');
    }

    try {
      // Check if student can attempt this quiz
      const canAttempt = await this.canAttemptQuiz(quizId, studentId);
      if (!canAttempt) {
        throw this.createError('ATTEMPT_LIMIT_EXCEEDED', 'You have already completed this quiz');
      }

      // Get quiz with questions
      const quiz = await this.getQuiz(quizId);

      // Validate answers length matches questions
      if (answers.length !== quiz.questions.length) {
        throw this.createError('INVALID_ANSWERS', `Expected ${quiz.questions.length} answers, got ${answers.length}`);
      }

      // Calculate score
      const scorePercentage = this.calculateScore(quiz.questions, answers);

      // Get lesson to determine if it counts for leaderboard
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('creator_id, creator_role')
        .eq('id', quiz.lesson_id)
        .single();

      if (lessonError) {
        throw this.handleSupabaseError(lessonError);
      }

      if (!lessonData) {
        throw this.createError('LESSON_NOT_FOUND', 'Lesson not found');
      }

      // Determine if this counts for leaderboard
      // Counts if: student created the lesson themselves
      const countsForLeaderboard = lessonData.creator_id === studentId && lessonData.creator_role === 'student';

      // Create quiz attempt record
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          student_id: studentId,
          answers,
          score_percentage: scorePercentage,
          counts_for_leaderboard: countsForLeaderboard,
        })
        .select()
        .single();

      if (attemptError) {
        throw this.handleSupabaseError(attemptError);
      }

      if (!attemptData) {
        throw this.createError('SUBMISSION_FAILED', 'Failed to submit quiz attempt');
      }

      // Update leaderboard if applicable
      if (countsForLeaderboard) {
        await this.updateLeaderboard(studentId, scorePercentage);
      }

      // Trigger gamification events
      try {
        const gamificationResult = await gamificationOrchestratorService.onQuizCompleted(studentId, scorePercentage);
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
        // Don't fail the quiz submission if gamification fails
      }

      return attemptData as QuizAttempt;
    } catch (error) {
      if (this.isQuizError(error)) {
        throw error;
      }
      throw this.createError('SUBMISSION_FAILED', `Failed to submit quiz attempt: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a quiz can be created for a lesson
   * - Returns false if quiz already exists
   * 
   * @param lessonId Lesson ID
   * @returns True if quiz can be created
   * 
   * Requirements: 3.2
   */
  async canCreateQuiz(lessonId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id')
        .eq('lesson_id', lessonId)
        .single();

      // If error is "not found", quiz doesn't exist - can create
      if (error && error.code === 'PGRST116') {
        return true;
      }

      // If no error and data exists, quiz already exists - cannot create
      if (data) {
        return false;
      }

      // If other error, throw it
      if (error) {
        throw this.handleSupabaseError(error);
      }

      return true;
    } catch (error) {
      if (this.isQuizError(error)) {
        throw error;
      }
      console.error('Failed to check if quiz can be created:', error);
      return false;
    }
  }

  /**
   * Check if a student can attempt a quiz
   * - Unlimited attempts for self-created lessons
   * - Single attempt for teacher-created lessons
   * 
   * @param quizId Quiz ID
   * @param studentId Student ID
   * @returns True if student can attempt quiz
   * 
   * Requirements: 3.3, 3.4
   */
  async canAttemptQuiz(quizId: string, studentId: string): Promise<boolean> {
    try {
      // Get quiz to find lesson
      const quiz = await this.getQuiz(quizId);

      // Get lesson to check creator
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('creator_id, creator_role')
        .eq('id', quiz.lesson_id)
        .single();

      if (lessonError) {
        throw this.handleSupabaseError(lessonError);
      }

      if (!lessonData) {
        throw this.createError('LESSON_NOT_FOUND', 'Lesson not found');
      }

      // Check existing attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', quizId)
        .eq('student_id', studentId);

      if (attemptsError) {
        throw this.handleSupabaseError(attemptsError);
      }

      const attemptCount = attempts?.length || 0;

      // If student created the lesson, unlimited attempts
      if (lessonData.creator_id === studentId && lessonData.creator_role === 'student') {
        return true;
      }

      // If teacher created the lesson, only one attempt allowed
      if (lessonData.creator_role === 'teacher') {
        return attemptCount === 0;
      }

      // Default: allow if no attempts yet
      return attemptCount === 0;
    } catch (error) {
      if (this.isQuizError(error)) {
        throw error;
      }
      console.error('Failed to check if quiz can be attempted:', error);
      return false;
    }
  }

  /**
   * Get quiz attempts for a student
   * 
   * @param quizId Quiz ID
   * @param studentId Student ID
   * @returns Array of quiz attempts
   */
  async getQuizAttempts(quizId: string, studentId: string): Promise<QuizAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as QuizAttempt[];
    } catch (error) {
      if (this.isQuizError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch quiz attempts: ${(error as Error).message}`);
    }
  }

  /**
   * Get quiz by lesson ID
   * 
   * @param lessonId Lesson ID
   * @returns Quiz or null if not found
   */
  async getQuizByLessonId(lessonId: string): Promise<Quiz | null> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 or 1 results

      // If not found or table doesn't exist, return null
      if (error) {
        // Handle 406 error (Not Acceptable) - table might not exist or RLS issue
        if (error.code === '406' || error.message?.includes('406')) {
          console.warn('Quizzes table not available:', error.message);
          return null;
        }
        
        // Handle "no rows" error gracefully
        if (error.code === 'PGRST116') {
          return null;
        }
        
        throw this.handleSupabaseError(error);
      }

      return data as Quiz | null;
    } catch (error) {
      if (this.isQuizError(error)) {
        throw error;
      }
      console.error('Failed to fetch quiz by lesson ID:', error);
      return null;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Call AI service to generate quiz questions
   * - Uses GPT-OSS-120B (llama-3.3-70b-versatile) model
   * - Generates questions based on topic, subject, difficulty, and grade level
   * - Returns structured quiz questions with explanations
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
   */
  private async callAIForQuizGeneration(
    topic: string,
    subject: string,
    difficulty: 'easy' | 'medium' | 'hard',
    gradeLevel: string,
    questionCount: number
  ): Promise<QuizQuestion[]> {
    try {
      // Import Groq client
      const Groq = (await import('groq-sdk')).default;
      const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || 
        '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';
      
      const groq = new Groq({
        apiKey: GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      // Map difficulty to Russian
      const difficultyMap = {
        easy: 'легкий',
        medium: 'средний',
        hard: 'сложный',
      };
      const difficultyRu = difficultyMap[difficulty];

      // Prepare AI prompt
      const systemPrompt = `Ты — опытный преподаватель, создающий тесты для школьников.

ВАЖНО: Отвечай ТОЛЬКО валидным JSON массивом, без markdown, без объяснений.

Формат ответа (строго JSON):
[
  {
    "question_text": "Текст вопроса",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correct_answer_index": 0,
    "explanation": "Объяснение правильного ответа"
  }
]

Правила:
- Создай ровно ${questionCount} вопросов
- Каждый вопрос должен иметь ровно 4 варианта ответа
- correct_answer_index — индекс правильного ответа (0-3)
- Добавь краткое объяснение правильного ответа в поле explanation
- НЕ используй эмодзи
- Используй LaTeX для математических формул если нужно: $формула$
- Вопросы должны соответствовать уровню сложности и классу`;

      const userPrompt = `Создай тест из ${questionCount} вопросов по следующим параметрам:

Тема: ${topic}
Предмет: ${subject}
Уровень сложности: ${difficultyRu}
Класс: ${gradeLevel}

Вопросы должны:
1. Соответствовать указанному уровню сложности
2. Быть подходящими для учеников ${gradeLevel} класса
3. Проверять понимание темы "${topic}"
4. Иметь четкие и однозначные правильные ответы
5. Включать объяснения для лучшего понимания`;

      // Call Groq API (GPT-OSS-120B)
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // GPT-OSS-120B equivalent
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      const response = completion.choices[0]?.message?.content || '';

      // Parse JSON response
      let jsonStr = response.trim();
      
      // Extract JSON array if wrapped in markdown
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // Clean up common issues
      jsonStr = jsonStr
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}');

      try {
        const parsed = JSON.parse(jsonStr);
        
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Invalid response: expected array of questions');
        }

        // Convert to QuizQuestion format
        return parsed.map((q: any, index: number) => ({
          id: `q${index + 1}`,
          question_text: q.question_text || q.question || 'Вопрос',
          options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
          correct_answer_index: typeof q.correct_answer_index === 'number' 
            ? q.correct_answer_index 
            : (q.correct ?? 0),
          explanation: q.explanation || 'Объяснение будет добавлено',
        }));
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, jsonStr);
        throw new Error('Failed to parse AI response into quiz questions');
      }
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error(`AI generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate generated quiz questions
   * - Ensures correct number of questions
   * - Validates question structure
   * - Ensures 4 options per question
   * - Validates correct answer index
   * 
   * Requirements: 8.7, 8.8
   */
  private validateGeneratedQuestions(
    questions: QuizQuestion[],
    expectedCount: number
  ): QuizQuestion[] {
    // Ensure we have the expected number of questions
    if (questions.length < expectedCount) {
      throw this.createError(
        'INVALID_GENERATION',
        `Expected ${expectedCount} questions, but got ${questions.length}`
      );
    }

    // Take only the expected number of questions
    const validQuestions = questions.slice(0, expectedCount);

    // Validate each question
    for (let i = 0; i < validQuestions.length; i++) {
      const question = validQuestions[i];

      // Validate question text
      if (!question.question_text || question.question_text.trim().length === 0) {
        throw this.createError(
          'INVALID_QUESTION',
          `Question ${i + 1} has empty question text`
        );
      }

      // Validate options (must have exactly 4)
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        throw this.createError(
          'INVALID_OPTIONS',
          `Question ${i + 1} must have exactly 4 options, got ${question.options?.length || 0}`
        );
      }

      // Validate each option is not empty
      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j] || question.options[j].trim().length === 0) {
          throw this.createError(
            'INVALID_OPTION',
            `Question ${i + 1}, option ${j + 1} is empty`
          );
        }
      }

      // Validate correct answer index (0-3)
      if (
        typeof question.correct_answer_index !== 'number' ||
        question.correct_answer_index < 0 ||
        question.correct_answer_index > 3
      ) {
        throw this.createError(
          'INVALID_ANSWER_INDEX',
          `Question ${i + 1} has invalid correct answer index: ${question.correct_answer_index}`
        );
      }

      // Ensure explanation exists (can be empty string)
      if (question.explanation === undefined || question.explanation === null) {
        question.explanation = '';
      }
    }

    return validQuestions;
  }

  /**
   * Calculate quiz score percentage
   * - Compares student answers to correct answers
   * - Returns percentage of correct answers
   * 
   * Requirements: 3.5
   */
  private calculateScore(questions: QuizQuestion[], answers: number[]): number {
    if (questions.length === 0) {
      return 0;
    }

    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correct_answer_index) {
        correctCount++;
      }
    }

    return (correctCount / questions.length) * 100;
  }

  /**
   * Update leaderboard with quiz score
   * - Adds score to student's daily leaderboard entry
   * 
   * Requirements: 3.6
   */
  private async updateLeaderboard(studentId: string, scorePercentage: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get or create today's leaderboard entry
      const { data: existingEntry, error: fetchError } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw this.handleSupabaseError(fetchError);
      }

      if (existingEntry) {
        // Update existing entry
        const newScore = existingEntry.score + Math.round(scorePercentage);
        await supabase
          .from('leaderboard_entries')
          .update({
            score: newScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEntry.id);
      } else {
        // Create new entry
        await supabase
          .from('leaderboard_entries')
          .insert({
            student_id: studentId,
            date: today,
            score: Math.round(scorePercentage),
            rank: null,
            reward_coins: 0,
          });
      }
    } catch (error) {
      // Log error but don't throw - leaderboard update is not critical
      console.error('Failed to update leaderboard:', error);
    }
  }

  /**
   * Create a QuizError
   */
  private createError(code: string, message: string): QuizError {
    return { code, message };
  }

  /**
   * Check if error is a QuizError
   */
  private isQuizError(error: unknown): error is QuizError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to QuizError
   */
  private handleSupabaseError(error: { message: string; code?: string }): QuizError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Quiz not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this quiz');
    }

    if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
      return this.createError('QUIZ_EXISTS', 'Quiz already exists for this lesson');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const quizService = new QuizService();
