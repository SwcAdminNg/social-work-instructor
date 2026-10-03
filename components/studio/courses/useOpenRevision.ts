"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studioApi } from "@/lib/studio/api";
import type { OpenRevisionInfo } from "./courseStatus";

/** True once the element has scrolled into (or near) the viewport. */
export function useSeen<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

/**
 * The open revision for a course card. The list endpoint doesn't carry it
 * (§5.2): use the Approval Centre map when it knows the course, otherwise
 * lazily read `GET /courses/{id}/governance` once the card is visible.
 */
export function useOpenRevision(courseId: string, known: OpenRevisionInfo | undefined, enabled: boolean, visible: boolean) {
  const query = useQuery({
    queryKey: ["studio", "course", courseId, "governance"],
    queryFn: () => studioApi.getGovernance(courseId),
    enabled: enabled && visible && !known,
    staleTime: 60_000,
    retry: false,
  });
  if (known) return { revision: known, loading: false };
  const open = query.data?.open_revision;
  return {
    revision: open ? ({ id: open.id, status: open.status, kind: open.kind } as OpenRevisionInfo) : undefined,
    loading: enabled && visible && query.isLoading,
    versionLabel: query.data?.current_version_label,
  };
}
