# Apply Database Migration

Your database is missing the required tables. Follow these steps:

## Steps to Apply Migration

### Option 1: Supabase Dashboard (Easiest)

1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/pnhmrddjsoyatqwvkgvr
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query" button
4. Open the file `supabase/migrations/001_initial_schema.sql` in your editor
5. Copy ALL the content (Ctrl+A, Ctrl+C)
6. Paste it into the Supabase SQL Editor
7. Click "Run" button (or press Ctrl+Enter)
8. Wait for the query to complete (should take 5-10 seconds)
9. You should see "Success. No rows returned" message

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref pnhmrddjsoyatqwvkgvr

# Push the migration
supabase db push
```

### Option 3: Install Supabase CLI

If you don't have Supabase CLI:

```bash
# Install via npm
npm install -g supabase

# Then follow Option 2 steps
```

## Verify Migration

After applying the migration, verify it worked:

1. Go to Supabase Dashboard → Table Editor
2. You should see these tables:
   - user_profiles
   - schools
   - lessons
   - quizzes
   - chats
   - leaderboard_entries
   - support_tickets
   - transactions
   - And more...

## After Migration

Once the migration is applied:
1. Refresh your application
2. Try creating a lesson again
3. It should work now!

## Current Error

The error you're seeing:
```
Could not find the table 'public.lessons' in the schema cache
```

This means the `lessons` table doesn't exist in your database yet. The migration will create it.
