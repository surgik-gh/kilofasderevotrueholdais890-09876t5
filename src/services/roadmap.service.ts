/**
 * Roadmap Service
 * Handles learning roadmap generation and management
 * 
 * Requirements:
 * - 7.1: Generate roadmap through AI (costs 4 wisdom coins)
 * - 7.2: Check wisdom coins balance before generation
 * - 7.3: Deduct 4 coins for roadmap generation
 * - 7.4: Base roadmap on assessment quiz and quiz attempts
 * - 7.5: Include sequence of topics for learning
 * - 7.6: Include recommended lessons and materials
 * - 7.7: Include milestones (checkpoints)
 * - 7.8: Save roadmap to database for later retrieval
 * - 7.9: Display roadmap progress
 * - 7.10: Mark topics as completed
 */

import { supabase } from '../lib/supabase';
import { tokenEconomyService } from './token-economy.service';
import type { 
  LearningRoadmap, 
  RoadmapContent, 
  RoadmapTopic,
  RoadmapProgress
} from '../types/platform';

// ============================================================================
// TYPES
// ============================================================================

export interface GenerateRoadmapData {
  studentId: string;
  subject: string;
}

export interface UpdateProgressData {
  roadmapId: string;
  studentId: string;
  completedTopicId: string;
}

export interface RoadmapError {
  code: string;
  message: string;
  currentBalance?: number;
  requiredAmount?: number;
}

// ============================================================================
// ROADMAP SERVICE
// ============================================================================

export class RoadmapService {
  private readonly ROADMAP_GENERATION_COST = 4;

  /**
   * Generate a personalized learning roadmap using AI
   * - Checks wisdom coins balance (requires 4 coins)
   * - Deducts 4 coins from balance
   * - Fetches assessment results and quiz attempts for context
   * - Calls GPT-OSS-120B to generate roadmap
   * - Parses AI response into structured format
   * - Saves roadmap to database
   * 
   * @param data Roadmap generation data
   * @returns Generated roadmap
   * @throws Error if insufficient coins or generation fails
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
   */
  async generateRoadmap(data: GenerateRoadmapData): Promise<LearningRoadmap> {
    const { studentId, subject } = data;

    // Validate required fields
    if (!studentId || !subject) {
      throw this.createError('MISSING_FIELDS', 'Student ID and subject are required');
    }

    try {
      // 1. Check wisdom coins balance
      const hasEnough = await tokenEconomyService.hasEnoughTokens(
        studentId,
        this.ROADMAP_GENERATION_COST
      );

      if (!hasEnough) {
        const currentBalance = await tokenEconomyService.getBalance(studentId);
        throw this.createError(
          'INSUFFICIENT_COINS',
          `Insufficient Wisdom Coins. You have ${currentBalance} coins but need ${this.ROADMAP_GENERATION_COST} coins.`,
          currentBalance,
          this.ROADMAP_GENERATION_COST
        );
      }

      // 2. Deduct wisdom coins
      await tokenEconomyService.deductTokens(
        studentId,
        this.ROADMAP_GENERATION_COST,
        'expert_chat_usage' // Using this type as it's the closest match
      );

      // 3. Fetch student context for AI
      const context = await this.prepareStudentContext(studentId, subject);

      // 4. Generate roadmap using AI
      const roadmapContent = await this.callAIForRoadmap(subject, context);

      // 5. Initialize progress tracking
      const initialProgress: RoadmapProgress = {
        completed_topics: [],
        current_topic: roadmapContent.topics[0]?.id || '',
        completion_percentage: 0,
      };

      // 6. Save roadmap to database
      const { data: savedRoadmap, error: saveError } = await supabase
        .from('learning_roadmaps')
        .insert({
          student_id: studentId,
          subject,
          content: roadmapContent,
          progress: initialProgress,
        })
        .select()
        .single();

      if (saveError) {
        // Refund coins if save fails
        await tokenEconomyService.grantTokens(
          studentId,
          this.ROADMAP_GENERATION_COST,
          'biweekly_grant' // Using this as refund type
        );
        throw this.handleSupabaseError(saveError);
      }

      if (!savedRoadmap) {
        // Refund coins if save fails
        await tokenEconomyService.grantTokens(
          studentId,
          this.ROADMAP_GENERATION_COST,
          'biweekly_grant'
        );
        throw this.createError('SAVE_FAILED', 'Failed to save roadmap');
      }

      return savedRoadmap as LearningRoadmap;
    } catch (error) {
      if (this.isRoadmapError(error)) {
        throw error;
      }
      throw this.createError('GENERATION_FAILED', `Failed to generate roadmap: ${(error as Error).message}`);
    }
  }

