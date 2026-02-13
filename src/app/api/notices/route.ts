import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const limit = searchParams.get("limit") || "50";

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("notices")
      .select(`
        *,
        publisher:users!published_by (
          profile (
            full_name
          )
        )
      `)
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .limit(parseInt(limit));

    if (category) query = query.eq("category", category);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ notices: data });
  } catch (error) {
    console.error("Get notices error:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, priority, category, expiresAt } = body;

    const { data, error } = await supabase
      .from("notices")
      .insert({
        title,
        content,
        priority: priority || "normal",
        category: category || "general",
        published_by: user.id,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notice: data, success: true });
  } catch (error) {
    console.error("Create notice error:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
