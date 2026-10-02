import { ReviewDetail } from "@/components/dashboard/instructor/ReviewDetail";
import type { ApiEnvelope } from "@/components/dashboard/instructor/types";
import { fetchApi } from "@/lib/fetchApi";

export const metadata = {
  title: "Review Essay Mark | Social Work Nigeria",
};

async function readMark(id: string) {
  try {
    const res = await fetchApi(`/essay-marks/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<Record<string, unknown>>;
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function MarkReviewPage(
  props: PageProps<"/dashboard/approval-centre/marks/[id]">,
) {
  const { id } = await props.params;
  const detail = await readMark(id);

  return (
    <ReviewDetail
      typeLabel="Essay mark"
      title={
        typeof detail?.item_title === "string"
          ? detail.item_title
          : typeof detail?.essay_title === "string"
            ? detail.essay_title
            : "Essay mark"
      }
      subtitle="Moderate, approve, dispute or publish essay results according to the current mark status."
      detail={detail}
    />
  );
}
