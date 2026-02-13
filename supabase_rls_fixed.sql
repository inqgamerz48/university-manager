-- ========================================
-- UNI Manager - Row Level Security (RLS)
-- ========================================
-- Run this in Supabase SQL Editor after Prisma schema is pushed

-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- USERS & PROFILES
-- ========================================

-- Users can view own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles are viewable by all authenticated users
CREATE POLICY "Profiles are viewable by all" ON profiles
  FOR SELECT USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- STUDENTS
-- ========================================

-- Students can view own record
CREATE POLICY "Students can view own record" ON students
  FOR SELECT USING (auth.uid() = user_id);

-- Faculty can view students in their branch
CREATE POLICY "Faculty can view branch students" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM faculty f
      JOIN subjects s ON s.faculty_id = f.id
      WHERE f.user_id = auth.uid()
      AND s.branch_id = students.branch_id
    )
  );

-- Admins can manage all students
CREATE POLICY "Admins can manage students" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- FACULTY
-- ========================================

-- Faculty can view own record
CREATE POLICY "Faculty can view own record" ON faculty
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage faculty
CREATE POLICY "Admins can manage faculty" ON faculty
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- ASSIGNMENTS
-- ========================================

-- Faculty can manage own assignments
CREATE POLICY "Faculty can manage assignments" ON assignments
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM faculty WHERE id = assignments.faculty_id
    )
  );

-- Students can view active assignments
CREATE POLICY "Students can view assignments" ON assignments
  FOR SELECT USING (is_active = true);

-- ========================================
-- SUBMISSIONS
-- ========================================

-- Students can manage own submissions
CREATE POLICY "Students can manage submissions" ON submissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = submissions.student_id
    )
  );

-- Faculty can view submissions for their assignments
CREATE POLICY "Faculty can view submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN faculty f ON f.id = a.faculty_id
      WHERE a.id = submissions.assignment_id
      AND f.user_id = auth.uid()
    )
  );

-- ========================================
-- ATTENDANCE
-- ========================================

-- Faculty can mark attendance
CREATE POLICY "Faculty can mark attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM faculty WHERE user_id = auth.uid()
    )
  );

-- Students can view own attendance
CREATE POLICY "Students can view attendance" ON attendance
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = attendance.student_id
    )
  );

-- ========================================
-- NOTICES
-- ========================================

-- Admins can manage notices
CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- All users can view active notices
CREATE POLICY "All users can view notices" ON notices
  FOR SELECT USING (is_active = true);

-- ========================================
-- COMPLAINTS
-- ========================================

-- Students can manage own complaints
CREATE POLICY "Students can manage complaints" ON complaints
  FOR ALL USING (auth.uid() = student_id);

-- Admins can view all complaints
CREATE POLICY "Admins can view complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can update complaints
CREATE POLICY "Admins can update complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- INSTITUTIONS
-- ========================================

-- All authenticated users can view institutions
CREATE POLICY "Authenticated users can view institutions" ON institutions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage institutions
CREATE POLICY "Admins can manage institutions" ON institutions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- BRANCHES
-- ========================================

-- All authenticated users can view branches
CREATE POLICY "Authenticated users can view branches" ON branches
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage branches
CREATE POLICY "Admins can manage branches" ON branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- SUBJECTS
-- ========================================

-- All authenticated users can view active subjects
CREATE POLICY "Authenticated users can view subjects" ON subjects
  FOR SELECT USING (is_active = true);

-- Faculty can manage their subjects
CREATE POLICY "Faculty can manage subjects" ON subjects
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM faculty WHERE id = subjects.faculty_id
    )
  );

-- ========================================
-- ENROLLMENTS
-- ========================================

-- Students can view own enrollments
CREATE POLICY "Students can view enrollments" ON enrollments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = enrollments.student_id
    )
  );

-- Faculty can view enrollments for their subjects
CREATE POLICY "Faculty can view enrollments" ON enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM faculty f
      JOIN subjects s ON s.faculty_id = f.id
      WHERE s.id = enrollments.subject_id
      AND f.user_id = auth.uid()
    )
  );

-- Admins can manage enrollments
CREATE POLICY "Admins can manage enrollments" ON enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- FEE STRUCTURES & PAYMENTS
-- ========================================

-- All authenticated users can view fee structures
CREATE POLICY "Authenticated users can view fee structures" ON fee_structures
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage fee structures
CREATE POLICY "Admins can manage fee structures" ON fee_structures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Students can view own fee payments
CREATE POLICY "Students can view own fee payments" ON fee_payments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = fee_payments.student_id
    )
  );

-- Students can create fee payments
CREATE POLICY "Students can create fee payments" ON fee_payments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = fee_payments.student_id
    )
  );

-- Admins can manage all fee payments
CREATE POLICY "Admins can manage fee payments" ON fee_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- NOTIFICATIONS
-- ========================================

-- Users can view own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (institution_id IS NOT NULL AND auth.role() = 'authenticated')
  );

-- Admins can manage notifications
CREATE POLICY "Admins can manage notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- PERMISSIONS & ROLE PERMISSIONS
-- ========================================

-- All authenticated users can view permissions
CREATE POLICY "Authenticated users can view permissions" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage permissions
CREATE POLICY "Admins can manage permissions" ON permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can manage role permissions
CREATE POLICY "Admins can manage role_permissions" ON role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- AUDIT LOGS
-- ========================================

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- System can create audit logs (bypass RLS)
CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ========================================
-- SESSIONS
-- ========================================

-- Users can view own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

-- System can manage sessions
CREATE POLICY "System can manage sessions" ON sessions
  FOR ALL USING (true);
