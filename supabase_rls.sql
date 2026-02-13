-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Complaint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeeStructure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Institution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- 1. Users policies
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT USING (auth.uid() = id::text);

CREATE POLICY "Users can update own data" ON "User"
  FOR UPDATE USING (auth.uid() = id::text);

-- 2. Profiles policies
CREATE POLICY "Users can view profiles" ON "Profile"
  FOR SELECT USING (true); -- Public profiles? Or restricted? Adjust if needed.

CREATE POLICY "Users can update own profile" ON "Profile"
  FOR UPDATE USING (auth.uid() = user_id::text);

CREATE POLICY "Users can insert own profile" ON "Profile"
  FOR INSERT WITH CHECK (auth.uid() = user_id::text);


-- 3. Assignments policies
-- Students can view assignments for their subjects (simplified to public for now or authenticated)
CREATE POLICY "Authenticated users can view assignments" ON "Assignment"
  FOR SELECT USING (auth.role() = 'authenticated');

-- Faculty can manage assignments (This requires checking the user role which might be complex in RLS without custom claims or lookups)
-- For now, allow authenticated users to view. Management usually restricted by application logic or admin roles.
-- A stricter policy would be:
-- FOR ALL USING (EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role IN ('FACULTY', 'ADMIN', 'SUPER_ADMIN')))


-- 4. Submissions policies
CREATE POLICY "Students can view own submissions" ON "Submission"
  FOR SELECT USING (auth.uid() = student_id::text);

CREATE POLICY "Students can create own submissions" ON "Submission"
  FOR INSERT WITH CHECK (auth.uid() = student_id::text);

CREATE POLICY "Students can update own submissions" ON "Submission"
  FOR UPDATE USING (auth.uid() = student_id::text);

-- Faculty can view all submissions for assignments they own? 
-- This gets complex with relations. For start, let's keep it simple.


-- 5. Attendance policies
CREATE POLICY "Students can view own attendance" ON "Attendance"
  FOR SELECT USING (auth.uid() = student_id::text);

-- Faculty/Admins execute attendance taking.


-- 6. Notices policies
CREATE POLICY "Anyone can view active notices" ON "Notice"
  FOR SELECT USING (is_active = true);


-- 7. Complaints policies
CREATE POLICY "Students can view own complaints" ON "Complaint"
  FOR SELECT USING (auth.uid() = student_id::text);

CREATE POLICY "Students can create complaints" ON "Complaint"
  FOR INSERT WITH CHECK (auth.uid() = student_id::text);


-- 8. Subjects policies
CREATE POLICY "Authenticated users can view subjects" ON "Subject"
  FOR SELECT USING (auth.role() = 'authenticated');
