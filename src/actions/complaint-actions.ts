"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createComplaint(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const priority = formData.get("priority") as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("complaints").insert({
    title,
    description,
    category,
    priority,
    student_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/student/dashboard");
  return { success: true };
}

export async function getStudentComplaints(studentId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getAllComplaints(filters?: { status?: string; category?: string }) {
  const supabase = await createClient();
  
  let query = supabase
    .from("complaints")
    .select(`
      *,
      student:users!student_id (
        profile (
          full_name,
          student_id
        )
      )
    `);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

export async function updateComplaintStatus(
  complaintId: string,
  status: string,
  resolution?: string
) {
  const supabase = await createClient();
  
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "RESOLVED" || status === "CLOSED") {
    updateData.resolved_at = new Date().toISOString();
  }
  if (resolution) {
    updateData.resolution = resolution;
  }

  const { error } = await supabase
    .from("complaints")
    .update(updateData)
    .eq("id", complaintId);

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard");
  revalidatePath("/student/dashboard");
  return { success: true };
}
