-- ============================================
-- UNI Manager RLS (Row Level Security) Policies
-- For B.Tech + Diploma College Management System
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Institution Policies
-- ============================================

-- Everyone can view active institutions
CREATE POLICY "Anyone can view active institutions" ON institutions
  FOR SELECT USING (is_active = true);

-- Only SUPER_ADMIN can modify institutions
CREATE POLICY "Super admins can manage institutions" ON institutions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- Branch Policies
-- ============================================

-- All authenticated users can view active branches
CREATE POLICY "Anyone can view active branches" ON branches
  FOR SELECT USING (is_active = true);

-- Only SUPER_ADMIN can modify branches
CREATE POLICY "Super admins can manage branches" ON branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- User Policies
-- ============================================

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users in their institution
CREATE POLICY "Admins can view institution users" ON users
  FOR SELECT USING (
    institution_id = (
      SELECT institution_id FROM users WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Profile Policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all profiles in their institution
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      AND EXISTS (
        SELECT 1 FROM users u2
        WHERE u2.institution_id = u.institution_id
        AND u2.id = profiles.user_id
      )
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- Student Policies
-- ============================================

-- Students can view their own data
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (user_id = auth.uid());

-- Students can update their own data
CREATE POLICY "Students can update own data" ON students
  FOR UPDATE USING (user_id = auth.uid());

-- Faculty can view students in their branch
CREATE POLICY "Faculty can view branch students" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM faculty f
      WHERE f.user_id = auth.uid()
      AND f.branch_id = students.branch_id
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can manage all students
CREATE POLICY "Admins can manage students" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Faculty Policies
-- ============================================

-- Faculty can view their own data
CREATE POLICY "Faculty can view own data" ON faculty
  FOR SELECT USING (user_id = auth.uid());

-- Faculty can update their own data
CREATE POLICY "Faculty can update own data" ON faculty
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can manage all faculty
CREATE POLICY "Admins can manage faculty" ON faculty
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Subject Policies
-- ============================================

-- Everyone can view active subjects
CREATE POLICY "Anyone can view active subjects" ON subjects
  FOR SELECT USING (is_active = true);

-- Faculty can manage their assigned subjects
CREATE POLICY "Faculty manage assigned subjects" ON subjects
  FOR ALL USING (faculty_id = (
    SELECT id FROM faculty WHERE user_id = auth.uid()
  ));

-- Admins can manage all subjects
CREATE POLICY "Admins manage all subjects" ON subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Enrollment Policies
-- ============================================

-- Students can view their own enrollments
CREATE POLICY "Students view own enrollments" ON enrollments
  FOR SELECT USING (
    student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Faculty can view enrollments for their subjects
CREATE POLICY "Faculty view subject enrollments" ON enrollments
  FOR SELECT USING (
    faculty_id = (
      SELECT id FROM faculty WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all enrollments
CREATE POLICY "Admins manage enrollments" ON enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Assignment Policies
-- ============================================

-- Everyone can view active assignments
CREATE POLICY "Anyone can view active assignments" ON assignments
  FOR SELECT USING (is_active = true);

-- Faculty can manage their assignments
CREATE POLICY "Faculty manage assignments" ON assignments
  FOR ALL USING (faculty_id = (
    SELECT id FROM faculty WHERE user_id = auth.uid()
  ));

-- Admins can view all assignments
CREATE POLICY "Admins view all assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Submission Policies
-- ============================================

-- Students can view their own submissions
CREATE POLICY "Students view own submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

-- Students can create their own submissions
CREATE POLICY "Students create submissions" ON submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own submissions (before grading)
CREATE POLICY "Students update own submissions" ON submissions
  FOR UPDATE USING (
    student_id = auth.uid() AND graded_at IS NULL
  );

-- Faculty can view submissions for their assignments
CREATE POLICY "Faculty view assignment submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE id = submissions.assignment_id
      AND faculty_id = (SELECT id FROM faculty WHERE user_id = auth.uid())
    )
  );

-- Faculty can grade submissions
CREATE POLICY "Faculty grade submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE id = submissions.assignment_id
      AND faculty_id = (SELECT id FROM faculty WHERE user_id = auth.uid())
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins view all submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Attendance Policies
-- ============================================

-- Students can view their own attendance
CREATE POLICY "Students view own attendance" ON attendance
  FOR SELECT USING (student_id = auth.uid());

-- Faculty can manage attendance for their subjects
CREATE POLICY "Faculty manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE id = attendance.subject_id
      AND faculty_id = (SELECT id FROM faculty WHERE user_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can view all attendance
CREATE POLICY "Admins view all attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Notice Policies
-- ============================================

-- Everyone can view active notices
CREATE POLICY "Anyone can view active notices" ON notices
  FOR SELECT USING (is_active = true);

-- Admins and Faculty can manage notices
CREATE POLICY "Staff can manage notices" ON notices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'FACULTY')
    )
  );

-- ============================================
-- Complaint Policies
-- ============================================

-- Students can view their own complaints
CREATE POLICY "Students view own complaints" ON complaints
  FOR SELECT USING (student_id = auth.uid());

-- Students can create complaints
CREATE POLICY "Students create complaints" ON complaints
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own complaints (if not resolved)
CREATE POLICY "Students update own complaints" ON complaints
  FOR UPDATE USING (
    student_id = auth.uid() AND status IN ('PENDING', 'IN_PROGRESS')
  );

-- Admins can view all complaints
CREATE POLICY "Admins view all complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can update complaints
CREATE POLICY "Admins update complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Fee Structure Policies
-- ============================================

-- Everyone can view fee structures
CREATE POLICY "Anyone can view fee structures" ON fee_structures
  FOR SELECT USING (is_active = true);

-- Admins can manage fee structures
CREATE POLICY "Admins manage fee structures" ON fee_structures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Fee Payment Policies
-- ============================================

-- Students can view their own payments
CREATE POLICY "Students view own payments" ON fee_payments
  FOR SELECT USING (student_id = (
    SELECT id FROM students WHERE user_id = auth.uid()
  ));

-- Students can create payment records (tracking only)
CREATE POLICY "Students create payment records" ON fee_payments
  FOR INSERT WITH CHECK (student_id = (
    SELECT id FROM students WHERE user_id = auth.uid()
  ));

-- Students can update their own payments (before approval)
CREATE POLICY "Students update own payments" ON fee_payments
  FOR UPDATE USING (
    student_id = (SELECT id FROM students WHERE user_id = auth.uid())
    AND status = 'PENDING'
  );

-- Admins can view and manage all payments
CREATE POLICY "Admins manage payments" ON fee_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Notification Policies
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can create notifications for all users
CREATE POLICY "Admins create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'FACULTY')
    )
  );

