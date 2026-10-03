"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, studioApi } from "@/lib/studio/api";
import { qk } from "@/lib/studio/queryKeys";
import type { Revision } from "@/lib/studio/types";
import { asSections } from "./utils";

export function useRevision(id?: string | null, opts: { initialData?: Revision | null; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.revision(id ?? "none"),
    queryFn: () => studioApi.getRevision(id!),
    enabled: !!id && opts.enabled !== false,
    initialData: opts.initialData ?? undefined,
    staleTime: 5_000,
    retry: (count, err) => count < 2 && !(err instanceof ApiError && (err.status === 403 || err.status === 404)),
  });
}

export function useRevisionDiff(id?: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.diff(id ?? "none"),
    queryFn: () => studioApi.getDiff(id!),
    enabled: !!id && enabled,
    staleTime: 10_000,
  });
}

export function useRevisionPreview(id?: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.preview(id ?? "none"),
    queryFn: async () => asSections(await studioApi.getPreview(id!)),
    enabled: !!id && enabled,
    staleTime: 30_000,
  });
}

export function useRevisionTree(id?: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.tree(id ?? "none"),
    queryFn: async () => asSections(await studioApi.getTree(id!)),
    enabled: !!id && enabled,
    staleTime: 30_000,
  });
}

export function useCoursePermissions(courseId?: string | null, enabled = true) {
  return useQuery({
    queryKey: qk.permissions(courseId ?? undefined),
    queryFn: () => studioApi.myPermissions(courseId ?? undefined),
    enabled: !!courseId && enabled,
    staleTime: 60_000,
  });
}
