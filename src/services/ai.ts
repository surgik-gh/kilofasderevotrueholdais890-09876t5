// AI Service with Groq API integration
// Implements the AIService interface from design.md

import Groq from 'groq-sdk';

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
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

// Helper function to call Groq API with error handling
const callGroq = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('Groq API error:', error);
    throw new Error(`AI service error: ${error.message || 'Unknown error'}`);
  }
};

// Generate lesson from topic (using gpt-oss-120B via OpenRouter, fallback to Groq)
export const generateLesson = async (topic: string, subject: string): Promise<string> => {
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

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Создай подробный учебный материал по теме: "${topic}". Предмет: ${subject}. Урок должен быть информативным, структурированным и понятным для школьников.` }
  ];

  // Try OpenRouter with gpt-oss-120B first, fallback to Groq
  try {
    return await callOpenRouter('nousresearch/gpt-oss-120b', messages);
  } catch (error) {
    console.log('Falling back to Groq for lesson generation');
    return await callGroq(messages);
  }
};

// Process uploaded material (using Kimi K2-0905 via OpenRouter, fallback to Groq)
export const processUploadedMaterial = async (material: string, subject: string): Promise<string> => {
  const systemPrompt = `Ты — редактор учебных материалов. Твоя задача — взять исходный текст и превратить его в качественный учебный материал на русском языке.

ЗАДАЧИ:
1. Убери лишнее и воду
2. Структурируй материал логически
3. Добавь чёткие заголовки и подзаголовки
4. Выдели ключевые понятия
5. Добавь примеры где необходимо

ПРАВИЛА ФОРМАТИРОВАНИЯ:
1. Используй Markdown (##, ###, списки, **жирный**)
2. Для математики используй LaTeX: $inline$ и $$block$$
3. НЕ используй эмодзи

Выходной формат:
## Введение
[краткое введение]

## Основные понятия
[определения]

## Детальный разбор
[основной материал]

## Примеры
[практические примеры]

## Выводы
[ключевые моменты]`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Обработай и структурируй следующий учебный материал по предмету "${subject}":\n\n${material}` }
  ];

  // Try OpenRouter with Kimi K2 first, fallback to Groq
  try {
    return await callOpenRouter('moonshotai/kimi-k2-instruct', messages);
  } catch (error) {
    console.log('Falling back to Groq for material processing');
    return await callGroq(messages);
  }
};

// Generate quiz using gpt-oss-20b (via OpenRouter or similar)
export const generateQuiz = async (lessonContent: string): Promise<{ question: string; options: string[]; correct: number }[]> => {
  const systemPrompt = `Ты создаёшь тесты на русском языке. 
ВАЖНО: Отвечай ТОЛЬКО валидным JSON массивом, без markdown, без объяснений.

Формат ответа (строго JSON):
[{"question":"текст вопроса","options":["вариант1","вариант2","вариант3","вариант4"],"correct":0}]

correct — индекс правильного ответа (0-3).
Создай ровно 5 вопросов.
НЕ используй эмодзи.
Используй LaTeX для формул если они есть.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Создай тест из 5 вопросов по этому материалу:\n\n${lessonContent.substring(0, 3000)}` }
  ];

  // Try OpenRouter gpt-oss-20b, fallback to Groq Llama
  try {
    const data = await callOpenRouter('gpt-oss-20b', messages);
    // Parse response
    let jsonStr = data.trim();
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    
    // Clean up
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.log('Falling back to Groq for quiz');
  }

  // Use Groq for fast quiz generation (Fallback)
  const response = await callGroq(messages);
  
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

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q: { question: string; options: string[]; correct: number }) => ({
        question: q.question || 'Вопрос',
        options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
        correct: typeof q.correct === 'number' ? q.correct : 0
      }));
    }
  } catch (e) {
    console.error('Failed to parse quiz JSON:', e, jsonStr);
  }
  
  // Fallback quiz
  return [
    { question: 'Какой основной термин был рассмотрен в уроке?', options: ['Термин A', 'Термин B', 'Термин C', 'Термин D'], correct: 0 },
    { question: 'Что является ключевой концепцией данной темы?', options: ['Концепция 1', 'Концепция 2', 'Концепция 3', 'Концепция 4'], correct: 1 },
    { question: 'Какой пример лучше всего иллюстрирует тему?', options: ['Пример A', 'Пример B', 'Пример C', 'Пример D'], correct: 2 },
    { question: 'Какой вывод можно сделать из материала?', options: ['Вывод 1', 'Вывод 2', 'Вывод 3', 'Вывод 4'], correct: 0 },
    { question: 'Как применить полученные знания на практике?', options: ['Способ A', 'Способ B', 'Способ C', 'Способ D'], correct: 1 }
  ];
};

// Expert chat response
export const getExpertResponse = async (message: string, context: string = ''): Promise<string> => {
  const systemPrompt = `Ты — Alies AI, умный помощник для обучения. Отвечай на русском языке.

ПРАВИЛА:
1. Давай чёткие, понятные ответы
2. Используй примеры где уместно
3. Для математики используй LaTeX: $inline$ и $$block$$
4. НЕ используй эмодзи, только текст
5. Будь дружелюбным, но профессиональным

${context ? `Контекст беседы: ${context}` : ''}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ];

  return await callGroq(messages);
};
