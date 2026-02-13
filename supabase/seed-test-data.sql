-- ============================================================
-- UniManager Test Seed Data (lowercase table names)
-- ============================================================
-- Run AFTER rename-tables.sql
-- PIN FORMAT: YY<college_code>-DEPT-NNN
-- College code for this institution: UM001
-- ============================================================

-- =====================
-- 1. Institution
-- =====================
INSERT INTO institutions (id, name, code, college_code, type, address, phone, email, is_active)
VALUES (
  'inst-001',
  'UniManager Engineering College',
  'UMEC',
  'UM001',
  'ENGINEERING',
  '123 University Road, Tech City',
  '+91-9876543210',
  'info@umec.edu.in',
  true
)
ON CONFLICT (code) DO UPDATE SET college_code = 'UM001';

-- =====================
-- 2. Branches
-- =====================
INSERT INTO branches (id, institution_id, name, code, course_type, duration_years, is_active)
VALUES
  ('branch-cse', 'inst-001', 'Computer Science & Engineering', 'CS', 'B_TECH', 4, true),
  ('branch-ece', 'inst-001', 'Electronics & Communication', 'EC', 'B_TECH', 4, true),
  ('branch-mech', 'inst-001', 'Mechanical Engineering', 'ME', 'B_TECH', 4, true),
  ('branch-eee', 'inst-001', 'Electrical & Electronics', 'EE', 'B_TECH', 4, true)
ON CONFLICT (institution_id, code) DO NOTHING;

-- =====================
-- 3. Admin User
-- =====================
INSERT INTO users (id, email, password_hash, role, institution_id, is_active)
VALUES (
  'a9d4d59c-e805-43ec-b1d1-77939b228cae',
  'admin@unimanager.com',
  'supabase-auth-managed',
  'SUPER_ADMIN',
  'inst-001',
  true
)
ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN', institution_id = 'inst-001';

INSERT INTO profiles (id, user_id, full_name, pin_number, department)
VALUES (
  'profile-admin',
  'a9d4d59c-e805-43ec-b1d1-77939b228cae',
  'Admin User',
  null,
  'Administration'
)
ON CONFLICT (user_id) DO UPDATE SET full_name = 'Admin User', department = 'Administration';

-- =====================
-- 4. Subjects
-- =====================
INSERT INTO subjects (id, code, name, credits, institution_id, branch_id, semester, academic_year, is_active)
VALUES
  ('sub-dsa', 'CS301', 'Data Structures & Algorithms', 4, 'inst-001', 'branch-cse', 'SEM_3', '2025-26', true),
  ('sub-dbms', 'CS302', 'Database Management Systems', 4, 'inst-001', 'branch-cse', 'SEM_3', '2025-26', true),
  ('sub-os', 'CS303', 'Operating Systems', 3, 'inst-001', 'branch-cse', 'SEM_4', '2025-26', true),
  ('sub-cn', 'CS304', 'Computer Networks', 3, 'inst-001', 'branch-cse', 'SEM_4', '2025-26', true),
  ('sub-em', 'EC301', 'Electromagnetic Theory', 3, 'inst-001', 'branch-ece', 'SEM_3', '2025-26', true),
  ('sub-sp', 'EC302', 'Signal Processing', 4, 'inst-001', 'branch-ece', 'SEM_3', '2025-26', true)
ON CONFLICT (institution_id, code) DO NOTHING;

-- =====================
-- 5. Student Pre-Imports
-- PIN Format: YY<UM001>-DEPT-NNN
-- =====================
INSERT INTO student_pre_imports (id, institution_id, pin_number, first_name, last_name, email, year, semester, course_code, course_name, is_registered)
VALUES
  ('pre-s1', 'inst-001', '24UM001-CS-001', 'Rahul', 'Sharma', 'rahul.s@student.umec.edu.in', 'YEAR_2', 'SEM_3', 'CS', 'Computer Science & Engineering', false),
  ('pre-s2', 'inst-001', '24UM001-CS-002', 'Priya', 'Patel', 'priya.p@student.umec.edu.in', 'YEAR_2', 'SEM_3', 'CS', 'Computer Science & Engineering', false),
  ('pre-s3', 'inst-001', '24UM001-EC-001', 'Arjun', 'Reddy', 'arjun.r@student.umec.edu.in', 'YEAR_2', 'SEM_3', 'EC', 'Electronics & Communication', false),
  ('pre-s4', 'inst-001', '24UM001-CS-003', 'Sneha', 'Kumar', 'sneha.k@student.umec.edu.in', 'YEAR_1', 'SEM_1', 'CS', 'Computer Science & Engineering', false),
  ('pre-s5', 'inst-001', '24UM001-ME-001', 'Vikram', 'Singh', 'vikram.s@student.umec.edu.in', 'YEAR_1', 'SEM_1', 'ME', 'Mechanical Engineering', false)
ON CONFLICT (institution_id, pin_number) DO NOTHING;

