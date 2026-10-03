import { ApprovalCentre, type ApprovalCentreInit } from "@/components/studio/approvals/ApprovalCentre";
import type { ApiEnvelope, DashboardUserProfile } from "@/components/dashboard/instructor/types";
import { fetchApi } from "@/lib/fetchApi";
import type { ApprovalCounts, ApprovalRow, ApprovalView, PaginatedMeta } from "@/lib/studio/types";

export const metadata = {
  title: "Approval Centre | Social Work Nigeria",
};

const VIEWS: ApprovalView[] = [
  "awaiting_me",
  "overdue",
  "ready_to_publish",
  "returned_to_me",
  "my_drafts",
  "recently_approved",
  "recently_rejected",
];

async function readApi<T>(endpoint: string): Promise<{ data: T | null; meta?: PaginatedMeta }> {
  try {
    const res = await fetchApi(endpoint, { cache: "no-store" });
    if (!res.ok) return { data: null };
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
    return { data: json.data ?? null, meta: json.meta as PaginatedMeta | undefined };
  } catch {
    return { data: null };
  }
}

export default async function ApprovalCentrePage(props: PageProps<"/dashboard/approval-centre">) {
  const searchParams = await props.searchParams;
  const { data: profile } = await readApi<DashboardUserProfile>("/users/me");
  const capabilities = profile?.access?.capabilities;
  const reviewerMode = Boolean(
    capabilities?.can_review_content || capabilities?.can_moderate_marks || capabilities?.can_approve_results || capabilities?.can_publish,
  );
  const canPublish = Boolean(capabilities?.can_publish);

  const requested = typeof searchParams.view === "string" ? (searchParams.view as ApprovalView) : undefined;
  const allowed = VIEWS.filter(
    (v) => (v !== "awaiting_me" && v !== "overdue" && v !== "ready_to_publish") || (v === "ready_to_publish" ? canPublish : reviewerMode),
  );
  const view: ApprovalView = requested && allowed.includes(requested) ? requested : reviewerMode ? "awaiting_me" : "my_drafts";

  const [counts, rows] = await Promise.all([
    readApi<ApprovalCounts>("/governance/approval-centre/counts"),
    readApi<ApprovalRow[]>(`/governance/approval-centre?view=${view}&page=1&page_size=30`),
  ]);

  const init: ApprovalCentreInit = {
    view,
    reviewerMode,
    canPublish,
    counts: counts.data ?? null,
    rows: rows.data ?? null,
    meta: rows.meta,
  };

  return <ApprovalCentre init={init} />;
}
