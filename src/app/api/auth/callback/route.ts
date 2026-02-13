import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const redirectTo = requestUrl.searchParams.get("redirect") || "/student/dashboard";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Get user role to redirect to correct dashboard
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                const role = profile?.role || "STUDENT";
                let dashboardPath = "/student/dashboard";
                if (role === "ADMIN" || role === "SUPER_ADMIN") dashboardPath = "/admin/dashboard";
                else if (role === "FACULTY") dashboardPath = "/faculty/dashboard";

                return NextResponse.redirect(new URL(dashboardPath, requestUrl.origin));
            }
        }
    }

    // Auth code exchange failed — redirect to login
    return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
}
