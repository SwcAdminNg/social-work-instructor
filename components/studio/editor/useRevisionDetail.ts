"use client";

import { useQuery } from "@tanstack/react-query";
import { studioApi } from "@/lib/studio/api";
import { qk } from "@/lib/studio/queryKeys";
import { useCourseEditor } from "./CourseEditorContext";

/** Full detail of the course's open revision (available actions, decisions…). */
export function useRevisionDetail() {
  const { revision, governanceEnabled } = useCourseEditor();
  const id = revision?.id;
  return useQuery({
    queryKey: qk.revision(id ?? "none"),
    queryFn: () => studioApi.getRevision(id!),
    enabled: governanceEnabled && !!id,
    staleTime: 15_000,
  });
}
