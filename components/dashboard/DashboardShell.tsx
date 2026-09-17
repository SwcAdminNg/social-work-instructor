"use client";

import { SidebarProvider, useSidebar } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";

function Content({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "lg:pl-[78px]" : "lg:pl-[252px]"
      }`}
    >
      <DashboardHeader />
      <main className="flex-1 bg-[#f7f7fb] p-4 sm:p-6 dark:bg-[#0b0f1a]">
        {children}
      </main>
    </div>
  );
}

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0b0f1a]">
        <Sidebar />
        <Content>{children}</Content>
      </div>
    </SidebarProvider>
  );
}
