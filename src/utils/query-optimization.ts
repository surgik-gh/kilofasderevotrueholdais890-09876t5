/**
 * Query optimization utilities for Supabase
 * Provides helpers for efficient database queries
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Select only specific fields to reduce payload size
 */
export const selectFields = {
  // User profile minimal fields
  userMinimal: 'id, full_name, avatar_url, role',
  
  // User profile with stats
  userWithStats: 'id, full_name, avatar_url, role, wisdom_coins, experience_points, level',
  
  // Lesson minimal fields
  lessonMinimal: 'id, title, subject, difficulty, created_at',
  
  // Lesson with author
  lessonWithAuthor: 'id, title, subject, difficulty, created_at, author:user_profiles!author_id(id, full_name, avatar_url)',
  
  // Quiz minimal fields
  quizMinimal: 'id, title, subject, difficulty, question_count',
  
  // Quiz with details
  quizWithDetails: 'id, title, subject, difficulty, questions, created_at, creator:user_profiles!creator_id(id, full_name)',
  
  // Achievement minimal
  achievementMinimal: 'id, name, description, icon, rarity',
  
  // Quest minimal
  questMinimal: 'id, title, description, type, difficulty, reward_xp, reward_coins',
  
  // Notification minimal
  notificationMinimal: 'id, type, title, message, read, created_at',
};

/**
 * Common query filters
 */
export const queryFilters = {
  // Active items only
  active: { status: 'active' },
  
  // Published items only
  published: { is_published: true },
  
  // Not deleted
  notDeleted: { deleted_at: null },
  
  // Recent items (last 30 days)
  recent: (field: string = 'created_at') => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return { [field]: { gte: thirtyDaysAgo.toISOString() } };
  },
};

/**
 * Batch fetch utility to reduce multiple queries
 */
export async function batchFetch<T>(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
  select: string = '*'
): Promise<T[]> {
  if (ids.length === 0) return [];
  
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .in('id', ids);
  
  if (error) throw error;
  return data as T[];
}

/**
 * Optimized count query (uses Supabase count feature)
 */
export async function getCount(
  supabase: SupabaseClient,
  table: string,
  filters?: Record<string, any>
): Promise<number> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }
  
  const { count, error } = await query;
  
  if (error) throw error;
  return count || 0;
}

/**
 * Optimized exists check (faster than count)
 */
export async function exists(
  supabase: SupabaseClient,
  table: string,
  filters: Record<string, any>
): Promise<boolean> {
  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .limit(1);
  
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  
  const { count, error } = await query;
  
  if (error) throw error;
  return (count || 0) > 0;
}

/**
 * Optimized join query builder
 */
export class QueryBuilder<T> {
  private query: any;
  
  constructor(
    private supabase: SupabaseClient,
    private table: string
  ) {
    this.query = supabase.from(table);
  }
  
  select(fields: string) {
    this.query = this.query.select(fields);
    return this;
  }
  
  eq(column: string, value: any) {
    this.query = this.query.eq(column, value);
    return this;
  }
  
  in(column: string, values: any[]) {
    this.query = this.query.in(column, values);
    return this;
  }
  
  gte(column: string, value: any) {
    this.query = this.query.gte(column, value);
    return this;
  }
  
  lte(column: string, value: any) {
    this.query = this.query.lte(column, value);
    return this;
  }
  
  order(column: string, ascending: boolean = true) {
    this.query = this.query.order(column, { ascending });
    return this;
  }
  
  limit(count: number) {
    this.query = this.query.limit(count);
    return this;
  }
  
  range(from: number, to: number) {
    this.query = this.query.range(from, to);
    return this;
  }
  
  async execute(): Promise<T[]> {
    const { data, error } = await this.query;
    if (error) throw error;
    return data as T[];
  }
  
  async single(): Promise<T | null> {
    const { data, error } = await this.query.single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as T;
  }
}

/**
 * Create optimized query builder
 */
export function createQuery<T>(supabase: SupabaseClient, table: string) {
  return new QueryBuilder<T>(supabase, table);
}

/**
 * Prefetch related data to avoid N+1 queries
 */
export async function prefetchRelated<T, R>(
  items: T[],
  getRelatedIds: (item: T) => string | string[],
  fetchRelated: (ids: string[]) => Promise<R[]>,
  attachRelated: (item: T, related: R[]) => T
): Promise<T[]> {
  // Collect all related IDs
  const relatedIds = new Set<string>();
  items.forEach(item => {
    const ids = getRelatedIds(item);
    if (Array.isArray(ids)) {
      ids.forEach(id => relatedIds.add(id));
    } else if (ids) {
      relatedIds.add(ids);
    }
  });
  
  // Fetch all related items in one query
  const related = await fetchRelated(Array.from(relatedIds));
  
  // Attach related items to original items
  return items.map(item => attachRelated(item, related));
}

/**
 * Database index recommendations
 */
export const indexRecommendations = `
-- Performance optimization indexes for AILesson platform

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_grade ON user_profiles(grade);

-- Lessons
CREATE INDEX IF NOT EXISTS idx_lessons_author_id ON lessons(author_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_difficulty ON lessons(subject, difficulty);

-- Quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_creator_id ON quizzes(creator_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);

-- Quiz attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_subject ON quiz_attempts(student_id, subject);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON quiz_attempts(completed_at DESC);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- Quests
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_status ON user_quests(user_id, status);

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Connection requests
CREATE INDEX IF NOT EXISTS idx_connection_requests_to_user ON connection_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_from_user ON connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);

-- AI chat sessions
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_created_at ON ai_chat_sessions(created_at DESC);

-- AI chat messages
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- Learning roadmaps
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_student_id ON learning_roadmaps(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_subject ON learning_roadmaps(subject);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lessons_published_subject ON lessons(is_published, subject) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_quizzes_published_subject ON quizzes(is_published, subject) WHERE is_published = true;
`;

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  private queries: Map<string, { count: number; totalTime: number }> = new Map();
  
  async measure<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - start;
      
      this.recordQuery(queryName, duration);
      
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordQuery(queryName, duration);
      throw error;
    }
  }
  
  private recordQuery(name: string, duration: number) {
    const existing = this.queries.get(name) || { count: 0, totalTime: 0 };
    this.queries.set(name, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
    });
  }
  
  getStats() {
    const stats: Array<{
      query: string;
      count: number;
      avgTime: number;
      totalTime: number;
    }> = [];
    
    this.queries.forEach((value, key) => {
      stats.push({
        query: key,
        count: value.count,
        avgTime: value.totalTime / value.count,
        totalTime: value.totalTime,
      });
    });
    
    return stats.sort((a, b) => b.totalTime - a.totalTime);
  }
  
  reset() {
    this.queries.clear();
  }
}

export const queryMonitor = new QueryMonitor();
