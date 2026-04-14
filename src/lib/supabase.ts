import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// For production, set these environment variables:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env || {}
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ============================================================================
// DATABASE TYPES (aligned with design document)
// ============================================================================

export type SubscriptionTier = 
  | 'student_freemium' | 'student_promium' | 'student_premium' | 'student_legend'
  | 'teacher_freemium' | 'teacher_promium' | 'teacher_premium' | 'teacher_maxi';

export type Subject = 
  | 'mathematics' | 'russian_language' | 'physics' | 'geography' 
  | 'literature' | 'obzh' | 'physical_education' | 'biology' 
  | 'chemistry' | 'history' | 'social_studies' | 'informatics' 
  | 'programming' | 'music' | 'geometry' | 'probability_statistics';

export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'administrator';
  full_name: string;
  school_id: string | null;
  subscription_tier: SubscriptionTier;
  wisdom_coins: number;
  daily_login_streak: number;
  last_login_date: string | null;
  free_expert_queries_remaining: number;
  grade?: string; // Grade level (1-11, техникум, ВУЗ) - for students
  grade_letter?: string; // Class letter (A, B, C, etc.) - for students
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolMembership {
  id: string;
  school_id: string;
  user_id: string;
  role: 'teacher' | 'parent' | 'student';
  joined_at: string;
}

export interface ParentChildLink {
  id: string;
  parent_id: string;
  child_id: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  subject: Subject;
  content: string;
  creator_id: string;
  creator_role: 'student' | 'teacher';
  school_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonAssignment {
  id: string;
  lesson_id: string;
  student_id: string;
  assigned_at: string;
}

export interface LessonAttachment {
  id: string;
  lesson_id: string;
  file_name: string;
  file_url: string;
  file_type: 'literature' | 'poem' | 'song' | 'document' | 'other';
  uploaded_at: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  created_by: string;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: number[];
  score_percentage: number;
  counts_for_leaderboard: boolean;
  completed_at: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'public' | 'school_parent' | 'school_teacher' | 'direct';
  school_id: string | null;
  invitation_code: string;
  created_by: string;
  created_at: string;
}

export interface ChatMembership {
  id: string;
  chat_id: string;
  user_id: string;
  joined_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
}

export interface LeaderboardEntry {
  id: string;
  student_id: string;
  date: string;
  score: number;
  rank: number | null;
  reward_coins: number;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  sent_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 
    | 'initial_grant' 
    | 'daily_login' 
    | 'biweekly_grant' 
    | 'leaderboard_reward'
    | 'lesson_creation' 
    | 'quiz_creation' 
    | 'expert_chat_usage'
    | 'subscription_purchase';
  description: string;
  created_at: string;
}

// Legacy types for backward compatibility
export interface DbUser extends UserProfile {
  name: string; // Alias for full_name
  coins: number; // Alias for wisdom_coins
  subscription: string; // Alias for subscription_tier
  expert_chat_uses: number; // Alias for free_expert_queries_remaining
  last_login: string; // Alias for last_login_date
}

export interface DbSchool extends School {
  city: string; // Alias for address
}

export interface DbLesson extends Lesson {
  author_id: string; // Alias for creator_id
}

export interface DbQuiz {
  id: string;
  lesson_id: string;
  questions: string; // JSON stringified
  created_at: string;
}

export interface DbQuizResult extends QuizAttempt {
  user_id: string; // Alias for student_id
  score: number; // Alias for score_percentage
}

export interface DbResource extends LessonAttachment {
  title: string;
  content: string;
  school_id: string;
  author_id: string;
}

export interface DbTicket extends SupportTicket {
  message: string; // Alias for description
  resolved_at?: string;
}

export interface DbChatMessage extends ChatMessage {}

// ============================================================================
// AUTH HELPER FUNCTIONS
// ============================================================================

export const signUp = async (
  email: string, 
  password: string, 
  userData: {
    full_name: string;
    role: 'student' | 'teacher' | 'parent' | 'administrator';
    school_id?: string;
  }
) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.full_name,
        role: userData.role,
        school_id: userData.school_id,
      }
    }
  })

  if (authError) throw authError

  // Create user profile in user_profiles table
  if (authData.user) {
    // Determine initial coins based on role
    const initialCoins = userData.role === 'teacher' ? 150 : userData.role === 'student' ? 50 : 0;
    
    // Determine subscription tier based on role
    const subscriptionTier: SubscriptionTier = 
      userData.role === 'teacher' ? 'teacher_freemium' : 'student_freemium';

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: userData.full_name,
        role: userData.role,
        school_id: userData.school_id || null,
        wisdom_coins: initialCoins,
        subscription_tier: subscriptionTier,
        free_expert_queries_remaining: 5,
        last_login_date: new Date().toISOString().split('T')[0],
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      throw profileError
    }

    // Create initial transaction record
    if (initialCoins > 0) {
      await supabase
        .from('transactions')
        .insert({
          user_id: authData.user.id,
          amount: initialCoins,
          transaction_type: 'initial_grant',
          description: `Initial ${initialCoins} Wisdom Coins grant for ${userData.role}`,
        })
    }

    // Create school membership if school_id provided
    if (userData.school_id) {
      await supabase
        .from('school_memberships')
        .insert({
          school_id: userData.school_id,
          user_id: authData.user.id,
          role: userData.role === 'administrator' ? 'teacher' : userData.role,
        })
    }
  }

  return authData
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Update last login date
  if (data.user) {
    await supabase
      .from('user_profiles')
      .update({ last_login_date: new Date().toISOString().split('T')[0] })
      .eq('id', data.user.id)
  }

  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile as UserProfile | null
}

export const updateProfile = async (
  userId: string, 
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as UserProfile
}

export const getSchools = async (): Promise<School[]> => {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name')

  if (error) throw error
  return data as School[]
}

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key'
}

// ============================================================================
// PLATFORM PRODUCTION-READY TYPES
// ============================================================================
// Export types from platform.ts for production-ready features

export type {
  ConnectionRequest,
  AIChatSession,
  AIChatMessage,
  LearningRoadmap,
  RoadmapContent,
  RoadmapTopic,
  RoadmapProgress,
  Notification,
  AssessmentResult,
  ExtendedUserProfile,
  ProgressAnalytics,
  SubjectScore,
} from '../types/platform'
