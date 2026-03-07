-- ============================================================================
-- Gamification System Migration
-- ============================================================================
-- This migration adds the complete gamification system including:
-- - Achievements and badges
-- - Experience and levels
-- - Daily/weekly quests
-- - Challenges between students
-- - Milestones
-- - Streaks
-- - Seasonal events
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('learning', 'social', 'achievement', 'special')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  icon TEXT NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- User levels table
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  experience_points INTEGER NOT NULL DEFAULT 0,
  experience_to_next_level INTEGER NOT NULL DEFAULT 100,
  total_experience INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quests table
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly')),
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL,
  active_from TIMESTAMPTZ NOT NULL,
  active_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User quests table
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  winner_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('invited', 'accepted', 'declined')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User milestones table
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  achieved BOOLEAN NOT NULL DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  best_count INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Seasonal events table
CREATE TABLE IF NOT EXISTS seasonal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  special_quests UUID[],
  special_achievements UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User seasonal progress table
CREATE TABLE IF NOT EXISTS user_seasonal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
  seasonal_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  rewards_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(user_id, unlocked);
CREATE INDEX IF NOT EXISTS idx_user_achievements_favorite ON user_achievements(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_levels_user ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_active ON user_quests(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_creator ON challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_achieved ON user_milestones(user_id, achieved);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_type ON streaks(user_id, streak_type);
CREATE INDEX IF NOT EXISTS idx_seasonal_events_active ON seasonal_events(active);
CREATE INDEX IF NOT EXISTS idx_user_seasonal_progress_event ON user_seasonal_progress(event_id, seasonal_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_seasonal_progress_user ON user_seasonal_progress(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Achievements (public read)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

-- User achievements (only own)
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User levels (only own)
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own level" ON user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own level" ON user_levels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own level" ON user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quests (public read)
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are viewable by everyone" ON quests FOR SELECT USING (true);

-- User quests (only own)
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quests" ON user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own quests" ON user_quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quests" ON user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenges (participants and creator) - Fixed to avoid infinite recursion
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Allow users to view challenges where they are creator
CREATE POLICY "Users can view their created challenges" ON challenges FOR SELECT 
  USING (auth.uid() = creator_id);

-- Allow users to view challenges where they are participants (using subquery without recursion)
CREATE POLICY "Users can view challenges they joined" ON challenges FOR SELECT 
  USING (
    id IN (
      SELECT challenge_id 
      FROM challenge_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their challenges" ON challenges FOR UPDATE USING (auth.uid() = creator_id);

-- Challenge participants - Fixed to avoid infinite recursion
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Allow users to view participants of challenges they created
CREATE POLICY "Creators can view challenge participants" ON challenge_participants FOR SELECT 
  USING (
    challenge_id IN (
      SELECT id 
      FROM challenges 
      WHERE creator_id = auth.uid()
    )
  );

-- Allow users to view their own participation records
CREATE POLICY "Users can view their own participation" ON challenge_participants FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their participation" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- Allow creators to update participant records (for invitations)
CREATE POLICY "Creators can update participant records" ON challenge_participants FOR UPDATE 
  USING (
    challenge_id IN (
      SELECT id 
      FROM challenges 
      WHERE creator_id = auth.uid()
    )
  );

-- Milestones (public read)
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Milestones are viewable by everyone" ON milestones FOR SELECT USING (true);

-- User milestones (only own)
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own milestones" ON user_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own milestones" ON user_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own milestones" ON user_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Streaks (only own)
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own streaks" ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seasonal events (public read)
ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone" ON seasonal_events FOR SELECT USING (true);

-- User seasonal progress (only own)
ALTER TABLE user_seasonal_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own event progress" ON user_seasonal_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own event progress" ON user_seasonal_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own event progress" ON user_seasonal_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA: PREDEFINED ACHIEVEMENTS
-- ============================================================================

INSERT INTO achievements (code, title, description, category, rarity, icon, reward_coins, reward_xp, condition_type, condition_value) VALUES
-- Learning achievements - Lesson creation
('first_lesson', 'Первый шаг', 'Создайте свой первый урок', 'learning', 'common', '🎯', 25, 50, 'lesson_created', 1),
('knowledge_seeker', 'Знаток', 'Создайте 10 уроков', 'learning', 'rare', '📚', 50, 100, 'lesson_created', 10),
('master_creator', 'Мастер', 'Создайте 50 уроков', 'learning', 'epic', '🎓', 100, 250, 'lesson_created', 50),
('lesson_legend', 'Легенда обучения', 'Создайте 100 уроков', 'learning', 'legendary', '👑', 250, 500, 'lesson_created', 100),

-- Learning achievements - Quiz completion
('first_quiz', 'Начинающий ученик', 'Пройдите первую викторину', 'learning', 'common', '✏️', 25, 50, 'quiz_completed', 1),
('diligent_student', 'Прилежный ученик', 'Пройдите 25 викторин', 'learning', 'rare', '📝', 50, 100, 'quiz_completed', 25),
('quiz_genius', 'Гений', 'Пройдите 100 викторин', 'learning', 'epic', '🧠', 100, 250, 'quiz_completed', 100),
('quiz_master', 'Мастер викторин', 'Пройдите 250 викторин', 'learning', 'legendary', '🏆', 250, 500, 'quiz_completed', 250),

-- Achievement achievements - Perfect scores
('perfectionist', 'Перфекционист', 'Получите 100% в викторине', 'achievement', 'rare', '💯', 50, 100, 'quiz_perfect', 1),
('flawless', 'Безупречный', 'Получите 100% в 10 викторинах', 'achievement', 'epic', '⭐', 100, 250, 'quiz_perfect', 10),
('perfect_master', 'Мастер совершенства', 'Получите 100% в 25 викторинах', 'achievement', 'legendary', '🌟', 250, 500, 'quiz_perfect', 25),

-- Social achievements - Login streaks
('week_warrior', 'Неделя силы', 'Войдите в систему 7 дней подряд', 'social', 'rare', '🔥', 50, 100, 'login_streak', 7),
('month_dedication', 'Месяц упорства', 'Войдите в систему 30 дней подряд', 'social', 'epic', '💪', 100, 250, 'login_streak', 30),
('consistency_legend', 'Легенда постоянства', 'Войдите в систему 100 дней подряд', 'social', 'legendary', '🎖️', 250, 500, 'login_streak', 100),

-- Achievement achievements - Leaderboard
('daily_champion', 'Чемпион дня', 'Займите 1 место в рейтинге', 'achievement', 'rare', '🥇', 50, 100, 'leaderboard_first', 1),
('leaderboard_king', 'Король рейтинга', 'Займите 1 место 10 раз', 'achievement', 'epic', '👑', 100, 250, 'leaderboard_first', 10),
('eternal_champion', 'Вечный чемпион', 'Займите 1 место 25 раз', 'achievement', 'legendary', '🏅', 250, 500, 'leaderboard_first', 25),

-- Special achievements - Subject diversity
('polymath', 'Эрудит', 'Изучите все предметы', 'special', 'epic', '🎨', 100, 250, 'subjects_studied', 8),

-- Achievement achievements - Level milestones
('experienced', 'Опытный', 'Достигните 10 уровня', 'achievement', 'rare', '⬆️', 50, 100, 'level_reached', 10),
('expert', 'Эксперт', 'Достигните 25 уровня', 'achievement', 'epic', '🎯', 100, 250, 'level_reached', 25),
('learning_master', 'Мастер обучения', 'Достигните 50 уровня', 'achievement', 'legendary', '🌠', 250, 500, 'level_reached', 50),

-- Social achievements - Challenges
('competitor', 'Соперник', 'Победите в 5 челленджах', 'social', 'rare', '⚔️', 50, 100, 'challenge_won', 5),
('unbeatable', 'Непобедимый', 'Победите в 20 челленджах', 'social', 'epic', '🛡️', 100, 250, 'challenge_won', 20),
('challenge_legend', 'Легенда челленджей', 'Победите в 50 челленджах', 'social', 'legendary', '🏰', 250, 500, 'challenge_won', 50),

-- Social achievements - Quests
('quest_warrior', 'Квестовый воин', 'Выполните все ежедневные квесты 7 дней подряд', 'social', 'rare', '🗡️', 50, 100, 'quest_completed', 21),
('quest_champion', 'Чемпион квестов', 'Выполните 100 квестов', 'social', 'epic', '🎪', 100, 250, 'quest_completed', 100),

-- Achievement achievements - Leaderboard top 10
('top_ten', 'Топ-10', 'Войдите в топ-10 по достижениям', 'achievement', 'epic', '🔟', 100, 250, 'leaderboard_first', 1)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SEED DATA: PREDEFINED MILESTONES
-- ============================================================================

INSERT INTO milestones (code, title, description, category, threshold, reward_coins, reward_xp, icon) VALUES
-- Lessons created milestones
('lessons_10', 'Первые 10 уроков', 'Создайте 10 уроков', 'lessons_created', 10, 50, 100, '📚'),
('lessons_25', '25 уроков', 'Создайте 25 уроков', 'lessons_created', 25, 75, 150, '📖'),
('lessons_50', '50 уроков', 'Создайте 50 уроков', 'lessons_created', 50, 100, 250, '📕'),
('lessons_100', '100 уроков', 'Создайте 100 уроков', 'lessons_created', 100, 150, 400, '📗'),
('lessons_250', '250 уроков', 'Создайте 250 уроков', 'lessons_created', 250, 250, 750, '📘'),
('lessons_500', '500 уроков', 'Создайте 500 уроков', 'lessons_created', 500, 500, 1500, '📙'),

-- Quizzes completed milestones
('quizzes_10', 'Первые 10 викторин', 'Пройдите 10 викторин', 'quizzes_completed', 10, 50, 100, '✏️'),
('quizzes_25', '25 викторин', 'Пройдите 25 викторин', 'quizzes_completed', 25, 75, 150, '✒️'),
('quizzes_50', '50 викторин', 'Пройдите 50 викторин', 'quizzes_completed', 50, 100, 250, '🖊️'),
('quizzes_100', '100 викторин', 'Пройдите 100 викторин', 'quizzes_completed', 100, 150, 400, '🖋️'),
('quizzes_250', '250 викторин', 'Пройдите 250 викторин', 'quizzes_completed', 250, 250, 750, '📝'),
('quizzes_500', '500 викторин', 'Пройдите 500 викторин', 'quizzes_completed', 500, 500, 1500, '📋'),

-- Wisdom coins milestones
('coins_500', '500 монет', 'Накопите 500 Wisdom Coins', 'wisdom_coins', 500, 50, 100, '🪙'),
('coins_1000', '1000 монет', 'Накопите 1000 Wisdom Coins', 'wisdom_coins', 1000, 100, 200, '💰'),
('coins_2500', '2500 монет', 'Накопите 2500 Wisdom Coins', 'wisdom_coins', 2500, 150, 350, '💎'),
('coins_5000', '5000 монет', 'Накопите 5000 Wisdom Coins', 'wisdom_coins', 5000, 250, 600, '💵'),
('coins_10000', '10000 монет', 'Накопите 10000 Wisdom Coins', 'wisdom_coins', 10000, 500, 1200, '💸'),

-- Level milestones
('level_5', 'Уровень 5', 'Достигните 5 уровня', 'level_reached', 5, 50, 100, '⬆️'),
('level_10', 'Уровень 10', 'Достигните 10 уровня', 'level_reached', 10, 75, 150, '⏫'),
('level_20', 'Уровень 20', 'Достигните 20 уровня', 'level_reached', 20, 100, 250, '🔼'),
('level_30', 'Уровень 30', 'Достигните 30 уровня', 'level_reached', 30, 150, 400, '🔺'),
('level_40', 'Уровень 40', 'Достигните 40 уровня', 'level_reached', 40, 250, 750, '🔝'),
('level_50', 'Уровень 50', 'Достигните 50 уровня', 'level_reached', 50, 500, 1500, '🎯')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
