-- ============================================================================
-- Fix 406 Errors for Gamification Tables
-- ============================================================================
-- This script fixes RLS policies that are causing 406 (Not Acceptable) errors
-- The issue is that some policies are too restrictive or missing
-- ============================================================================

-- Drop and recreate all RLS policies with proper permissions

-- ============================================================================
-- USER_LEVELS TABLE
-- ============================================================================
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own level" ON user_levels;
DROP POLICY IF EXISTS "Users can update their own level" ON user_levels;
DROP POLICY IF EXISTS "Users can insert their own level" ON user_levels;
DROP POLICY IF EXISTS "Service role can manage all levels" ON user_levels;

-- Allow users to view their own level
CREATE POLICY "Users can view their own level" 
  ON user_levels FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update their own level
CREATE POLICY "Users can update their own level" 
  ON user_levels FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to insert their own level
CREATE POLICY "Users can insert their own level" 
  ON user_levels FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all levels (for system operations)
CREATE POLICY "Service role can manage all levels" 
  ON user_levels FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- SEASONAL_EVENTS TABLE
-- ============================================================================
ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events are viewable by everyone" ON seasonal_events;
DROP POLICY IF EXISTS "Service role can manage events" ON seasonal_events;

-- Allow everyone to view seasonal events (they are public)
CREATE POLICY "Events are viewable by everyone" 
  ON seasonal_events FOR SELECT 
  USING (true);

-- Allow service role to manage events
CREATE POLICY "Service role can manage events" 
  ON seasonal_events FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STREAKS TABLE
-- ============================================================================
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own streaks" ON streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON streaks;
DROP POLICY IF EXISTS "Users can insert their own streaks" ON streaks;
DROP POLICY IF EXISTS "Service role can manage all streaks" ON streaks;

CREATE POLICY "Users can view their own streaks" 
  ON streaks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
  ON streaks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" 
  ON streaks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all streaks" 
  ON streaks FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- USER_ACHIEVEMENTS TABLE
-- ============================================================================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Service role can manage all achievements" ON user_achievements;

CREATE POLICY "Users can view their own achievements" 
  ON user_achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
  ON user_achievements FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
  ON user_achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all achievements" 
  ON user_achievements FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- USER_MILESTONES TABLE
-- ============================================================================
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own milestones" ON user_milestones;
DROP POLICY IF EXISTS "Users can update their own milestones" ON user_milestones;
DROP POLICY IF EXISTS "Users can insert their own milestones" ON user_milestones;
DROP POLICY IF EXISTS "Service role can manage all milestones" ON user_milestones;

CREATE POLICY "Users can view their own milestones" 
  ON user_milestones FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones" 
  ON user_milestones FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones" 
  ON user_milestones FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all milestones" 
  ON user_milestones FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- QUIZZES TABLE (if not already fixed)
-- ============================================================================
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Service role can manage all quizzes" ON quizzes;

CREATE POLICY "Users can view their own quizzes" 
  ON quizzes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM lessons 
      WHERE lessons.id = quizzes.lesson_id 
      AND lessons.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create quizzes" 
  ON quizzes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons 
      WHERE lessons.id = quizzes.lesson_id 
      AND lessons.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own quizzes" 
  ON quizzes FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM lessons 
      WHERE lessons.id = quizzes.lesson_id 
      AND lessons.creator_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all quizzes" 
  ON quizzes FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the policies are working:

-- Check user_levels policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_levels';

-- Check seasonal_events policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'seasonal_events';

-- Check streaks policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'streaks';

-- Check user_achievements policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_achievements';

-- Check user_milestones policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_milestones';

-- Check quizzes policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'quizzes';
