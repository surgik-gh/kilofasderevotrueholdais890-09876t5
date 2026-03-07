# Gamification System Migration Guide

This guide provides step-by-step instructions for migrating existing users to the new gamification system.

## Overview

The gamification system adds achievements, levels, quests, challenges, milestones, and streaks to the AILesson platform. For existing users, we need to initialize their gamification data so they can start earning achievements and progressing through the system.

## Prerequisites

Before running the migration, ensure:

1. ✅ The database migration `002_gamification_system.sql` has been applied
2. ✅ All gamification tables exist in the database
3. ✅ Predefined achievements and milestones have been seeded
4. ✅ You have access to Supabase credentials
5. ✅ You have a backup of the production database (for production migrations)

## Migration Steps

### Step 1: Install Dependencies

First, install the required dependencies:

```bash
npm install
```

This will install `tsx` which is needed to run the TypeScript migration script.

### Step 2: Verify Database Migration

Verify that the gamification tables exist:

```sql
-- Check if tables exist
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

-- Check if achievements are seeded
SELECT COUNT(*) FROM achievements;
-- Should return 25 or more

-- Check if milestones are seeded
SELECT COUNT(*) FROM milestones;
-- Should return 24 or more
```

### Step 3: Test in Development/Staging

**IMPORTANT**: Always test the migration in a development or staging environment first!

```bash
# Ensure .env file has development/staging credentials
npm run migrate:gamification
```

Review the output carefully:
- Check that all users are processed
- Verify the number of records created
- Look for any errors

### Step 4: Verify Migration Results

After the migration, verify the data:

```sql
-- Check total records created
SELECT 
  (SELECT COUNT(*) FROM user_levels) as levels,
  (SELECT COUNT(*) FROM user_achievements) as achievements,
  (SELECT COUNT(*) FROM streaks) as streaks,
  (SELECT COUNT(*) FROM user_milestones) as milestones;

-- Check a specific user (replace with actual user ID)
SELECT 
  ul.level,
  ul.experience_points,
  ul.total_experience,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = ul.user_id) as achievement_count,
  (SELECT COUNT(*) FROM streaks WHERE user_id = ul.user_id) as streak_count,
  (SELECT COUNT(*) FROM user_milestones WHERE user_id = ul.user_id) as milestone_count
FROM user_levels ul
WHERE ul.user_id = 'your-user-id';

-- Verify all users have levels
SELECT COUNT(*) as users_without_levels
FROM user_profiles up
LEFT JOIN user_levels ul ON up.id = ul.user_id
WHERE ul.id IS NULL;
-- Should return 0
```

### Step 5: Run in Production

Once verified in staging, run the migration in production:

```bash
# Set production environment variables
export VITE_SUPABASE_URL=your_production_url
export VITE_SUPABASE_ANON_KEY=your_production_key

# Run the migration
npm run migrate:gamification
```

### Step 6: Post-Migration Verification

After production migration:

1. **Check the migration output** for any errors
2. **Verify record counts** match expected values
3. **Test with a few user accounts**:
   - Log in as different users
   - Check that they see their level (Level 1)
   - Verify achievements page shows all achievements as locked
   - Confirm quests page is accessible
4. **Monitor application logs** for any errors
5. **Check Supabase dashboard** for any unusual activity

## Migration Script Details

### What the Script Does

The migration script (`scripts/migrate-gamification-data.ts`) performs the following operations for each user:

1. **User Levels**: Creates a level record with:
   - Level: 1
   - Experience: 0
   - Total Experience: 0
   - XP to Next Level: 100

2. **User Achievements**: Creates records for all 25+ achievements:
   - Progress: 0
   - Unlocked: false
   - Is Favorite: false

3. **Streaks**: Creates 4 streak records:
   - daily_login
   - lesson_creation
   - quiz_completion
   - quest_completion
   - All with count: 0

4. **User Milestones**: Creates records for all 24+ milestones:
   - Achieved: false

