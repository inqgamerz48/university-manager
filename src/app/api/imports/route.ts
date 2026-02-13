import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { validatePIN, COLLEGE_CODE } from "@/lib/pin-validator";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "ADMIN" && profile?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an Excel or CSV file." },
        { status: 400 }
      );
    }

    const { data: institution } = await supabase
      .from("institutions")
      .select("id")
      .eq("is_active", true)
      .single();

    const institutionId = institution?.id || "default";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { parse } = await import("csv-parse/sync");
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const requiredColumns = ["PIN", "First Name", "Year", "Semester", "Course Code", "Course Name"];
    const headers = Object.keys(records[0] || {});
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${missingColumns.join(", ")}`,
          requiredColumns,
          foundColumns: headers,
        },
        { status: 400 }
      );
    }

    const results = {
      total: records.length,
      imported: 0,
      skipped: 0,
      errors: [] as { row: number; pin: string; error: string }[],
    };

    interface ImportRow {
      [key: string]: string | number | undefined;
    }

    for (let i = 0; i < records.length; i++) {
      const row = records[i] as ImportRow;
      const rowNumber = i + 2;

      try {
        const pinValue = row["PIN"]?.toString().trim().toUpperCase();
        const pin = pinValue || "";
        const pinValidation = validatePIN(pin);

        if (!pinValue) {
          results.errors.push({
            row: rowNumber,
            pin: pin || "UNKNOWN",
            error: "PIN is required",
          });
          results.skipped++;
          continue;
        }

        if (!pinValidation.valid) {
          results.errors.push({
            row: rowNumber,
            pin,
            error: pinValidation.errors[0],
          });
          results.skipped++;
          continue;
        }

        const { error: insertError } = await supabase
          .from("student_pre_imports")
          .upsert(
            {
              institution_id: institutionId,
              pin_number: pin,
              first_name: row["First Name"]?.toString().trim() || "",
              last_name: row["Last Name"]?.toString().trim() || null,
              email: row["Email"]?.toString().trim() || null,
              year: row["Year"]?.toString().trim() || pinValidation.yearFull,
              semester: row["Semester"]?.toString().trim() || "1",
              course_code: row["Course Code"]?.toString().trim() || "",
              course_name: row["Course Name"]?.toString().trim() || "",
              is_registered: false,
            },
            {
              onConflict: "institution_id, pin_number",
              ignoreDuplicates: false,
            }
          );

        if (insertError) {
          results.errors.push({
            row: rowNumber,
            pin,
            error: insertError.message,
          });
          results.skipped++;
        } else {
          results.imported++;
        }
      } catch (rowError) {
        results.errors.push({
          row: rowNumber,
          pin: row["PIN"]?.toString() || "UNKNOWN",
          error: rowError instanceof Error ? rowError.message : "Unknown error",
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${results.imported} students, skipped ${results.skipped}`,
      ...results,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "ADMIN" && profile?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";

    const { data: imports, error } = await supabase
      .from("student_pre_imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const { count: totalCount } = await supabase
      .from("student_pre_imports")
      .select("*", { count: "exact", head: true });

    const { count: registeredCount } = await supabase
      .from("student_pre_imports")
      .select("*", { count: "exact", head: true })
      .eq("is_registered", true);

    return NextResponse.json({
      imports: imports || [],
      stats: {
        total: totalCount || 0,
        registered: registeredCount || 0,
        pending: (totalCount || 0) - (registeredCount || 0),
      },
    });
  } catch (error) {
    console.error("Get imports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch imports" },
      { status: 500 }
    );
  }
}
