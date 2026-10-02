import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type {
  AdminOverview,
  ApprovalCounts,
  ApprovalRow,
  ManageCourse,
  StaffPermissions,
} from "./types";

type InstructorDashboardProps = {
  adminOverview?: AdminOverview | null;
  permissions?: StaffPermissions | null;
  approvalCounts?: ApprovalCounts | null;
  approvalRows?: ApprovalRow[];
  courses?: ManageCourse[];
};

function numberLabel(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat("en-NG").format(number);
}

function moneyLabel(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "NGN 0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(number);
}

function dateLabel(value?: string) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatCard({
  label,
  value,
  helper,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "attention" | "success" | "cool";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const toneClass = {
    default: "border-slate-200 bg-white text-[#2D6A4F] dark:border-[#262a3d] dark:bg-[#111525]",
    attention: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    cool: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-extrabold text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-md bg-white/80 shadow-sm dark:bg-white/10">
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
        {helper}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#b7e4c7] px-3 text-sm font-bold text-[#2D6A4F] no-underline transition hover:bg-[#eef8f2] dark:border-[#40916c]/50 dark:text-[#74c69d] dark:hover:bg-[#52b788]/12"
        >
          Open
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function RoleStrip({ permissions }: { permissions?: StaffPermissions | null }) {
  const roles = permissions?.roles?.map((role) => role.role).filter(Boolean) ?? [];
  const uniqueRoles = Array.from(new Set(roles));
  const permissionCount = permissions?.permissions?.length ?? 0;

  return (
    <div className="rounded-lg border border-[#dceee4] bg-[#f7fcf9] p-4 dark:border-[#27433a] dark:bg-[#13231d]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-md bg-white text-[#2D6A4F] shadow-sm dark:bg-[#0d1f18] dark:text-[#74c69d]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-950 dark:text-white">
              {uniqueRoles.length > 0
                ? "Your workspace is tuned to your staff roles"
                : "Instructor workspace"}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {permissions?.governance_enabled
                ? "Content governance is active, so authoring, review, moderation, approval and publishing queues stay separated."
                : "You can manage teaching work here. Governance controls will appear when the backend enables them for your role."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {uniqueRoles.slice(0, 5).map((role) => (
            <span
              key={role}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-extrabold text-[#2D6A4F] shadow-sm dark:bg-[#0d1f18] dark:text-[#74c69d]"
            >
              {role?.replaceAll("_", " ")}
            </span>
          ))}
          {permissionCount > 0 && (
            <span className="rounded-md bg-[#2D6A4F] px-2.5 py-1 text-xs font-extrabold text-white dark:bg-[#52b788] dark:text-[#06130d]">
              {permissionCount} permissions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalPreview({
  counts,
  rows,
}: {
  counts?: ApprovalCounts | null;
  rows: ApprovalRow[];
}) {
  const totalAttention =
    Number(counts?.awaiting_me ?? 0) +
    Number(counts?.returned_to_me ?? 0) +
    Number(counts?.overdue ?? 0) +
    Number(counts?.ready_to_publish ?? 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
      <SectionHeader
        title="Approval Centre"
        description="Course revisions and essay marks that need review, moderation, approval or publishing."
        href="/dashboard/approval-centre"
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Awaiting me"
          value={numberLabel(counts?.awaiting_me)}
          helper="Ready for your decision"
          tone={Number(counts?.awaiting_me) > 0 ? "attention" : "default"}
          icon={Clock3}
        />
        <StatCard
          label="Returned"
          value={numberLabel(counts?.returned_to_me)}
          helper="Needs author follow-up"
          icon={MessageSquareText}
        />
        <StatCard
          label="Overdue"
          value={numberLabel(counts?.overdue)}
          helper="Past the review SLA"
          tone={Number(counts?.overdue) > 0 ? "attention" : "default"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Publish"
          value={numberLabel(counts?.ready_to_publish)}
          helper="Fully approved work"
          tone="success"
          icon={CheckCircle2}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-100 dark:border-[#262a3d]">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {totalAttention > 0 ? "Open the centre to view your queue" : "No approval work waiting"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              New review requests and moderated marks will land here automatically.
            </p>
          </div>
        ) : (
          <ul className="m-0 list-none divide-y divide-slate-100 p-0 dark:divide-[#262a3d]">
            {rows.slice(0, 5).map((row) => (
              <li key={`${row.kind}-${row.id}`} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.68rem] font-extrabold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {row.kind === "ESSAY_MARK" ? "Essay mark" : "Course revision"}
                      </span>
                      {row.risk && (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[0.68rem] font-extrabold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          {row.risk}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate text-sm font-extrabold text-slate-950 dark:text-white">
                      {row.item_title || "Untitled item"}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {row.course_title || row.current_stage || row.status || "Approval item"}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className={row.is_overdue ? "text-rose-600 dark:text-rose-300" : ""}>
                      {dateLabel(row.due_at)}
                    </span>
                    <Link
                      href={
                        row.kind === "ESSAY_MARK"
                          ? `/dashboard/approval-centre/marks/${row.id}`
                          : `/dashboard/approval-centre/revisions/${row.id}`
                      }
                      className="inline-flex h-8 items-center rounded-md bg-[#2D6A4F] px-3 text-xs font-extrabold text-white no-underline transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d]"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CoursePreview({ courses }: { courses: ManageCourse[] }) {
  const assessmentCount = courses.reduce((count, course) => {
    return (
      count +
      (course.sections ?? []).reduce(
        (sectionCount, section) =>
          sectionCount +
          (section.items ?? []).filter((item) => item.assessment).length,
        0,
      )
    );
  }, 0);
  const openRevisionCount = courses.filter(
    (course) => course.governance?.open_revision,
  ).length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
      <SectionHeader
        title="Course Studio"
        description="Manage curriculum, assessments, governance drafts and learner-facing content."
        href="/dashboard/courses"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Courses"
          value={numberLabel(courses.length)}
          helper="Manageable courses"
          icon={BookOpenCheck}
        />
        <StatCard
          label="Assessments"
          value={numberLabel(assessmentCount)}
          helper="Quiz, essay and quiz group items"
          tone="cool"
          icon={FileCheck2}
        />
        <StatCard
          label="Open revisions"
          value={numberLabel(openRevisionCount)}
          helper="Draft or review work"
          tone={openRevisionCount > 0 ? "attention" : "default"}
          icon={Sparkles}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {courses.slice(0, 4).map((course) => {
          const courseAssessmentCount = (course.sections ?? []).reduce(
            (count, section) =>
              count +
              (section.items ?? []).filter((item) => item.assessment).length,
            0,
          );
          return (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="rounded-lg border border-slate-100 p-4 no-underline transition hover:border-[#b7e4c7] hover:bg-[#f7fcf9] dark:border-[#262a3d] dark:hover:border-[#40916c] dark:hover:bg-[#52b788]/10"
            >
              <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white">
                {course.title || "Untitled course"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[0.68rem] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {course.is_published ? "Published" : course.governance_status || "Draft"}
                </span>
                <span className="rounded-md bg-[#eef8f2] px-2 py-1 text-[0.68rem] font-bold text-[#2D6A4F] dark:bg-[#52b788]/12 dark:text-[#74c69d]">
                  {courseAssessmentCount} assessments
                </span>
                {course.governance?.open_revision?.status && (
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-[0.68rem] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {course.governance.open_revision.status.replaceAll("_", " ")}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AdminPanel({ overview }: { overview: AdminOverview }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
      <SectionHeader
        title="Platform Admin"
        description="A separate command view appears when the admin overview endpoint allows it."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={numberLabel(overview.users?.total_users)}
          helper={`${numberLabel(overview.users?.new_last_30_days)} joined in 30 days`}
          icon={UsersRound}
        />
        <StatCard
          label="Revenue"
          value={moneyLabel(overview.revenue?.last_30_days)}
          helper={`${moneyLabel(overview.revenue?.last_7_days)} in the last 7 days`}
          tone="success"
          icon={Landmark}
        />
        <StatCard
          label="Published"
          value={numberLabel(overview.courses?.published)}
          helper={`${numberLabel(overview.courses?.draft)} drafts still in progress`}
          icon={GraduationCap}
        />
        <StatCard
          label="Needs attention"
          value={numberLabel(overview.support?.unassigned_open)}
          helper={`${numberLabel(overview.reviews?.pending_reply)} reviews pending reply`}
          tone={Number(overview.support?.unassigned_open) > 0 ? "attention" : "default"}
          icon={AlertTriangle}
        />
      </div>
    </section>
  );
}

export function InstructorDashboard({
  adminOverview,
  permissions,
  approvalCounts,
  approvalRows = [],
  courses = [],
}: InstructorDashboardProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-extrabold uppercase text-[#2D6A4F] dark:text-[#74c69d]">
          Instructor workspace
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Teaching operations, all in one place
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Build courses, manage assessments, move reviews along, and keep moderation work visible without leaving the dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/courses"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white no-underline transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d]"
            >
              Course Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/approval-centre"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#b7e4c7] px-4 text-sm font-bold text-[#2D6A4F] no-underline transition hover:bg-[#eef8f2] dark:border-[#40916c]/50 dark:text-[#74c69d] dark:hover:bg-[#52b788]/12"
            >
              Approval Centre
            </Link>
          </div>
        </div>
      </div>

      <RoleStrip permissions={permissions} />
      {adminOverview && <AdminPanel overview={adminOverview} />}
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <ApprovalPreview counts={approvalCounts} rows={approvalRows} />
        <CoursePreview courses={courses} />
      </div>
    </div>
  );
}
