"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, type UserRole } from "@/stores/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    ClipboardCheck,
    Bell,
    AlertCircle,
    DollarSign,
    Settings,
    Shield,
    Upload,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    Building,
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    roles: UserRole[];
    badge?: string;
}

const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"],
    },
    {
        label: "Users & Access",
        href: "/admin/rbac",
        icon: Shield,
        roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
        label: "Student Imports",
        href: "/admin/imports",
        icon: Upload,
        roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
        label: "Assignments",
        href: "/assignments",
        icon: BookOpen,
        roles: ["FACULTY", "STUDENT"],
    },
    {
        label: "Attendance",
        href: "/attendance",
        icon: Calendar,
        roles: ["FACULTY"],
    },
    {
        label: "Grading",
        href: "/grading",
        icon: ClipboardCheck,
        roles: ["FACULTY"],
    },
    {
        label: "Notices",
        href: "/notices",
        icon: Bell,
        roles: ["FACULTY", "STUDENT", "SUPER_ADMIN", "ADMIN"],
    },
    {
        label: "Complaints",
        href: "/complaints",
        icon: AlertCircle,
        roles: ["SUPER_ADMIN", "ADMIN", "STUDENT"],
    },
    {
        label: "Fees",
        href: "/fees",
        icon: DollarSign,
        roles: ["SUPER_ADMIN", "ADMIN", "STUDENT"],
    },
    {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "ADMIN"],
    },
];

function getRolePrefix(role: UserRole): string {
    switch (role) {
        case "SUPER_ADMIN":
        case "ADMIN":
            return "/admin";
        case "FACULTY":
            return "/faculty";
        default:
            return "/student";
    }
}

function getRoleLabel(role: UserRole): string {
    switch (role) {
        case "SUPER_ADMIN":
            return "Super Admin";
        case "ADMIN":
            return "Admin";
        case "FACULTY":
            return "Faculty";
        default:
            return "Student";
    }
}

function getRoleBadgeClass(role: UserRole): string {
    switch (role) {
        case "SUPER_ADMIN":
            return "bg-gold-500/10 text-[#D4AF37] border-[#D4AF37]/30";
        case "ADMIN":
            return "bg-blue-500/10 text-blue-400 border-blue-500/30";
        case "FACULTY":
            return "bg-green-500/10 text-green-400 border-green-500/30";
        default:
            return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    }
}

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout: storeLogout } = useAuthStore();

    const role: UserRole = user?.role || "STUDENT";
    const prefix = getRolePrefix(role);

    const filteredItems = NAV_ITEMS.filter((item) =>
        item.roles.includes(role)
    );

    const getFullHref = (item: NavItem) => {
        // Admin-specific routes already have /admin prefix
        if (item.href.startsWith("/admin/")) return item.href;
        // Dashboard is special — maps to /role/dashboard
        if (item.href === "/dashboard") return `${prefix}/dashboard`;
        // Other routes use role prefix
        return `${prefix}${item.href}`;
    };

    const isActive = (item: NavItem) => {
        const fullHref = getFullHref(item);
        if (item.href === "/dashboard") {
            return pathname === fullHref;
        }
        return pathname.startsWith(fullHref);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        storeLogout();
        router.push("/login");
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
                <Link href={`${prefix}/dashboard`} className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                        <Building className="h-5 w-5 text-black" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight">UNI Manager</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">College Management</span>
                        </div>
                    )}
                </Link>
                {/* Desktop collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "rotate-180" : ""
                            }`}
                    />
                </button>
                {/* Mobile close */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {filteredItems.map((item) => {
                    const active = isActive(item);
                    const fullHref = getFullHref(item);
                    return (
                        <Link
                            key={item.href}
                            href={fullHref}
                            onClick={() => setMobileOpen(false)}
                            className={`
                group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                ${active
                                    ? "bg-[#D4AF37]/15 text-[#D4AF37] shadow-sm shadow-[#D4AF37]/10"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                }
                ${collapsed ? "justify-center" : ""}
              `}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon
                                className={`h-5 w-5 shrink-0 transition-colors ${active ? "text-[#D4AF37]" : "text-muted-foreground group-hover:text-foreground"
                                    }`}
                            />
                            {!collapsed && (
                                <>
                                    <span className="ml-3 truncate">{item.label}</span>
                                    {item.badge && (
                                        <Badge
                                            variant="destructive"
                                            className="ml-auto text-[10px] px-1.5 py-0"
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}
                                </>
                            )}
                            {/* Active indicator */}
                            {active && (
                                <div className="absolute left-0 w-1 h-6 rounded-r-full bg-[#D4AF37]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="border-t border-white/10 p-3">
                <div
                    className={`flex items-center rounded-lg p-2.5 ${collapsed ? "justify-center" : "space-x-3"
                        }`}
                >
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-semibold">
                            {user?.fullName?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user?.fullName || "User"}
                            </p>
                            <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 mt-0.5 ${getRoleBadgeClass(role)}`}
                            >
                                {getRoleLabel(role)}
                            </Badge>
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className={`w-full mt-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? "px-0 justify-center" : "justify-start"
                        }`}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="ml-2">Sign Out</span>}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile trigger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 rounded-lg bg-secondary/80 backdrop-blur-lg border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#0d0d0d] border-r border-white/10
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                {sidebarContent}
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={`
          hidden lg:flex flex-col shrink-0 h-screen sticky top-0
          bg-[#0d0d0d]/80 backdrop-blur-xl border-r border-white/10
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-64"}
        `}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
