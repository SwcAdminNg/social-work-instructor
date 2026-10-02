import { ApprovalCentre } from "@/components/dashboard/instructor/ApprovalCentre";
import type {
  ApiEnvelope,
  ApprovalCounts,
  ApprovalRow,
  DashboardUserProfile,
} from "@/components/dashboard/instructor/types";
import { fetchApi } from "@/lib/fetchApi";

export const metadata = {
  title: "Approval Centre | Social Work Nigeria",
};

async function readApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetchApi(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function ApprovalCentrePage() {
  const profile = await readApi<DashboardUserProfile>("/users/me");
  const capabilities = profile?.access?.capabilities;
  const reviewerMode = Boolean(
    capabilities?.can_review_content ||
      capabilities?.can_moderate_marks ||
      capabilities?.can_approve_results ||
      capabilities?.can_publish,
  );
  const initialView = reviewerMode ? "awaiting_me" : "my_drafts";

  const [counts, rows] = capabilities?.can_access_approval_centre
    ? await Promise.all([
        readApi<ApprovalCounts>("/governance/approval-centre/counts"),
        readApi<ApprovalRow[]>(
          `/governance/approval-centre?view=${initialView}&page=1&page_size=30`,
        ),
      ])
    : [null, [] as ApprovalRow[]];

  return (
    <ApprovalCentre
      initialCounts={counts}
      initialRows={rows ?? []}
      initialView={initialView}
      reviewerMode={reviewerMode}
    />
  );
}