-- ============================================
-- Audit Log Policies
-- ============================================

-- SUPER_ADMIN can view audit logs
CREATE POLICY "SUPER_ADMIN view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- System can create audit logs (via service role)
CREATE POLICY "System create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Session Policies
-- ============================================

-- Users can manage their own sessions
CREATE POLICY "Users manage own sessions" ON sessions
  FOR ALL USING (user_id = auth.uid());

-- SUPER_ADMIN can manage all sessions
CREATE POLICY "SUPER_ADMIN manage sessions" ON sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- ============================================
-- Permission & RolePermission Policies
-- ============================================

-- Admins can view permissions
CREATE POLICY "Admins view permissions" ON permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- SUPER_ADMIN can manage role permissions
CREATE POLICY "SUPER_ADMIN manage role permissions" ON role_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- ============================================
-- Helper Views
-- ============================================

-- View to check user's institution
CREATE OR REPLACE VIEW user_institutions AS
SELECT 
  u.id as user_id,
  u.institution_id,
  i.name as institution_name,
  i.code as institution_code,
  u.role
FROM users u
LEFT JOIN institutions i ON u.institution_id = i.id
WHERE u.id = auth.uid();

-- View for student's branch info
CREATE OR REPLACE VIEW student_branch_info AS
SELECT 
  s.id as student_id,
  s.pin_number,
  s.roll_number,
  s.admission_year,
  s.current_semester,
  b.name as branch_name,
  b.code as branch_code,
  b.course_type,
  u.email,
  p.full_name
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN profiles p ON u.id = p.user_id
JOIN branches b ON s.branch_id = b.id;

