// Server-side loaders for the Assessments pages. Import from server components only.
import { fetchApi } from "@/lib/fetchApi";
import type { ManagedCourse } from "@/lib/studio/types";

/** GET an API envelope server-side. Resolves `{ ok, status, data }` and never throws. */
export async function readApi<T>(endpoint: string): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const res = await fetchApi(endpoint, { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T };
    const ok = res.ok && json.success !== false;
    return { ok, status: res.status, data: ok ? (json.data ?? null) : null };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

const isLive = (c: ManagedCourse) => (c.governance_status ?? (c.is_published ? "PUBLISHED" : "DRAFT")) === "PUBLISHED";

/**
 * A course's tree for assessment listing / marking. For a live course we read
 * the live layer: that's what learners submit against, so its item ids are the
 * ones the marking endpoints expect.
 */
export async function readCourseTree(id: string, preferLive: boolean) {
  if (preferLive) {
    const live = await readApi<ManagedCourse>(`/courses/manage/${id}?layer=live`);
    if (live.data) return live.data;
  }
  return (await readApi<ManagedCourse>(`/courses/manage/${id}`)).data;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export const MAX_COURSES = 40;

/** Managed courses with their curriculum (fetched per course when the list omits it). */
export async function readCoursesWithCurriculum() {
  const list = await readApi<ManagedCourse[]>("/courses/manage?page=1&page_size=50");
  if (!list.ok) return { courses: [] as ManagedCourse[], failed: true, skipped: 0 };
  const rows = Array.isArray(list.data) ? list.data : [];
  const targets = rows.slice(0, MAX_COURSES);
  const courses = await mapLimit(targets, 8, async (c) => {
    const live = isLive(c);
    if (c.sections && !live) return c;
    const tree = await readCourseTree(c.id, live);
    return tree ? { ...c, ...tree } : c;
  });
  return { courses, failed: false, skipped: rows.length - targets.length };
}
