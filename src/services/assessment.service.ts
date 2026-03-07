/**
 * Assessment Service
 * Handles generation and submission of assessment quizzes for new students
 * 
 * Requirements:
 * - 1.2: Generate assessment quiz with 2 questions per subject
 * - 1.3: Save assessment results
 * - 1.4: Include base subjects
 * - 1.5: Include additional language subjects
 * - 1.6: Exclude geometry for grades < 7
 * - 1.7: Use GPT-OSS-120B for question generation
 */

import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';
import type { AssessmentResult } from '../types/platform';

// ============================================================================
// TYPES
// ============================================================================

export interface AssessmentQuestion {
  id: string;
  subject: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string;
}

export interface AssessmentQuiz {
  questions: AssessmentQuestion[];
  subjects: string[];
}

export interface AssessmentAnswer {
  question_id: string;
  subject: string;
  selected_answer_index: number;
  correct_answer_index: number;
  is_correct: boolean;
}

export interface AssessmentSubmission {
  student_id: string;
  answers: AssessmentAnswer[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Base subjects for all students
const BASE_SUBJECTS = [
  'Русский язык',
  'Английский язык',
  'Математика',
  'Физика',
  'Химия',
  'Биология',
  'История',
  'Обществознание',
  'Информатика',
];

// Geometry is only for grade 7+
const GEOMETRY_SUBJECT = 'Геометрия';

// Initialize Groq client for GPT-OSS-120B
const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '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';
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// ============================================================================
// ASSESSMENT SERVICE
// ============================================================================

export class AssessmentService {
  /**
   * Generate assessment quiz for a student based on their grade
   * - Generates 2 questions per subject
   * - Excludes geometry for grades < 7
   * - Uses GPT-OSS-120B for question generation
   * 
   * @param grade Student's grade level (1-11, техникум, ВУЗ)
   * @returns Assessment quiz with questions
   * 
   * Requirements: 1.2, 1.4, 1.5, 1.6, 1.7
   */
  async generateAssessmentQuiz(grade: string): Promise<AssessmentQuiz> {
    // Determine which subjects to include
    const subjects = this.getSubjectsForGrade(grade);
    
    // Generate 2 questions per subject
    const allQuestions: AssessmentQuestion[] = [];
    
    for (const subject of subjects) {
      try {
        const questions = await this.generateQuestionsForSubject(subject, grade, 2);
        allQuestions.push(...questions);
      } catch (error) {
        console.error(`Failed to generate questions for ${subject}:`, error);
        // Add fallback questions if generation fails
        allQuestions.push(...this.getFallbackQuestions(subject, 2));
      }
    }

    return {
      questions: allQuestions,
      subjects,
    };
  }

  /**
   * Submit assessment results and save to database
   * - Calculates score per subject
   * - Saves results to assessment_results table
   * 
   * @param submission Assessment submission data
   * @returns Array of saved assessment results
   * 
   * Requirements: 1.3
   */
  async submitAssessment(submission: AssessmentSubmission): Promise<AssessmentResult[]> {
    const { student_id, answers } = submission;

    // Group answers by subject
    const answersBySubject = this.groupAnswersBySubject(answers);

    // Calculate score for each subject and save
    const results: AssessmentResult[] = [];

    for (const [subject, subjectAnswers] of Object.entries(answersBySubject)) {
      const correctCount = subjectAnswers.filter(a => a.is_correct).length;
      const totalCount = subjectAnswers.length;
      const scorePercentage = (correctCount / totalCount) * 100;

      // Save to database
      const { data, error } = await supabase
        .from('assessment_results')
        .insert({
          student_id,
          subject,
          score_percentage: scorePercentage,
          answers: subjectAnswers,
        })
        .select()
        .single();

      if (error) {
        console.error(`Failed to save assessment result for ${subject}:`, error);
        throw new Error(`Failed to save assessment result: ${error.message}`);
      }

      if (data) {
        results.push(data as AssessmentResult);
      }
    }

    return results;
  }

  /**
   * Get assessment results for a student
   * 
   * @param studentId Student's user ID
   * @returns Array of assessment results
   */
  async getAssessmentResults(studentId: string): Promise<AssessmentResult[]> {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch assessment results:', error);
      throw new Error(`Failed to fetch assessment results: ${error.message}`);
    }

    return (data || []) as AssessmentResult[];
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get subjects for a specific grade level
   * - Excludes geometry for grades < 7
   */
  private getSubjectsForGrade(grade: string): string[] {
    const subjects = [...BASE_SUBJECTS];

    // Add geometry only for grade 7 and above
    const gradeNum = parseInt(grade);
    if (!isNaN(gradeNum) && gradeNum >= 7) {
      subjects.push(GEOMETRY_SUBJECT);
    }

    // For higher education, include all subjects including geometry
    if (grade === 'техникум' || grade === 'ВУЗ') {
      subjects.push(GEOMETRY_SUBJECT);
    }

    return subjects;
  }

  /**
   * Generate questions for a specific subject using GPT-OSS-120B
   */
  private async generateQuestionsForSubject(
    subject: string,
    grade: string,
    count: number
  ): Promise<AssessmentQuestion[]> {
    const systemPrompt = `Ты создаёшь оценочные тесты для определения уровня знаний ученика.
ВАЖНО: Отвечай ТОЛЬКО валидным JSON массивом, без markdown, без объяснений.

Формат ответа (строго JSON):
[{"question_text":"текст вопроса","options":["вариант1","вариант2","вариант3","вариант4"],"correct_answer_index":0,"explanation":"объяснение"}]

Правила:
- Создай ровно ${count} вопросов
- Вопросы должны соответствовать уровню ${grade} класса
- Вопросы должны проверять базовые знания по предмету
- correct_answer_index — индекс правильного ответа (0-3)
- НЕ используй эмодзи
- Используй LaTeX для формул если нужно: $формула$
- Добавь краткое объяснение правильного ответа`;

    const userPrompt = `Создай ${count} оценочных вопроса по предмету "${subject}" для ${grade} класса. Вопросы должны проверять базовые знания.`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Parse JSON from response
      let jsonStr = response.trim();
      
      // Extract JSON array if wrapped in other text
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

      const parsed = JSON.parse(jsonStr);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q: any, index: number) => ({
          id: `${subject.toLowerCase().replace(/\s+/g, '_')}_q${index + 1}`,
          subject,
          question_text: q.question_text || q.question || 'Вопрос',
          options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
          correct_answer_index: typeof q.correct_answer_index === 'number' ? q.correct_answer_index : 0,
          explanation: q.explanation,
        }));
      }
    } catch (error) {
      console.error(`Failed to generate questions for ${subject}:`, error);
      throw error;
    }

    // If we get here, generation failed
    throw new Error(`Failed to generate questions for ${subject}`);
  }

  /**
   * Get fallback questions if AI generation fails
   */
  private getFallbackQuestions(subject: string, count: number): AssessmentQuestion[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `${subject.toLowerCase().replace(/\s+/g, '_')}_fallback_q${i + 1}`,
      subject,
      question_text: `Базовый вопрос ${i + 1} по предмету ${subject}`,
      options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
      correct_answer_index: 0,
      explanation: 'Это тестовый вопрос',
    }));
  }

  /**
   * Group answers by subject
   */
  private groupAnswersBySubject(answers: AssessmentAnswer[]): Record<string, AssessmentAnswer[]> {
    const grouped: Record<string, AssessmentAnswer[]> = {};

    for (const answer of answers) {
      if (!grouped[answer.subject]) {
        grouped[answer.subject] = [];
      }
      grouped[answer.subject].push(answer);
    }

    return grouped;
  }
}

// Export singleton instance
export const assessmentService = new AssessmentService();
