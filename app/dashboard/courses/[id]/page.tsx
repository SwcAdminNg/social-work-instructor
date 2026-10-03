import { Suspense } from "react";
import { CourseEditor } from "@/components/studio/editor/CourseEditor";
import { CourseEditorProvider } from "@/components/studio/editor/CourseEditorContext";
import { CourseUnavailable } from "@/components/studio/editor/CourseUnavailable";
import { fetchApi } from "@/lib/fetchApi";
import type { ManagedCourse } from "@/lib/studio/types";

export const metadata = {
  title: "Course editor | Social Work Nigeria",
};

async function readCourse(id: string): Promise<{ course: ManagedCourse | null; status: number }> {
  try {
    const res = await fetchApi(`/courses/manage/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return { course: null, status: res.status };
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: ManagedCourse };
    if (json.success === false || !json.data) return { course: null, status: 404 };
    return { course: json.data, status: 200 };
  } catch {
    return { course: null, status: 503 };
  }
}

export default async function CourseEditorPage(props: PageProps<"/dashboard/courses/[id]">) {
  const { id } = await props.params;
  const { course, status } = await readCourse(id);

  if (!course) return <CourseUnavailable status={status} />;

  return (
    <CourseEditorProvider courseId={id} initialCourse={course}>
      {/* useSearchParams (tab deep links) needs a Suspense boundary. */}
      <Suspense>
        <CourseEditor />
      </Suspense>
    </CourseEditorProvider>
  );
}
