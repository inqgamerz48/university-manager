"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalBranches: number;
  totalSubjects: number;
  pendingComplaints: number;
  todayAttendance: number;
  activeAssignments: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_grade: number;
  subject_code: string;
  subject_name: string;
  faculty_name: string;
  is_active: boolean;
  submissions_count: number;
  submitted: boolean;
  grade?: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  category: string;
  published_at: string;
  published_by_name: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at?: string;
}

export interface FeeStatus {
  total_due: number;
  total_paid: number;
  total_pending: number;
  overdue: number;
  next_due_date?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  subject_code: string;
  subject_name: string;
  percentage: number;
}

export interface FacultyClass {
  id: string;
  subject_code: string;
  subject_name: string;
  semester: string;
  branch_name: string;
  course_type: string;
  total_students: number;
  attendance_today?: number;
}

export interface Submission {
  id: string;
  student_name: string;
  student_pin: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  file_url?: string;
}

// ============================================
// Admin Dashboard Hooks
// ============================================

export function useAdminStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        const [usersRes, studentsRes, facultyRes, branchesRes, 
                subjectsRes, complaintsRes, attendanceRes, assignmentsRes] = await Promise.all([
          supabase.from("users").select("id", { count: "exact" }).neq("role", "SUPER_ADMIN"),
          supabase.from("students").select("id", { count: "exact" }),
          supabase.from("faculty").select("id", { count: "exact" }),
          supabase.from("branches").select("id", { count: "exact" }),
          supabase.from("subjects").select("id", { count: "exact" }).eq("is_active", true),
          supabase.from("complaints").select("id", { count: "exact" }).eq("status", "PENDING"),
          supabase.from("attendance").select("id", { count: "exact" }).gte("date", new Date().toISOString().split('T')[0]),
          supabase.from("assignments").select("id", { count: "exact" }).eq("is_active", true),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalStudents: studentsRes.count || 0,
          totalFaculty: facultyRes.count || 0,
          totalBranches: branchesRes.count || 0,
          totalSubjects: subjectsRes.count || 0,
          pendingComplaints: complaintsRes.count || 0,
          todayAttendance: attendanceRes.count || 0,
          activeAssignments: assignmentsRes.count || 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [supabase]);

  return { stats, loading, error };
}

export function useRecentActivity(limit = 10) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchActivity() {
      const { data } = await supabase
        .from("audit_logs")
        .select(`
          *,
          user:users(email, profiles(full_name))
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      setActivities(data || []);
    }

    fetchActivity();
  }, [supabase, limit]);

  return { activities, loading };
}

// ============================================
// Student Dashboard Hooks
// ============================================

export function useStudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function fetchAssignments() {
      const { data: studentData } = await supabase
        .from("students")
        .select("id, branch_id, current_semester")
        .eq("user_id", userId)
        .single();

      if (!studentData) {
        setLoading(false);
        return;
      }

      // Get all active assignments for student's branch/semester
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          *,
          subject:subjects(code, name),
          faculty:users(profiles(full_name))
        `)
        .eq("is_active", true)
        .order("due_date", { ascending: true });

      if (!assignmentsData) {
        setLoading(false);
        return;
      }

      // Check submissions for each assignment
      const assignmentsWithSubmission = await Promise.all(
        assignmentsData.map(async (assignment) => {
          const { data: submission } = await supabase
            .from("submissions")
            .select("id, grade, submitted_at")
            .eq("assignment_id", assignment.id)
            .eq("student_id", userId)
            .single();

          return {
            ...assignment,
            subject_code: assignment.subject?.code || "",
            subject_name: assignment.subject?.name || "",
            faculty_name: assignment.faculty?.profiles?.full_name || "Unknown",
            submissions_count: 0,
            submitted: !!submission,
            grade: submission?.grade || undefined,
          };
        })
      );

      setAssignments(assignmentsWithSubmission);
      setLoading(false);
    }

    fetchAssignments();
  }, [user, supabase]);

  return { assignments, loading };
}

export function useStudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchNotices() {
      const { data } = await supabase
        .from("notices")
        .select(`
          *,
          publisher:users(profiles(full_name))
        `)
        .eq("is_active", true)
        .order("published_at", { ascending: false })
        .limit(10);

      if (data) {
        setNotices(
          data.map((notice) => ({
            ...notice,
            published_by_name: notice.publisher?.profiles?.full_name || "Admin",
          }))
        );
      }
      setLoading(false);
    }

    fetchNotices();
  }, [supabase]);

  return { notices, loading };
}

