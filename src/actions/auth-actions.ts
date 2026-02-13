"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = profile?.role || "STUDENT";
    let redirectPath = "/student/dashboard";

    if (role === "FACULTY") redirectPath = "/faculty/dashboard";
    else if (role === "ADMIN" || role === "SUPER_ADMIN") redirectPath = "/admin/dashboard";

    redirect(redirectPath);
  }

  redirect("/student/dashboard");
}

export async function register(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const pinNumber = formData.get("pinNumber") as string;
  const fullName = formData.get("fullName") as string || "Student";

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        pin_number: pinNumber.toUpperCase(),
        role: "STUDENT",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: user.id,
      full_name: fullName,
      pin_number: pinNumber.toUpperCase(),
    });

    if (profileError) {
      return { error: profileError.message };
    }

    await supabase
      .from("users")
      .update({
        pin_number: pinNumber.toUpperCase(),
      })
      .eq("id", user.id);
  }

  revalidatePath("/", "layout");
  redirect("/student/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return profile;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const bio = formData.get("bio") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      bio,
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
