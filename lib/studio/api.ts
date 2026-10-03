// Browser-side client for the authoring + governance API. Every call goes
// through the authenticated `/api/proxy/*` route.
import type {
  AiGeneratePayload,
  AiGenerateResult,
  ApprovalCounts,
  ApprovalRow,
  ApprovalView,
  AssessmentUpdatePayload,
  Course,
  CourseGovernance,
  CoursePayload,
  CoursePermissions,
  CourseVersion,
  DecisionPayload,
  EssayMark,
  EssaySubmission,
  ItemCreatePayload,
  ItemCreateResult,
  ItemUpdatePayload,
  Layer,
  ManagedCourse,
  OpenRevisionSummary,
  Paginated,
  PaginatedMeta,
  QuestionPayload,
  QuizGroupSection,
  QuizOption,
  QuizQuestion,
  Revision,
  RevisionComment,
  RevisionDiff,
  RevisionEvidence,
  Risk,
  Section,
  SubmitPayload,
  VideoUploadCredentials,
  AnchorType,
} from "./types";

export type FieldError = { loc?: (string | number)[]; msg?: string };

export class ApiError extends Error {
  status: number;
  errors: FieldError[];
  /** Set for requests that never got a response: "aborted" or "timeout". */
  code?: string;

  constructor(message: string, status: number, errors: FieldError[] = [], code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }

  /** The course is locked: under review (withdraw first) or archived. */
  get isLocked() {
    return this.status === 409;
  }

  /** First validation message for a field name, if any. */
  fieldError(field: string) {
    return this.errors.find((e) => e.loc?.includes(field))?.msg;
  }
}

type Envelope<T> = { success?: boolean; message?: string; data?: T; meta?: PaginatedMeta; errors?: FieldError[] };

function errorMessage(json: Envelope<unknown>, status: number) {
  if (json.message && json.message !== "Validation error") return json.message;
  const first = json.errors?.[0];
  if (first?.msg) {
    const field = first.loc?.filter((p) => p !== "body").join(" › ");
    return field ? `${field}: ${first.msg}` : first.msg;
  }
  if (json.message) return json.message;
  return status === 401 ? "Your session has expired. Please sign in again." : "Something went wrong. Please try again.";
}

type RequestOptions = {
  /** Cancels the request (e.g. a "Cancel" button). */
  signal?: AbortSignal;
  /** Client-side timeout in ms; rejects with status 0 / "timeout". */
  timeoutMs?: number;
};

/** status 0 + code: the request never got an HTTP answer. */
export const ABORTED = "aborted";
export const TIMED_OUT = "timeout";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<{ data: T; meta?: PaginatedMeta; message?: string }> {
  const isForm = body instanceof FormData;
  const controller = new AbortController();
  let timedOut = false;
  const timer = opts.timeoutMs
    ? setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, opts.timeoutMs)
    : undefined;
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onAbort);

  let res: Response;
  try {
    res = await fetch(`/api/proxy${path}`, {
      method,
      headers: body !== undefined && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (timedOut) throw new ApiError("The request took too long and was stopped.", 0, [], TIMED_OUT);
    if (controller.signal.aborted) throw new ApiError("Cancelled.", 0, [], ABORTED);
    throw new ApiError((err as Error)?.message || "Network error. Check your connection.", 0);
  } finally {
    if (timer) clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || json.success === false) {
    throw new ApiError(errorMessage(json, res.status), res.status, json.errors ?? []);
  }
  return { data: json.data as T, meta: json.meta, message: json.message };
}

const get = <T>(path: string) => request<T>("GET", path).then((r) => r.data);
const post = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>("POST", path, body ?? {}, opts).then((r) => r.data);
const patch = <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}).then((r) => r.data);
const del = <T = unknown>(path: string) => request<T>("DELETE", path).then((r) => r.data);

function qs(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

async function list<T>(path: string): Promise<Paginated<T>> {
  const r = await request<T[]>("GET", path);
  return { items: Array.isArray(r.data) ? r.data : [], meta: r.meta };
}

/** PUT raw bytes to a signed storage URL (thumbnails, documents, evidence). */
export async function uploadToSignedUrl(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(file);
  });
}

/** Client timeout for AI drafting calls (server gives the provider 60s). */
export const AI_TIMEOUT_MS = 120_000;

