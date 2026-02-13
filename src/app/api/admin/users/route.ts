import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac-server";
import { createAuditLog } from "@/lib/audit";

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
