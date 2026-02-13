import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { hasPermission, hasRole } from "@/lib/rbac-server";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user.id, "users:read");
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const { data: userData, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        role,
        is_active,
        created_at,
        updated_at,
        institution_id,
        pin_number,
        profile:profiles (
          full_name,
          phone,
          department,
          year,
          semester,
          course_code,
          course_name
        )
      `)
      .eq("id", id)
      .single();

    if (error || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManageUsers = await hasPermission(user.id, "users:write");
    const canAssignRoles = await hasPermission(user.id, "users:roles");

    if (!canManageUsers && !canAssignRoles) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role, is_active, ...updateData } = body;

    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (role && role !== currentUser.role) {
      if (!canAssignRoles) {
        return NextResponse.json({ error: "Cannot modify roles without users:roles permission" }, { status: 403 });
      }

      const isDemotingSuperAdmin = currentUser.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN";
      const isSelfDemotion = id === user.id && role !== currentUser.role;

      if (isDemotingSuperAdmin || isSelfDemotion) {
        return NextResponse.json({ error: "Cannot change this user's role" }, { status: 403 });
      }

      await createAuditLog({
        user_id: user.id,
        action: "update",
        entity_type: "user_role",
        entity_id: id,
        old_values: { role: currentUser.role },
        new_values: { role },
      });
    }

    const updatePayload: Record<string, unknown> = { ...updateData };
    if (role !== undefined) updatePayload.role = role;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const { error: updateError } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
