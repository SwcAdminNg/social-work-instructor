import type { Metadata } from "next";
import { Suspense } from "react";
import Login from "@/components/auth/Login";
import { fetchApi } from "@/lib/fetchApi";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Instructor Sign In | Social Work Nigeria Instructors",
    description: "Sign in to your instructor workspace to build courses, respond to reviewers and mark learners' work.",
    path: "/login",
  }),
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

export default async function LoginPage() {
  const stats = await loadStats();
  return (
    <Suspense fallback={null}>
      <Login statsData={stats} />
    </Suspense>
  );
}
