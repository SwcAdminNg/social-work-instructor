import { CourseLibrary } from "@/components/studio/courses/CourseLibrary";
import { readApprovalRows, readMe, readPage } from "@/components/studio/courses/serverData";
import type { ManagedCourse } from "@/lib/studio/types";

export const metadata = {
  title: "My courses | Social Work Nigeria",
};

export default async function CoursesPage() {
  const me = await readMe();
  const access = me?.access;
  const caps = access?.capabilities ?? {};
  const governed = access?.governance_enabled !== false;
  const inbox = governed && !!caps.can_access_approval_centre;

  const [courses, drafts, returned] = await Promise.all([
    caps.can_edit_content ? readPage<ManagedCourse>("/courses/manage?page=1&page_size=50") : Promise.resolve(null),
    inbox ? readApprovalRows("my_drafts", 100, "COURSE_REVISION") : Promise.resolve(null),
    inbox ? readApprovalRows("returned_to_me", 100, "COURSE_REVISION") : Promise.resolve(null),
  ]);

  return <CourseLibrary initialCourses={courses} initialDrafts={drafts} initialReturned={returned} />;
}
