// Client-safe exports - no server imports

export type Role = "STUDENT" | "FACULTY" | "ADMIN" | "SUPER_ADMIN";

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

// Role hierarchy: Higher roles inherit permissions from lower roles
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  STUDENT: [],
  FACULTY: ["STUDENT"],
  ADMIN: ["FACULTY", "STUDENT"],
  SUPER_ADMIN: ["ADMIN", "FACULTY", "STUDENT"],
};

// Permission definitions with categories
export const PERMISSIONS: Record<string, Permission> = {
  // User Management
  "users:read": { id: "users_read", code: "users:read", name: "View Users", description: "View user profiles and information", category: "users" },
  "users:write": { id: "users_write", code: "users:write", name: "Manage Users", description: "Create, update, and delete users", category: "users" },
  "users:roles": { id: "users_roles", code: "users:roles", name: "Assign Roles", description: "Change user roles and permissions", category: "users" },
  "users:import": { id: "users_import", code: "users:import", name: "Import Users", description: "Bulk import user data", category: "users" },

  // Student Management
  "students:read": { id: "students_read", code: "students:read", name: "View Students", description: "View student profiles and records", category: "students" },
  "students:write": { id: "students_write", code: "students:write", name: "Manage Students", description: "Create and update student records", category: "students" },
  "students:import": { id: "students_import", code: "students:import", name: "Import Students", description: "Bulk import student data", category: "students" },

  // Faculty Management
  "faculty:read": { id: "faculty_read", code: "faculty:read", name: "View Faculty", description: "View faculty profiles", category: "faculty" },
  "faculty:write": { id: "faculty_write", code: "faculty:write", name: "Manage Faculty", description: "Create and update faculty records", category: "faculty" },

  // Assignment Management
  "assignments:create": { id: "assignments_create", code: "assignments:create", name: "Create Assignments", description: "Create new assignments", category: "assignments" },
  "assignments:read": { id: "assignments_read", code: "assignments:read", name: "View Assignments", description: "View assignments", category: "assignments" },
  "assignments:write": { id: "assignments_write", code: "assignments:write", name: "Edit Assignments", description: "Update and delete assignments", category: "assignments" },
  "assignments:grade": { id: "assignments_grade", code: "assignments:grade", name: "Grade Assignments", description: "Grade student submissions", category: "assignments" },
  "assignments:delete": { id: "assignments_delete", code: "assignments:delete", name: "Delete Assignments", description: "Delete assignments", category: "assignments" },

  // Submission Management
  "submissions:read": { id: "submissions_read", code: "submissions:read", name: "View Submissions", description: "View student submissions", category: "submissions" },
  "submissions:write": { id: "submissions_write", code: "submissions:write", name: "Submit Work", description: "Submit assignments", category: "submissions" },
  "submissions:grade": { id: "submissions_grade", code: "submissions:grade", name: "Grade Submissions", description: "Grade student submissions", category: "submissions" },

  // Attendance Management
  "attendance:read": { id: "attendance_read", code: "attendance:read", name: "View Attendance", description: "View attendance records", category: "attendance" },
  "attendance:write": { id: "attendance_write", code: "attendance:write", name: "Mark Attendance", description: "Mark and update attendance", category: "attendance" },
  "attendance:export": { id: "attendance_export", code: "attendance:export", name: "Export Attendance", description: "Export attendance data", category: "attendance" },

  // Notice Management
  "notices:read": { id: "notices_read", code: "notices:read", name: "View Notices", description: "View published notices", category: "notices" },
  "notices:create": { id: "notices_create", code: "notices:create", name: "Create Notices", description: "Create and publish notices", category: "notices" },
  "notices:write": { id: "notices_write", code: "notices:write", name: "Manage Notices", description: "Update and delete notices", category: "notices" },
  "notices:delete": { id: "notices_delete", code: "notices:delete", name: "Delete Notices", description: "Delete notices", category: "notices" },

  // Complaint Management
  "complaints:read": { id: "complaints_read", code: "complaints:read", name: "View Complaints", description: "View complaints", category: "complaints" },
  "complaints:create": { id: "complaints_create", code: "complaints:create", name: "Submit Complaints", description: "Submit new complaints", category: "complaints" },
  "complaints:resolve": { id: "complaints_resolve", code: "complaints:resolve", name: "Resolve Complaints", description: "Resolve and close complaints", category: "complaints" },
  "complaints:assign": { id: "complaints_assign", code: "complaints:assign", name: "Assign Complaints", description: "Assign complaints to staff", category: "complaints" },

  // Fee Management
  "fees:read": { id: "fees_read", code: "fees:read", name: "View Fees", description: "View fee structures and payments", category: "fees" },
  "fees:write": { id: "fees_write", code: "fees:write", name: "Manage Fees", description: "Create and update fee structures", category: "fees" },
  "fees:pay": { id: "fees_pay", code: "fees:pay", name: "Pay Fees", description: "Process fee payments", category: "fees" },

  // Subject Management
  "subjects:read": { id: "subjects_read", code: "subjects:read", name: "View Subjects", description: "View subject catalog", category: "subjects" },
  "subjects:write": { id: "subjects_write", code: "subjects:write", name: "Manage Subjects", description: "Create and update subjects", category: "subjects" },
  "subjects:delete": { id: "subjects_delete", code: "subjects:delete", name: "Delete Subjects", description: "Delete subjects", category: "subjects" },

  // Analytics & Reports
  "analytics:read": { id: "analytics_read", code: "analytics:read", name: "View Analytics", description: "View analytics and reports", category: "analytics" },
  "analytics:export": { id: "analytics_export", code: "analytics:export", name: "Export Reports", description: "Export analytics and reports", category: "analytics" },

  // Settings
  "settings:read": { id: "settings_read", code: "settings:read", name: "View Settings", description: "View system settings", category: "settings" },
  "settings:write": { id: "settings_write", code: "settings:write", name: "Manage Settings", description: "Modify system settings", category: "settings" },

  // Institution
  "institution:read": { id: "institution_read", code: "institution:read", name: "View Institution", description: "View institution details", category: "institution" },
  "institution:write": { id: "institution_write", code: "institution:write", name: "Manage Institution", description: "Update institution settings", category: "institution" },

  // Audit
  "audit:read": { id: "audit_read", code: "audit:read", name: "View Audit Logs", description: "View audit logs", category: "audit" },
};

