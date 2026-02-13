import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac-server";

export async function GET() {
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

    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { data: usersWithRoles } = await supabase
      .from("users")
      .select("role");

    const roleCounts: Record<string, number> = {};
    usersWithRoles?.forEach((u) => {
      const role = u.role as string;
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    const roleStats = Object.entries(roleCounts || {}).map(([role, count]) => ({
      role,
      count: count as number,
    }));

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        roleStats,
        activeUsers: activeUsers || 0,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
