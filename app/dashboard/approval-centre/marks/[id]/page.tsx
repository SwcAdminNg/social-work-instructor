import { MarkReview } from "@/components/studio/assessments/MarkReview";
import { readApi } from "@/components/studio/assessments/serverData";
import type { EssayMark } from "@/lib/studio/types";

export const metadata = {
  title: "Review Essay Mark | Social Work Nigeria",
};

export default async function MarkReviewPage(props: PageProps<"/dashboard/approval-centre/marks/[id]">) {
  const { id } = await props.params;
  const mark = await readApi<EssayMark>(`/essay-marks/${id}`);
  return <MarkReview markId={id} initialMark={mark.data} />;
}
