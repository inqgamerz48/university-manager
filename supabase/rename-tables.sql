-- ============================================================
-- Rename PascalCase tables to lowercase
-- Run this in Supabase SQL Editor BEFORE re-running seed data
-- ============================================================

-- Rename tables (skip institutions & student_pre_imports - already lowercase)
ALTER TABLE IF EXISTS "Branch" RENAME TO branches;
ALTER TABLE IF EXISTS "Student" RENAME TO students;
ALTER TABLE IF EXISTS "Faculty" RENAME TO faculty;
ALTER TABLE IF EXISTS "Subject" RENAME TO subjects;
ALTER TABLE IF EXISTS "Enrollment" RENAME TO enrollments;
ALTER TABLE IF EXISTS "User" RENAME TO users;
ALTER TABLE IF EXISTS "Profile" RENAME TO profiles;
ALTER TABLE IF EXISTS "Assignment" RENAME TO assignments;
ALTER TABLE IF EXISTS "Submission" RENAME TO submissions;
ALTER TABLE IF EXISTS "Attendance" RENAME TO attendance;
ALTER TABLE IF EXISTS "Notice" RENAME TO notices;
ALTER TABLE IF EXISTS "Complaint" RENAME TO complaints;
ALTER TABLE IF EXISTS "FeeStructure" RENAME TO fee_structures;
ALTER TABLE IF EXISTS "FeePayment" RENAME TO fee_payments;
ALTER TABLE IF EXISTS "Notification" RENAME TO notifications;
ALTER TABLE IF EXISTS "Permission" RENAME TO permissions;
ALTER TABLE IF EXISTS "RolePermission" RENAME TO role_permissions;
ALTER TABLE IF EXISTS "AuditLog" RENAME TO audit_logs;
ALTER TABLE IF EXISTS "Session" RENAME TO sessions;
