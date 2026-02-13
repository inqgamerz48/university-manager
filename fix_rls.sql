-- Fix RLS for institutions and student_pre_imports tables
-- Run this in Supabase SQL Editor

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow select on institutions" ON institutions;
DROP POLICY IF EXISTS "Allow update on institutions" ON institutions;
DROP POLICY IF EXISTS "Allow select on student_pre_imports" ON student_pre_imports;
DROP POLICY IF EXISTS "Allow update on student_pre_imports" ON student_pre_imports;

-- Enable RLS (if not already enabled)
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_pre_imports ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for registration
CREATE POLICY "Allow select on institutions" ON institutions
  FOR SELECT USING (true);

CREATE POLICY "Allow select on student_pre_imports" ON student_pre_imports
  FOR SELECT USING (true);

CREATE POLICY "Allow update on student_pre_imports" ON student_pre_imports
  FOR UPDATE USING (true);

-- Also create insert policy for student_pre_imports if needed
CREATE POLICY "Allow insert on student_pre_imports" ON student_pre_imports
  FOR INSERT WITH CHECK (true);
