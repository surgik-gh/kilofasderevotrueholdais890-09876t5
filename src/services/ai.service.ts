// AI Service with Groq API integration
// Implements the AIService interface from design.md

import Groq from 'groq-sdk';
import { gamificationOrchestratorService } from './gamification/gamification-orchestrator.service';

// Types from design document
type Subject = 
  | 'mathematics' | 'russian_language' | 'physics' | 'geography' 
  | 'literature' | 'obzh' | 'physical_education' | 'biology' 
  | 'chemistry' | 'history' | 'social_studies' | 'informatics' 
  | 'programming' | 'music' | 'geometry' | 'probability_statistics';

interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
}

// Initialize Groq client
// Use environment variable if available, otherwise use default key
const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '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';
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

// Helper function to call Groq API with error handling
const callGroq = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      model: options.model || 'llama-3.1-8b-instant',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('Groq API error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('Ошибка подключения к AI сервису. Проверьте интернет-соединение.');
    }
    
    if (error.status === 401) {
      throw new Error('Ошибка авторизации AI сервиса. Проверьте API ключ.');
    }
    
    if (error.status === 429) {
      throw new Error('Превышен лимит запросов к AI сервису. Попробуйте позже.');
    }
    
    if (error.status === 500 || error.status === 503) {
      throw new Error('AI сервис временно недоступен. Попробуйте позже.');
    }
    
    throw new Error(`Ошибка AI сервиса: ${error.message || 'Неизвестная ошибка'}`);
  }
};

/**
 * Generate lesson content from a topic or material
 * @param topic - The lesson topic
 * @param subject - The subject area
 * @param material - Optional uploaded material to process
 * @returns Generated lesson content in Markdown format
 */
export const generateLesson = async (
  topic: string, 
  subject: Subject, 
  material?: string
): Promise<string> => {
  const systemPrompt = `Ты — опытный преподаватель ${subject}. Создавай подробные учебные материалы на русском языке.

ВАЖНЫЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
1. Используй Markdown для структуры (заголовки ##, списки, жирный текст)
2. Для математических формул ОБЯЗАТЕЛЬНО используй LaTeX синтаксис:
   - Inline формулы: $формула$ (например: $x^2 + y^2 = r^2$)
   - Block формулы: $$формула$$ (например: $$\\int_0^1 x^2 dx = \\frac{1}{3}$$)
3. Для дробей: $\\frac{числитель}{знаменатель}$
4. Для степеней: $x^{степень}$
5. Для индексов: $x_{индекс}$
6. Для корней: $\\sqrt{выражение}$ или $\\sqrt[n]{выражение}$
7. Для греческих букв: $\\alpha$, $\\beta$, $\\gamma$, $\\pi$, $\\Sigma$
8. Для пределов: $\\lim_{x \\to \\infty}$
9. Для сумм: $\\sum_{i=1}^{n}$
10. НЕ используй эмодзи, только текст и формулы

Структура урока:
1. Введение (краткое описание темы)
2. Основные понятия (определения с формулами где нужно)
3. Подробное объяснение (теория с примерами)
4. Практические примеры (решённые задачи)
5. Выводы и ключевые моменты`;

  let userPrompt: string;
  
  if (material) {
    // Process uploaded material
    userPrompt = `Обработай и структурируй следующий учебный материал по предмету "${subject}":\n\n${material}`;
  } else {
    // Generate from topic
    userPrompt = `Создай подробный учебный материал по теме: "${topic}". Предмет: ${subject}. Урок должен быть информативным, структурированным и понятным для школьников.`;
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  // Use GPT-OSS 120B for lesson generation
  return await callGroq(messages, { model: 'llama-3.3-70b-versatile', maxTokens: 8000 });
};

/**
 * Generate quiz questions from lesson content
 * @param lessonContent - The lesson content to generate questions from
 * @param questionCount - Number of questions to generate
 * @returns Array of quiz questions
 */
export const generateQuiz = async (
  lessonContent: string, 
  questionCount: number
): Promise<QuizQuestion[]> => {
  const systemPrompt = `Ты создаёшь тесты на русском языке. 
ВАЖНО: Отвечай ТОЛЬКО валидным JSON массивом, без markdown, без объяснений.

Формат ответа (строго JSON):
[{"question_text":"текст вопроса","options":["вариант1","вариант2","вариант3","вариант4"],"correct_answer_index":0,"explanation":"объяснение"}]

correct_answer_index — индекс правильного ответа (0-3).
Создай ровно ${questionCount} вопросов.
НЕ используй эмодзи.
Используй LaTeX для формул если они есть.
Добавь краткое объяснение правильного ответа в поле explanation.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Создай тест из ${questionCount} вопросов по этому материалу:\n\n${lessonContent.substring(0, 3000)}` }
  ];

  // Use Llama 3.3 70B for quiz generation (DeepSeek R1 was decommissioned)
  const response = await callGroq(messages, { model: 'llama-3.3-70b-versatile', temperature: 0.5 });
  
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
    .replace(/,\s*}/g, '}')
    // Fix malformed "options":"..." to "options":["..."]
    .replace(/"options"\s*:\s*"([^"]+)"/g, (match, p1) => {
      // If it looks like it should be an array, convert it
      return `"options":["${p1}"]`;
    });

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q: any, index: number) => {
        // Ensure options is an array
        let options = q.options;
        if (typeof options === 'string') {
          options = [options];
        } else if (!Array.isArray(options)) {
          options = ['A', 'B', 'C', 'D'];
        }
        
        return {
          id: `q${index + 1}`,
          question_text: q.question_text || q.question || 'Вопрос',
          options: options,
          correct_answer_index: typeof q.correct_answer_index === 'number' ? q.correct_answer_index : (q.correct ?? 0),
          explanation: q.explanation
        };
      });
    }
  } catch (e) {
    console.error('Failed to parse quiz JSON:', e, jsonStr);
  }
  
  // Fallback quiz if parsing fails
  return Array.from({ length: questionCount }, (_, i) => ({
    id: `q${i + 1}`,
    question_text: `Вопрос ${i + 1} по материалу урока`,
    options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
    correct_answer_index: 0,
    explanation: 'Объяснение будет добавлено'
  }));
};

