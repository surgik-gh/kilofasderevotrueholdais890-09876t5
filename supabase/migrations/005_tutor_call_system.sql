-- ============================================================================
-- MIGRATION 005: Tutor Call System
-- ============================================================================
-- This migration adds support for voice calls with AI tutor using LMNT API
-- Features:
-- - Call session tracking
-- - Duration and cost tracking
-- - Call history
-- - RLS policies for security

-- ============================================================================
-- TABLES
-- ============================================================================

-- Tutor Call Sessions
-- Tracks voice call sessions with AI tutor
CREATE TABLE IF NOT EXISTS tutor_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  coins_charged INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_tutor_call_sessions_user_id ON tutor_call_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_call_sessions_status ON tutor_call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutor_call_sessions_started_at ON tutor_call_sessions(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE tutor_call_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own call sessions
CREATE POLICY "Users can view own call sessions"
  ON tutor_call_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own call sessions
CREATE POLICY "Users can create own call sessions"
  ON tutor_call_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own call sessions
CREATE POLICY "Users can update own call sessions"
  ON tutor_call_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Administrators can view all call sessions
CREATE POLICY "Administrators can view all call sessions"
  ON tutor_call_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tutor_call_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tutor_call_sessions_updated_at_trigger
  BEFORE UPDATE ON tutor_call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_call_sessions_updated_at();

-- ============================================================================
-- UPDATE TRANSACTION TYPES
-- ============================================================================

-- Add tutor_call_usage to transaction types if not exists
-- Note: This assumes transactions table has a check constraint on transaction_type
-- If the constraint exists, we need to drop and recreate it

DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'transactions_transaction_type_check'
    AND table_name = 'transactions'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_transaction_type_check;
  END IF;

  -- Add new constraint with tutor_call_usage
  ALTER TABLE transactions ADD CONSTRAINT transactions_transaction_type_check
    CHECK (transaction_type IN (
      'initial_grant',
      'daily_login',
      'biweekly_grant',
      'leaderboard_reward',
      'lesson_creation',
      'quiz_creation',
      'expert_chat_usage',
      'subscription_purchase',
      'tutor_call_usage'
    ));
END $$;

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- View for call statistics
CREATE OR REPLACE VIEW tutor_call_statistics AS
SELECT
  user_id,
  COUNT(*) as total_calls,
  SUM(duration_seconds) as total_duration_seconds,
  SUM(coins_charged) as total_coins_spent,
  AVG(duration_seconds) as avg_duration_seconds,
  AVG(coins_charged) as avg_coins_per_call,
  MAX(started_at) as last_call_date
FROM tutor_call_sessions
WHERE status = 'completed'
GROUP BY user_id;

-- Grant access to view
GRANT SELECT ON tutor_call_statistics TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tutor_call_sessions IS 'Tracks voice call sessions with AI tutor';
COMMENT ON COLUMN tutor_call_sessions.user_id IS 'User who initiated the call';
COMMENT ON COLUMN tutor_call_sessions.subject IS 'Optional subject for the call';
COMMENT ON COLUMN tutor_call_sessions.duration_seconds IS 'Total call duration in seconds';
COMMENT ON COLUMN tutor_call_sessions.coins_charged IS 'Total Wisdom Coins charged for the call';
COMMENT ON COLUMN tutor_call_sessions.status IS 'Call status: active, completed, or cancelled';

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 005: Tutor Call System completed successfully';
END $$;
