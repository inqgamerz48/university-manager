-- ========================================
-- UNI Manager - Row Level Security (RLS)
-- ========================================
-- IMPORTANT: Run this line by line in Supabase SQL Editor if you get errors

-- Enable RLS on all tables
ALTER TABLE "Institution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Faculty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Complaint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeeStructure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Permission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RolePermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- USER (references auth.uid() with 'id' column)
-- ========================================
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- ========================================
-- PROFILE (references User.id with 'user_id' column)
-- ========================================
CREATE POLICY "Profiles are viewable by all" ON "Profile"
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON "Profile"
  FOR UPDATE USING (auth.uid()::text = user_id);

-- ========================================
-- STUDENT (references User.id with 'user_id' column)
-- ========================================
CREATE POLICY "Students can view own record" ON "Student"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage students" ON "Student"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User" WHERE id = auth.uid()::text 
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- FACULTY (references User.id with 'user_id' column)
-- ========================================
CREATE POLICY "Faculty can view own record" ON "Faculty"
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage faculty" ON "Faculty"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User" WHERE id = auth.uid()::text 
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- ASSIGNMENT
-- ========================================
CREATE POLICY "Students can view assignments" ON "Assignment"
  FOR SELECT USING (is_active = true);

-- ========================================
-- SUBMISSION
-- ========================================
CREATE POLICY "Students can view own submissions" ON "Submission"
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT user_id FROM "Student" WHERE id = "Submission".student_id
    )
  );

-- ========================================
-- ATTENDANCE
-- ========================================
CREATE POLICY "Students can view attendance" ON "Attendance"
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT user_id FROM "Student" WHERE id = "Attendance".student_id
    )
  );

-- ========================================
-- NOTICE
-- ========================================
CREATE POLICY "All users can view notices" ON "Notice"
  FOR SELECT USING (is_active = true);

-- ========================================
-- COMPLAINT (references User.id with 'student_id' column)
-- ========================================
CREATE POLICY "Students can manage complaints" ON "Complaint"
  FOR ALL USING (auth.uid()::text = student_id);

CREATE POLICY "Admins can view complaints" ON "Complaint"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- INSTITUTION
-- ========================================
CREATE POLICY "All can view institutions" ON "Institution"
  FOR SELECT USING (true);

-- ========================================
-- BRANCH
-- ========================================
CREATE POLICY "All can view branches" ON "Branch"
  FOR SELECT USING (true);

-- ========================================
-- SUBJECT
-- ========================================
CREATE POLICY "All can view subjects" ON "Subject"
  FOR SELECT USING (is_active = true);

-- ========================================
-- ENROLLMENT
-- ========================================
CREATE POLICY "Students can view enrollments" ON "Enrollment"
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT user_id FROM "Student" WHERE id = "Enrollment".student_id
    )
  );

-- ========================================
-- FEE STRUCTURE
-- ========================================
CREATE POLICY "All can view fee structures" ON "FeeStructure"
  FOR SELECT USING (true);

-- ========================================
-- FEE PAYMENT
-- ========================================
CREATE POLICY "Students can view own fee payments" ON "FeePayment"
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT user_id FROM "Student" WHERE id = "FeePayment".student_id
    )
  );

-- ========================================
-- NOTIFICATION (references User.id with 'user_id' column)
-- ========================================
CREATE POLICY "Users can view own notifications" ON "Notification"
  FOR SELECT USING (auth.uid()::text = user_id);

-- ========================================
-- PERMISSION
-- ========================================
CREATE POLICY "All can view permissions" ON "Permission"
  FOR SELECT USING (true);

-- ========================================
-- ROLE PERMISSION
-- ========================================
CREATE POLICY "All can view role permissions" ON "RolePermission"
  FOR SELECT USING (true);

-- ========================================
-- AUDIT LOG (references User.id with 'user_id' column)
-- ========================================
CREATE POLICY "Admins can view audit logs" ON "AuditLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- SESSION (references User.id with 'user_id' column)
-- ========================================
CREATE POLICY "Users can view own sessions" ON "Session"
  FOR SELECT USING (auth.uid()::text = user_id);