// Alias for admin/faculty - same functionality
export const useNotices = useStudentNotices;

export function useStudentComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function fetchComplaints() {
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .eq("student_id", userId)
        .order("created_at", { ascending: false });

      setComplaints(data || []);
      setLoading(false);
    }

    fetchComplaints();
  }, [user, supabase]);

  return { complaints, loading };
}

export function useStudentFeeStatus() {
  const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function fetchFees() {
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!studentData) {
        setLoading(false);
        return;
      }

      const { data: payments } = await supabase
        .from("fee_payments")
        .select("*, fee_structure:fee_structures(name, due_date)")
        .eq("student_id", studentData.id);

      if (!payments || payments.length === 0) {
        setLoading(false);
        return;
      }

      let total_due = 0;
      let total_paid = 0;
      let total_pending = 0;
      let overdue = 0;
      let next_due_date: string | undefined;

      const now = new Date();

      payments.forEach((payment) => {
        total_due += payment.amount;
        if (payment.status === "PAID") {
          total_paid += payment.amount;
        } else if (payment.status === "PENDING") {
          total_pending += payment.amount;
          const dueDate = new Date(payment.due_date);
          if (dueDate < now) {
            overdue += payment.amount;
          } else if (!next_due_date || dueDate < new Date(next_due_date)) {
            next_due_date = payment.due_date;
          }
        }
      });

      setFeeStatus({
        total_due,
        total_paid,
        total_pending,
        overdue,
        next_due_date,
      });
      setLoading(false);
    }

    fetchFees();
  }, [user, supabase]);

  return { feeStatus, loading };
}

export function useStudentAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function fetchAttendance() {
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!studentData) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("attendance")
        .select(`
          *,
          subject:subjects(code, name)
        `)
        .eq("student_id", studentData.id)
        .order("date", { ascending: false });

      if (data) {
        const attendanceMap = new Map<string, AttendanceRecord>();
        const subjectStats = new Map<string, { present: number; total: number }>();

        data.forEach((record) => {
          const key = record.subject_code;
          const current = subjectStats.get(key) || { present: 0, total: 0 };
          current.total += 1;
          if (record.status === "PRESENT") current.present += 1;
          subjectStats.set(key, current);
        });

        data.slice(0, 20).forEach((record) => {
          const stats = subjectStats.get(record.subject_code) || { present: 0, total: 1 };
          attendanceMap.set(record.id, {
            ...record,
            subject_code: record.subject?.code || "",
            subject_name: record.subject?.name || "",
            percentage: Math.round((stats.present / stats.total) * 100),
          });
        });

        setAttendance(Array.from(attendanceMap.values()));
      }
      setLoading(false);
    }

    fetchAttendance();
  }, [user, supabase]);

  return { attendance, loading };
}

// ============================================
// Faculty Dashboard Hooks
// ============================================

export function useFacultyClasses() {
  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function fetchClasses() {
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id, branch_id")
        .eq("user_id", userId)
        .single();

      if (!facultyData) {
        setLoading(false);
        return;
      }

      const { data: subjects } = await supabase
        .from("subjects")
        .select(`
          *,
          branch:branches(name, code, course_type)
        `)
        .eq("faculty_id", facultyData.id)
        .eq("is_active", true);

      if (!subjects) {
        setLoading(false);
        return;
      }

      const classesWithStudents = await Promise.all(
        subjects.map(async (subject) => {
          const { count } = await supabase
            .from("enrollments")
            .select("id", { count: "exact" })
            .eq("subject_id", subject.id)
            .eq("is_active", true);

          return {
            ...subject,
            branch_name: subject.branch?.name || "All",
            course_type: subject.branch?.course_type || "BOTH",
            total_students: count || 0,
          };
        })
      );

      setClasses(classesWithStudents);
      setLoading(false);
    }

    fetchClasses();
  }, [user, supabase]);

  return { classes, loading };
}

export function useFacultySubmissions(facultySubjectIds: string[]) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (facultySubjectIds.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchSubmissions() {
      const { data } = await supabase
        .from("submissions")
        .select(`
          *,
          student:users(profiles(full_name, pin_number)),
          assignment:assignments(title)
        `)
        .in("assignment_id", facultySubjectIds)
        .order("submitted_at", { ascending: false });

      if (data) {
        setSubmissions(
          data.map((submission) => ({
            id: submission.id,
            student_name: submission.student?.profiles?.full_name || "Unknown",
            student_pin: submission.student?.profiles?.pin_number || submission.student_id,
            submitted_at: submission.submitted_at,
            grade: submission.grade,
            feedback: submission.feedback,
            file_url: submission.file_url,
          }))
        );
      }
      setLoading(false);
    }

    fetchSubmissions();
  }, [facultySubjectIds, supabase]);

  return { submissions, loading };
}

