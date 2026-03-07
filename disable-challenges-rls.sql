-- ============================================================================
-- EMERGENCY FIX: Completely Disable RLS for Challenges
-- ============================================================================
-- This script completely disables RLS for challenges tables to resolve
-- the infinite recursion issue. Security will be handled at application level.
-- ============================================================================

-- Drop ALL existing policies for challenges
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'challenges') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON challenges';
    END LOOP;
END $$;

-- Drop ALL existing policies for challenge_participants
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'challenge_participants') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON challenge_participants';
    END LOOP;
END $$;

-- Disable RLS completely
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('challenges', 'challenge_participants');

-- Verify no policies exist
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('challenges', 'challenge_participants');

-- Test queries to ensure they work
SELECT COUNT(*) as challenge_count FROM challenges;
SELECT COUNT(*) as participant_count FROM challenge_participants;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'RLS has been disabled for challenges and challenge_participants tables.';
    RAISE NOTICE 'All security checks will now be performed at the application level.';
    RAISE NOTICE 'Please refresh your application to test.';
END $$;
