/**
 * Weekly Challenge Generation Cron Job
 * Runs weekly on Monday at midnight UTC
 * Generates 1 weekly challenge for all users using GPT-OSS-120B
 * 
 * Vercel Cron Job
 * Schedule: 0 0 * * 1 (Monday at midnight)
 * 
 * Requirements: 9.1, 9.5, 9.9, 9.10
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

// Challenge types
type ChallengeType = 'most_lessons' | 'most_quizzes' | 'highest_score';

interface GeneratedChallenge {
  title: string;
  description: string;
  challenge_type: ChallengeType;
  target_value: number;
  reward_coins: number;
  reward_xp: number;
  duration_days: number;
}

/**
 * Generate a weekly challenge using GPT-OSS-120B (llama-3.3-70b-versatile)
 */
async function generateChallengeWithAI(): Promise<GeneratedChallenge> {
  const systemPrompt = `Ты — генератор еженедельных челленджей для образовательной платформы. Создавай интересные соревновательные задания для школьников.

ВАЖНО: Отвечай ТОЛЬКО валидным JSON объектом, без markdown, без объяснений.

Формат ответа (строго JSON):
{
  "title": "Название челленджа",
  "description": "Описание соревнования",
  "challenge_type": "тип челленджа",
  "target_value": число,
  "reward_coins": число монет,
  "reward_xp": число опыта,
  "duration_days": 7
}

Типы челленджей (challenge_type):
- "most_lessons" - создать больше всего уроков
- "most_quizzes" - пройти больше всего викторин
- "highest_score" - набрать больше всего очков в рейтинге

Награды для недельных челленджей:
- reward_coins: 100-200 монет
- reward_xp: 200-400 опыта
- duration_days: всегда 7

Целевые значения (target_value):
- most_lessons: 5-10 уроков
- most_quizzes: 10-20 викторин
- highest_score: 500-1000 очков`;

  const userPrompt = `Создай интересный еженедельный челлендж для школьников.

Требования:
1. Челлендж должен быть достижимым, но требовать усилий
2. Описание должно мотивировать участвовать
3. Тип челленджа должен быть разнообразным (выбери один из трёх типов)
4. Длительность всегда 7 дней
5. Награды должны быть привлекательными`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    let jsonStr = response.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    // Clean up common issues
    jsonStr = jsonStr
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/,\s*}/g, '}');

    const parsed = JSON.parse(jsonStr);
    
    return {
      title: parsed.title || 'Еженедельный челлендж',
      description: parsed.description || 'Соревнуйтесь с другими учениками',
      challenge_type: parsed.challenge_type || 'most_quizzes',
      target_value: parsed.target_value || 10,
      reward_coins: parsed.reward_coins || 150,
      reward_xp: parsed.reward_xp || 300,
      duration_days: 7,
    };
  } catch (error) {
    console.error('AI generation failed:', error);
    return generateFallbackChallenge();
  }
}

/**
 * Generate fallback challenge if AI fails
 */
function generateFallbackChallenge(): GeneratedChallenge {
  const challengeTypes: ChallengeType[] = ['most_lessons', 'most_quizzes', 'highest_score'];
  const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

  const challenges: { [key in ChallengeType]: GeneratedChallenge } = {
    most_lessons: {
      title: 'Марафон знаний',
      description: 'Создайте больше всего уроков за неделю и станьте чемпионом!',
      challenge_type: 'most_lessons',
      target_value: 7,
      reward_coins: 150,
      reward_xp: 300,
      duration_days: 7,
    },
    most_quizzes: {
      title: 'Викторина недели',
      description: 'Пройдите больше всего викторин и докажите свои знания!',
      challenge_type: 'most_quizzes',
      target_value: 15,
      reward_coins: 150,
      reward_xp: 300,
      duration_days: 7,
    },
    highest_score: {
      title: 'Гонка за лидерством',
      description: 'Наберите больше всего очков в рейтинге за неделю!',
      challenge_type: 'highest_score',
      target_value: 1000,
      reward_coins: 200,
      reward_xp: 400,
      duration_days: 7,
    },
  };

  return challenges[randomType];
}

/**
 * Send notifications to all users about new challenge
 */
async function sendChallengeNotifications(challengeId: string, challengeTitle: string): Promise<number> {
  try {
    // Get all active users (students)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'student');

    if (usersError) {
      console.error('Failed to fetch users for notifications:', usersError);
      return 0;
    }

    if (!users || users.length === 0) {
      console.log('No users to notify');
      return 0;
    }

    // Create notifications for all users
    const notifications = users.map(user => ({
      user_id: user.id,
      type: 'challenge_available',
      title: 'Новый еженедельный челлендж!',
      message: `Присоединяйтесь к челленджу "${challengeTitle}" и соревнуйтесь с другими учениками!`,
      data: { challenge_id: challengeId },
      read: false,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Failed to create notifications:', notificationError);
      return 0;
    }

    console.log(`Sent ${notifications.length} notifications`);
    return notifications.length;
  } catch (error) {
    console.error('Error sending notifications:', error);
    return 0;
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
    console.log('Starting weekly challenge generation...');

    // Generate challenge using AI
    const challengeData = await generateChallengeWithAI();

    // Calculate time range (this week - Monday to Monday)
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    // Adjust to Monday if not already
    const dayOfWeek = startDate.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setUTCDate(startDate.getUTCDate() + daysToMonday);
    
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    // Create challenge in database
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert({
        creator_id: null, // System-generated challenge
        title: challengeData.title,
        description: challengeData.description,
        challenge_type: challengeData.challenge_type,
        target_value: challengeData.target_value,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reward_coins: challengeData.reward_coins,
        reward_xp: challengeData.reward_xp,
        status: 'active',
        winner_id: null,
      })
      .select()
      .single();

    if (challengeError) {
      throw new Error(`Failed to create challenge: ${challengeError.message}`);
    }

    if (!challenge) {
      throw new Error('Challenge creation returned no data');
    }

    console.log(`Created challenge: ${challenge.id} - ${challenge.title}`);

    // Send notifications to all users
    const notificationsSent = await sendChallengeNotifications(challenge.id, challenge.title);

    console.log('Weekly challenge generation complete');

    return res.status(200).json({
      success: true,
      message: 'Weekly challenge generation completed',
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.challenge_type,
        target_value: challenge.target_value,
        reward_coins: challenge.reward_coins,
        reward_xp: challenge.reward_xp,
        start_date: challenge.start_date,
        end_date: challenge.end_date,
      },
      notificationsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weekly challenge generation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Weekly challenge generation failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
