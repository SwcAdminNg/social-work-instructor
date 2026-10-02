import { AssessmentStudio } from "@/components/dashboard/instructor/AssessmentStudio";
import type { ApiEnvelope, ManageCourse } from "@/components/dashboard/instructor/types";
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
  const courses = await readCourses();
  return <AssessmentStudio courses={courses} />;
}
