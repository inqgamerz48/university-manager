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

        // Check if Admin
        const { data: userData } = await getAdminClient().from('users').select('role').eq('id', user.id).single();
        if (userData?.role !== 'ADMIN' && userData?.role !== 'SUPER_ADMIN') {
            return { success: false, error: "Forbidden: Admin only" };
        }

        const { error } = await getAdminClient().from("branches").insert([{
            ...data,
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

        const { data: userData } = await getAdminClient().from('users').select('role').eq('id', user.id).single();
        if (userData?.role !== 'ADMIN' && userData?.role !== 'SUPER_ADMIN') {
            return { success: false, error: "Forbidden: Admin only" };
        }

        const { error } = await getAdminClient().from("subjects").insert([{
            ...data,
            is_active: true,
            // We need to fetch faculty_id? Or just leave it null for later assignment?
            // For now, allow null faculty.
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
