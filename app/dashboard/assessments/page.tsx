import { AssessmentsHub } from "@/components/studio/assessments/AssessmentsHub";
import { readCoursesWithCurriculum } from "@/components/studio/assessments/serverData";

export const metadata = {
  title: "Assessments | Social Work Nigeria",
};

export default async function AssessmentsPage() {
  const { courses, failed, skipped } = await readCoursesWithCurriculum();
  return <AssessmentsHub courses={courses} failed={failed} skipped={skipped} />;
}
