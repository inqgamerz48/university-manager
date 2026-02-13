"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAssignment(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string;
  const subjectCode = formData.get("subjectCode") as string;
  const subjectName = formData.get("subjectName") as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("assignments").insert({
    title,
    description,
    due_date: dueDate,
    subject_code: subjectCode,
    subject_name: subjectName,
    faculty_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/faculty/dashboard");
  return { success: true };
}

export async function getAssignments(facultyId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("assignments")
    .select("*")
    .order("due_date", { ascending: true });

  if (facultyId) {
    query = query.eq("faculty_id", facultyId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function getStudentAssignments(studentId?: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("assignments")
    .select(`
      *,
      submissions (
        id,
        grade,
        feedback,
        submitted_at
      )
    `)
    .order("due_date", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export async function submitAssignment(formData: FormData) {
  const supabase = await createClient();
  
  const assignmentId = formData.get("assignmentId") as string;
  const content = formData.get("content") as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("submissions").upsert({
    assignment_id: assignmentId,
    student_id: user.id,
    content,
    submitted_at: new Date().toISOString(),
  }, {
    onConflict: "assignment_id, student_id"
  });

  if (error) return { error: error.message };

  revalidatePath("/student/dashboard");
  return { success: true };
}
