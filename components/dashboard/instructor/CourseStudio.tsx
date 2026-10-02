import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  FileCheck2,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import type { CourseItem, ManageCourse } from "./types";

function assessmentItems(course: ManageCourse) {
  return (course.sections ?? []).flatMap((section) =>
    (section.items ?? [])
      .filter((item) => item.assessment)
      .map((item) => ({ ...item, sectionTitle: section.title })),
  );
}

function countByType(items: (CourseItem & { sectionTitle?: string })[], type: string) {
  return items.filter((item) => item.assessment?.assessment_type === type).length;
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <Icon className="h-5 w-5 text-[#2D6A4F] dark:text-[#74c69d]" />
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export function CourseStudio({ courses }: { courses: ManageCourse[] }) {
  const allAssessments = courses.flatMap(assessmentItems);
  const openRevisions = courses.filter((course) => course.governance?.open_revision).length;
  const published = courses.filter((course) => course.is_published).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#2D6A4F] dark:text-[#74c69d]">
            Course Studio
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Manage courses without losing the thread
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            See curriculum health, assessment coverage, publication state and governance drafts from one scannable workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Courses" value={courses.length} icon={BookOpenCheck} />
        <Stat label="Published" value={published} icon={GraduationCap} />
        <Stat label="Assessments" value={allAssessments.length} icon={FileCheck2} />
        <Stat label="Open revisions" value={openRevisions} icon={Sparkles} />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-[#262a3d] dark:bg-[#111525]">
          <p className="text-sm font-extrabold text-slate-950 dark:text-white">
            No manageable courses found
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Courses you own or can administer will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => {
            const assessments = assessmentItems(course);
            const finalAssessments = assessments.filter(
              (item) => item.assessment?.is_final_assessment,
            ).length;
            return (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="rounded-lg border border-slate-200 bg-white p-5 text-left no-underline shadow-sm transition hover:border-[#b7e4c7] hover:bg-[#f7fcf9] dark:border-[#262a3d] dark:bg-[#111525] dark:hover:border-[#40916c] dark:hover:bg-[#52b788]/10"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[0.68rem] font-extrabold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {course.is_published ? "Published" : course.governance_status || "Draft"}
                      </span>
                      {course.current_version_label && (
                        <span className="rounded-md bg-[#eef8f2] px-2 py-1 text-[0.68rem] font-extrabold text-[#2D6A4F] dark:bg-[#52b788]/12 dark:text-[#74c69d]">
                          v{course.current_version_label}
                        </span>
                      )}
                      {course.governance?.open_revision?.status && (
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-[0.68rem] font-extrabold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          {course.governance.open_revision.status.replaceAll("_", " ")}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 truncate text-lg font-extrabold text-slate-950 dark:text-white">
                      {course.title || "Untitled course"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      <span>{course.sections?.length ?? 0} sections</span>
                      <span>{assessments.length} assessments</span>
                      <span>{finalAssessments} final gates</span>
                      <span>{countByType(assessments, "ESSAY")} essays</span>
                    </div>
                  </div>
                  <div className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white dark:bg-[#52b788] dark:text-[#06130d]">
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CourseDetail({ course }: { course: ManageCourse | null }) {
  if (!course) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center dark:border-[#262a3d] dark:bg-[#111525]">
        <p className="text-sm font-extrabold text-slate-950 dark:text-white">
          Course unavailable
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You may not have access to this course, or it no longer exists.
        </p>
      </div>
    );
  }

  const assessments = assessmentItems(course);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Link
        href="/dashboard/courses"
        className="w-fit text-sm font-bold text-[#2D6A4F] no-underline dark:text-[#74c69d]"
      >
        Back to Course Studio
      </Link>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#2D6A4F] dark:text-[#74c69d]">
              Course workspace
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {course.title || "Untitled course"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {course.sections?.length ?? 0} sections, {assessments.length} assessments, {course.governance?.layer || "auto"} layer
            </p>
          </div>
          {course.governance?.open_revision?.id && (
            <Link
              href={`/dashboard/approval-centre/revisions/${course.governance.open_revision.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white no-underline transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d]"
            >
              Open revision
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-4">
        {(course.sections ?? []).map((section) => (
          <section
            key={section.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]"
          >
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-[#2D6A4F] dark:text-[#74c69d]" />
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                {section.title || "Untitled section"}
              </h2>
            </div>
            <div className="grid gap-3">
              {(section.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-100 p-4 dark:border-[#262a3d]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-extrabold text-slate-950 dark:text-white">
                        {item.title || "Untitled item"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {item.assessment?.assessment_type || item.item_type || "Course item"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.assessment?.is_final_assessment && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-extrabold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          <LockKeyhole className="h-3.5 w-3.5" />
                          Final gate
                        </span>
                      )}
                      {item.assessment?.essay?.requires_moderation && (
                        <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-extrabold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          Moderated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