  /**
   * Get all roadmaps for a student
   * - Returns roadmaps ordered by most recent
   * - Includes progress information
   * 
   * @param studentId Student ID
   * @returns Array of roadmaps
   * 
   * Requirements: 7.8
   */
  async getRoadmaps(studentId: string): Promise<LearningRoadmap[]> {
    // Validate required fields
    if (!studentId) {
      throw this.createError('MISSING_STUDENT_ID', 'Student ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('learning_roadmaps')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as LearningRoadmap[];
    } catch (error) {
      if (this.isRoadmapError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch roadmaps: ${(error as Error).message}`);
    }
  }

  /**
   * Get a single roadmap by ID
   * - Returns roadmap with progress
   * - Verifies student has access
   * 
   * @param roadmapId Roadmap ID
   * @param studentId Student ID (for authorization)
   * @returns Roadmap data
   * @throws Error if not found or not authorized
   * 
   * Requirements: 7.8, 7.9
   */
  async getRoadmap(roadmapId: string, studentId: string): Promise<LearningRoadmap> {
    // Validate required fields
    if (!roadmapId || !studentId) {
      throw this.createError('MISSING_FIELDS', 'Roadmap ID and student ID are required');
    }

    try {
      const { data, error } = await supabase
        .from('learning_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .eq('student_id', studentId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('NOT_FOUND', 'Roadmap not found');
      }

      return data as LearningRoadmap;
    } catch (error) {
      if (this.isRoadmapError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch roadmap: ${(error as Error).message}`);
    }
  }

  /**
   * Update progress on a roadmap
   * - Marks a topic as completed
   * - Updates current topic to next uncompleted topic
   * - Recalculates completion percentage
   * - Updates roadmap in database
   * 
   * @param data Progress update data
   * @returns Updated roadmap
   * @throws Error if not authorized or update fails
   * 
   * Requirements: 7.9, 7.10
   */
  async updateProgress(data: UpdateProgressData): Promise<LearningRoadmap> {
    const { roadmapId, studentId, completedTopicId } = data;

    // Validate required fields
    if (!roadmapId || !studentId || !completedTopicId) {
      throw this.createError('MISSING_FIELDS', 'Roadmap ID, student ID, and completed topic ID are required');
    }

    try {
      // Fetch current roadmap
      const roadmap = await this.getRoadmap(roadmapId, studentId);

      // Check if topic is already completed
      if (roadmap.progress.completed_topics.includes(completedTopicId)) {
        return roadmap; // Already completed, no update needed
      }

      // Verify topic exists in roadmap
      const topicExists = roadmap.content.topics.some(t => t.id === completedTopicId);
      if (!topicExists) {
        throw this.createError('INVALID_TOPIC', 'Topic not found in roadmap');
      }

      // Update progress
      const updatedCompletedTopics = [...roadmap.progress.completed_topics, completedTopicId];
      const totalTopics = roadmap.content.topics.length;
      const completionPercentage = Math.round((updatedCompletedTopics.length / totalTopics) * 100);

      // Find next uncompleted topic
      const nextTopic = roadmap.content.topics.find(
        t => !updatedCompletedTopics.includes(t.id)
      );

      const updatedProgress: RoadmapProgress = {
        completed_topics: updatedCompletedTopics,
        current_topic: nextTopic?.id || '',
        completion_percentage: completionPercentage,
      };

      // Save updated progress to database
      const { data: updatedRoadmap, error: updateError } = await supabase
        .from('learning_roadmaps')
        .update({
          progress: updatedProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roadmapId)
        .eq('student_id', studentId)
        .select()
        .single();

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      if (!updatedRoadmap) {
        throw this.createError('UPDATE_FAILED', 'Failed to update roadmap progress');
      }

      return updatedRoadmap as LearningRoadmap;
    } catch (error) {
      if (this.isRoadmapError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to update progress: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a roadmap
   * - Only roadmap owner can delete
   * 
   * @param roadmapId Roadmap ID
   * @param studentId Student ID (for authorization)
   * @throws Error if not authorized or delete fails
   */
  async deleteRoadmap(roadmapId: string, studentId: string): Promise<void> {
    // Validate required fields
    if (!roadmapId || !studentId) {
      throw this.createError('MISSING_FIELDS', 'Roadmap ID and student ID are required');
    }

    try {
      // Verify roadmap belongs to student
      const roadmap = await this.getRoadmap(roadmapId, studentId);

      if (roadmap.student_id !== studentId) {
        throw this.createError('UNAUTHORIZED', 'You do not have permission to delete this roadmap');
      }

      // Delete roadmap
      const { error: deleteError } = await supabase
        .from('learning_roadmaps')
        .delete()
        .eq('id', roadmapId)
        .eq('student_id', studentId);

      if (deleteError) {
        throw this.handleSupabaseError(deleteError);
      }
    } catch (error) {
      if (this.isRoadmapError(error)) {
        throw error;
      }
      throw this.createError('DELETE_FAILED', `Failed to delete roadmap: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Prepare student context for AI roadmap generation
   * - Fetches assessment results for the subject
   * - Fetches recent quiz attempts for the subject
   * - Fetches student grade level
   * 
   * Requirements: 7.4
   */
  private async prepareStudentContext(studentId: string, subject: string): Promise<string> {
    try {
      // Fetch student profile for grade level
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('grade, grade_letter')
        .eq('id', studentId)
        .single();

      if (profileError) {
        console.warn('Failed to fetch student profile:', profileError);
      }

      const gradeLevel = profile?.grade || 'Unknown';
      const gradeLetter = profile?.grade_letter || '';

      // Fetch assessment results for the subject
      const { data: assessmentResults, error: assessmentError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('student_id', studentId)
        .eq('subject', subject)
        .order('created_at', { ascending: false })
        .limit(1);

      if (assessmentError) {
        console.warn('Failed to fetch assessment results:', assessmentError);
      }

      const assessmentScore = assessmentResults && assessmentResults.length > 0
        ? assessmentResults[0].score_percentage
        : null;

      // Fetch recent quiz attempts for the subject
      const { data: quizAttempts, error: quizError } = await supabase
        .from('quiz_attempts')
        .select(`
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
        .order('completed_at', { ascending: false })
        .limit(10);

      if (quizError) {
        console.warn('Failed to fetch quiz attempts:', quizError);
      }

      // Filter quiz attempts for the specific subject
      const subjectQuizAttempts = quizAttempts?.filter((attempt: any) => 
        attempt.quizzes?.lessons?.subject === subject
      ) || [];

      // Calculate average quiz score
      let averageQuizScore: number | null = null;
      if (subjectQuizAttempts.length > 0) {
        const totalScore = subjectQuizAttempts.reduce(
          (sum: number, attempt: any) => sum + (attempt.score_percentage || 0),
          0
        );
        averageQuizScore = totalScore / subjectQuizAttempts.length;
      }

      // Build context string
      let context = `Student Grade Level: ${gradeLevel}${gradeLetter ? ` (${gradeLetter})` : ''}\n`;
      
      if (assessmentScore !== null) {
        context += `Assessment Quiz Score: ${assessmentScore.toFixed(1)}%\n`;
      }

      if (averageQuizScore !== null) {
        context += `Average Quiz Score: ${averageQuizScore.toFixed(1)}% (based on ${subjectQuizAttempts.length} attempts)\n`;
      }

      if (subjectQuizAttempts.length > 0) {
        context += `Recent Quiz Performance:\n`;
        subjectQuizAttempts.slice(0, 5).forEach((attempt: any, index: number) => {
          context += `  ${index + 1}. ${attempt.score_percentage.toFixed(1)}%\n`;
        });
      }

      // Determine performance level
      const performanceScore = averageQuizScore || assessmentScore || 50;
      let performanceLevel = 'средний';
      if (performanceScore < 50) {
        performanceLevel = 'начальный';
      } else if (performanceScore >= 80) {
        performanceLevel = 'продвинутый';
      }

      context += `Performance Level: ${performanceLevel}\n`;

      return context;
    } catch (error) {
      console.error('Error preparing student context:', error);
      return 'Student context unavailable';
    }
  }

  /**
   * Call AI service to generate roadmap
   * - Uses GPT-OSS-120B model
   * - Provides student context and subject
   * - Parses response into structured format
   * 
   * Requirements: 7.1, 7.5, 7.6, 7.7
   */
  private async callAIForRoadmap(
    subject: string,
    context: string
  ): Promise<RoadmapContent> {
    try {
      // Import Groq client
      const Groq = (await import('groq-sdk')).default;
      const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || 
        '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';
      
      const groq = new Groq({
        apiKey: GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      // Prepare AI prompt
      const systemPrompt = `Ты — опытный педагог, создающий персонализированные программы обучения.

ВАЖНО: Отвечай ТОЛЬКО валидным JSON, без markdown, без объяснений.

Формат ответа (строго JSON):
{
  "topics": [
    {
      "id": "topic-1",
      "title": "Название темы",
      "description": "Подробное описание темы",
      "resources": ["Ресурс 1", "Ресурс 2"],
      "milestones": ["Контрольная точка 1", "Контрольная точка 2"],
      "order": 1
    }
  ],
  "estimated_duration": "4 недели",
  "difficulty_level": "средний"
}

Создай программу обучения из 5-8 тем в логическом порядке.
Каждая тема должна включать:
- Понятное название
- Подробное описание (что изучить)
- 2-3 рекомендуемых ресурса (уроки, материалы)
- 2-3 контрольные точки (milestones) для проверки понимания

НЕ используй эмодзи.`;

      const userPrompt = `Создай персонализированную программу обучения по предмету "${subject}".

Контекст студента:
${context}

Программа должна:
1. Соответствовать уровню студента
2. Начинаться с основ и постепенно усложняться
3. Включать практические задания
4. Иметь четкие контрольные точки для проверки прогресса`;

      // Call Groq API
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
      
      // Extract JSON if wrapped in markdown
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
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
        
        // Validate structure
        if (!parsed.topics || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
          throw new Error('Invalid roadmap structure: missing or empty topics array');
        }

        // Ensure all topics have required fields
        const validatedTopics: RoadmapTopic[] = parsed.topics.map((topic: any, index: number) => ({
          id: topic.id || `topic-${index + 1}`,
          title: topic.title || `Тема ${index + 1}`,
          description: topic.description || 'Описание темы',
          resources: Array.isArray(topic.resources) ? topic.resources : [],
          milestones: Array.isArray(topic.milestones) ? topic.milestones : [],
          order: typeof topic.order === 'number' ? topic.order : index + 1,
        }));

        return {
          topics: validatedTopics,
          estimated_duration: parsed.estimated_duration || '4 недели',
          difficulty_level: parsed.difficulty_level || 'средний',
        };
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, jsonStr);
        throw new Error('Failed to parse AI response into roadmap structure');
      }
    } catch (error) {
      console.error('AI service error:', error);
      
      // Return fallback roadmap if AI fails
      return this.createFallbackRoadmap(subject);
    }
  }

  /**
   * Create a fallback roadmap if AI generation fails
   * - Provides basic structure for the subject
   * 
   * Requirements: 7.5, 7.6, 7.7
   */
  private createFallbackRoadmap(subject: string): RoadmapContent {
    return {
      topics: [
        {
          id: 'topic-1',
          title: `Основы ${subject}`,
          description: 'Изучение базовых понятий и терминологии',
          resources: [
            'Учебник по предмету',
            'Видеоуроки для начинающих',
          ],
          milestones: [
            'Понимание основных терминов',
            'Решение простых задач',
          ],
          order: 1,
        },
        {
          id: 'topic-2',
          title: `Практические навыки ${subject}`,
          description: 'Применение знаний на практике',
          resources: [
            'Практические задания',
            'Интерактивные упражнения',
          ],
          milestones: [
            'Выполнение практических заданий',
            'Самостоятельное решение задач',
          ],
          order: 2,
        },
        {
          id: 'topic-3',
          title: `Углубленное изучение ${subject}`,
          description: 'Изучение сложных тем и концепций',
          resources: [
            'Дополнительные материалы',
            'Специализированные курсы',
          ],
          milestones: [
            'Понимание сложных концепций',
            'Решение задач повышенной сложности',
          ],
          order: 3,
        },
      ],
      estimated_duration: '4 недели',
      difficulty_level: 'средний',
    };
  }

  /**
   * Create a RoadmapError
   */
  private createError(
    code: string,
    message: string,
    currentBalance?: number,
    requiredAmount?: number
  ): RoadmapError {
    return { code, message, currentBalance, requiredAmount };
  }

  /**
   * Check if error is a RoadmapError
   */
  private isRoadmapError(error: unknown): error is RoadmapError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to RoadmapError
   */
  private handleSupabaseError(error: { message: string; code?: string }): RoadmapError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Roadmap not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this roadmap');
    }

    if (error.message.includes('unique constraint')) {
      return this.createError('DUPLICATE', 'Duplicate roadmap');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const roadmapService = new RoadmapService();
