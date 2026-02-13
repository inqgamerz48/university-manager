import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
// Note: getUserPermissions should be imported from @/lib/rbac-server for server components
// import { getUserPermissions } from "@/lib/rbac-server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, institution_id")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "STUDENT";

  return (
    <div className="min-h-screen bg-background">
      {/* Role is available for client components via headers */}
      {children}
    </div>
  );
}
