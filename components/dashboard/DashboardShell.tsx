"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ShieldCheck } from "lucide-react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";

function ProfilePhotoBanner() {
  return (
    <div className="mb-5 rounded-lg border border-[#b7e4c7] bg-[#f1fbf6] px-4 py-4 text-[#173f2d] shadow-sm dark:border-[#2f6f55] dark:bg-[#10261c] dark:text-[#d8f3dc] sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-white text-[#2D6A4F] shadow-sm dark:bg-[#173326] dark:text-[#52b788]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold">
              Add a professional profile photo for your instructor account
            </p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[#315f49] dark:text-[#b7e4c7]">
              Your photo helps learners, fellow instructors, and community
              members recognize you across discussions and profile reviews.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/settings?profile_photo=instructor"
          className="inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white no-underline transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
        >
          <Camera className="h-4 w-4" />
          Add photo
        </Link>
      </div>
    </div>
  );
}

function Content({
  children,
  userHasProfilePicture,
}: {
  children: React.ReactNode;
  userHasProfilePicture?: boolean;
}) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const showPhotoBanner =
    userHasProfilePicture === false &&
    !pathname.startsWith("/dashboard/settings");

  return (
    <div
      className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "lg:pl-[78px]" : "lg:pl-[252px]"
      }`}
    >
      <DashboardHeader />
      <main className="flex-1 bg-[#f7f7fb] p-4 sm:p-6 dark:bg-[#0b0f1a]">
        {showPhotoBanner && <ProfilePhotoBanner />}
        {children}
      </main>
    </div>
  );
}

export function DashboardShell({
  children,
  userHasProfilePicture,
}: {
  children: React.ReactNode;
  userHasProfilePicture?: boolean;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0b0f1a]">
        <Sidebar />
        <Content userHasProfilePicture={userHasProfilePicture}>
          {children}
        </Content>
      </div>
    </SidebarProvider>
  );
}
