-- Assign Teacher to School - Quick Fix
-- This script will help you assign a teacher to a school

-- Step 1: Find your teacher account
SELECT 
  'Your Teacher Account' as info,
  id as teacher_id,
  full_name,
  email,
  role,
  school_id,
  created_at
FROM user_profiles
WHERE role = 'teacher'
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Find available schools (or create one if needed)
SELECT 
  'Available Schools' as info,
  id as school_id,
  name,
  address,
  created_at
FROM schools
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: If no school exists, create one (uncomment and modify):
-- INSERT INTO schools (name, address)
-- VALUES ('Моя школа', 'Адрес школы')
-- RETURNING id, name;

-- Step 4: Assign teacher to school
-- Replace <teacher_id> with your teacher ID from Step 1
-- Replace <school_id> with school ID from Step 2 (or newly created school)

-- Update user profile with school_id
-- UPDATE user_profiles
-- SET school_id = '<school_id>'
-- WHERE id = '<teacher_id>' AND role = 'teacher';

-- Create school membership
-- INSERT INTO school_memberships (school_id, user_id, role)
-- VALUES ('<school_id>', '<teacher_id>', 'teacher')
-- ON CONFLICT (school_id, user_id) DO UPDATE
-- SET role = 'teacher';

-- Step 5: Verify the assignment
-- SELECT 
--   'Verification' as info,
--   up.id,
--   up.full_name,
--   up.email,
--   up.role,
--   up.school_id,
--   s.name as school_name,
--   sm.role as membership_role
-- FROM user_profiles up
-- LEFT JOIN schools s ON up.school_id = s.id
-- LEFT JOIN school_memberships sm ON up.id = sm.user_id AND up.school_id = sm.school_id
-- WHERE up.role = 'teacher' AND up.id = '<teacher_id>';

-- Step 6: Optional - Create test students in the same school
-- INSERT INTO user_profiles (id, email, full_name, role, school_id, wisdom_coins, subscription_tier, grade)
-- VALUES 
--   (gen_random_uuid(), 'student1@test.com', 'Тестовый Ученик 1', 'student', '<school_id>', 50, 'student_freemium', '10'),
--   (gen_random_uuid(), 'student2@test.com', 'Тестовый Ученик 2', 'student', '<school_id>', 50, 'student_freemium', '10'),
--   (gen_random_uuid(), 'student3@test.com', 'Тестовый Ученик 3', 'student', '<school_id>', 50, 'student_freemium', '11')
-- ON CONFLICT (email) DO NOTHING;

-- Step 7: Create school memberships for test students
-- INSERT INTO school_memberships (school_id, user_id, role)
-- SELECT '<school_id>', id, 'student'
-- FROM user_profiles
-- WHERE email IN ('student1@test.com', 'student2@test.com', 'student3@test.com')
-- ON CONFLICT (school_id, user_id) DO NOTHING;
