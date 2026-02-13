import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("complaints")
      .select(`
        *,
        student:users!student_id (
          profile (
            full_name,
            student_id
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ complaints: data });
  } catch (error) {
    console.error("Get complaints error:", error);
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
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
    const { title, description, category, priority } = body;

    const { data, error } = await supabase
      .from("complaints")
      .insert({
        title,
        description,
        category: category || "general",
        priority: priority || "normal",
        student_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ complaint: data, success: true });
  } catch (error) {
    console.error("Create complaint error:", error);
    return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { complaintId, status, resolution } = body;

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "RESOLVED" || status === "CLOSED") {
      updateData.resolved_at = new Date().toISOString();
    }
    if (resolution) {
      updateData.resolution = resolution;
    }

    const { error } = await supabase
      .from("complaints")
      .update(updateData)
      .eq("id", complaintId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update complaint error:", error);
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
