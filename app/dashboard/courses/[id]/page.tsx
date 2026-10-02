import { CourseDetail } from "@/components/dashboard/instructor/CourseStudio";
import type { ApiEnvelope, ManageCourse } from "@/components/dashboard/instructor/types";
import { fetchApi } from "@/lib/fetchApi";

export const metadata = {
  title: "Course Workspace | Social Work Nigeria",
};

async function readCourse(id: string) {
  try {
    const res = await fetchApi(`/courses/manage/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<ManageCourse>;
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function CourseWorkspacePage(
  props: PageProps<"/dashboard/courses/[id]">,
) {
  const { id } = await props.params;
  const course = await readCourse(id);
  return <CourseDetail course={course} />;
}
