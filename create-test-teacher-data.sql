-- Create Test Data for Teachers and Students
-- Run this script if you need test data for teacher dashboard

-- Note: Replace the UUIDs below with actual user IDs from your database
-- You can get them by running: SELECT id, full_name, email, role FROM user_profiles;

-- Example: Create school memberships for existing users
-- Uncomment and modify the following lines with actual IDs:

/*
-- Create school membership for a teacher
INSERT INTO school_memberships (school_id, user_id, role)
VALUES (
  'YOUR_SCHOOL_ID_HERE',  -- Replace with actual school ID
  'YOUR_TEACHER_ID_HERE',  -- Replace with actual teacher user ID
  'teacher'
)
ON CONFLICT DO NOTHING;

-- Create school memberships for students
INSERT INTO school_memberships (school_id, user_id, role)
VALUES 
  ('YOUR_SCHOOL_ID_HERE', 'STUDENT_1_ID_HERE', 'student'),
  ('YOUR_SCHOOL_ID_HERE', 'STUDENT_2_ID_HERE', 'student'),
  ('YOUR_SCHOOL_ID_HERE', 'STUDENT_3_ID_HERE', 'student')
ON CONFLICT DO NOTHING;
*/

-- Alternative: If users don't have school_id set in user_profiles, update it
/*
UPDATE user_profiles
SET school_id = 'YOUR_SCHOOL_ID_HERE'
WHERE id IN ('TEACHER_ID', 'STUDENT_1_ID', 'STUDENT_2_ID', 'STUDENT_3_ID');
*/

-- Check the results
SELECT 
  sm.role,
  up.full_name,
  up.email,
  s.name as school_name
FROM school_memberships sm
JOIN user_profiles up ON sm.user_id = up.id
LEFT JOIN schools s ON sm.school_id = s.id
ORDER BY sm.role, up.full_name;
