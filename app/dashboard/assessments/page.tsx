import { AssessmentStudio } from "@/components/dashboard/instructor/AssessmentStudio";
import type {
  ApiEnvelope,
  DashboardUserProfile,
  ManageCourse,
} from "@/components/dashboard/instructor/types";
import { fetchApi } from "@/lib/fetchApi";

export const metadata = {
  title: "Assessments | Social Work Nigeria",
};

async function readCourses() {
  try {
    const res = await fetchApi("/courses/manage?page=1&page_size=50", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<ManageCourse[]>;
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function AssessmentsPage() {
  const profile = await (async () => {
    try {
      const res = await fetchApi("/users/me", { cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<DashboardUserProfile>;
      return json.data ?? null;
    } catch {
      return null;
    }
  })();
  const courses = profile?.access?.capabilities?.can_mark_essays
    ? await readCourses()
    : [];
  return <AssessmentStudio courses={courses} />;
}
