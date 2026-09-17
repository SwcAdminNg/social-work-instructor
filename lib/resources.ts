import { fetchApi } from "@/lib/fetchApi";

export const RESOURCE_CATEGORIES = [
  "COURSE_MATERIALS",
  "PRACTICE_RESOURCES",
  "POLICIES_AND_GUIDANCE",
  "TEMPLATES_AND_FORMS",
  "VIDEOS_AND_WEBINARS",
  "RESEARCH_AND_PUBLICATIONS",
  "CAREER_AND_CPD",
  "USEFUL_LINKS",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
export type ResourceAccessReason = "LOGIN_REQUIRED" | "ENROLLMENT_REQUIRED";
export type ResourceVisibility = "PUBLIC" | "LOGGED_IN" | "COURSE_ENROLLED";
export type ResourceAttachmentType = "VIDEO" | "DOCUMENT" | "LINKS";

export type ResourceRead = {
  id: string;
  name: string;
  slug?: string;
  category?: ResourceCategory | string;
  description?: string;
  thumbnail_url?: string;
  visibility?: ResourceVisibility | string;
  course_id?: string;
  owner_id?: string;
  is_published?: boolean;
  can_access?: boolean;
  access_reason?: ResourceAccessReason;
  attachments?: ResourceAttachment[];
};

export type ResourceAttachment = {
  id: string;
  resource_id?: string;
  title?: string;
  attachment_type?: ResourceAttachmentType | string;
  order_index?: number;
  video?: {
    status?: "PENDING" | "PROCESSING" | "READY" | "FAILED" | string;
    playback_url?: string;
    thumbnail_url?: string;
    duration_seconds?: number;
  };
  document?: {
    file_name?: string;
    mime_type?: string;
    file_size_bytes?: number;
    is_uploaded?: boolean;
    downloadable?: boolean;
    file_url?: string;
    content_url?: string;
    url?: string;
    view_url?: string;
    preview_url?: string;
  };
  link?: {
    url?: string;
    label?: string;
    description?: string;
  };
};

export type ResourceMeta = {
  page?: number;
  page_size?: number;
  total_items?: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
};

export type ResourceListResult = {
  items: ResourceRead[];
  meta: ResourceMeta;
  ok: boolean;
  status: number;
};

type ResourceQuery = {
  page?: number;
  pageSize?: number;
  category?: string;
  courseId?: string;
  search?: string;
};

export async function getResources(query: ResourceQuery = {}): Promise<ResourceListResult> {
  const params = new URLSearchParams();
  params.set("page", String(query.page || 1));
  params.set("page_size", String(query.pageSize || 20));
  if (query.category) params.set("category", query.category);
  if (query.courseId) params.set("course_id", query.courseId);
  if (query.search) params.set("search", query.search);

  const res = await fetchApi(`/resources?${params.toString()}`, {
    next: { revalidate: 60 },
  });
  const json = await res.json().catch(() => ({}));

  return {
    items: getResourceItems(json),
    meta: getResourceMeta(json),
    ok: res.ok,
    status: res.status,
  };
}

export async function getCourseResources(
  courseId: string,
  query: Omit<ResourceQuery, "courseId"> = {},
): Promise<ResourceListResult> {
  const params = new URLSearchParams();
  params.set("page", String(query.page || 1));
  params.set("page_size", String(query.pageSize || 20));
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);

  const res = await fetchApi(`/resources/courses/${courseId}?${params.toString()}`, {
    next: { revalidate: 60 },
  });
  const json = await res.json().catch(() => ({}));

  return {
    items: getResourceItems(json),
    meta: getResourceMeta(json),
    ok: res.ok,
    status: res.status,
  };
}

export async function getResource(slug: string) {
  const res = await fetchApi(`/resources/${slug}`, {
    next: { revalidate: 60 },
  });
  const json = await res.json().catch(() => ({}));
  return {
    resource: (json?.data || null) as ResourceRead | null,
    ok: res.ok,
    status: res.status,
  };
}

export function getResourceItems(json: unknown): ResourceRead[] {
  if (!json || typeof json !== "object") return [];

  const payload = json as {
    data?: ResourceRead[] | { items?: ResourceRead[]; resources?: ResourceRead[] };
    items?: ResourceRead[];
    resources?: ResourceRead[];
  };

  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && !Array.isArray(payload.data)) {
    if (Array.isArray(payload.data.items)) return payload.data.items;
    if (Array.isArray(payload.data.resources)) return payload.data.resources;
  }
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.resources)) return payload.resources;

  return [];
}

export function getResourceMeta(json: unknown): ResourceMeta {
  if (!json || typeof json !== "object") return {};

  const payload = json as {
    meta?: ResourceMeta;
    data?: { meta?: ResourceMeta };
  };

  return payload.meta || payload.data?.meta || {};
}

export function formatResourceCategory(category?: string) {
  if (!category) return "Resource";
  return category
    .toLowerCase()
    .split("_")
    .map((word) => (word === "and" ? "&" : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

export function getResourceCta(resource: ResourceRead) {
  if (resource.can_access) return "View resource";
  if (resource.access_reason === "LOGIN_REQUIRED") return "Log in to unlock";
  if (resource.access_reason === "ENROLLMENT_REQUIRED") return "Enroll to unlock";
  return "Locked";
}

export function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}
