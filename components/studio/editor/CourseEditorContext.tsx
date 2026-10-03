"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, studioApi } from "@/lib/studio/api";
import { qk } from "@/lib/studio/queryKeys";
import { isInReview } from "@/lib/studio/labels";
import type { Layer, ManagedCourse, OpenRevisionSummary } from "@/lib/studio/types";
import { useAccess } from "../AccessContext";

type RunOptions = {
  /** Toast shown on success. */
  success?: string;
  /** Re-fetch the manage tree afterwards (default true — §6 says always re-fetch). */
  refresh?: boolean;
  /** Return the error instead of toasting it (for forms that show inline errors). */
  silent?: boolean;
};

type CourseEditorValue = {
  courseId: string;
  course: ManagedCourse | undefined;
  isLoading: boolean;
  error: Error | null;

  layer: Layer;
  setLayer: (layer: Layer) => void;

  governanceEnabled: boolean;
  lifecycle: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  revision: OpenRevisionSummary | null;
  /** A published course with a hidden working copy (learners still see live). */
  hasWorkingCopy: boolean;

  /**
   * Curriculum + academic fields can't be edited. Operational fields (price,
   * access, thumbnail, credits, live-session times) ignore this — they apply
   * live and never need review (§3.5) — but are still blocked while viewing
   * the live layer or archived.
   */
  readOnly: boolean;
  /** Why the editor is read-only, for banners. */
  lockReason: "live-layer" | "in-review" | "archived" | "locked" | null;
  lockMessage: string | null;

  /** Re-fetch the course tree and everything governance-related. */
  refresh: () => Promise<void>;
  /**
   * Run a write. Toasts errors, turns a 409 into a read-only lock and always
   * re-fetches afterwards. Resolves to the result, or undefined on failure.
   */
  run: <T>(fn: () => Promise<T>, opts?: RunOptions) => Promise<T | undefined>;
};

const Ctx = createContext<CourseEditorValue | null>(null);

export function CourseEditorProvider({
  courseId,
  initialCourse,
  initialLayer = "auto",
  children,
}: {
  courseId: string;
  initialCourse?: ManagedCourse | null;
  initialLayer?: Layer;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { governanceEnabled: accessGovernance } = useAccess();
  const [layer, setLayer] = useState<Layer>(initialLayer);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.course(courseId, layer),
    queryFn: () => studioApi.getCourse(courseId, layer),
    initialData: layer === initialLayer && initialCourse ? initialCourse : undefined,
    staleTime: 10_000,
    // Poll while a video is still processing so status flips to READY on its own.
    refetchInterval: (q) => {
      const c = q.state.data as ManagedCourse | undefined;
      const processing = c?.sections?.some((s) =>
        s.items?.some((i) => i.item_type === "VIDEO" && (i.video?.status === "PROCESSING" || i.video?.status === "PENDING") && i.video?.bunny_video_guid),
      );
      return processing ? 15_000 : false;
    },
  });

  const course = query.data;
  const governance = course?.governance;
  const governanceEnabled = governance?.governance_enabled ?? accessGovernance;
  const lifecycle = (governance?.lifecycle ?? course?.governance_status ?? "DRAFT") as CourseEditorValue["lifecycle"];
  const revision = governance?.open_revision ?? null;
  const hasWorkingCopy = lifecycle === "PUBLISHED" && governance?.layer === "draft";

  let lockReason: CourseEditorValue["lockReason"] = null;
  if (lifecycle === "ARCHIVED") lockReason = "archived";
  else if (layer === "live" && lifecycle === "PUBLISHED" && revision) lockReason = "live-layer";
  else if (governanceEnabled && revision && (revision.is_editable === false || isInReview(revision.status))) lockReason = "in-review";
  else if (lockMessage) lockReason = "locked";

  const refresh = useCallback(async () => {
    setLockMessage(null);
    await queryClient.invalidateQueries({ queryKey: qk.all });
  }, [queryClient]);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, opts: RunOptions = {}) => {
      try {
        const result = await fn();
        if (opts.success) toast.success(opts.success);
        if (opts.refresh !== false) await queryClient.invalidateQueries({ queryKey: qk.all });
        return result;
      } catch (err) {
        const e = err instanceof ApiError ? err : new ApiError((err as Error)?.message ?? "Something went wrong", 0);
        if (e.isLocked) {
          setLockMessage(e.message);
          await queryClient.invalidateQueries({ queryKey: qk.all });
        }
        if (opts.silent) throw e;
        toast.error(e.message);
        return undefined;
      }
    },
    [queryClient],
  );

  const value = useMemo<CourseEditorValue>(
    () => ({
      courseId,
      course,
      isLoading: query.isPending,
      error: (query.error as Error) ?? null,
      layer,
      setLayer,
      governanceEnabled,
      lifecycle,
      revision,
      hasWorkingCopy,
      readOnly: lockReason !== null,
      lockReason,
      lockMessage,
      refresh,
      run,
    }),
    [courseId, course, query.isPending, query.error, layer, governanceEnabled, lifecycle, revision, hasWorkingCopy, lockReason, lockMessage, refresh, run],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCourseEditor() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCourseEditor must be used inside <CourseEditorProvider>");
  return ctx;
}
