# Gamification System Migration Guide

This guide explains how to apply the gamification system migration to your Supabase database.

## Migration File

The migration file is located at: `supabase/migrations/002_gamification_system.sql`

## What This Migration Does

1. **Creates 11 new tables:**
   - `achievements` - Predefined achievements
   - `user_achievements` - User progress on achievements
   - `user_levels` - User experience and levels
   - `quests` - Daily and weekly quests
   - `user_quests` - User progress on quests
   - `challenges` - Challenges between students
   - `challenge_participants` - Challenge participation
   - `milestones` - Predefined milestones
   - `user_milestones` - User milestone progress
   - `streaks` - User activity streaks
   - `seasonal_events` - Seasonal events
   - `user_seasonal_progress` - User progress in events

2. **Creates performance indexes** on all tables for efficient queries

3. **Sets up Row Level Security (RLS)** policies to ensure data privacy

4. **Seeds predefined data:**
   - 24 achievements across all categories
   - 24 milestones for tracking progress

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root directory
cd /path/to/your/project

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/002_gamification_system.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 3: Manual SQL Execution

If you have direct database access:

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/002_gamification_system.sql
```

## Post-Migration Steps

After applying the migration, you need to initialize data for existing users:

### 1. Create User Levels for Existing Users

Run this SQL to create level records for all existing users:

```sql
INSERT INTO user_levels (user_id, level, experience_points, experience_to_next_level, total_experience)
SELECT 
  id,
  1,
  0,
  100,
  0
FROM user_profiles
WHERE id NOT IN (SELECT user_id FROM user_levels)
ON CONFLICT (user_id) DO NOTHING;
```

### 2. Create User Achievement Records

Run this SQL to create achievement records for all users:

```sql
INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked)
SELECT 
  up.id,
  a.id,
  0,
  false
FROM user_profiles up
CROSS JOIN achievements a
WHERE NOT EXISTS (
  SELECT 1 FROM user_achievements ua 
  WHERE ua.user_id = up.id AND ua.achievement_id = a.id
)
ON CONFLICT (user_id, achievement_id) DO NOTHING;
```

### 3. Create User Milestone Records

Run this SQL to create milestone records for all users:

```sql
INSERT INTO user_milestones (user_id, milestone_id, achieved)
SELECT 
  up.id,
  m.id,
  false
FROM user_profiles up
CROSS JOIN milestones m
WHERE NOT EXISTS (
  SELECT 1 FROM user_milestones um 
  WHERE um.user_id = up.id AND um.milestone_id = m.id
)
ON CONFLICT (user_id, milestone_id) DO NOTHING;
```

### 4. Create Streak Records

Run this SQL to create streak records for all users:

```sql
INSERT INTO streaks (user_id, streak_type, current_count, best_count, last_activity_date)
SELECT 
  id,
  streak_type,
  0,
  0,
  CURRENT_DATE
FROM user_profiles
CROSS JOIN (
  VALUES 
    ('daily_login'),
    ('lesson_creation'),
    ('quiz_completion'),
    ('quest_completion')
) AS types(streak_type)
WHERE NOT EXISTS (
  SELECT 1 FROM streaks s 
  WHERE s.user_id = user_profiles.id AND s.streak_type = types.streak_type
)
ON CONFLICT (user_id, streak_type) DO NOTHING;
```

## Verification

After applying the migration and post-migration steps, verify everything is working:

### 1. Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'achievements',
  'user_achievements',
  'user_levels',
  'quests',
  'user_quests',
  'challenges',
  'challenge_participants',
  'milestones',
  'user_milestones',
  'streaks',
  'seasonal_events',
  'user_seasonal_progress'
);
```

Should return 12 rows.

### 2. Check Achievements Seeded

```sql
SELECT COUNT(*) FROM achievements;
```

Should return 24.

### 3. Check Milestones Seeded

```sql
SELECT COUNT(*) FROM milestones;
```

Should return 24.

### 4. Check RLS Policies

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'achievements',
  'user_achievements',
  'user_levels',
  'quests',
  'user_quests',
  'challenges',
  'challenge_participants',
  'milestones',
  'user_milestones',
  'streaks',
  'seasonal_events',
  'user_seasonal_progress'
);
```

Should return multiple policies for each table.

### 5. Check User Data Initialized

```sql
-- Check user levels
SELECT COUNT(*) FROM user_levels;

-- Check user achievements
SELECT COUNT(*) FROM user_achievements;

-- Check user milestones
SELECT COUNT(*) FROM user_milestones;

-- Check streaks
SELECT COUNT(*) FROM streaks;
```

Each should return counts matching the number of users multiplied by the number of items (achievements, milestones, streak types).

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop all tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS user_seasonal_progress CASCADE;
DROP TABLE IF EXISTS seasonal_events CASCADE;
DROP TABLE IF EXISTS streaks CASCADE;
DROP TABLE IF EXISTS user_milestones CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS challenge_participants CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS user_levels CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
```

**Warning:** This will delete all gamification data. Only use in development/testing.

## Troubleshooting

### Error: relation "user_profiles" does not exist

This means the base schema hasn't been applied yet. Apply `001_initial_schema.sql` first.

### Error: duplicate key value violates unique constraint

This usually happens if you're re-running the migration. The `ON CONFLICT DO NOTHING` clauses should prevent this, but if you see it, you can safely ignore it or drop the tables and re-run.

### RLS Policies Not Working

Make sure RLS is enabled on all tables:

```sql
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

## Next Steps

After successfully applying the migration:

1. Implement the gamification services (Task 2-10)
2. Create the API routes (Task 12)
3. Build the UI components (Task 15-21)
4. Test the complete system (Task 28)

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you have the necessary permissions
4. Review the error messages carefully
