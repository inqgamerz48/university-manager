import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  console.log("[CREATE USER] Starting...");
  
  try {
    const supabase = await createClient();
    console.log("[CREATE USER] Got supabase client");
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[CREATE USER] Auth check done", { userId: user?.id, authError });

    if (authError || !user) {
      console.log("[CREATE USER] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (simple check)
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role, institution_id")
      .eq("id", user.id)
      .single();

    console.log("[CREATE USER] User data", { userData, roleError });

    if (roleError || !userData) {
      console.log("[CREATE USER] User not found in DB");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.role !== "ADMIN" && userData.role !== "SUPER_ADMIN") {
      console.log("[CREATE USER] Not admin", { role: userData.role });
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await request.json();
    console.log("[CREATE USER] Body received", { role: body.role, email: body.email });
    
    const { email, password, full_name, role, pin_number, branch_id, admission_year } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 });
    }

    const institution_id = userData.institution_id;
    console.log("[CREATE USER] Institution ID", institution_id);

    if (!institution_id) {
      return NextResponse.json({ error: "Admin has no institution assigned. Please contact super admin." }, { status: 400 });
    }

    // 1. Create user in Auth (using Service Role)
    const adminClient = getAdminClient();
    console.log("[CREATE USER] Creating auth user...");
    
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    console.log("[CREATE USER] Auth user created", { createError, newUser });

    if (createError) throw createError;
    if (!newUser.user) throw new Error("Failed to create user");

    // 2. Update Public Users Role
    console.log("[CREATE USER] Upserting user record...");
    const { error: userUpsertError } = await adminClient
      .from("users")
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email!,
        role: role || "STUDENT",
        is_active: true,
        institution_id
      });

    console.log("[CREATE USER] User upsert done", { userUpsertError });

    if (userUpsertError) throw userUpsertError;

    // 3. Update Profile
    console.log("[CREATE USER] Upserting profile...");
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        user_id: newUser.user.id,
        full_name,
        pin_number,
        updated_at: new Date().toISOString(),
      });

    console.log("[CREATE USER] Profile upsert done", { profileError });

    if (profileError) throw profileError;

    // 4. If Faculty or Student, create specific record
    if (role === 'FACULTY') {
      console.log("[CREATE USER] Creating faculty record...");
      const { error: facultyError } = await adminClient.from('faculty').upsert({
        user_id: newUser.user.id,
        institution_id,
        employee_id: pin_number || `EMP-${Date.now()}`,
        branch_id: branch_id || null
      });
      console.log("[CREATE USER] Faculty created", { facultyError });
      if (facultyError) throw facultyError;
    } else if (role === 'STUDENT') {
      console.log("[CREATE USER] Creating student record...", { branch_id, admission_year });
      if (!branch_id || !admission_year) {
        throw new Error("Branch and Admission Year are required for Students");
      }
      const { error: studentError } = await adminClient.from('students').upsert({
        user_id: newUser.user.id,
        institution_id,
        branch_id,
        pin_number,
        admission_year: parseInt(admission_year),
        academic_year: "YEAR_1",
        current_semester: "SEM_1"
      });
      console.log("[CREATE USER] Student created", { studentError });
      if (studentError) throw studentError;
    }

    createAuditLog({
      action: "create",
      entity_type: "user",
      entity_id: newUser.user.id,
      new_values: { email, role },
    });

    console.log("[CREATE USER] SUCCESS!");
    return NextResponse.json({ user: newUser.user, message: "User created successfully" });
  } catch (error: any) {
    console.error("[CREATE USER] ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal server error", details: error.toString() }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Simple role check
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || (userData.role !== "ADMIN" && userData.role !== "SUPER_ADMIN")) {
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
      .neq("role", "SUPER_ADMIN")
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (role) {
      query = query.eq("role", role);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ users: data });
  } catch (error: any) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
