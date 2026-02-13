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

    const body = await request.json();
    const { pinNumber } = body;

    if (!pinNumber) {
      return NextResponse.json({ error: "PIN number is required" }, { status: 400 });
    }

    const pinValidation = validatePIN(pinNumber);

    if (!pinValidation.valid) {
      return NextResponse.json(
        { error: pinValidation.errors[0], valid: false },
        { status: 400 }
      );
    }

    const { data: institution } = await supabase
      .from("institutions")
      .select("id")
      .eq("is_active", true)
      .single();

    const institutionId = institution?.id || "default";

    const { data: preImport, error } = await supabase
      .from("student_pre_imports")
      .select("*")
      .eq("institution_id", institutionId)
      .eq("pin_number", pinNumber.toUpperCase())
      .single();

    if (error || !preImport) {
      return NextResponse.json({
        found: false,
        message: "PIN not found in pre-imported records",
        pinInfo: {
          formatted: pinValidation.valid
            ? `${pinValidation.year}${pinValidation.collegeCode}-${pinValidation.deptCode}-${pinValidation.studentPin}`
            : pinNumber,
          year: pinValidation.valid ? pinValidation.yearFull : null,
          department: pinValidation.valid
            ? `${pinValidation.deptCode} - ${pinValidation.deptCode}`
            : null,
        },
      });
    }

    if (preImport.is_registered) {
      return NextResponse.json({
        found: true,
        alreadyRegistered: true,
        message: "This PIN has already been registered",
        student: {
          pin_number: preImport.pin_number,
          first_name: preImport.first_name,
          last_name: preImport.last_name,
          year: preImport.year,
          semester: preImport.semester,
          course_code: preImport.course_code,
          course_name: preImport.course_name,
        },
      });
    }

    return NextResponse.json({
      found: true,
      alreadyRegistered: false,
      pinInfo: {
        formatted: pinValidation.valid
          ? `${pinValidation.year}${pinValidation.collegeCode}-${pinValidation.deptCode}-${pinValidation.studentPin}`
          : pinNumber,
        year: pinValidation.valid ? pinValidation.yearFull : null,
        department: pinValidation.valid
          ? `${pinValidation.deptCode} - ${pinValidation.deptCode}`
          : null,
      },
      student: {
        pin_number: preImport.pin_number,
        first_name: preImport.first_name,
        last_name: preImport.last_name,
        year: preImport.year,
        semester: preImport.semester,
        course_code: preImport.course_code,
        course_name: preImport.course_name,
      },
    });
  } catch (error) {
    console.error("Verify PIN error:", error);
    return NextResponse.json(
      { error: "Failed to verify PIN" },
      { status: 500 }
    );
  }
}
