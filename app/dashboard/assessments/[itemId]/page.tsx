import { EssayMarking, type EssayContext } from "@/components/studio/assessments/EssayMarking";
import { readApi, readCourseTree } from "@/components/studio/assessments/serverData";
import type { EssaySubmission } from "@/lib/studio/types";

export const metadata = {
  title: "Mark Essays | Social Work Nigeria",
};

async function readContext(courseId: string | undefined, itemId: string): Promise<EssayContext | null> {
  if (!courseId) return null;
  const course = await readCourseTree(courseId, true);
  for (const section of course?.sections ?? []) {
    const item = section.items?.find((i) => i.id === itemId);
    if (item) {
      return {
        itemTitle: item.title,
        courseTitle: course?.title,
        sectionTitle: section.title,
        isFinal: !!item.assessment?.is_final_assessment,
        essay: item.assessment?.essay,
      };
    }
  }
  return course ? { courseTitle: course.title } : null;
}

export default async function EssayMarkingPage(props: {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { itemId } = await props.params;
  const sp = await props.searchParams;
  const courseId = typeof sp.course === "string" ? sp.course : undefined;
  const learner = typeof sp.learner === "string" ? sp.learner : undefined;

  const [context, submissions] = await Promise.all([
    readContext(courseId, itemId),
    readApi<EssaySubmission[]>(`/courses/items/${itemId}/essay/submissions?page=1&page_size=50`),
  ]);

  return (
    <EssayMarking
      itemId={itemId}
      courseId={courseId}
      context={context}
      initialSubmissions={submissions.ok && Array.isArray(submissions.data) ? submissions.data : undefined}
      initialLearner={learner}
    />
  );
}
