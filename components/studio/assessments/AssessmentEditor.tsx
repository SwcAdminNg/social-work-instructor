"use client";

// Rendered inside the curriculum item editor sheet for ASSESSMENT items.
// Always reads from the `item` prop: the parent re-derives it from the
// re-fetched tree after every write, and ids can change after the first edit
// of a published course, so nothing here caches question/option ids.

import { AlertTriangle, ClipboardCheck, Flag, Layers, ListChecks, Lock, PenLine, ShieldCheck } from "lucide-react";
import { Badge, ButtonLink, Callout, Card, CardHeader } from "@/components/ui/primitives";
import { useAccess } from "@/components/studio/AccessContext";
import { useCourseEditor } from "@/components/studio/editor/CourseEditorContext";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/studio/labels";
import type { Item } from "@/lib/studio/types";
import { AssessmentSettings } from "./AssessmentSettings";
import { QuestionBuilder } from "./QuestionBuilder";
import { QuizGroupBuilder, groupStats } from "./QuizGroupBuilder";
import { SaveIndicator, SaveTrackerProvider, questionsSummary } from "./shared";

const TYPE_ICON = { QUIZ: ListChecks, ESSAY: PenLine, QUIZ_GROUP: Layers } as const;

export function AssessmentEditor({ item, sectionId }: { item: Item; sectionId: string }) {
  return (
    <SaveTrackerProvider>
      <AssessmentEditorInner item={item} sectionId={sectionId} />
    </SaveTrackerProvider>
  );
}

function AssessmentEditorInner({ item, sectionId }: { item: Item; sectionId: string }) {
  const { readOnly, courseId, lifecycle, hasWorkingCopy, course } = useCourseEditor();
  const { capabilities } = useAccess();
  const a = item.assessment;

  if (!a) {
    return (
      <Callout tone="warning" icon={AlertTriangle} title="Assessment details are missing">
        This item has no assessment data. Refresh the page; if it persists, delete the item and add it again.
      </Callout>
    );
  }

  const type = a.assessment_type;
  const Icon = TYPE_ICON[type] ?? ClipboardCheck;
  const quizQuestions = a.quiz?.questions ?? [];
  const groupSections = a.quiz_group?.sections ?? [];
  const quizSummary = questionsSummary(quizQuestions);
  const group = groupStats(groupSections);
  const groupIssues = groupSections.reduce((n, s) => n + questionsSummary(s.questions ?? []).withIssues, 0);
  const issues = type === "QUIZ" ? quizSummary.withIssues : type === "QUIZ_GROUP" ? groupIssues : 0;
  // Learners submit against the live course, so marking links use live item ids.
  const isLiveLayer = lifecycle === "PUBLISHED" && (course?.governance?.layer ? course.governance.layer === "live" : !hasWorkingCopy);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 dark:border-ink-line dark:bg-ink-surface">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{ASSESSMENT_TYPE_LABELS[type] ?? "Assessment"}</span>
        {type === "QUIZ" && (
          <Badge size="xs">
            {quizQuestions.length} question{quizQuestions.length === 1 ? "" : "s"}
          </Badge>
        )}
        {type === "QUIZ_GROUP" && (
          <Badge size="xs">
            {groupSections.length} section{groupSections.length === 1 ? "" : "s"} · {group.perAttempt} per attempt
          </Badge>
        )}
        {a.is_final_assessment && (
          <Badge size="xs" tone="violet" icon={Flag}>
            Module gate
          </Badge>
        )}
        {type === "ESSAY" && a.essay?.requires_moderation && (
          <Badge size="xs" tone="info" icon={ShieldCheck}>
            Moderated
          </Badge>
        )}
        {issues > 0 && (
          <Badge size="xs" tone="warning" icon={AlertTriangle}>
            {issues} to fix
          </Badge>
        )}
        <span className="ml-auto">{readOnly ? <Badge size="xs" icon={Lock}>Read-only</Badge> : <SaveIndicator />}</span>
      </div>

      <AssessmentSettings item={item} sectionId={sectionId} />

      {type === "QUIZ" && (
        <Card>
          <QuestionBuilder
            questions={quizQuestions}
            target={{ kind: "quiz", itemId: item.id }}
            readOnly={readOnly}
            description={readOnly ? undefined : "Click any text to edit it. Tick the circle beside the right answer."}
          />
        </Card>
      )}

      {type === "QUIZ_GROUP" && (
        <Card>
          <QuizGroupBuilder itemId={item.id} sections={groupSections} readOnly={readOnly} />
        </Card>
      )}

      {type === "ESSAY" && capabilities.can_mark_essays && (
        <Card>
          <CardHeader
            icon={ClipboardCheck}
            title="Marking"
            description={
              isLiveLayer
                ? "Read learners' submissions, award a score and feedback."
                : "Learners can submit once this assessment is live. Marking opens from the Assessments page."
            }
            actions={
              isLiveLayer ? (
                <ButtonLink href={`/dashboard/assessments/${item.id}?course=${courseId}`} variant="secondary" size="sm">
                  Mark submissions
                </ButtonLink>
              ) : (
                <ButtonLink href="/dashboard/assessments" variant="outline" size="sm">
                  Assessments
                </ButtonLink>
              )
            }
            className="mb-0"
          />
        </Card>
      )}
    </div>
  );
}
