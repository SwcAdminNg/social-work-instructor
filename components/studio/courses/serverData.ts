// Server-only helpers for the dashboard home and My courses pages.
// They never throw: a failed call yields null / an empty list so the page
// still renders (the client re-fetches with react-query).
import { fetchApi } from "@/lib/fetchApi";
import type { UserAccess } from "@/components/dashboard/instructor/types";
import type { ApprovalRow, ApprovalView, PaginatedMeta } from "@/lib/studio/types";

type Envelope<T> = { success?: boolean; data?: T; meta?: PaginatedMeta };

export type MeProfile = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  profile_picture_url?: string | null;
  access?: UserAccess | null;
};

export async function readApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetchApi(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => ({}))) as Envelope<T>;
    if (json.success === false) return null;
    return (json.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function readPage<T>(endpoint: string): Promise<{ items: T[]; meta?: PaginatedMeta } | null> {
  try {
    const res = await fetchApi(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => ({}))) as Envelope<T[]>;
    if (json.success === false) return null;
    return { items: Array.isArray(json.data) ? json.data : [], meta: json.meta };
  } catch {
    return null;
  }
}

export function readMe() {
  return readApi<MeProfile>("/users/me");
}

export async function readApprovalRows(view: ApprovalView, pageSize = 50, kind?: "COURSE_REVISION" | "ESSAY_MARK") {
  const params = new URLSearchParams({ view, page: "1", page_size: String(pageSize) });
  if (kind) params.set("kind", kind);
  const page = await readPage<ApprovalRow>(`/governance/approval-centre?${params}`);
  return page ? page.items : null;
}
