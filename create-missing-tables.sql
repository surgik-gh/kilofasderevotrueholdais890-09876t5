-- Create only the missing tables for lessons functionality
-- Run this in Supabase SQL Editor

-- Check if schools table exists, create if not
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
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
CREATE TABLE IF NOT EXISTS lesson_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id, student_id)
);

-- Lesson attachments
CREATE TABLE IF NOT EXISTS lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  answers INTEGER[] NOT NULL,
  score_percentage NUMERIC(5,2) NOT NULL,
  counts_for_leaderboard BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public', 'school_parent', 'school_teacher', 'direct')),
  school_id UUID REFERENCES schools(id),
  invitation_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat memberships
CREATE TABLE IF NOT EXISTS chat_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
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
CREATE TABLE IF NOT EXISTS support_tickets (
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
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- School memberships
CREATE TABLE IF NOT EXISTS school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'student')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, user_id)
);

-- Parent-child relationships
CREATE TABLE IF NOT EXISTS parent_child_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_lessons_creator ON lessons(creator_id);
CREATE INDEX IF NOT EXISTS idx_lessons_school ON lessons(school_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_date ON leaderboard_entries(date, score DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_school_memberships_user ON school_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_school_memberships_school ON school_memberships(school_id);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_student ON lesson_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_lesson ON lesson_assignments(lesson_id);

-- Enable RLS on new tables
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
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own lessons" ON lessons;
DROP POLICY IF EXISTS "Students can view assigned lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers can view lessons in their school" ON lessons;
DROP POLICY IF EXISTS "Parents can view their children's assigned lessons" ON lessons;
DROP POLICY IF EXISTS "Users can create lessons" ON lessons;
DROP POLICY IF EXISTS "Users can update their own lessons" ON lessons;
DROP POLICY IF EXISTS "Users can delete their own lessons" ON lessons;

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

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "System can create transactions" ON transactions;

CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- Schools policies
DROP POLICY IF EXISTS "Anyone can view schools" ON schools;

CREATE POLICY "Anyone can view schools"
  ON schools FOR SELECT
  USING (true);

-- Leaderboard policies
DROP POLICY IF EXISTS "Anyone can view leaderboard entries" ON leaderboard_entries;
DROP POLICY IF EXISTS "System can manage leaderboard entries" ON leaderboard_entries;

CREATE POLICY "Anyone can view leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (true);

CREATE POLICY "System can manage leaderboard entries"
  ON leaderboard_entries FOR ALL
  USING (true);

-- Insert a default school if it doesn't exist
INSERT INTO schools (name, address) 
VALUES ('Default School', 'Test Address')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'All missing tables created successfully!' as message;
