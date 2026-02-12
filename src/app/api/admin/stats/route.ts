import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac-server";

export async function GET() {
  const supabase = createClient();

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

    const { data: roleCounts } = await supabase
      .from("users")
      .select("role", { count: "exact", head: false })
      .then(async (query) => {
        const { data } = await query;
        const counts: Record<string, number> = {};
        data?.forEach((u: Record<string, unknown>) => {
          const role = u.role as string;
          counts[role] = (counts[role] || 0) + 1;
        });
        return { data: counts };
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
