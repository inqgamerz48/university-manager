"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAttendance(formData: FormData) {
  const supabase = await createClient();
  
  const studentId = formData.get("studentId") as string;
  const date = formData.get("date") as string;
  const status = formData.get("status") as string;
  const subjectCode = formData.get("subjectCode") as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("attendance").upsert({
    student_id: studentId,
    date,
    status,
    subject_code: subjectCode,
    marked_by: user.id,
  }, {
    onConflict: "student_id, date, subject_code"
  });

  if (error) return { error: error.message };

  revalidatePath("/faculty/dashboard");
  return { success: true };
}

export async function getStudentAttendance(studentId: string, month?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("attendance")
    .select("*")
    .eq("student_id", studentId);

  if (month) {
    query = query.like("date", `${month}%`);
  }

  const { data, error } = await query.order("date", { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

export async function getClassAttendance(subjectCode: string, date: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("attendance")
    .select(`
      *,
      student:users!student_id (
        profile (
          full_name,
          student_id
        )
      )
    `)
    .eq("subject_code", subjectCode)
    .eq("date", date);

  if (error) return { error: error.message };
  return { data };
}