/** Largest document the AI endpoints accept (§5.2). */
export const AI_MAX_FILE_BYTES = 10 * 1024 * 1024;

function aiForm(payload: AiGeneratePayload & { file: File }) {
  const form = new FormData();
  // The document endpoints take no prompt field; only these form fields (§5.2).
  form.set("file", payload.file);
  if (payload.question_count) form.set("question_count", String(payload.question_count));
  if (payload.options_per_question) form.set("options_per_question", String(payload.options_per_question));
  form.set("persist", String(payload.persist ?? true));
  if (payload.provider) form.set("provider", payload.provider);
  if (payload.model?.trim()) form.set("model", payload.model.trim());
  return form;
}

export const studioApi = {
  /* Courses (§5) */
  listCourses: (params: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    level?: string;
    is_published?: boolean;
  } = {}) => list<ManagedCourse>(`/courses/manage${qs({ page: 1, page_size: 50, ...params })}`),
  getCourse: (id: string, layer: Layer = "auto") => get<ManagedCourse>(`/courses/manage/${id}${qs({ layer })}`),
  createCourse: (payload: CoursePayload) => post<Course>("/courses", payload),
  updateCourse: (id: string, payload: CoursePayload) => patch<Course>(`/courses/${id}`, payload),
  deleteCourse: (id: string) => del(`/courses/${id}`),
  thumbnailUploadUrl: (courseId: string, file: File) =>
    post<{ upload_url: string; thumbnail_url: string }>(`/courses/manage/${courseId}/thumbnail-upload-url`, {
      file_name: file.name,
      content_type: file.type || "image/png",
    }),
  /** Legacy publish toggle — used only when governance is switched off (§14). */
  setPublished: (id: string, isPublished: boolean) =>
    patch<Course>(`/courses/${id}/publish${qs({ is_published: isPublished })}`),

  /* Sections (§6.1) */
  createSection: (courseId: string, payload: { title: string; order_index?: number; guest_instructors?: string[] }) =>
    post<Section>(`/courses/${courseId}/sections`, payload),
  updateSection: (
    courseId: string,
    sectionId: string,
    payload: { title?: string; order_index?: number; guest_instructors?: string[] },
  ) => patch<Section>(`/courses/${courseId}/sections/${sectionId}`, payload),
  deleteSection: (courseId: string, sectionId: string) => del(`/courses/${courseId}/sections/${sectionId}`),
  reorderSections: (courseId: string, sections: { id: string; order_index: number }[]) =>
    patch(`/courses/${courseId}/sections/reorder`, { sections }),

  /* Items (§6.2–6.4) */
  createItem: (courseId: string, sectionId: string, payload: ItemCreatePayload) =>
    post<ItemCreateResult>(`/courses/${courseId}/sections/${sectionId}/items`, payload),
  updateItem: (itemId: string, payload: ItemUpdatePayload) => patch(`/courses/items/${itemId}`, payload),
  deleteItem: (itemId: string) => del(`/courses/items/${itemId}`),
  reorderItems: (courseId: string, sectionId: string, items: { id: string; order_index: number }[]) =>
    patch(`/courses/${courseId}/sections/${sectionId}/items/reorder`, { items }),
  refreshVideoUpload: (itemId: string) => post<VideoUploadCredentials>(`/courses/items/${itemId}/video/refresh-upload`),
  finalizeDocument: (itemId: string, payload: { mime_type?: string; file_size_bytes?: number }) =>
    post(`/courses/items/${itemId}/document/finalize`, payload),
  updateAssessment: (itemId: string, payload: AssessmentUpdatePayload) =>
    patch(`/courses/items/${itemId}/assessment`, payload),

  /* Quiz (§6.5) */
  createQuestion: (itemId: string, payload: QuestionPayload) =>
    post<QuizQuestion>(`/courses/items/${itemId}/quiz/questions`, payload),
  updateQuestion: (
    questionId: string,
    payload: Partial<Pick<QuestionPayload, "text" | "order_index" | "allow_multiple_answers" | "multi_answer_mode">>,
  ) => patch(`/courses/quiz/questions/${questionId}`, payload),
  deleteQuestion: (questionId: string) => del(`/courses/quiz/questions/${questionId}`),
  createOption: (questionId: string, payload: { text: string; is_correct?: boolean; order_index?: number }) =>
    post<QuizOption>(`/courses/quiz/questions/${questionId}/options`, payload),
  updateOption: (optionId: string, payload: { text?: string; is_correct?: boolean; order_index?: number }) =>
    patch(`/courses/quiz/options/${optionId}`, payload),
  deleteOption: (optionId: string) => del(`/courses/quiz/options/${optionId}`),
  // AI drafting (AI_ASSESSMENT_AUTHORING_API.md). The server allows the provider
  // 60s, so these get a longer client timeout (§10) and accept a cancel signal.
  aiGenerate: (itemId: string, payload: AiGeneratePayload, opts?: RequestOptions) =>
    post<AiGenerateResult>(`/courses/items/${itemId}/quiz/ai-generate`, payload, { timeoutMs: AI_TIMEOUT_MS, ...opts }),
  aiAutocomplete: (itemId: string, payload: AiGeneratePayload & { file: File }, opts?: RequestOptions) =>
    post<AiGenerateResult>(`/courses/items/${itemId}/quiz/ai-autocomplete`, aiForm(payload), { timeoutMs: AI_TIMEOUT_MS, ...opts }),

  /* Quiz groups (§6.6) */
  createGroupSection: (itemId: string, payload: { title: string; order_index?: number; questions_to_ask?: number | null }) =>
    post<QuizGroupSection>(`/courses/items/${itemId}/quiz-group/sections`, payload),
  updateGroupSection: (
    sectionId: string,
    payload: { title?: string; order_index?: number; questions_to_ask?: number | null },
  ) => patch(`/courses/quiz-group/sections/${sectionId}`, payload),
  deleteGroupSection: (sectionId: string) => del(`/courses/quiz-group/sections/${sectionId}`),
  createGroupQuestion: (sectionId: string, payload: QuestionPayload) =>
    post<QuizQuestion>(`/courses/quiz-group/sections/${sectionId}/questions`, payload),
  groupAiGenerate: (sectionId: string, payload: AiGeneratePayload, opts?: RequestOptions) =>
    post<AiGenerateResult>(`/courses/quiz-group/sections/${sectionId}/ai-generate`, payload, { timeoutMs: AI_TIMEOUT_MS, ...opts }),
  groupAiAutocomplete: (sectionId: string, payload: AiGeneratePayload & { file: File }, opts?: RequestOptions) =>
    post<AiGenerateResult>(`/courses/quiz-group/sections/${sectionId}/ai-autocomplete`, aiForm(payload), {
      timeoutMs: AI_TIMEOUT_MS,
      ...opts,
    }),

  /* Governance — author (§7) */
  getGovernance: (courseId: string) => get<CourseGovernance>(`/courses/${courseId}/governance`),
  openRevision: (courseId: string) => post<OpenRevisionSummary>(`/courses/${courseId}/revisions`),
  listRevisions: (courseId: string) => get<OpenRevisionSummary[]>(`/courses/${courseId}/revisions`),
  getRevision: (id: string) => get<Revision>(`/governance/revisions/${id}`),
  getDiff: (id: string) => get<RevisionDiff>(`/governance/revisions/${id}/diff`),
  getPreview: (id: string) => get<{ sections?: unknown[] } & Record<string, unknown>>(`/governance/revisions/${id}/preview`),
  getTree: (id: string) => get<ManagedCourse | { sections?: ManagedCourse["sections"] }>(`/governance/revisions/${id}/tree`),
  submit: (id: string, payload: SubmitPayload) => post<Revision>(`/governance/revisions/${id}/submit`, payload),
  withdraw: (id: string) => post<Revision>(`/governance/revisions/${id}/withdraw`),
  discard: (id: string) => post<Revision>(`/governance/revisions/${id}/discard`),
  listComments: (id: string) => get<RevisionComment[]>(`/governance/revisions/${id}/comments`),
  addComment: (
    id: string,
    payload: { body: string; parent_id?: string; anchor_type?: AnchorType; anchor_id?: string },
  ) => post<RevisionComment>(`/governance/revisions/${id}/comments`, payload),
  resolveComment: (commentId: string) => patch<RevisionComment>(`/governance/comments/${commentId}/resolve`),
  listEvidence: (id: string) => get<RevisionEvidence[]>(`/governance/revisions/${id}/evidence`),
  evidenceUploadUrl: (id: string, payload: { title: string; file_name: string; content_type?: string }) =>
    post<{ evidence_id: string; upload_url: string; storage_key: string }>(
      `/governance/revisions/${id}/evidence/upload-url`,
      payload,
    ),
  finalizeEvidence: (evidenceId: string, payload: { mime_type?: string; file_size_bytes?: number }) =>
    post(`/governance/evidence/${evidenceId}/finalize`, payload),
  addEvidenceLink: (id: string, payload: { title: string; url: string }) =>
    post<RevisionEvidence>(`/governance/revisions/${id}/evidence/link`, payload),

  /* Governance — reviewers (§8) */
  myPermissions: (courseId?: string) => get<CoursePermissions>(`/governance/me/permissions${qs({ course_id: courseId })}`),
  approvalCentre: (params: { view: ApprovalView; kind?: string; course_id?: string; page?: number; page_size?: number }) =>
    list<ApprovalRow>(`/governance/approval-centre${qs({ page: 1, page_size: 30, ...params })}`),
  approvalCounts: () => get<ApprovalCounts>("/governance/approval-centre/counts"),
  claim: (id: string) => post<Revision>(`/governance/revisions/${id}/claim`),
  assign: (id: string, payload: { reviewer_id: string; due_at?: string }) =>
    post<Revision>(`/governance/revisions/${id}/assign`, payload),
  decide: (id: string, payload: DecisionPayload) => post<Revision>(`/governance/revisions/${id}/decision`, payload),
  forceApprove: (id: string, justification: string) =>
    post<Revision>(`/governance/revisions/${id}/force-approve`, { justification }),
  rerateRisk: (id: string, payload: { level: Risk; reason: string }) =>
    post<Revision>(`/governance/revisions/${id}/risk`, payload),
  publish: (id: string) => post<Revision>(`/governance/revisions/${id}/publish`),

  /* Versions & lifecycle (§10) */
  listVersions: (courseId: string) => get<CourseVersion[]>(`/courses/${courseId}/versions`),
  getVersion: (courseId: string, versionId: string) =>
    get<CourseVersion & { snapshot?: unknown }>(`/courses/${courseId}/versions/${versionId}`),
  rollback: (courseId: string, versionId: string, reason?: string) =>
    post<Revision>(`/courses/${courseId}/versions/${versionId}/rollback`, { reason }),
  archive: (courseId: string, reason?: string) => post(`/courses/${courseId}/archive`, { reason }),
  reinstate: (courseId: string, reason?: string) => post<Revision>(`/courses/${courseId}/reinstate`, { reason }),

  /* Essay marking (§11) */
  listEssaySubmissions: (itemId: string, page = 1) =>
    list<EssaySubmission>(`/courses/items/${itemId}/essay/submissions${qs({ page, page_size: 50 })}`),
  gradeEssay: (
    itemId: string,
    userId: string,
    payload: { score: number; feedback?: string; recommendation?: "PASS" | "FAIL"; submit_for_moderation?: boolean; is_published?: boolean },
  ) => post<EssayMark>(`/courses/items/${itemId}/essay/submissions/${userId}/grade`, payload),
  getMark: (markId: string) => get<EssayMark>(`/essay-marks/${markId}`),
  submitMark: (markId: string) => post<EssayMark>(`/essay-marks/${markId}/submit`),
  moderateMark: (
    markId: string,
    payload: { action: "APPROVE" | "AMEND" | "RETURN"; score?: number; feedback?: string; note?: string },
  ) => post<EssayMark>(`/essay-marks/${markId}/moderate`, payload),
  disputeMark: (markId: string, note: string) => post<EssayMark>(`/essay-marks/${markId}/dispute`, { note }),
  approveMark: (markId: string, payload: { note?: string } = {}) => post<EssayMark>(`/essay-marks/${markId}/approve`, payload),
  publishMarks: (itemId: string, payload: { mark_ids?: string[]; all_approved?: boolean }) =>
    post(`/courses/items/${itemId}/essay-marks/publish`, payload),
  listItemMarks: (itemId: string) => get<EssayMark[]>(`/courses/items/${itemId}/essay-marks`),
};