export function usePendingGrading() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function fetchPending() {
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!facultyData) {
        setLoading(false);
        return;
      }

      const { data: assignmentIds } = await supabase
        .from("assignments")
        .select("id")
        .eq("faculty_id", facultyData.id);

      const { count: submissionCount } = await supabase
        .from("submissions")
        .select("id", { count: "exact" })
        .in(
          "assignment_id",
          (assignmentIds || []).map(a => a.id)
        )
        .is("grade", null);

      setCount(submissionCount || 0);
      setLoading(false);
    }

    fetchPending();
  }, [user, supabase]);

  return { pendingCount: count, loading };
}

// ============================================
// RBAC Hooks
// ============================================

export function useUsersList(searchQuery?: string) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUsers() {
      let query = supabase
        .from("users")
        .select(`
          *,
          profile:profiles(full_name, pin_number)
        `)
        .neq("role", "SUPER_ADMIN")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("email", `%${searchQuery}%`);
      }

      const { data } = await query;
      setUsers(data || []);
      setLoading(false);
    }

    fetchUsers();
  }, [supabase, searchQuery]);

  return { users, loading };
}

export function useRoleStats() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from("users")
        .select("role")
        .neq("role", "SUPER_ADMIN");

      if (data) {
        const statsMap: Record<string, number> = {};
        data.forEach((user) => {
          statsMap[user.role] = (statsMap[user.role] || 0) + 1;
        });
        setStats(statsMap);
      }
      setLoading(false);
    }

    fetchStats();
  }, [supabase]);

  return { stats, loading };
}

// ============================================
// General Hooks
// ============================================

export function useBranches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBranches() {
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("name");

      setBranches(data || []);
      setLoading(false);
    }

    fetchBranches();
  }, [supabase]);

  return { branches, loading };
}

export function useSubjects(branchId?: string) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSubjects() {
      let query = supabase
        .from("subjects")
        .select(`
          *,
          branch:branches(name, course_type),
          faculty:users(profiles(full_name))
        `)
        .eq("is_active", true);

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data } = await query;
      setSubjects(data || []);
      setLoading(false);
    }

    fetchSubjects();
  }, [supabase, branchId]);

  return { subjects, loading };
}

// ============================================
// Actions
// ============================================

export async function updateUserRole(userId: string, role: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .update({ role: role as any })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function createNotice(data: {
  title: string;
  content: string;
  priority: string;
  category: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("notices").insert({
    ...data,
    published_by: user.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function createComplaint(data: {
  title: string;
  description: string;
  category: string;
  priority: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("complaints").insert({
    ...data,
    student_id: user.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateComplaintStatus(
  complaintId: string,
  status: string,
  resolution?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("complaints")
    .update({
      status: status as any,
      resolution,
      resolved_at: status === "RESOLVED" || status === "CLOSED" ? new Date().toISOString() : null,
    })
    .eq("id", complaintId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function createAssignment(data: {
  title: string;
  description?: string;
  instructions?: string;
  due_date: string;
  max_grade: number;
  subject_id: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: facultyData } = await supabase
    .from("faculty")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!facultyData) {
    return { success: false, error: "User is not a faculty member" };
  }

  const { data: subjectData } = await supabase
    .from("subjects")
    .select("code, name")
    .eq("id", data.subject_id)
    .single();

  const { error } = await supabase.from("assignments").insert({
    title: data.title,
    description: data.description,
    instructions: data.instructions,
    due_date: data.due_date,
    max_grade: data.max_grade,
    subject_id: data.subject_id,
    faculty_id: facultyData.id,
    subject_code: subjectData?.code || "",
    subject_name: subjectData?.name || "",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("submissions")
    .update({
      grade,
      feedback,
      graded_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function markAttendance(
  studentId: string,
  subjectId: string,
  date: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.from("attendance").upsert(
    {
      student_id: studentId,
      subject_id: subjectId,
      date: date,
      status: status as any,
      marked_by: user.id,
    },
    {
      onConflict: "student_id_date_subject_id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
