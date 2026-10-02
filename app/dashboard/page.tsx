import { InstructorDashboard } from "@/components/dashboard/instructor/InstructorDashboard";
import type {
  AdminOverview,
  ApiEnvelope,
  ApprovalCounts,
  ApprovalRow,
  DashboardUserProfile,
  ManageCourse,
} from "@/components/dashboard/instructor/types";
import { fetchApi } from "@/lib/fetchApi";

export const metadata = {
  title: "Instructor Dashboard | Social Work Nigeria",
};

async function readApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetchApi(endpoint, { cache: "no-store" });
    if (!res.ok) return null;

    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T> | T;
    if (json && typeof json === "object" && "data" in json) {
      return (json as ApiEnvelope<T>).data ?? null;
    }
    return json as T;
  } catch {
    return null;
  }
}

async function readList<T>(endpoint: string): Promise<T[]> {
  const data = await readApi<T[] | { items?: T[] }>(endpoint);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export default async function DashboardPage() {
  const profile = await readApi<DashboardUserProfile>("/users/me");
  const access = profile?.access ?? null;
  const capabilities = access?.capabilities;

  const [adminOverview, approvalCounts, approvalRows, courses] =
    await Promise.all([
      capabilities?.can_publish || capabilities?.can_manage_staff_roles
        ? readApi<AdminOverview>("/admin/dashboard/overview?limit=5")
        : Promise.resolve(null),
      capabilities?.can_access_approval_centre
        ? readApi<ApprovalCounts>("/governance/approval-centre/counts")
        : Promise.resolve(null),
      capabilities?.can_access_approval_centre
        ? readList<ApprovalRow>(
            "/governance/approval-centre?view=awaiting_me&page=1&page_size=5",
          )
        : Promise.resolve([]),
      capabilities?.can_edit_content || capabilities?.can_mark_essays
        ? readList<ManageCourse>("/courses/manage?page=1&page_size=8")
        : Promise.resolve([]),
    ]);

  return (
    <InstructorDashboard
      adminOverview={adminOverview}
      permissions={access}
      approvalCounts={approvalCounts}
      approvalRows={approvalRows}
      courses={courses}
    />
  );
}