-- View for faculty subject assignments
CREATE OR REPLACE VIEW faculty_subjects AS
SELECT 
  f.id as faculty_id,
  f.designation,
  s.id as subject_id,
  s.code as subject_code,
  s.name as subject_name,
  s.semester,
  b.name as branch_name,
  b.course_type
FROM faculty f
JOIN subjects s ON f.id = s.faculty_id
LEFT JOIN branches b ON s.branch_id = b.id;

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get current user's institution ID
CREATE OR REPLACE FUNCTION current_institution_id()
RETURNS uuid AS $$
  SELECT institution_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is faculty
CREATE OR REPLACE FUNCTION is_faculty()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'FACULTY'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role::text FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- Seed Data (Optional - Run manually if needed)
-- ============================================

-- Insert default permissions
INSERT INTO permissions (code, name, description, category) VALUES
('users:read', 'View Users', 'View user profiles', 'users'),
('users:write', 'Manage Users', 'Create and update users', 'users'),
('users:delete', 'Delete Users', 'Delete users', 'users'),
('students:read', 'View Students', 'View student records', 'students'),
('students:write', 'Manage Students', 'Create and update students', 'students'),
('faculty:read', 'View Faculty', 'View faculty records', 'faculty'),
('faculty:write', 'Manage Faculty', 'Create and update faculty', 'faculty'),
('assignments:create', 'Create Assignments', 'Create new assignments', 'assignments'),
('assignments:read', 'View Assignments', 'View assignments', 'assignments'),
('assignments:grade', 'Grade Assignments', 'Grade student submissions', 'assignments'),
('attendance:read', 'View Attendance', 'View attendance records', 'attendance'),
('attendance:write', 'Mark Attendance', 'Mark student attendance', 'attendance'),
('notices:create', 'Create Notices', 'Publish notices', 'notices'),
('notices:read', 'View Notices', 'View published notices', 'notices'),
('complaints:read', 'View Complaints', 'View complaints', 'complaints'),
('complaints:resolve', 'Resolve Complaints', 'Resolve and close complaints', 'complaints'),
('fees:read', 'View Fees', 'View fee structures and payments', 'fees'),
('fees:write', 'Manage Fees', 'Create and update fee structures', 'fees'),
('reports:read', 'View Reports', 'View analytics and reports', 'reports'),
('settings:read', 'View Settings', 'View system settings', 'settings'),
('settings:write', 'Manage Settings', 'Modify system settings', 'settings')
ON CONFLICT (code) DO NOTHING;

-- Assign all permissions to SUPER_ADMIN
INSERT INTO role_permissions (role, permission_id)
SELECT 'SUPER_ADMIN', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Assign common permissions to ADMIN
INSERT INTO role_permissions (role, permission_id)
SELECT 'ADMIN', id FROM permissions
WHERE code NOT IN ('users:delete', 'settings:write')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Assign faculty permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'FACULTY', id FROM permissions
WHERE code IN ('assignments:create', 'assignments:read', 'assignments:grade',
               'attendance:read', 'attendance:write', 'notices:create', 'notices:read',
               'complaints:read', 'students:read')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Assign student permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'STUDENT', id FROM permissions
WHERE code IN ('assignments:read', 'attendance:read', 'notices:read',
               'complaints:read', 'complaints:create', 'fees:read')
ON CONFLICT (role, permission_id) DO NOTHING;
