"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit";

// ==========================================
// Branches (Departments)
// ==========================================

export async function createBranch(data: {
    name: string;
    code: string;
    course_type: "UG" | "PG" | "BOTH";
    description?: string;
    duration_semesters: number;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        // Check if Admin and get institution_id
        const adminClient = getAdminClient();
        const { data: userData, error: userError } = await adminClient
            .from('users')
            .select('role, institution_id')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return { success: false, error: "User not found" };
        }

        if (userData?.role !== 'ADMIN' && userData?.role !== 'SUPER_ADMIN') {
            return { success: false, error: "Forbidden: Admin only" };
        }

        if (!userData.institution_id) {
            return { success: false, error: "No institution assigned to admin" };
        }

        const { error } = await adminClient.from("branches").insert([{
            ...data,
            institution_id: userData.institution_id,
            is_active: true
        }]);

        if (error) {
            console.error("Supabase Error:", error);
            return { success: false, error: error.message };
        }

        await createAuditLog({
            action: "create",
            entity_type: "branch",
            entity_id: data.code,
            new_values: data,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Create branch error:", error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// Subjects
// ==========================================

export async function createSubject(data: {
    name: string;
    code: string;
    branch_id: string;
    semester: number;
    credits: number;
    type: "THEORY" | "LAB" | "ELECTIVE";
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        // Check if Admin and get institution_id
        const adminClient = getAdminClient();
        const { data: userData, error: userError } = await adminClient
            .from('users')
            .select('role, institution_id')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return { success: false, error: "User not found" };
        }

        if (userData?.role !== 'ADMIN' && userData?.role !== 'SUPER_ADMIN') {
            return { success: false, error: "Forbidden: Admin only" };
        }

        if (!userData.institution_id) {
            return { success: false, error: "No institution assigned to admin" };
        }

        // Get branch info for the subject
        const { data: branchData } = await adminClient
            .from('branches')
            .select('course_type')
            .eq('id', data.branch_id)
            .single();

        const { error } = await adminClient.from("subjects").insert([{
            ...data,
            institution_id: userData.institution_id,
            academic_year: new Date().getFullYear().toString(),
            semester: `SEM_${data.semester}`,
            is_active: true,
        }]);

        if (error) {
            return { success: false, error: error.message };
        }

        await createAuditLog({
            action: "create",
            entity_type: "subject",
            entity_id: data.code,
            new_values: data,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Create subject error:", error);
        return { success: false, error: error.message };
    }
}
