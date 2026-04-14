-- Automatic Teacher School Assignment Fix
-- This script will automatically assign the most recent teacher to a school

-- Create a school if none exists
DO $$
DECLARE
  v_school_id uuid;
  v_teacher_id uuid;
BEGIN
  -- Check if any school exists
  SELECT id INTO v_school_id FROM schools LIMIT 1;
  
  -- If no school exists, create one
  IF v_school_id IS NULL THEN
    INSERT INTO schools (name, address)
    VALUES ('Тестовая школа', 'г. Москва')
    RETURNING id INTO v_school_id;
    
    RAISE NOTICE 'Created new school with ID: %', v_school_id;
  ELSE
    RAISE NOTICE 'Using existing school with ID: %', v_school_id;
  END IF;
  
  -- Get the most recent teacher without a school
  SELECT id INTO v_teacher_id 
  FROM user_profiles 
  WHERE role = 'teacher' AND school_id IS NULL
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_teacher_id IS NULL THEN
    -- Try to get any teacher
    SELECT id INTO v_teacher_id 
    FROM user_profiles 
    WHERE role = 'teacher'
    ORDER BY created_at DESC 
    LIMIT 1;
  END IF;
  
  IF v_teacher_id IS NOT NULL THEN
    -- Update teacher's school_id
    UPDATE user_profiles
    SET school_id = v_school_id
    WHERE id = v_teacher_id;
    
    RAISE NOTICE 'Updated teacher % with school_id: %', v_teacher_id, v_school_id;
    
    -- Create or update school membership
    INSERT INTO school_memberships (school_id, user_id, role)
    VALUES (v_school_id, v_teacher_id, 'teacher')
    ON CONFLICT (school_id, user_id) DO UPDATE
    SET role = 'teacher';
    
    RAISE NOTICE 'Created school membership for teacher %', v_teacher_id;
    
    -- Assign existing students to this school if none exist
    IF NOT EXISTS (
      SELECT 1 FROM school_memberships 
      WHERE school_id = v_school_id AND role = 'student'
    ) THEN
      -- Find existing students without a school and assign them
      UPDATE user_profiles
      SET school_id = v_school_id
      WHERE role = 'student' 
        AND school_id IS NULL
        AND id IN (
          SELECT id FROM user_profiles 
          WHERE role = 'student' AND school_id IS NULL 
          LIMIT 5
        );
      
      -- Create school memberships for these students
      INSERT INTO school_memberships (school_id, user_id, role)
      SELECT v_school_id, id, 'student'
      FROM user_profiles
      WHERE role = 'student' AND school_id = v_school_id
      ON CONFLICT (school_id, user_id) DO NOTHING;
      
      RAISE NOTICE 'Assigned existing students to school %', v_school_id;
    END IF;
  ELSE
    RAISE NOTICE 'No teacher found in the database';
  END IF;
END $$;

-- Verify the results
SELECT 
  'Teacher Assignment Verification' as info,
  up.id,
  up.full_name,
  up.email,
  up.role,
  up.school_id,
  s.name as school_name,
  sm.role as membership_role
FROM user_profiles up
LEFT JOIN schools s ON up.school_id = s.id
LEFT JOIN school_memberships sm ON up.id = sm.user_id AND up.school_id = sm.school_id
WHERE up.role = 'teacher'
ORDER BY up.created_at DESC
LIMIT 5;

-- Show students in the same school
SELECT 
  'Students in Teacher School' as info,
  up.id,
  up.full_name,
  up.email,
  up.grade,
  up.wisdom_coins,
  s.name as school_name
FROM user_profiles up
JOIN schools s ON up.school_id = s.id
WHERE up.role = 'student' 
  AND up.school_id IN (
    SELECT school_id FROM user_profiles WHERE role = 'teacher' LIMIT 1
  )
ORDER BY up.created_at DESC
LIMIT 10;
