"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFeeStructure(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Verify admin role
    const { data: userData } = await supabase
        .from("users")
        .select("role, institution_id")
        .eq("id", user.id)
        .single();

    if (!userData || !["ADMIN", "SUPER_ADMIN"].includes(userData.role)) {
        return { error: "Only admins can create fee structures" };
    }

    const name = formData.get("name") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const category = formData.get("category") as string;
    const academicYear = formData.get("academicYear") as string || "2025-26";
    const courseType = formData.get("courseType") as string || "B_TECH";
    const dueDate = formData.get("dueDate") as string;

    if (!name || !amount || !category || !dueDate) {
        return { error: "All fields are required" };
    }

    const { error } = await supabase.from("fee_structures").insert({
        name,
        amount,
        category,
        academic_year: academicYear,
        course_type: courseType,
        institution_id: userData.institution_id,
        due_date: dueDate,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/fees");
    return { success: true };
}

export async function getFeeStructures() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: userData } = await supabase
        .from("users")
        .select("institution_id")
        .eq("id", user.id)
        .single();

    const { data, error } = await supabase
        .from("fee_structures")
        .select("*, payments:fee_payments(id, amount, status)")
        .eq("institution_id", userData?.institution_id || "")
        .eq("is_active", true)
        .order("due_date", { ascending: true });

    if (error) return { error: error.message };
    return { data };
}

export async function deleteFeeStructure(id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("fee_structures")
        .update({ is_active: false })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/fees");
    return { success: true };
}

export async function getFeeStats() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: userData } = await supabase
        .from("users")
        .select("institution_id")
        .eq("id", user.id)
        .single();

    const institutionId = userData?.institution_id || "";

    // Get all active fee structures
    const { data: structures } = await supabase
        .from("fee_structures")
        .select("id, amount")
        .eq("institution_id", institutionId)
        .eq("is_active", true);

    // Get all payments
    const { data: payments } = await supabase
        .from("fee_payments")
        .select("amount, status")
        .in("fee_id", (structures || []).map(s => s.id));

    const totalCollected = (payments || [])
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0);

    const totalPending = (payments || [])
        .filter(p => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0);

    const totalOverdue = (payments || [])
        .filter(p => p.status === "OVERDUE")
        .reduce((sum, p) => sum + p.amount, 0);

    return {
        data: {
            totalCollected,
            totalPending,
            totalOverdue,
            activeStructures: (structures || []).length,
        },
    };
}

export async function recordPayment(feeId: string, studentPin: string, method: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Verify admin
    const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!userData || !["ADMIN", "SUPER_ADMIN"].includes(userData.role)) {
        return { error: "Only admins can record payments" };
    }

    // Find student
    const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("pin_number", studentPin)
        .single();

    if (!student) {
        return { error: "Student not found with this PIN" };
    }

    // Check if payment record exists
    const { data: existingPayment } = await supabase
        .from("fee_payments")
        .select("id")
        .eq("student_id", student.id)
        .eq("fee_id", feeId)
        .single();

    if (existingPayment) {
        // Update existing
        const { error } = await supabase
            .from("fee_payments")
            .update({
                status: "PAID",
                payment_method: method,
                paid_at: new Date().toISOString(),
                transaction_id: `MANUAL-${Date.now()}`
            })
            .eq("id", existingPayment.id);

        if (error) return { error: error.message };
    } else {
        // Create new paid record
        const { data: feeStructure } = await supabase
            .from("fee_structures")
            .select("amount, due_date")
            .eq("id", feeId)
            .single();

        if (!feeStructure) return { error: "Fee structure not found" };

        const { error } = await supabase
            .from("fee_payments")
            .insert({
                student_id: student.id,
                fee_id: feeId,
                amount: feeStructure.amount,
                status: "PAID",
                payment_method: method,
                paid_at: new Date().toISOString(),
                due_date: feeStructure.due_date,
                transaction_id: `MANUAL-${Date.now()}`
            });

        if (error) return { error: error.message };
    }

    revalidatePath("/admin/fees");
    revalidatePath("/student/fees");
    return { success: true };
}
