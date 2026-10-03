import { RevisionReview } from "@/components/studio/approvals/RevisionReview";
import type { ApiEnvelope } from "@/components/dashboard/instructor/types";
import { fetchApi } from "@/lib/fetchApi";
import type { Revision } from "@/lib/studio/types";

export const metadata = {
  title: "Review Revision | Social Work Nigeria",
};

async function readRevision(id: string): Promise<{ revision: Revision | null; error: { status: number; message: string } | null }> {
  try {
    const res = await fetchApi(`/governance/revisions/${id}`, { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<Revision>;
    if (!res.ok || !json.data) {
      return { revision: null, error: { status: res.status, message: json.message ?? "This revision couldn't be loaded." } };
    }
    return { revision: json.data, error: null };
  } catch {
    return { revision: null, error: { status: 0, message: "We couldn't reach the server." } };
  }
}

export default async function RevisionReviewPage(props: PageProps<"/dashboard/approval-centre/revisions/[id]">) {
  const { id } = await props.params;
  const { revision, error } = await readRevision(id);
  return <RevisionReview id={id} initialRevision={revision} initialError={error} />;
}
