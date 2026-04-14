-- Fix RLS policies for gamification tables
-- This adds missing INSERT policies for system-generated content

-- Quests table - allow INSERT for authenticated users (system will create quests)
DROP POLICY IF EXISTS "Quests are viewable by everyone" ON quests;
DROP POLICY IF EXISTS "System can insert quests" ON quests;

CREATE POLICY "Quests are viewable by everyone" 
  ON quests FOR SELECT 
  USING (true);

CREATE POLICY "System can insert quests" 
  ON quests FOR INSERT 
  WITH CHECK (true);

-- User quests - allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert their own quests" ON user_quests;

CREATE POLICY "Users can insert their own quests" 
  ON user_quests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- User achievements - allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;

CREATE POLICY "Users can insert their own achievements" 
  ON user_achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- User levels - allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert their own level" ON user_levels;

CREATE POLICY "Users can insert their own level" 
  ON user_levels FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Streaks - allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert their own streaks" ON streaks;

CREATE POLICY "Users can insert their own streaks" 
  ON streaks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- User milestones - allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert their own milestones" ON user_milestones;

CREATE POLICY "Users can insert their own milestones" 
  ON user_milestones FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- User seasonal progress - allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can insert their own event progress" ON user_seasonal_progress;

CREATE POLICY "Users can insert their own event progress" 
  ON user_seasonal_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
