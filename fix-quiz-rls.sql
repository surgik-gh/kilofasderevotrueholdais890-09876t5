-- Fix RLS policies for quizzes table

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view quizzes for accessible lessons" ON quizzes;
DROP POLICY IF EXISTS "Users can create quizzes for their lessons" ON quizzes;
DROP POLICY IF EXISTS "Users can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Anyone can view quizzes" ON quizzes;

-- Create permissive policies for development
CREATE POLICY "Anyone can view quizzes"
  ON quizzes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update quizzes"
  ON quizzes FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete quizzes"
  ON quizzes FOR DELETE
  USING (true);

-- Success message
SELECT 'Quiz RLS policies updated successfully!' as message;
