"use client";

import { useCallback } from "react";
import { useCourseEditor } from "@/components/studio/editor/CourseEditorContext";
import { useSaveTracker } from "./shared";

/**
 * Wraps the editor's `run()` (toasts errors, handles 409 locks, re-fetches the
 * tree) and feeds the tiny saving indicator. Resolves true on success.
 */
export function useAssessmentWrite() {
  const { run } = useCourseEditor();
  const { track } = useSaveTracker();
  return useCallback(
    async (fn: () => Promise<unknown>, opts?: { success?: string }) => {
      const result = await track(
        run(async () => {
          await fn();
          return true as const;
        }, opts),
      );
      return result === true;
    },
    [run, track],
  );
}
