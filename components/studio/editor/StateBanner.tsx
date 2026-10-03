"use client";

import { useState } from "react";
import { Archive, Clock3, Eye, Lock, MessageSquareWarning, PencilLine, RefreshCw, Undo2 } from "lucide-react";
import { Button, Callout, Segmented } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/overlays";
import { studioApi } from "@/lib/studio/api";
import { isInReview, revisionStatus } from "@/lib/studio/labels";
import { useCourseEditor } from "./CourseEditorContext";
import { useRevisionDetail } from "./useRevisionDetail";

export function StateBanners({ onGoToReview }: { onGoToReview: () => void }) {
  const { course, governanceEnabled, lifecycle, revision, hasWorkingCopy, layer, setLayer, lockReason, lockMessage, run, refresh } =
    useCourseEditor();
  const detail = useRevisionDetail().data;
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const currentLabel = course?.governance?.current_version_label ?? course?.current_version_label;
  const inReview = governanceEnabled && !!revision && isInReview(revision.status);
  const returned = governanceEnabled && revision?.status === "RETURNED_FOR_REVISION";
  const canWithdraw = !!revision && (detail?.available_actions?.includes("WITHDRAW") ?? false);
  const showLayerToggle = governanceEnabled && lifecycle === "PUBLISHED" && !!revision && (hasWorkingCopy || layer === "live");
  const lastDecision = detail?.decisions?.length ? detail.decisions[detail.decisions.length - 1] : undefined;

  const withdrawButton = canWithdraw ? (
    <Button size="sm" variant="outline" icon={Undo2} onClick={() => setConfirmWithdraw(true)}>
      Withdraw to edit
    </Button>
  ) : null;

  const banners: React.ReactNode[] = [];

  if (lifecycle === "ARCHIVED") {
    banners.push(
      <Callout key="archived" tone="warning" icon={Archive} title="This course is archived">
        Learners can no longer find or enrol in it, and it can&apos;t be edited. An administrator can reinstate it.
      </Callout>,
    );
  }

  if (showLayerToggle) {
    const viewingLive = layer === "live";
    banners.push(
      <Callout
        key="layer"
        tone={viewingLive ? "info" : "brand"}
        icon={viewingLive ? Eye : PencilLine}
        title={
          viewingLive
            ? `You're viewing the live version${currentLabel ? ` (v${currentLabel})` : ""}`
            : `You're editing a draft${detail?.proposed_version_label ? ` (v${detail.proposed_version_label})` : ""}`
        }
        actions={
          <Segmented
            size="sm"
            options={[
              { key: "draft", label: "Draft", icon: PencilLine },
              { key: "live", label: "Live version", icon: Eye },
            ]}
            value={viewingLive ? "live" : "draft"}
            onChange={(k) => setLayer(k)}
          />
        }
      >
        {viewingLive
          ? "This is exactly what learners see today. It's read-only — switch back to your draft to keep editing."
          : `Learners still see ${currentLabel ? `v${currentLabel}` : "the published version"} until your changes are approved.`}
      </Callout>,
    );
  }

  if (inReview && revision) {
    const status = revisionStatus(revision.status);
    banners.push(
      <Callout
        key="review"
        tone="info"
        icon={Clock3}
        title={`${status.label} — editing is paused`}
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={onGoToReview}>
              View progress
            </Button>
            {withdrawButton}
          </>
        }
      >
        Reviewers are looking at your changes.{" "}
        {canWithdraw ? "Need to change something? Withdraw it — reviewers start again when you resubmit." : "You'll be notified when there's a decision."}
      </Callout>,
    );
  } else if (returned) {
    banners.push(
      <Callout
        key="returned"
        tone="warning"
        icon={MessageSquareWarning}
        title={`Changes requested${lastDecision?.actor?.name ? ` by ${lastDecision.actor.name}` : ""}`}
        actions={
          <Button size="sm" variant="outline" onClick={onGoToReview}>
            See feedback
          </Button>
        }
      >
        {lastDecision?.comment ? (
          <span className="line-clamp-2 italic">“{lastDecision.comment}”</span>
        ) : (
          "Make the requested changes, then resubmit for review."
        )}
      </Callout>,
    );
  }

  if (lockReason === "locked" && lockMessage) {
    banners.push(
      <Callout
        key="locked"
        tone="warning"
        icon={Lock}
        title="This course can't be edited right now"
        actions={
          <>
            {withdrawButton}
            <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => refresh()}>
              Reload
            </Button>
          </>
        }
      >
        {lockMessage}
      </Callout>,
    );
  }

  if (!banners.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {banners}
      {revision && (
        <ConfirmDialog
          open={confirmWithdraw}
          onOpenChange={setConfirmWithdraw}
          tone="warning"
          title="Withdraw from review?"
          description="Your changes go back to being a draft you can edit. Any review progress is cleared — reviewers start again from the first stage when you resubmit."
          confirmLabel="Withdraw and edit"
          onConfirm={async () => {
            const ok = await run(() => studioApi.withdraw(revision.id), { success: "Withdrawn — you can edit again", refresh: false });
            if (!ok) throw new Error("failed");
            await refresh();
          }}
        />
      )}
    </div>
  );
}