/**
 * Send a message to expert chat and get AI response
 * @param conversationHistory - Previous messages in the conversation
 * @param newMessage - The new message from the user
 * @param userId - Optional user ID for gamification tracking
 * @returns AI response
 */
export const sendExpertChatMessage = async (
  conversationHistory: ChatMessage[], 
  newMessage: string,
  userId?: string
): Promise<string> => {
  const systemPrompt = `Ты — Alies AI, умный помощник для обучения. Отвечай на русском языке.

ПРАВИЛА:
1. Давай чёткие, понятные ответы
2. Используй примеры где уместно
3. Для математики используй LaTeX: $inline$ и $$block$$
4. НЕ используй эмодзи, только текст
5. Будь дружелюбным, но профессиональным
6. Если не знаешь ответ, честно признайся
7. Помогай с учебными вопросами по всем школьным предметам`;

  // Convert conversation history to Groq format
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history (last 10 messages to avoid token limits)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: 'user', // Simplified: treat all history as user messages
      content: msg.content
    });
  }

  // Add new message
  messages.push({
    role: 'user',
    content: newMessage
  });

  const response = await callGroq(messages);

  // Trigger gamification events if userId is provided
  if (userId) {
    try {
      const gamificationResult = await gamificationOrchestratorService.onExpertChatMessage(userId);
      console.log('Gamification events triggered successfully for expert chat message');
      
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
      // Don't fail the chat message if gamification fails
    }
  }

  return response;
};

/**
 * Estimate token count for text
 * Uses a simple approximation: ~4 characters per token for Russian text
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export const estimateTokens = (text: string): number => {
  // Simple estimation: ~4 characters per token for Russian text
  // This is a rough approximation, actual tokenization may vary
  return Math.ceil(text.length / 4);
};

// Export types for use in other services
export type { Subject, QuizQuestion, ChatMessage };
