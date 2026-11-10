import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPassword from "@/components/auth/ResetPassword";
import { fetchApi } from "@/lib/fetchApi";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Choose a New Password | Social Work Nigeria Instructors",
    description: "Choose a new password for your instructor account.",
    path: "/reset-password",
  }),
  robots: { index: false, follow: false },
};

/** Platform figures for the side panel; the page still renders when the API is unreachable. */
async function loadStats() {
  try {
    const res = await fetchApi("/home/stats", { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data?.data || null;
  } catch {
    return null;
  }
}

export default async function ResetPasswordPage() {
  const stats = await loadStats();
  return (
    <Suspense fallback={null}>
      <ResetPassword statsData={stats} />
    </Suspense>
  );
}
