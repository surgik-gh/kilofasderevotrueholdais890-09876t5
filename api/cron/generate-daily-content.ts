/**
 * Daily Content Generation Cron Job
 * Runs daily at midnight UTC
 * Generates 3 daily quests for all active students using GPT-OSS-120B
 * 
 * Vercel Cron Job
 * Schedule: 0 0 * * * (midnight daily)
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7, 9.8
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Groq client for AI generation
const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Subject list for quest generation
const SUBJECTS = [
  'Математика',
  'Русский язык',
  'Физика',
  'Химия',
  'Биология',
  'История',
  'Обществознание',
  'Информатика',
  'Английский язык',
  'Геометрия',
];

// Difficulty levels
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

// Quest condition types
type QuestConditionType =
  | 'create_lessons'
  | 'complete_quizzes'
  | 'quiz_score_above'
  | 'leaderboard_top'
  | 'expert_chat_messages'
  | 'study_subjects';

interface GeneratedQuest {
  title: string;
  description: string;
  condition_type: QuestConditionType;
  condition_value: number;
  reward_coins: number;
  reward_xp: number;
  difficulty: DifficultyLevel;
  subject?: string;
}

/**
 * Generate quests using GPT-OSS-120B (llama-3.3-70b-versatile)
 */
async function generateQuestsWithAI(
  studentGrade: string,
  weakSubjects: string[]
): Promise<GeneratedQuest[]> {
  const systemPrompt = `Ты — генератор образовательных квестов для школьников. Создавай интересные и мотивирующие задания.

ВАЖНО: Отвечай ТОЛЬКО валидным JSON массивом, без markdown, без объяснений.

Формат ответа (строго JSON):
[
  {
    "title": "Название квеста",
    "description": "Описание задания",
    "condition_type": "тип условия",
    "condition_value": число,
    "reward_coins": число монет,
    "reward_xp": число опыта,
    "difficulty": "easy|medium|hard",
    "subject": "предмет (опционально)"
  }
]

Типы условий (condition_type):
- "create_lessons" - создать N уроков
- "complete_quizzes" - пройти N викторин
- "quiz_score_above" - получить N% в викторине
- "leaderboard_top" - войти в топ-N
- "expert_chat_messages" - отправить N сообщений в чат
- "study_subjects" - изучить N предметов

Награды по сложности:
- easy: 15-25 монет, 30-50 опыта
- medium: 25-35 монет, 50-70 опыта
- hard: 35-50 монет, 70-100 опыта

Создай ровно 3 квеста разной сложности (easy, medium, hard).`;

  const userPrompt = `Создай 3 ежедневных квеста для ученика ${studentGrade} класса.
${weakSubjects.length > 0 ? `Слабые предметы ученика: ${weakSubjects.join(', ')}. Учти это при создании квестов.` : ''}

Требования:
1. Один легкий квест (easy)
2. Один средний квест (medium)
3. Один сложный квест (hard)
4. Квесты должны быть разнообразными (разные типы условий)
5. Если есть слабые предметы, хотя бы один квест должен быть связан с ними`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    let jsonStr = response.trim();
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
      return parsed.slice(0, 3).map((q: any) => ({
        title: q.title || 'Ежедневный квест',
        description: q.description || 'Выполните задание',
        condition_type: q.condition_type || 'complete_quizzes',
        condition_value: q.condition_value || 1,
        reward_coins: q.reward_coins || 20,
        reward_xp: q.reward_xp || 40,
        difficulty: q.difficulty || 'medium',
        subject: q.subject,
      }));
    }
  } catch (error) {
    console.error('AI generation failed:', error);
  }

  // Fallback quests if AI generation fails
  return generateFallbackQuests(weakSubjects);
}

/**
 * Generate fallback quests if AI fails
 */
function generateFallbackQuests(weakSubjects: string[]): GeneratedQuest[] {
  const quests: GeneratedQuest[] = [
    {
      title: 'Первые шаги',
      description: 'Пройдите 1 викторину сегодня',
      condition_type: 'complete_quizzes',
      condition_value: 1,
      reward_coins: 20,
      reward_xp: 40,
      difficulty: 'easy',
    },
    {
      title: 'Отличный результат',
      description: 'Получите 80% или выше в викторине',
      condition_type: 'quiz_score_above',
      condition_value: 80,
      reward_coins: 30,
      reward_xp: 60,
      difficulty: 'medium',
    },
    {
      title: 'Войти в топ-10',
      description: 'Займите место в топ-10 рейтинга',
      condition_type: 'leaderboard_top',
      condition_value: 10,
      reward_coins: 40,
      reward_xp: 80,
      difficulty: 'hard',
    },
  ];

  // If there are weak subjects, replace one quest with a subject-specific one
  if (weakSubjects.length > 0) {
    const weakSubject = weakSubjects[0];
    quests[1] = {
      title: `Улучшить ${weakSubject}`,
      description: `Пройдите викторину по предмету ${weakSubject}`,
      condition_type: 'complete_quizzes',
      condition_value: 1,
      reward_coins: 30,
      reward_xp: 60,
      difficulty: 'medium',
      subject: weakSubject,
    };
  }

  return quests;
}