// Default role-permission mapping
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
  STUDENT: [
    "users:read",
    "students:read",
    "assignments:read",
    "submissions:read",
    "submissions:write",
    "attendance:read",
    "notices:read",
    "complaints:read",
    "complaints:create",
    "fees:read",
    "fees:pay",
    "subjects:read",
    "analytics:read",
    "institution:read",
  ],
  FACULTY: [
    "users:read",
    "students:read",
    "faculty:read",
    "assignments:create",
    "assignments:read",
    "assignments:write",
    "assignments:grade",
    "submissions:read",
    "submissions:grade",
    "attendance:read",
    "attendance:write",
    "notices:read",
    "notices:create",
    "notices:write",
    "complaints:read",
    "subjects:read",
    "subjects:write",
    "analytics:read",
    "analytics:export",
    "institution:read",
  ],
  ADMIN: [
    "users:read",
    "users:write",
    "users:import",
    "students:read",
    "students:write",
    "students:import",
    "faculty:read",
    "faculty:write",
    "assignments:create",
    "assignments:read",
    "assignments:write",
    "assignments:grade",
    "assignments:delete",
    "submissions:read",
    "submissions:grade",
    "attendance:read",
    "attendance:write",
    "attendance:export",
    "notices:read",
    "notices:create",
    "notices:write",
    "notices:delete",
    "complaints:read",
    "complaints:resolve",
    "complaints:assign",
    "fees:read",
    "fees:write",
    "subjects:read",
    "subjects:write",
    "subjects:delete",
    "analytics:read",
    "analytics:export",
    "settings:read",
    "institution:read",
    "institution:write",
  ],
  SUPER_ADMIN: Object.keys(PERMISSIONS),
};

// Client-side helper functions (no server imports)
export function getRoleHierarchy(role: Role): Role[] {
  const hierarchy: Role[] = [role];
  let current = role;
  
  while (ROLE_HIERARCHY[current]?.length > 0) {
    hierarchy.push(...ROLE_HIERARCHY[current]);
    current = ROLE_HIERARCHY[current][0];
  }
  
  return hierarchy;
}

export function getDefaultPermissions(role: Role): string[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}
