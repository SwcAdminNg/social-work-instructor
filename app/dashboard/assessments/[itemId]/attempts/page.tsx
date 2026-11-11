import { QuizAttempts, type QuizAttemptsContext } from "@/components/studio/assessments/QuizAttempts";
import { readApi, readCourseTree } from "@/components/studio/assessments/serverData";
import type { QuizAttemptReview } from "@/lib/studio/types";

export const metadata = {
  title: "Quiz Attempts | Social Work Nigeria",
};

async function readContext(courseId: string | undefined, itemId: string): Promise<QuizAttemptsContext | null> {
  if (!courseId) return null;
  const course = await readCourseTree(courseId, true);
  for (const section of course?.sections ?? []) {
    const item = section.items?.find((i) => i.id === itemId);
    if (item) {
      const assessment = item.assessment;
      const isGroup = assessment?.assessment_type === "QUIZ_GROUP";
      return {
        itemTitle: item.title,
        courseTitle: course?.title,
        sectionTitle: section.title,
        isFinal: !!assessment?.is_final_assessment,
        isGroup,
        passMark: (isGroup ? assessment?.quiz_group?.pass_mark_percentage : assessment?.quiz?.pass_mark_percentage) ?? null,
      };
    }
  }
  return course ? { courseTitle: course.title } : null;
}

export default async function QuizAttemptsPage(props: {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { itemId } = await props.params;
  const sp = await props.searchParams;
  const courseId = typeof sp.course === "string" ? sp.course : undefined;

  const [context, attempts] = await Promise.all([
    readContext(courseId, itemId),
    readApi<QuizAttemptReview[]>(`/courses/items/${itemId}/quiz/attempts?page=1&page_size=100`),
  ]);

  return (
    <QuizAttempts
      itemId={itemId}
      courseId={courseId}
      context={context}
      initialAttempts={attempts.ok && Array.isArray(attempts.data) ? attempts.data : undefined}
    />
  );
}
