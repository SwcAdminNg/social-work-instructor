import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, ListChecks, LockKeyhole, Timer } from "lucide-react";
import type { CourseItem, ManageCourse } from "./types";

type AssessmentRow = CourseItem & {
  courseId: string;
  courseTitle?: string;
  sectionTitle?: string;
};

function rowsFromCourses(courses: ManageCourse[]): AssessmentRow[] {
  return courses.flatMap((course) =>
    (course.sections ?? []).flatMap((section) =>
      (section.items ?? [])
        .filter((item) => item.assessment)
        .map((item) => ({
          ...item,
          courseId: course.id,
          courseTitle: course.title,
          sectionTitle: section.title,
        })),
    ),
  );
}

function dueLabel(value?: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(date);
}

function assessmentSummary(row: AssessmentRow) {
  const assessment = row.assessment;
  if (assessment?.assessment_type === "QUIZ") {
    return `${assessment.quiz?.questions?.length ?? 0} questions, pass mark ${assessment.quiz?.pass_mark_percentage ?? 70}%`;
  }
  if (assessment?.assessment_type === "ESSAY") {
    return `${assessment.essay?.submission_mode || "TEXT"} submission, pass mark ${assessment.essay?.pass_mark_percentage ?? 70}%`;
  }
  if (assessment?.assessment_type === "QUIZ_GROUP") {
    return `${assessment.quiz_group?.sections?.length ?? 0} sections, pass mark ${assessment.quiz_group?.pass_mark_percentage ?? 70}%`;
  }
  return "Assessment settings";
}

export function AssessmentStudio({ courses }: { courses: ManageCourse[] }) {
  const rows = rowsFromCourses(courses);
  const quizzes = rows.filter((row) => row.assessment?.assessment_type === "QUIZ").length;
  const essays = rows.filter((row) => row.assessment?.assessment_type === "ESSAY").length;
  const groups = rows.filter((row) => row.assessment?.assessment_type === "QUIZ_GROUP").length;
  const finalGates = rows.filter((row) => row.assessment?.is_final_assessment).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div>
        <p className="text-xs font-extrabold uppercase text-[#2D6A4F] dark:text-[#74c69d]">
          Assessment Studio
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Quizzes, essays and final gates
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Scan every managed assessment, spot moderation requirements, and jump back into the course workspace.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", rows.length, ClipboardCheck],
          ["Quizzes", quizzes, ListChecks],
          ["Essays", essays, FileText],
          ["Quiz groups", groups, Timer],
          ["Final gates", finalGates, LockKeyhole],
        ].map(([label, value, Icon]) => {
          const IconComponent = Icon as React.ComponentType<{ className?: string }>;
          return (
            <div
              key={String(label)}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {String(label)}
                </p>
                <IconComponent className="h-5 w-5 text-[#2D6A4F] dark:text-[#74c69d]" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">
                {String(value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-extrabold text-slate-950 dark:text-white">
              No assessments found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Assessment items from manageable courses will appear here.
            </p>
          </div>
        ) : (
          <ul className="m-0 list-none divide-y divide-slate-100 p-0 dark:divide-[#262a3d]">
            {rows.map((row) => (
              <li key={row.id} className="p-4 transition hover:bg-[#f7fcf9] dark:hover:bg-[#52b788]/8 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-[#eef8f2] px-2 py-1 text-[0.68rem] font-extrabold text-[#2D6A4F] dark:bg-[#52b788]/12 dark:text-[#74c69d]">
                        {row.assessment?.assessment_type?.replaceAll("_", " ") || "Assessment"}
                      </span>
                      {row.assessment?.is_final_assessment && (
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-[0.68rem] font-extrabold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          Final gate
                        </span>
                      )}
                      {row.assessment?.essay?.requires_moderation && (
                        <span className="rounded-md bg-sky-50 px-2 py-1 text-[0.68rem] font-extrabold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          Moderated
                        </span>
                      )}
                    </div>
                    <p className="mt-3 truncate text-base font-extrabold text-slate-950 dark:text-white">
                      {row.title || "Untitled assessment"}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                      {row.courseTitle || "Course"} / {row.sectionTitle || "Section"}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {assessmentSummary(row)} / {dueLabel(row.assessment?.due_date)}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/courses/${row.courseId}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white no-underline transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d]"
                  >
                    Open course
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
