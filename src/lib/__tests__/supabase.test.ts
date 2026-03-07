/**
 * Basic type checking tests for Supabase configuration
 * These tests verify that the types are correctly defined
 */

import { describe, it, expect } from 'vitest';
import type { 
  UserProfile, 
  School, 
  Lesson, 
  Quiz, 
  QuizAttempt,
  Chat,
  LeaderboardEntry,
  SupportTicket,
  Transaction,
  SubscriptionTier,
  Subject
} from '../supabase';

describe('Supabase Types', () => {
  it('should have correct UserProfile type structure', () => {
    const mockProfile: UserProfile = {
      id: '123',
      email: 'test@example.com',
      role: 'student',
      full_name: 'Test User',
      school_id: '456',
      subscription_tier: 'student_freemium',
      wisdom_coins: 50,
      daily_login_streak: 0,
      last_login_date: '2024-01-01',
      free_expert_queries_remaining: 5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    expect(mockProfile.role).toBe('student');
    expect(mockProfile.wisdom_coins).toBe(50);
  });

  it('should have correct School type structure', () => {
    const mockSchool: School = {
      id: '123',
      name: 'Test School',
      address: '123 Test St',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    expect(mockSchool.name).toBe('Test School');
  });

  it('should have correct Lesson type structure', () => {
    const mockLesson: Lesson = {
      id: '123',
      title: 'Test Lesson',
      subject: 'mathematics',
      content: 'Lesson content',
      creator_id: '456',
      creator_role: 'teacher',
      school_id: '789',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    expect(mockLesson.subject).toBe('mathematics');
    expect(mockLesson.creator_role).toBe('teacher');
  });

  it('should have correct Quiz type structure', () => {
    const mockQuiz: Quiz = {
      id: '123',
      lesson_id: '456',
      title: 'Test Quiz',
      questions: [
        {
          id: 'q1',
          question_text: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correct_answer_index: 1,
          explanation: 'Basic addition',
        },
      ],
      created_by: '789',
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(mockQuiz.questions).toHaveLength(1);
    expect(mockQuiz.questions[0].correct_answer_index).toBe(1);
  });

  it('should have correct QuizAttempt type structure', () => {
    const mockAttempt: QuizAttempt = {
      id: '123',
      quiz_id: '456',
      student_id: '789',
      answers: [1, 2, 0],
      score_percentage: 66.67,
      counts_for_leaderboard: true,
      completed_at: '2024-01-01T00:00:00Z',
    };

    expect(mockAttempt.score_percentage).toBe(66.67);
    expect(mockAttempt.counts_for_leaderboard).toBe(true);
  });

  it('should have correct Chat type structure', () => {
    const mockChat: Chat = {
      id: '123',
      name: 'Test Chat',
      type: 'public',
      school_id: null,
      invitation_code: 'ABC123',
      created_by: '456',
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(mockChat.type).toBe('public');
    expect(mockChat.invitation_code).toBe('ABC123');
  });

  it('should have correct LeaderboardEntry type structure', () => {
    const mockEntry: LeaderboardEntry = {
      id: '123',
      student_id: '456',
      date: '2024-01-01',
      score: 100,
      rank: 1,
      reward_coins: 50,
      updated_at: '2024-01-01T00:00:00Z',
    };

    expect(mockEntry.score).toBe(100);
    expect(mockEntry.rank).toBe(1);
    expect(mockEntry.reward_coins).toBe(50);
  });

  it('should have correct SupportTicket type structure', () => {
    const mockTicket: SupportTicket = {
      id: '123',
      user_id: '456',
      subject: 'Test Issue',
      description: 'Test description',
      status: 'open',
      priority: 'high',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    expect(mockTicket.status).toBe('open');
    expect(mockTicket.priority).toBe('high');
  });

  it('should have correct Transaction type structure', () => {
    const mockTransaction: Transaction = {
      id: '123',
      user_id: '456',
      amount: 50,
      transaction_type: 'initial_grant',
      description: 'Initial grant',
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(mockTransaction.amount).toBe(50);
    expect(mockTransaction.transaction_type).toBe('initial_grant');
  });

  it('should have all subscription tiers defined', () => {
    const studentTiers: SubscriptionTier[] = [
      'student_freemium',
      'student_promium',
      'student_premium',
      'student_legend',
    ];

    const teacherTiers: SubscriptionTier[] = [
      'teacher_freemium',
      'teacher_promium',
      'teacher_premium',
      'teacher_maxi',
    ];

    expect(studentTiers).toHaveLength(4);
    expect(teacherTiers).toHaveLength(4);
  });

  it('should have all subjects defined', () => {
    const subjects: Subject[] = [
      'mathematics',
      'russian_language',
      'physics',
      'geography',
      'literature',
      'obzh',
      'physical_education',
      'biology',
      'chemistry',
      'history',
      'social_studies',
      'informatics',
      'programming',
      'music',
      'geometry',
      'probability_statistics',
    ];

    expect(subjects).toHaveLength(16);
  });
});
