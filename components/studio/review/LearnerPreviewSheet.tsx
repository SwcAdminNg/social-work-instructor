"use client";

// Shows the course as a learner sees it. With a revisionId it renders
// GET /governance/revisions/{id}/preview (learner format, no answers); without
// one (governance off) it renders the given course's sections, hiding answers.
import { EyeOff, RefreshCw } from "lucide-react";
import { Badge, Button } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/overlays";
import type { ManagedCourse } from "@/lib/studio/types";
import { CoursePreview, type PreviewSection } from "./CoursePreview";
import { useRevisionPreview } from "./hooks";
import { errorMessage } from "./utils";

export function LearnerPreviewSheet({
  open,
  onOpenChange,
  revisionId,
  course,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionId?: string | null;
  course?: ManagedCourse | null;
}) {
  const preview = useRevisionPreview(revisionId, open);
  const sections: PreviewSection[] | undefined = revisionId ? preview.data : (course?.sections as PreviewSection[] | undefined);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      width="max-w-5xl"
      title="Learner preview"
      description={
        revisionId
          ? "Exactly what learners will see once these changes are published."
          : "What learners see on the course page."
      }
      headerExtra={
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="xs" tone="neutral" icon={EyeOff}>
            Correct answers hidden
          </Badge>
          {revisionId && (
            <Button size="xs" variant="ghost" icon={RefreshCw} onClick={() => preview.refetch()} loading={preview.isFetching && !preview.isPending}>
              Refresh
            </Button>
          )}
        </div>
      }
    >
      {open && (
        <CoursePreview
          course={course}
          sections={sections}
          loading={!!revisionId && preview.isPending}
          error={revisionId && preview.isError ? errorMessage(preview.error) : null}
          onRetry={() => preview.refetch()}
        />
      )}
    </Sheet>
  );
}
