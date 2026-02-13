"use client";

import { Sidebar } from "./Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
                <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
