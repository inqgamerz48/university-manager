"use server";

import { createClient } from "@/lib/supabase/server";
import { Role, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, ROLE_HIERARCHY } from "./rbac";

export async function getUserPermissions(userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (!user) return [];

  const role = user.role as Role;
  const allRoles = [role, ...ROLE_HIERARCHY[role]];

  const { data: rolePermissions } = await supabase
    .from("role_permissions")
    .select("permission_code")
    .in("role", allRoles);

  const permissions = new Set<string>();

  // Add role-based permissions
  for (const r of allRoles) {
    DEFAULT_ROLE_PERMISSIONS[r]?.forEach((p) => permissions.add(p));
  }

  // Add custom role permissions
  rolePermissions?.forEach((rp) => permissions.add(rp.permission_code));

  return Array.from(permissions);
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

export async function hasAnyPermission(userId: string, permissionList: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionList.some((p) => permissions.includes(p));
}

export async function hasAllPermissions(userId: string, permissionList: string[]): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionList.every((p) => permissions.includes(p));
}

export async function hasRole(userId: string, roles: Role | Role[]): Promise<boolean> {
  const supabase = createClient();
  const roleArray = Array.isArray(roles) ? roles : [roles];

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (!user) return false;

  return roleArray.includes(user.role as Role) || 
         ROLE_HIERARCHY[user.role as Role]?.some((h) => roleArray.includes(h));
}

export async function getRoleHierarchyServer(role: Role): Promise<Role[]> {
  const hierarchy: Role[] = [role];
  let current = role;
  
  while (ROLE_HIERARCHY[current]?.length > 0) {
    hierarchy.push(...ROLE_HIERARCHY[current]);
    current = ROLE_HIERARCHY[current][0];
  }
  
  return hierarchy;
}

export async function canAccessEntity(userId: string, entityUserId: string, permission: string): Promise<boolean> {
  return userId === entityUserId;
}

export async function requirePermission(permission: string) {
  return async (userId: string): Promise<{ allowed: boolean; error?: string }> => {
    const hasAccess = await hasPermission(userId, permission);
    
    if (!hasAccess) {
      return { allowed: false, error: `Permission denied: ${permission}` };
    }
    
    return { allowed: true };
  };
}
