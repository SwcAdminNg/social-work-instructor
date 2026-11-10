import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPassword from "@/components/auth/ForgotPassword";
import { fetchApi } from "@/lib/fetchApi";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Reset Your Password | Social Work Nigeria Instructors",
    description: "Request a secure link to choose a new password for your instructor account.",
    path: "/forgot-password",
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

export default async function ForgotPasswordPage() {
  const stats = await loadStats();
  return (
    <Suspense fallback={null}>
      <ForgotPassword statsData={stats} />
    </Suspense>
  );
}
