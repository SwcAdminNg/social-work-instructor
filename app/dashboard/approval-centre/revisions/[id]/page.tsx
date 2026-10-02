import { ReviewDetail } from "@/components/dashboard/instructor/ReviewDetail";
import type { ApiEnvelope } from "@/components/dashboard/instructor/types";
import { fetchApi } from "@/lib/fetchApi";

export const metadata = {
  title: "Review Revision | Social Work Nigeria",
};

async function readRevision(id: string) {
  try {
    const res = await fetchApi(`/governance/revisions/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<Record<string, unknown>>;
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function RevisionReviewPage(
  props: PageProps<"/dashboard/approval-centre/revisions/[id]">,
) {
  const { id } = await props.params;
  const detail = await readRevision(id);

  return (
    <ReviewDetail
      typeLabel="Course revision"
      title={
        typeof detail?.title === "string"
          ? detail.title
          : typeof detail?.item_title === "string"
            ? detail.item_title
            : "Course revision"
      }
      subtitle="Review the proposed course change, timeline, conditions and available decisions."
      detail={detail}
    />
  );
}
