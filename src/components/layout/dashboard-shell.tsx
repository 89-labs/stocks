"use client";

import { DashboardSidebar, DashboardMain } from "@/components/layout/dashboard-sidebar";
import { DashboardSidebarProvider } from "@/components/layout/dashboard-sidebar-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardSidebar />
        <DashboardMain>{children}</DashboardMain>
      </div>
    </DashboardSidebarProvider>
  );
}
