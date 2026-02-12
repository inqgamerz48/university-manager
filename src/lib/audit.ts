"use server";

import { createClient } from "@/lib/supabase/server";

export type AuditAction = 
  | "create" | "update" | "delete" | "read" | "login" | "logout" 
  | "export" | "import" | "approve" | "reject" | "submit" | "grade"
  | "mark_attendance" | "publish" | "resolve";

export interface AuditLogEntry {
  user_id?: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const supabase = createClient();

  try {
    await supabase.from("audit_logs").insert({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      old_values: entry.old_values || null,
      new_values: entry.new_values || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function getAuditLogs(filters?: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();

  let query = supabase
    .from("audit_logs")
    .select(`
      *,
      user:users!audit_logs_user_id_fkey (
        email,
        profile:profiles (full_name)
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }
  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate.toISOString());
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch audit logs:", error);
    return { logs: [], total: 0 };
  }

  const { count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true });

  return { logs: data || [], total: count || 0 };
}

export async function getUserActivity(userId: string, limit = 20) {
  return getAuditLogs({ userId, limit });
}

export async function getEntityHistory(entityType: string, entityId: string) {
  return getAuditLogs({ entityType, entityId, limit: 50 });
}

export async function getRecentActions(action: AuditAction, limit = 10) {
  return getAuditLogs({ action, limit });
}

// Middleware helper for request context
export async function getRequestContext(request: Request) {
  return {
    ip_address: request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || 
                 "unknown",
    user_agent: request.headers.get("user-agent") || "unknown",
  };
}
