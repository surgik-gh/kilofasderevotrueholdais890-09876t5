-- AILesson Platform Database Schema
-- This migration creates all tables and Row Level Security policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'administrator')),
  full_name TEXT NOT NULL,
  school_id UUID REFERENCES schools(id),
  subscription_tier TEXT NOT NULL DEFAULT 'student_freemium',
  wisdom_coins INTEGER NOT NULL DEFAULT 0,
  daily_login_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  free_expert_queries_remaining INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schools
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- School memberships
CREATE TABLE school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'student')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, user_id)
);

-- Parent-child relationships
CREATE TABLE parent_child_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  creator_role TEXT NOT NULL CHECK (creator_role IN ('student', 'teacher')),
  school_id UUID REFERENCES schools(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lesson assignments
CREATE TABLE lesson_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id, student_id)
);

-- Lesson attachments
CREATE TABLE lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id) -- Only one quiz per lesson
);

-- Quiz attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  answers INTEGER[] NOT NULL,
  score_percentage NUMERIC(5,2) NOT NULL,
  counts_for_leaderboard BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public', 'school_parent', 'school_teacher', 'direct')),
  school_id UUID REFERENCES schools(id),
  invitation_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat memberships
CREATE TABLE chat_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard entries
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Support tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket messages
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_lessons_creator ON lessons(creator_id);
CREATE INDEX idx_lessons_school ON lessons(school_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX idx_leaderboard_date ON leaderboard_entries(date, score DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_school_memberships_user ON school_memberships(user_id);
CREATE INDEX idx_school_memberships_school ON school_memberships(school_id);
CREATE INDEX idx_lesson_assignments_student ON lesson_assignments(student_id);
CREATE INDEX idx_lesson_assignments_lesson ON lesson_assignments(lesson_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile (except school_id for students)"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND (
      role != 'student' OR 
      school_id = (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Administrators can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

CREATE POLICY "Teachers can view profiles in their school"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'teacher'
      AND up.school_id = user_profiles.school_id
    )
  );

CREATE POLICY "Parents can view their children's profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid() AND child_id = user_profiles.id
    )
  );

-- Schools Policies
CREATE POLICY "Anyone can view schools"
  ON schools FOR SELECT
  USING (true);

CREATE POLICY "Administrators can manage schools"
  ON schools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- School Memberships Policies
CREATE POLICY "Users can view their own memberships"
  ON school_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view memberships in their school"
  ON school_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM school_memberships sm
      WHERE sm.user_id = auth.uid() AND sm.school_id = school_memberships.school_id
    )
  );

CREATE POLICY "Teachers and administrators can create memberships"
  ON school_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'administrator')
    )
  );

-- Parent-Child Links Policies
CREATE POLICY "Parents can view their child links"
  ON parent_child_links FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Children can view their parent links"
  ON parent_child_links FOR SELECT
  USING (child_id = auth.uid());

CREATE POLICY "Parents and administrators can create links"
  ON parent_child_links FOR INSERT
  WITH CHECK (
    parent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Lessons Policies
CREATE POLICY "Users can view their own lessons"
  ON lessons FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Students can view assigned lessons"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_assignments
      WHERE lesson_id = lessons.id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view lessons in their school"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'teacher' AND school_id = lessons.school_id
    )
  );

CREATE POLICY "Parents can view their children's assigned lessons"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_assignments la
      JOIN parent_child_links pcl ON la.student_id = pcl.child_id
      WHERE la.lesson_id = lessons.id AND pcl.parent_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lessons"
  ON lessons FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own lessons"
  ON lessons FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own lessons"
  ON lessons FOR DELETE
  USING (creator_id = auth.uid());

-- Lesson Assignments Policies
CREATE POLICY "Students can view their assignments"
  ON lesson_assignments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view assignments for their lessons"
  ON lesson_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE id = lesson_assignments.lesson_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create assignments for their lessons"
  ON lesson_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE id = lesson_id AND creator_id = auth.uid() AND creator_role = 'teacher'
    )
  );

CREATE POLICY "Parents can view their children's assignments"
  ON lesson_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid() AND child_id = lesson_assignments.student_id
    )
  );

-- Lesson Attachments Policies
CREATE POLICY "Users can view attachments for accessible lessons"
  ON lesson_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE id = lesson_attachments.lesson_id AND (
        creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM lesson_assignments
          WHERE lesson_id = lessons.id AND student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Lesson creators can manage attachments"
  ON lesson_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE id = lesson_attachments.lesson_id AND creator_id = auth.uid()
    )
  );

-- Quizzes Policies
CREATE POLICY "Users can view quizzes for accessible lessons"
  ON quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE id = quizzes.lesson_id AND (
        creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM lesson_assignments
          WHERE lesson_id = lessons.id AND student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create quizzes for their lessons"
  ON quizzes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE id = lesson_id AND creator_id = auth.uid()
    )
  );

-- Quiz Attempts Policies
CREATE POLICY "Students can view their own attempts"
  ON quiz_attempts FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their lessons"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      WHERE q.id = quiz_attempts.quiz_id AND l.creator_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their children's attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid() AND child_id = quiz_attempts.student_id
    )
  );

CREATE POLICY "Students can create quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Chats Policies
CREATE POLICY "Users can view public chats"
  ON chats FOR SELECT
  USING (type = 'public');

CREATE POLICY "Users can view chats they are members of"
  ON chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_memberships
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Chat Memberships Policies
CREATE POLICY "Users can view memberships for their chats"
  ON chat_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_memberships cm
      WHERE cm.chat_id = chat_memberships.chat_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join chats"
  ON chat_memberships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave chats"
  ON chat_memberships FOR DELETE
  USING (user_id = auth.uid());

-- Chat Messages Policies
CREATE POLICY "Chat members can view messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_memberships
      WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Chat members can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_memberships
      WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
    )
  );

-- Leaderboard Entries Policies
CREATE POLICY "Students can view their own leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Anyone can view leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (true);

CREATE POLICY "System can manage leaderboard entries"
  ON leaderboard_entries FOR ALL
  USING (true);

-- Support Tickets Policies
CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Administrators can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Administrators can update tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Ticket Messages Policies
CREATE POLICY "Users can view messages for their tickets"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Administrators can view all ticket messages"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

CREATE POLICY "Users can send messages to their tickets"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Administrators can send messages to any ticket"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Administrators can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_entries_updated_at
  BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA (Optional - for development)
-- ============================================================================

-- Insert a default school for testing
INSERT INTO schools (name, address) VALUES
  ('Default School', 'Test Address')
ON CONFLICT DO NOTHING;
