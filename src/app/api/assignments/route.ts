import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const facultyId = searchParams.get("facultyId");

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("assignments")
      .select(`
        *,
        submissions (
          id,
          grade,
          feedback,
          submitted_at,
          student:users!student_id (
            profile (
              full_name,
              student_id
            )
          )
        )
      `)
      .order("due_date", { ascending: true });

    if (facultyId) {
      query = query.eq("faculty_id", facultyId);
    } else if (searchParams.get("my") === "true") {
      query = query.eq("faculty_id", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ assignments: data });
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
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
    const { title, description, instructions, dueDate, subjectCode, subjectName, maxGrade } = body;

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        title,
        description,
        instructions,
        due_date: dueDate,
        subject_code: subjectCode,
        subject_name: subjectName,
        max_grade: maxGrade || 100,
        faculty_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ assignment: data, success: true });
  } catch (error) {
    console.error("Create assignment error:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
