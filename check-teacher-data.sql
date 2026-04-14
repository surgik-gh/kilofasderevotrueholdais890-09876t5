-- Check Teacher Data and School Memberships
-- This script helps diagnose why students and class analytics pages are empty

-- 1. Check if there are any schools
SELECT 
  'Schools' as table_name,
  COUNT(*) as count
FROM schools;

-- 2. Check if there are any school memberships
SELECT 
  'School Memberships' as table_name,
  COUNT(*) as count
FROM school_memberships;

-- 3. Check school memberships by role
SELECT 
  role,
  COUNT(*) as count
FROM school_memberships
GROUP BY role
ORDER BY role;

-- 4. Check user profiles by role
SELECT 
  role,
  COUNT(*) as count
FROM user_profiles
GROUP BY role
ORDER BY role;

-- 5. Check if teachers have school_id set
SELECT 
  id,
  full_name,
  email,
  role,
  school_id
FROM user_profiles
WHERE role = 'teacher'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if students have school_id set
SELECT 
  id,
  full_name,
  email,
  role,
  school_id,
  grade
FROM user_profiles
WHERE role = 'student'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check school memberships for teachers
SELECT 
  sm.id,
  sm.school_id,
  sm.user_id,
  sm.role,
  up.full_name,
  up.email,
  s.name as school_name
FROM school_memberships sm
JOIN user_profiles up ON sm.user_id = up.id
LEFT JOIN schools s ON sm.school_id = s.id
WHERE sm.role = 'teacher'
ORDER BY up.created_at DESC
LIMIT 10;

-- 8. Check school memberships for students
SELECT 
  sm.id,
  sm.school_id,
  sm.user_id,
  sm.role,
  up.full_name,
  up.email,
  up.grade,
  s.name as school_name
FROM school_memberships sm
JOIN user_profiles up ON sm.user_id = up.id
LEFT JOIN schools s ON sm.school_id = s.id
WHERE sm.role = 'student'
ORDER BY up.created_at DESC
LIMIT 10;

-- 9. Check quiz attempts for analytics
SELECT 
  COUNT(*) as total_attempts,
  COUNT(DISTINCT student_id) as unique_students
FROM quiz_attempts;

-- 10. Check quiz attempts with subject information
SELECT 
  l.subject,
  COUNT(*) as attempts_count,
  AVG(qa.score_percentage) as avg_score
FROM quiz_attempts qa
JOIN quizzes q ON qa.quiz_id = q.id
JOIN lessons l ON q.lesson_id = l.id
GROUP BY l.subject
ORDER BY attempts_count DESC;