/**
 * Get weak subjects for a student based on assessment results and quiz attempts
 */
async function getWeakSubjects(studentId: string): Promise<string[]> {
  try {
    // Get assessment results
    const { data: assessmentResults } = await supabase
      .from('assessment_results')
      .select('subject, score_percentage')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get quiz attempts
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, score')
      .eq('user_id', studentId)
      .order('attempted_at', { ascending: false })
      .limit(20);

    // Calculate average scores by subject
    const subjectScores: { [subject: string]: number[] } = {};

    // Add assessment scores
    if (assessmentResults) {
      for (const result of assessmentResults) {
        if (!subjectScores[result.subject]) {
          subjectScores[result.subject] = [];
        }
        subjectScores[result.subject].push(result.score_percentage);
      }
    }

    // Add quiz scores (would need to join with quizzes table to get subject)
    // For now, we'll just use assessment results

    // Find subjects with average < 60%
    const weakSubjects: string[] = [];
    for (const [subject, scores] of Object.entries(subjectScores)) {
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (average < 60) {
        weakSubjects.push(subject);
      }
    }

    return weakSubjects;
  } catch (error) {
    console.error('Failed to get weak subjects:', error);
    return [];
  }
}

/**
 * Main handler function
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting daily content generation...');

    // Get all active students
    const { data: students, error: studentsError } = await supabase
      .from('user_profiles')
      .select('id, grade')
      .eq('role', 'student')
      .not('grade', 'is', null);

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    if (!students || students.length === 0) {
      console.log('No students found');
      return res.status(200).json({
        success: true,
        message: 'No students to generate quests for',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Found ${students.length} students`);

    // Calculate time range (today)
    const now = new Date();
    const activeFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const activeUntil = new Date(activeFrom);
    activeUntil.setUTCDate(activeUntil.getUTCDate() + 1);

    let totalQuestsCreated = 0;
    let totalUserQuestsCreated = 0;
    const errors: string[] = [];

    // Generate quests for each student
    for (const student of students) {
      try {
        // Get weak subjects for personalization
        const weakSubjects = await getWeakSubjects(student.id);
        
        // Generate quests using AI
        const generatedQuests = await generateQuestsWithAI(
          student.grade || '5',
          weakSubjects
        );

        // Create quests in database
        for (const questData of generatedQuests) {
          try {
            // Create quest
            const { data: quest, error: questError } = await supabase
              .from('quests')
              .insert({
                title: questData.title,
                description: questData.description,
                quest_type: 'daily',
                condition_type: questData.condition_type,
                condition_value: questData.condition_value,
                reward_coins: questData.reward_coins,
                reward_xp: questData.reward_xp,
                active_from: activeFrom.toISOString(),
                active_until: activeUntil.toISOString(),
              })
              .select()
              .single();

            if (questError) {
              console.error(`Error creating quest for student ${student.id}:`, questError);
              errors.push(`Quest creation failed for student ${student.id}: ${questError.message}`);
              continue;
            }

            if (quest) {
              totalQuestsCreated++;

              // Create user quest
              const { error: userQuestError } = await supabase
                .from('user_quests')
                .insert({
                  user_id: student.id,
                  quest_id: quest.id,
                  progress: 0,
                  completed: false,
                  reward_claimed: false,
                });

              if (userQuestError) {
                console.error(`Error creating user quest for student ${student.id}:`, userQuestError);
                errors.push(`User quest creation failed for student ${student.id}: ${userQuestError.message}`);
              } else {
                totalUserQuestsCreated++;
              }
            }
          } catch (questError) {
            console.error(`Error processing quest for student ${student.id}:`, questError);
            errors.push(`Quest processing failed for student ${student.id}: ${(questError as Error).message}`);
          }
        }
      } catch (studentError) {
        console.error(`Error processing student ${student.id}:`, studentError);
        errors.push(`Student processing failed for ${student.id}: ${(studentError as Error).message}`);
      }
    }

    console.log(`Daily content generation complete. Created ${totalQuestsCreated} quests and ${totalUserQuestsCreated} user quests`);

    return res.status(200).json({
      success: true,
      message: 'Daily content generation completed',
      stats: {
        studentsProcessed: students.length,
        questsCreated: totalQuestsCreated,
        userQuestsCreated: totalUserQuestsCreated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily content generation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Daily content generation failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
