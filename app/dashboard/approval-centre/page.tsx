import { ApprovalCentre } from "@/components/dashboard/instructor/ApprovalCentre";
import type {
  ApiEnvelope,
  ApprovalCounts,
  ApprovalRow,
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
  const [counts, rows] = await Promise.all([
    readApi<ApprovalCounts>("/governance/approval-centre/counts"),
    readApi<ApprovalRow[]>(
      "/governance/approval-centre?view=awaiting_me&page=1&page_size=30",
    ),
  ]);

  return (
    <ApprovalCentre initialCounts={counts} initialRows={rows ?? []} />
  );
}