### Expected Record Counts

For N users, you should see:
- User Levels: N records
- User Achievements: N × 25 records (or more if additional achievements exist)
- Streaks: N × 4 records
- User Milestones: N × 24 records (or more if additional milestones exist)

### Safety Features

- **Idempotent**: Can be run multiple times safely
- **Error Handling**: Errors for individual users don't stop the migration
- **Duplicate Detection**: Skips records that already exist
- **Detailed Logging**: Every step is logged for transparency

## Troubleshooting

### Issue: "No achievements found"

**Cause**: The database migration wasn't applied or seed data is missing.

**Solution**:
```sql
-- Check if achievements table exists
SELECT COUNT(*) FROM achievements;

-- If empty, run the seed data from 002_gamification_system.sql
-- Or manually insert achievements
```

### Issue: "Permission denied"

**Cause**: RLS policies or insufficient permissions.

**Solution**:
- Verify the Supabase key has sufficient permissions
- Check RLS policies allow INSERT operations
- Consider using the service role key for migration (more secure than disabling RLS)

### Issue: "Some users failed to migrate"

**Cause**: Various reasons (foreign key constraints, data issues, etc.)

**Solution**:
1. Review the error messages in the migration output
2. Fix the underlying issues
3. Re-run the migration (it will skip already migrated users)

### Issue: "Migration is too slow"

**Cause**: Large number of users or slow network connection.

**Solution**:
- The script processes users sequentially for safety
- For very large databases (1000+ users), consider:
  - Running during off-peak hours
  - Using a direct database connection instead of the API
  - Batching the operations

## Rollback Procedure

If you need to rollback the migration (development/staging only):

```sql
-- WARNING: This deletes all gamification data
-- Only use in development/staging environments

BEGIN;

-- Delete user data (cascades will handle related records)
DELETE FROM user_achievements;
DELETE FROM user_levels;
DELETE FROM streaks;
DELETE FROM user_milestones;
DELETE FROM user_quests;
DELETE FROM challenge_participants;
DELETE FROM user_seasonal_progress;

COMMIT;
```

For production, instead of rollback:
1. Fix the issue
2. Re-run the migration (it's idempotent)

## Post-Migration Tasks

After successful migration:

1. ✅ Update documentation to reflect the new features
2. ✅ Notify users about the new gamification system
3. ✅ Monitor system performance and user engagement
4. ✅ Set up Vercel cron jobs for daily/weekly quest resets
5. ✅ Create initial seasonal events (optional)
6. ✅ Monitor error logs for any issues

## Monitoring

After migration, monitor:

- **User engagement**: Are users earning achievements?
- **System performance**: Any slowdowns?
- **Error rates**: Any new errors in logs?
- **Database size**: Expected growth in database size

## Support

If you encounter issues during migration:

1. Check the error messages in the migration output
2. Review the troubleshooting section above
3. Check Supabase logs for database errors
4. Verify RLS policies are correctly configured
5. Test with a single user first before migrating all users

## Checklist

Use this checklist to ensure a smooth migration:

### Pre-Migration
- [ ] Database migration applied
- [ ] Achievements seeded (25+)
- [ ] Milestones seeded (24+)
- [ ] Dependencies installed (`npm install`)
- [ ] Backup created (production only)
- [ ] Tested in staging environment

### Migration
- [ ] Environment variables set correctly
- [ ] Migration script executed
- [ ] No errors in output
- [ ] Record counts verified

### Post-Migration
- [ ] User levels created for all users
- [ ] User achievements created
- [ ] Streaks created
- [ ] Milestones created
- [ ] Tested with sample user accounts
- [ ] Application working correctly
- [ ] No errors in logs
- [ ] Users notified of new features

## Timeline

Estimated time for migration:
- Small database (< 100 users): 2-5 minutes
- Medium database (100-1000 users): 5-30 minutes
- Large database (1000+ users): 30+ minutes

Plan accordingly and schedule during low-traffic periods for production.