-- =====================
-- 6. Fee Structures
-- =====================
INSERT INTO fee_structures (id, name, amount, category, academic_year, course_type, institution_id, due_date, is_active)
VALUES
  ('fee-tuition-btech', 'B.Tech Tuition Fee', 75000.00, 'TUITION', '2025-26', 'B_TECH', 'inst-001', '2026-03-31', true),
  ('fee-exam-btech', 'B.Tech Exam Fee', 5000.00, 'EXAM', '2025-26', 'B_TECH', 'inst-001', '2026-02-28', true),
  ('fee-lab-btech', 'B.Tech Lab Fee', 15000.00, 'LAB', '2025-26', 'B_TECH', 'inst-001', '2026-03-31', true)
ON CONFLICT DO NOTHING;

-- =====================
-- 7. Notices
-- =====================
INSERT INTO notices (id, title, content, priority, category, published_by, is_active, published_at)
VALUES
  ('notice-1', 'Welcome to Spring Semester 2025-26', 'Welcome back students! Classes begin on February 15th. Please check your timetables and report to your respective classrooms.', 'high', 'academic', 'a9d4d59c-e805-43ec-b1d1-77939b228cae', true, now()),
  ('notice-2', 'Mid-Semester Exam Schedule', 'Mid-semester examinations will be held from March 15-25. Detailed schedule will be posted next week.', 'high', 'exam', 'a9d4d59c-e805-43ec-b1d1-77939b228cae', true, now()),
  ('notice-3', 'Library Timings Extended', 'The central library will now be open from 8 AM to 10 PM on all working days.', 'normal', 'general', 'a9d4d59c-e805-43ec-b1d1-77939b228cae', true, now()),
  ('notice-4', 'Annual Sports Day Registration', 'Registration for Annual Sports Day is open. Last date for entries is February 28th.', 'normal', 'event', 'a9d4d59c-e805-43ec-b1d1-77939b228cae', true, now())
ON CONFLICT DO NOTHING;

-- =====================
-- 8. Permissions
-- =====================
INSERT INTO permissions (id, code, name, description, category, is_active)
VALUES
  ('perm-1', 'users.view', 'View Users', 'Can view user profiles', 'users', true),
  ('perm-2', 'users.create', 'Create Users', 'Can create new users', 'users', true),
  ('perm-3', 'users.edit', 'Edit Users', 'Can edit user profiles', 'users', true),
  ('perm-4', 'users.delete', 'Delete Users', 'Can delete users', 'users', true),
  ('perm-5', 'students.view', 'View Students', 'Can view student records', 'students', true),
  ('perm-6', 'students.import', 'Import Students', 'Can import student data', 'students', true),
  ('perm-7', 'attendance.view', 'View Attendance', 'Can view attendance records', 'attendance', true),
  ('perm-8', 'attendance.mark', 'Mark Attendance', 'Can mark student attendance', 'attendance', true),
  ('perm-9', 'notices.create', 'Create Notices', 'Can create notices', 'notices', true),
  ('perm-10', 'notices.edit', 'Edit Notices', 'Can edit notices', 'notices', true),
  ('perm-11', 'complaints.view', 'View Complaints', 'Can view complaints', 'complaints', true),
  ('perm-12', 'complaints.manage', 'Manage Complaints', 'Can resolve/close complaints', 'complaints', true),
  ('perm-13', 'fees.view', 'View Fees', 'Can view fee structures', 'fees', true),
  ('perm-14', 'fees.manage', 'Manage Fees', 'Can create/edit fee structures', 'fees', true),
  ('perm-15', 'assignments.create', 'Create Assignments', 'Can create assignments', 'assignments', true),
  ('perm-16', 'assignments.grade', 'Grade Assignments', 'Can grade student submissions', 'assignments', true),
  ('perm-17', 'institution.manage', 'Manage Institution', 'Can manage institution settings', 'institution', true)
ON CONFLICT (code) DO NOTHING;

-- =====================
-- UPDATE existing seed data: fix PINs and branch codes
-- Run this if the old seed was already applied
-- =====================
UPDATE student_pre_imports SET pin_number = '24UM001-CS-001', course_code = 'CS' WHERE id = 'pre-s1';
UPDATE student_pre_imports SET pin_number = '24UM001-CS-002', course_code = 'CS' WHERE id = 'pre-s2';
UPDATE student_pre_imports SET pin_number = '24UM001-EC-001', course_code = 'EC' WHERE id = 'pre-s3';
UPDATE student_pre_imports SET pin_number = '24UM001-CS-003', course_code = 'CS' WHERE id = 'pre-s4';
UPDATE student_pre_imports SET pin_number = '24UM001-ME-001', course_code = 'ME' WHERE id = 'pre-s5';

UPDATE branches SET code = 'CS' WHERE id = 'branch-cse' AND institution_id = 'inst-001';
UPDATE branches SET code = 'EC' WHERE id = 'branch-ece' AND institution_id = 'inst-001';
UPDATE branches SET code = 'ME' WHERE id = 'branch-mech' AND institution_id = 'inst-001';
UPDATE branches SET code = 'EE' WHERE id = 'branch-eee' AND institution_id = 'inst-001';

UPDATE institutions SET college_code = 'UM001' WHERE id = 'inst-001';

-- =====================
-- Done! Login with:
--   Email: admin@unimanager.com
--   Password: Admin@123456
-- Test PINs: 24UM001-CS-001, 24UM001-CS-002, 24UM001-EC-001
-- =====================
