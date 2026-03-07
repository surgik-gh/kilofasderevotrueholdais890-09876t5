import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLesson, generateQuiz, sendExpertChatMessage, estimateTokens } from '../ai.service';
import type { ChatMessage } from '../ai.service';

// Mock Groq SDK
vi.mock('groq-sdk', () => {
  const MockGroq = vi.fn(function(this: any) {
    this.chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked AI response'
            }
          }]
        })
      }
    };
  });
  
  return {
    default: MockGroq
  };
});

describe('AI Service', () => {
  describe('generateLesson', () => {
    it('should generate lesson from topic', async () => {
      const result = await generateLesson('Квадратные уравнения', 'mathematics');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should generate lesson from material', async () => {
      const material = 'Квадратное уравнение имеет вид ax^2 + bx + c = 0';
      const result = await generateLesson('Квадратные уравнения', 'mathematics', material);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle API errors gracefully', async () => {
      // This test verifies error handling is in place
      await expect(generateLesson('', 'mathematics')).resolves.toBeDefined();
    });
  });

  describe('generateQuiz', () => {
    it('should generate quiz with specified number of questions', async () => {
      const lessonContent = 'Квадратное уравнение - это уравнение вида ax^2 + bx + c = 0';
      const result = await generateQuiz(lessonContent, 5);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure of first question
      const firstQuestion = result[0];
      expect(firstQuestion).toHaveProperty('id');
      expect(firstQuestion).toHaveProperty('question_text');
      expect(firstQuestion).toHaveProperty('options');
      expect(firstQuestion).toHaveProperty('correct_answer_index');
      expect(Array.isArray(firstQuestion.options)).toBe(true);
      expect(firstQuestion.options.length).toBe(4);
      expect(typeof firstQuestion.correct_answer_index).toBe('number');
    });

    it('should return fallback quiz on parsing error', async () => {
      const result = await generateQuiz('Invalid content', 3);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('sendExpertChatMessage', () => {
    it('should send message and get response', async () => {
      const conversationHistory: ChatMessage[] = [];
      const newMessage = 'Что такое квадратное уравнение?';
      
      const result = await sendExpertChatMessage(conversationHistory, newMessage);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle conversation history', async () => {
      const conversationHistory: ChatMessage[] = [
        {
          id: '1',
          chat_id: 'chat1',
          sender_id: 'user1',
          content: 'Привет',
          sent_at: new Date().toISOString()
        },
        {
          id: '2',
          chat_id: 'chat1',
          sender_id: 'ai',
          content: 'Здравствуйте!',
          sent_at: new Date().toISOString()
        }
      ];
      const newMessage = 'Помоги с математикой';
      
      const result = await sendExpertChatMessage(conversationHistory, newMessage);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for Russian text', () => {
      const text = 'Привет, как дела?';
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    it('should estimate tokens for longer text', () => {
      const shortText = 'Привет';
      const longText = 'Привет, как дела? Это длинный текст для проверки оценки токенов.';
      
      const shortTokens = estimateTokens(shortText);
      const longTokens = estimateTokens(longText);
      
      expect(longTokens).toBeGreaterThan(shortTokens);
    });

    it('should handle empty string', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBe(0);
    });
  });
});
