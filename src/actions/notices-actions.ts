"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createNotice(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const priority = formData.get("priority") as string;
  const category = formData.get("category") as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("notices").insert({
    title,
    content,
    priority,
    category,
    published_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard");
  revalidatePath("/student/dashboard");
  return { success: true };
}

export async function getNotices(filters?: { category?: string; priority?: string }) {
  const supabase = await createClient();
  
  let query = supabase
    .from("notices")
    .select(`
      *,
      publisher:users!published_by (
        profile (
          full_name
        )
      )
    `)
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  const { data, error } = await query.limit(50);
  if (error) return { error: error.message };
  return { data };
}

export async function getAllNotices() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("notices")
    .select(`
      *,
      publisher:users!published_by (
        profile (
          full_name
        )
      )
    `)
    .order("published_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function updateNoticeStatus(noticeId: string, isActive: boolean) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("notices")
    .update({ is_active: isActive })
    .eq("id", noticeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard");
  return { success: true };
}
