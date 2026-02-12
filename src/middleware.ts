import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/faculty": ["FACULTY", "ADMIN", "SUPER_ADMIN"],
  "/student": ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"],
};

const PUBLIC_ROUTES = ["/login", "/register", "/api/auth", "/api/webhook"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware (no next/headers)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "STUDENT";

  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(role)) {
        const redirectUrl = getDashboardUrl(role);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-user-role", role);
  return response;
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin/dashboard";
    case "FACULTY":
      return "/faculty/dashboard";
    default:
      return "/student/dashboard";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
