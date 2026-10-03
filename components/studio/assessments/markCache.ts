"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/studio/queryKeys";
import type { EssayMark } from "@/lib/studio/types";

/** Marks for one essay item (local key, still under the "studio" root). */
export const itemMarksKey = (itemId: string) => ["studio", "item-marks", itemId] as const;

function isMark(value: unknown): value is EssayMark {
  return !!value && typeof value === "object" && "id" in value && "status" in value;
}

/**
 * After a marking action: put the returned mark straight into the cache, then
 * refresh the lists that depend on it (submissions, item marks, approval centre).
 */
export function useSyncMark() {
  const queryClient = useQueryClient();
  return useCallback(
    async (result: unknown, itemId?: string | null) => {
      if (isMark(result)) queryClient.setQueryData(qk.mark(result.id), result);
      const tasks: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: ["studio", "approval"] }),
        queryClient.invalidateQueries({ queryKey: qk.approvalCounts() }),
      ];
      if (itemId) {
        tasks.push(queryClient.invalidateQueries({ queryKey: qk.essaySubmissions(itemId) }));
        tasks.push(queryClient.invalidateQueries({ queryKey: itemMarksKey(itemId) }));
      }
      if (!isMark(result)) tasks.push(queryClient.invalidateQueries({ queryKey: ["studio", "mark"] }));
      await Promise.all(tasks);
    },
    [queryClient],
  );
}
