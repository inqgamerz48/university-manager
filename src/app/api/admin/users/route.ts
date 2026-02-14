import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac-server";
import { createAuditLog } from "@/lib/audit";

import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = await hasPermission(user.id, "users:write");
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, full_name, role, pin_number, branch_id, admission_year } = body;

    // Get Admin's institution_id
    const { data: adminUser } = await getAdminClient()
      .from("users")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    const institution_id = adminUser?.institution_id;

    if (!institution_id) {
      return NextResponse.json({ error: "Admin has no institution assigned" }, { status: 400 });
    }

    // 1. Create user in Auth (using Service Role)
    const { data: newUser, error: createError } = await getAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) throw createError;
    if (!newUser.user) throw new Error("Failed to create user");

    // 2. Update Public Users Role (Trigger might have created it, but with default role)
    // We upsert to be safe in case trigger is slow or fast
    const { error: userError } = await getAdminClient()
      .from("users")
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email!,
        role: role || "STUDENT",
        is_active: true
      });

    if (userError) throw userError;

    // 3. Update Profile (Trigger might have created it)
    const { error: profileError } = await getAdminClient()
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        full_name,
        pin_number,
        updated_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    // 4. If Faculty or Student, create specific record
    if (role === 'FACULTY') {
      await getAdminClient().from('faculty').upsert({
        user_id: newUser.user.id,
        institution_id,
        employee_id: pin_number || `EMP-${Date.now()}`,
        branch_id: branch_id || null
      });
    } else if (role === 'STUDENT') {
      if (!branch_id || !admission_year) {
        throw new Error("Branch and Admission Year are required for Students");
      }
      await getAdminClient().from('students').upsert({
        user_id: newUser.user.id,
        institution_id,
        branch_id,
        pin_number,
        admission_year: parseInt(admission_year),
        academic_year: "YEAR_1",
        current_semester: "SEM_1"
      });
    }

    createAuditLog({
      action: "create",
      entity_type: "user",
      entity_id: newUser.user.id,
      new_values: { email, role },
    });

    return NextResponse.json({ user: newUser.user });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const role = searchParams.get("role");

    let query = supabase
      .from("users")
      .select(`
        id,
        email,
        role,
        is_active,
        created_at,
        profile:profiles (full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (role) {
      query = query.eq("role", role);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    const formattedUsers = (users || []).map((u: Record<string, unknown>) => ({
      ...u,
      full_name: (u.profile as Record<string, unknown>)?.full_name || null,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
