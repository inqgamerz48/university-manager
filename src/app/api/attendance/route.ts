import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const subjectCode = searchParams.get("subjectCode");
  const month = searchParams.get("month");

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("attendance")
      .select(`
        *,
        student:users!student_id (
          profile (
            full_name,
            student_id
          )
        )
      `);

    if (studentId) {
      query = query.eq("student_id", studentId);
    }
    if (subjectCode) {
      query = query.eq("subject_code", subjectCode);
    }
    if (month) {
      query = query.like("date", `${month}%`);
    }

    const { data, error } = await query.order("date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ attendance: data });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
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
    const { studentId, date, status, subjectCode, records } = body;

    if (records && Array.isArray(records)) {
      const attendanceRecords = records.map((record: { studentId: string; status: string }) => ({
        student_id: record.studentId,
        date,
        status: record.status,
        subject_code: subjectCode,
        marked_by: user.id,
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(attendanceRecords, { onConflict: "student_id, date, subject_code" });

      if (error) throw error;

      return NextResponse.json({ success: true, message: "Attendance marked successfully" });
    } else {
      const { error } = await supabase
        .from("attendance")
        .upsert({
          student_id: studentId,
          date,
          status,
          subject_code: subjectCode,
          marked_by: user.id,
        }, {
          onConflict: "student_id, date, subject_code"
        });

      if (error) throw error;

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Mark attendance error:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}
