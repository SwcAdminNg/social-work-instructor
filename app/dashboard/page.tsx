import { DashboardHome } from "@/components/studio/home/DashboardHome";
import type { HomeData } from "@/components/studio/home/types";
import { readApi, readApprovalRows, readMe, readPage } from "@/components/studio/courses/serverData";
import { courseLifecycle, revisionMapFromRows } from "@/components/studio/courses/courseStatus";
import type { AdminOverview } from "@/components/dashboard/instructor/types";
import type { ApprovalCounts, CourseGovernance, ManagedCourse } from "@/lib/studio/types";

export const metadata = {
  title: "Dashboard | Social Work Nigeria",
};

/** How many recent courses to check individually for an in-review revision. */
const GOVERNANCE_LOOKUPS = 12;

export default async function DashboardPage() {
  const me = await readMe();
  const access = me?.access ?? null;
  const caps = access?.capabilities ?? {};
  const governed = access?.governance_enabled !== false;
  const inbox = governed && !!caps.can_access_approval_centre;
  const reviewer = !!(caps.can_review_content || caps.can_force_approve);

  const [coursesPage, counts, drafts, returned, awaiting, adminOverview] = await Promise.all([
    caps.can_edit_content ? readPage<ManagedCourse>("/courses/manage?page=1&page_size=50") : Promise.resolve(null),
    inbox ? readApi<ApprovalCounts>("/governance/approval-centre/counts") : Promise.resolve(null),
    inbox ? readApprovalRows("my_drafts", 20, "COURSE_REVISION") : Promise.resolve(null),
    inbox ? readApprovalRows("returned_to_me", 20) : Promise.resolve(null),
    inbox && reviewer ? readApprovalRows("awaiting_me", 6) : Promise.resolve(null),
    caps.can_publish || caps.can_manage_staff_roles
      ? readApi<AdminOverview>("/admin/dashboard/overview?limit=5")
      : Promise.resolve(null),
  ]);

  const courses = [...(coursesPage?.items ?? [])].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  const revisions = revisionMapFromRows(drafts ?? [], returned ?? []);

  // The course list doesn't carry the open revision (§5.2). Courses the inbox
  // doesn't mention may still be in review, so check the most recent few.
  if (governed) {
    const unknown = courses
      .filter((c) => !revisions[c.id] && courseLifecycle(c, governed) !== "ARCHIVED")
      .slice(0, GOVERNANCE_LOOKUPS);
    const blocks = await Promise.all(unknown.map((c) => readApi<CourseGovernance>(`/courses/${c.id}/governance`)));
    blocks.forEach((g, i) => {
      const open = g?.open_revision;
      if (open) revisions[unknown[i].id] = { id: open.id, status: open.status, kind: open.kind };
    });
  }

  const data: HomeData = {
    firstName: me?.first_name || me?.username || null,
    courses,
    courseTotal: coursesPage?.meta?.total_items ?? courses.length,
    revisions,
    counts,
    returned: returned ?? [],
    drafts: drafts ?? [],
    awaiting: awaiting ?? [],
    adminOverview,
  };

  return <DashboardHome data={data} />;
}
