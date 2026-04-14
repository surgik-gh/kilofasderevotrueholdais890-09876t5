-- Fix Teacher School Assignment
-- This script ensures teachers are properly assigned to schools

-- Step 1: Check current state
SELECT 
  'Current Teacher State' as info,
  id,
  full_name,
  email,
  role,
  school_id,
  created_at
FROM user_profiles
WHERE role = 'teacher'
ORDER BY created_at DESC;

-- Step 2: Check if there are any schools
SELECT 
  'Available Schools' as info,
  id,
  name,
  created_at
FROM schools
ORDER BY created_at DESC;

-- Step 3: Check school memberships for teachers
SELECT 
  'Teacher School Memberships' as info,
  sm.id,
  sm.school_id,
  sm.user_id,
  up.full_name,
  s.name as school_name
FROM school_memberships sm
JOIN user_profiles up ON sm.user_id = up.id
LEFT JOIN schools s ON sm.school_id = s.id
WHERE sm.role = 'teacher';

-- Step 4: If you need to assign a teacher to a school, use this:
-- Replace <teacher_user_id> with actual teacher ID
-- Replace <school_id> with actual school ID

-- Example: Update teacher's school_id in user_profiles
-- UPDATE user_profiles
-- SET school_id = '<school_id>'
-- WHERE id = '<teacher_user_id>' AND role = 'teacher';

-- Example: Create school membership if it doesn't exist
-- INSERT INTO school_memberships (school_id, user_id, role)
-- VALUES ('<school_id>', '<teacher_user_id>', 'teacher')
-- ON CONFLICT (school_id, user_id) DO NOTHING;

-- Step 5: Verify the fix
-- SELECT 
--   'Verification' as info,
--   up.id,
--   up.full_name,
--   up.school_id,
--   sm.school_id as membership_school_id,
--   s.name as school_name
-- FROM user_profiles up
-- LEFT JOIN school_memberships sm ON up.id = sm.user_id
-- LEFT JOIN schools s ON up.school_id = s.id
-- WHERE up.role = 'teacher';
