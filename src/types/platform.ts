// ============================================================================
// PLATFORM PRODUCTION-READY TYPES
// ============================================================================
// This file contains TypeScript interfaces for the production-ready platform
// features including connection requests, AI chat sessions, learning roadmaps,
// notifications, and assessment results.

/**
 * Connection Request
 * Represents a request to establish a connection between users
 * (parent-child, teacher-school, student-school)
 */
export interface ConnectionRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  request_type: 'parent_child' | 'teacher_school' | 'student_school';
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * AI Chat Session
 * Represents a conversation session with the Alies AI
 */
export interface AIChatSession {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

/**
 * AI Chat Message
 * Represents a single message in an AI chat session
 */
export interface AIChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Learning Roadmap
 * Represents a personalized learning plan for a student
 */
export interface LearningRoadmap {
  id: string;
  student_id: string;
  subject: string;
  content: RoadmapContent;
  progress: RoadmapProgress;
  created_at: string;
  updated_at: string;
}

/**
 * Roadmap Content
 * Structure of the learning roadmap content
 */
export interface RoadmapContent {
  topics: RoadmapTopic[];
  estimated_duration: string;
  difficulty_level: string;
}

/**
 * Roadmap Topic
 * Individual topic within a learning roadmap
 */
export interface RoadmapTopic {
  id: string;
  title: string;
  description: string;
  resources: string[];
  milestones: string[];
  order: number;
}

/**
 * Roadmap Progress
 * Tracks student progress through a learning roadmap
 */
export interface RoadmapProgress {
  completed_topics: string[];
  current_topic: string;
  completion_percentage: number;
}

/**
 * Notification
 * Represents a system notification for a user
 */
export interface Notification {
  id: string;
  user_id: string;
  type: 'connection_request' | 'quiz_completed' | 'lesson_assigned' | 
        'quest_available' | 'challenge_available' | 'support_response' | 'other';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

/**
 * Assessment Result
 * Stores results from the initial assessment quiz taken during registration
 */
export interface AssessmentResult {
  id: string;
  student_id: string;
  subject: string;
  score_percentage: number;
  answers: Record<string, unknown>;
  created_at: string;
}

/**
 * Extended User Profile
 * Extends the base UserProfile with grade information for students
 */
export interface ExtendedUserProfile {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'administrator';
  full_name: string;
  school_id: string | null;
  subscription_tier: string;
  wisdom_coins: number;
  daily_login_streak: number;
  last_login_date: string | null;
  free_expert_queries_remaining: number;
  grade?: string; // Grade level (1-11, техникум, ВУЗ)
  grade_letter?: string; // Class letter (A, B, C, etc.)
  created_at: string;
  updated_at: string;
}

/**
 * Progress Analytics
 * Comprehensive analytics for student progress
 */
export interface ProgressAnalytics {
  student_id: string;
  overall_average: number;
  subject_scores: SubjectScore[];
  weak_subjects: string[];
  strong_subjects: string[];
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

/**
 * Subject Score
 * Detailed score information for a specific subject
 */
export interface SubjectScore {
  subject: string;
  average_score: number;
  attempts_count: number;
  last_attempt_date: string;
  trend: 'up' | 'down' | 'stable';
}
