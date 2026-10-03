import type { ApprovalView, Layer } from "./types";

// Every studio query key starts with "studio" so a single invalidation can
// refresh the whole workspace after a governance action.
export const qk = {
  all: ["studio"] as const,
  courses: (params?: Record<string, unknown>) => ["studio", "courses", params ?? {}] as const,
  course: (id: string, layer?: Layer) => (layer ? (["studio", "course", id, layer] as const) : (["studio", "course", id] as const)),
  revision: (id: string) => ["studio", "revision", id] as const,
  revisions: (courseId: string) => ["studio", "revisions", courseId] as const,
  diff: (id: string) => ["studio", "diff", id] as const,
  preview: (id: string) => ["studio", "preview", id] as const,
  tree: (id: string) => ["studio", "tree", id] as const,
  comments: (id: string) => ["studio", "comments", id] as const,
  evidence: (id: string) => ["studio", "evidence", id] as const,
  versions: (courseId: string) => ["studio", "versions", courseId] as const,
  permissions: (courseId?: string) => ["studio", "permissions", courseId ?? "global"] as const,
  approval: (view: ApprovalView, kind?: string) => ["studio", "approval", view, kind ?? "ALL"] as const,
  approvalCounts: () => ["studio", "approval-counts"] as const,
  essaySubmissions: (itemId: string) => ["studio", "essay-submissions", itemId] as const,
  mark: (id: string) => ["studio", "mark", id] as const,
};
