-- Migration: Teacher Multi-School Support
-- Allows teachers to be associated with multiple schools

-- ============================================================================
-- ENSURE SCHOOL_MEMBERSHIPS TABLE EXISTS
-- ============================================================================

-- This table should already exist from migration 001, but we'll ensure it's correct
CREATE TABLE IF NOT EXISTS school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'student')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_school_memberships_user_id ON school_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_school_memberships_school_id ON school_memberships(school_id);

-- ============================================================================
-- UPDATE RLS POLICIES FOR SCHOOL_MEMBERSHIPS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own school memberships" ON school_memberships;
DROP POLICY IF EXISTS "Teachers can manage their school memberships" ON school_memberships;
DROP POLICY IF EXISTS "Administrators can manage all school memberships" ON school_memberships;

-- Enable RLS
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
CREATE POLICY "Users can view their own school memberships"
  ON school_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Teachers can insert their own memberships (join schools)
CREATE POLICY "Teachers can join schools"
  ON school_memberships
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    role = 'teacher' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Teachers can delete their own memberships (leave schools)
CREATE POLICY "Teachers can leave schools"
  ON school_memberships
  FOR DELETE
  USING (
    user_id = auth.uid() AND
    role = 'teacher'
  );

-- Administrators can manage all memberships
CREATE POLICY "Administrators can manage all school memberships"
  ON school_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- ============================================================================
-- UPDATE TEACHER ACCESS CHECKS
-- ============================================================================

-- Function to check if a teacher has access to any school
CREATE OR REPLACE FUNCTION has_teacher_school_access(teacher_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM school_memberships
    WHERE user_id = teacher_id AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teacher's schools
CREATE OR REPLACE FUNCTION get_teacher_schools(teacher_id UUID)
RETURNS TABLE (
  school_id UUID,
  school_name TEXT,
  is_primary BOOLEAN,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.school_id,
    s.name as school_name,
    (up.school_id = sm.school_id) as is_primary,
    sm.joined_at
  FROM school_memberships sm
  JOIN schools s ON s.id = sm.school_id
  LEFT JOIN user_profiles up ON up.id = teacher_id
  WHERE sm.user_id = teacher_id AND sm.role = 'teacher'
  ORDER BY is_primary DESC, sm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE LESSONS RLS TO SUPPORT MULTI-SCHOOL TEACHERS
-- ============================================================================

-- Drop and recreate teacher lesson policies
DROP POLICY IF EXISTS "Teachers can create lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers can view their school lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers can update their own lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers can delete their own lessons" ON lessons;

-- Teachers can create lessons if they belong to at least one school
CREATE POLICY "Teachers can create lessons"
  ON lessons
  FOR INSERT
  WITH CHECK (
    creator_id = auth.uid() AND
    creator_role = 'teacher' AND
    has_teacher_school_access(auth.uid())
  );

-- Teachers can view lessons from any of their schools
CREATE POLICY "Teachers can view their school lessons"
  ON lessons
  FOR SELECT
  USING (
    creator_role = 'teacher' AND
    (
      creator_id = auth.uid() OR
      school_id IN (
        SELECT school_id FROM school_memberships
        WHERE user_id = auth.uid() AND role = 'teacher'
      )
    )
  );

-- Teachers can update their own lessons
CREATE POLICY "Teachers can update their own lessons"
  ON lessons
  FOR UPDATE
  USING (
    creator_id = auth.uid() AND
    creator_role = 'teacher'
  );

-- Teachers can delete their own lessons
CREATE POLICY "Teachers can delete their own lessons"
  ON lessons
  FOR DELETE
  USING (
    creator_id = auth.uid() AND
    creator_role = 'teacher'
  );

-- ============================================================================
-- MIGRATION DATA: AUTO-CREATE MEMBERSHIPS FOR EXISTING TEACHERS
-- ============================================================================

-- For teachers who have a school_id but no membership, create one
INSERT INTO school_memberships (user_id, school_id, role, joined_at)
SELECT 
  id as user_id,
  school_id,
  'teacher' as role,
  created_at as joined_at
FROM user_profiles
WHERE role = 'teacher' 
  AND school_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM school_memberships sm
    WHERE sm.user_id = user_profiles.id 
      AND sm.school_id = user_profiles.school_id
  )
ON CONFLICT (school_id, user_id) DO NOTHING;

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View to see teacher-school relationships
CREATE OR REPLACE VIEW teacher_school_summary AS
SELECT 
  up.id as teacher_id,
  up.full_name as teacher_name,
  up.email as teacher_email,
  up.school_id as primary_school_id,
  ps.name as primary_school_name,
  COUNT(sm.id) as total_schools,
  ARRAY_AGG(s.name ORDER BY (up.school_id = sm.school_id) DESC, sm.joined_at) as school_names
FROM user_profiles up
LEFT JOIN school_memberships sm ON sm.user_id = up.id AND sm.role = 'teacher'
LEFT JOIN schools s ON s.id = sm.school_id
LEFT JOIN schools ps ON ps.id = up.school_id
WHERE up.role = 'teacher'
GROUP BY up.id, up.full_name, up.email, up.school_id, ps.name;

-- Grant access to authenticated users
GRANT SELECT ON teacher_school_summary TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE school_memberships IS 'Tracks user memberships in schools, allowing teachers to belong to multiple schools';
COMMENT ON FUNCTION has_teacher_school_access IS 'Checks if a teacher has access to at least one school';
COMMENT ON FUNCTION get_teacher_schools IS 'Returns all schools a teacher belongs to with primary school indicator';
COMMENT ON VIEW teacher_school_summary IS 'Summary view of teacher-school relationships';
