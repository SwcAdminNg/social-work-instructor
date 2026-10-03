import { studioApi } from "@/lib/studio/api";
import type { QuestionPayload } from "@/lib/studio/types";

/** Where new questions go: a standalone quiz item or one quiz-group section. */
export type QuestionTarget = { kind: "quiz"; itemId: string } | { kind: "group"; sectionId: string };

export function createQuestionFor(target: QuestionTarget, payload: QuestionPayload) {
  return target.kind === "quiz"
    ? studioApi.createQuestion(target.itemId, payload)
    : studioApi.createGroupQuestion(target.sectionId, payload);
}
