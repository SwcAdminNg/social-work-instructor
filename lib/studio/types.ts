// Types for the course authoring + content governance API
// (api/docs/phase_4/INSTRUCTOR_COURSE_AUTHORING_AND_APPROVAL_API.md).
// The API strips nulls, so every optional field may be missing.

export type PaginatedMeta = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type Paginated<T> = { items: T[]; meta?: PaginatedMeta };

/* ───────────────────────── Enums ───────────────────────── */

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CourseCategory =
  | "DEVELOPMENT"
  | "BUSINESS"
  | "FINANCE_ACCOUNTING"
  | "IT_SOFTWARE"
  | "OFFICE_PRODUCTIVITY"
  | "PERSONAL_DEVELOPMENT"
  | "DESIGN"
  | "MARKETING"
  | "HEALTH_FITNESS"
  | "MUSIC"
  | "TEACHING_ACADEMICS"
  | "PHOTOGRAPHY_VIDEO"
  | "LIFESTYLE"
  | "LANGUAGE";
export type AccessMode = "SELF_PACED" | "SCHEDULED";
export type ItemType = "VIDEO" | "DOCUMENT" | "LINKS" | "LIVE_SESSION" | "ASSESSMENT";
export type AssessmentType = "QUIZ" | "ESSAY" | "QUIZ_GROUP";
export type SubmissionMode = "TEXT" | "DOCUMENT";
export type MultiAnswerMode = "AND" | "OR";
export type VideoStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type LiveSessionStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
export type Lifecycle = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Layer = "auto" | "live" | "draft";
export type AiProvider = "GEMINI" | "OPENAI" | "DEEPSEEK";

export type RevisionKind = "INITIAL" | "CHANGE" | "ROLLBACK" | "REINSTATE";
export type RevisionStatus =
  | "DRAFT"
  | "SUBMITTED_FOR_REVIEW"
  | "ACADEMIC_REVIEW"
  | "ACADEMICALLY_APPROVED"
  | "ASSESSMENT_MODERATION"
  | "QA_REVIEW"
  | "QA_APPROVED"
  | "COURSE_APPROVED"
  | "FINAL_APPROVAL_REQUIRED"
  | "READY_TO_PUBLISH"
  | "RETURNED_FOR_REVISION"
  | "PUBLISHED"
  | "REJECTED"
  | "WITHDRAWN";
export type Stage =
  | "QUICK_APPROVAL"
  | "ACADEMIC_REVIEW"
  | "ASSESSMENT_MODERATION"
  | "QA_REVIEW"
  | "COURSE_LEAD_APPROVAL"
  | "FINAL_APPROVAL";
export type StageStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "APPROVED_WITH_CONDITIONS"
  | "RETURNED"
  | "REJECTED"
  | "SKIPPED"
  | "SUPERSEDED";
export type Decision =
  | "APPROVED"
  | "APPROVED_WITH_MINOR_CHANGES"
  | "RETURNED_FOR_REVISION"
  | "REJECTED"
  | "ESCALATED"
  | "FORCE_APPROVED";
export type Risk = "LOW" | "MEDIUM" | "HIGH";
export type RiskFlag = "SAFEGUARDING" | "LEGAL" | "POLICY" | "CERTIFICATE_RULE" | "CPD_RECOGNITION";
export type RevisionAction =
  | "EDIT"
  | "DISCARD"
  | "SUBMIT"
  | "WITHDRAW"
  | "CLAIM"
  | "APPROVE"
  | "APPROVE_WITH_MINOR_CHANGES"
  | "RETURN_FOR_REVISION"
  | "REJECT"
  | "ESCALATE"
  | "ASSIGN_REVIEWER"
  | "FORCE_APPROVE"
  | "OVERRIDE_RISK"
  | "PUBLISH"
  | "COMMENT"
  | "ATTACH_EVIDENCE";
export type ApprovalView =
  | "awaiting_me"
  | "returned_to_me"
  | "overdue"
  | "ready_to_publish"
  | "recently_approved"
  | "recently_rejected"
  | "my_drafts";

/* ───────────────────────── People ───────────────────────── */

export type PersonRef = { id?: string; name?: string };

export type InstructorCredit = {
  user_id?: string | null;
  name: string;
  profile_picture_url?: string | null;
  is_guest?: boolean;
};

/* ───────────────────────── Course ───────────────────────── */

export type Course = {
  id: string;
  created_at?: string;
  title: string;
  slug?: string;
  description?: string;
  prerequisite?: string | null;
  level?: CourseLevel;
  category?: CourseCategory;
  what_you_will_learn?: string[];
  material_includes?: string[];
  requirements?: string[];
  is_free?: boolean;
  price?: number | null;
  thumbnail_url?: string | null;
  instructor_id?: string;
  is_published?: boolean;
  is_exclusive?: boolean;
  is_featured?: boolean;
  average_rating?: number;
  total_reviews?: number;
  access_mode?: AccessMode;
  access_start_date?: string | null;
  access_end_date?: string | null;
  certificate_enabled?: boolean;
  /** Overall score (average of best scores on every assessment) needed for the certificate. Default 70. */
  certificate_pass_mark_percentage?: number;
  governance_status?: Lifecycle;
  current_version_label?: string;
  instructors?: InstructorCredit[];
  estimated_total_minutes?: number;
  estimated_duration?: string;
};

export type OpenRevisionSummary = {
  id: string;
  course_id?: string;
  course_title?: string;
  kind: RevisionKind;
  status: RevisionStatus;
  round?: number;
  author?: PersonRef;
  created_at?: string;
  is_editable?: boolean;
};

export type CourseGovernance = {
  governance_enabled?: boolean;
  lifecycle?: Lifecycle;
  current_version_label?: string;
  layer?: Layer;
  open_revision?: OpenRevisionSummary | null;
};

export type ManagedCourse = Course & {
  sections?: Section[];
  governance?: CourseGovernance;
};

export type CoursePayload = {
  title?: string;
  description?: string;
  prerequisite?: string | null;
  level?: CourseLevel;
  category?: CourseCategory;
  what_you_will_learn?: string[];
  material_includes?: string[];
  requirements?: string[];
  is_free?: boolean;
  price?: number | null;
  thumbnail_url?: string | null;
  is_exclusive?: boolean;
  instructors?: { user_id?: string | null; name: string }[];
  access_mode?: AccessMode;
  access_start_date?: string | null;
  access_end_date?: string | null;
  certificate_enabled?: boolean;
  /** Overall score (average of best scores on every assessment) needed for the certificate. Default 70. */
  certificate_pass_mark_percentage?: number;
};

/* ───────────────────────── Curriculum ───────────────────────── */

export type Section = {
  id: string;
  course_id?: string;
  title: string;
  order_index: number;
  guest_instructors?: InstructorCredit[];
  items?: Item[];
};

export type QuizOption = { id: string; text: string; order_index: number; is_correct?: boolean };

export type QuizQuestion = {
  id: string;
  text: string;
  order_index: number;
  allow_multiple_answers?: boolean;
  multi_answer_mode?: MultiAnswerMode | null;
  options?: QuizOption[];
};

export type QuizSettings = {
  max_attempts?: number | null;
  pass_mark_percentage?: number;
  show_result_to_student?: boolean;
};

export type EssaySettings = {
  question?: string;
  description?: string;
  submission_mode?: SubmissionMode;
  pass_mark_percentage?: number;
  max_attempts?: number | null;
  requires_moderation?: boolean;
};

export type QuizGroupSettings = QuizSettings & { time_limit_seconds?: number | null };

export type QuizGroupSection = {
  id: string;
  title: string;
  order_index: number;
  questions_to_ask?: number | null;
  questions?: QuizQuestion[];
};

export type Assessment = {
  id?: string;
  assessment_type: AssessmentType;
  due_date?: string | null;
  is_final_assessment?: boolean;
  quiz?: QuizSettings & { questions?: QuizQuestion[] };
  essay?: EssaySettings;
  quiz_group?: QuizGroupSettings & { sections?: QuizGroupSection[] };
};

export type Item = {
  id: string;
  section_id?: string;
  title: string;
  item_type: ItemType;
  order_index: number;
  is_preview?: boolean;
  estimated_minutes?: number | null;
  video?: {
    status?: VideoStatus;
    bunny_video_guid?: string;
    playback_url?: string | null;
    thumbnail_url?: string | null;
    duration_seconds?: number | null;
  } | null;
  document?: {
    file_name?: string;
    storage_key?: string;
    mime_type?: string | null;
    file_size_bytes?: number | null;
    is_uploaded?: boolean;
    downloadable?: boolean;
  } | null;
  link?: { url: string; label?: string | null; description?: string | null } | null;
  live_session?: {
    scheduled_start_at?: string;
    duration_minutes?: number;
    guest_name?: string | null;
    guest_title?: string | null;
    status?: LiveSessionStatus;
  } | null;
  assessment?: Assessment | null;
};

export type VideoUploadCredentials = {
  tus_endpoint: string;
  library_id: string;
  video_id: string;
  authorization_signature: string;
  authorization_expire: number;
};

export type ItemCreateResult = Item & {
  video_upload?: VideoUploadCredentials | null;
  document_upload?: { upload_url: string; storage_key: string } | null;
};

export type ItemCreatePayload = {
  title: string;
  item_type: ItemType;
  order_index?: number;
  is_preview?: boolean;
  estimated_minutes?: number | null;
  // DOCUMENT
  file_name?: string;
  downloadable?: boolean;
  // LINKS
  url?: string;
  label?: string | null;
  description?: string | null;
  // LIVE_SESSION
  scheduled_start_at?: string;
  duration_minutes?: number;
  guest_name?: string | null;
  guest_title?: string | null;
  // ASSESSMENT
  assessment_type?: AssessmentType;
  due_date?: string | null;
  is_final_assessment?: boolean;
  quiz_settings?: QuizSettings;
  essay_settings?: EssaySettings;
  quiz_group_settings?: QuizGroupSettings;
};

export type ItemUpdatePayload = Partial<
  Pick<
    ItemCreatePayload,
    | "title"
    | "order_index"
    | "is_preview"
    | "estimated_minutes"
    | "downloadable"
    | "url"
    | "label"
    | "description"
    | "scheduled_start_at"
    | "duration_minutes"
    | "guest_name"
    | "guest_title"
  >
>;

export type AssessmentUpdatePayload = {
  due_date?: string | null;
  is_final_assessment?: boolean;
  quiz_settings?: QuizSettings;
  essay_settings?: EssaySettings;
  quiz_group_settings?: QuizGroupSettings;
};

export type QuestionPayload = {
  text: string;
  order_index?: number;
  allow_multiple_answers?: boolean;
  multi_answer_mode?: MultiAnswerMode | null;
  options?: { text: string; is_correct?: boolean; order_index?: number }[];
};

export type AiGeneratePayload = {
  prompt?: string;
  question_count?: number;
  options_per_question?: number;
  persist?: boolean;
  provider?: AiProvider;
  model?: string;
};

export type GeneratedQuestion = Omit<QuestionPayload, "options"> & {
  options: { text: string; is_correct?: boolean; order_index?: number }[];
};

export type AiGenerateResult = {
  prompt?: string;
  source_file_name?: string;
  extracted_text_preview?: string;
  provider?: string;
  model?: string;
  persisted?: boolean;
  generated_questions?: GeneratedQuestion[];
  created_questions?: QuizQuestion[];
};

/* ───────────────────────── Governance ───────────────────────── */

export type StageCondition = { text: string; stage?: Stage; by?: string; at?: string };

export type RevisionStage = {
  id?: string;
  round?: number;
  stage: Stage;
  sequence?: number;
  status: StageStatus;
  assigned_reviewer?: PersonRef;
  decided_by?: PersonRef;
  decided_at?: string;
  due_at?: string;
  conditions?: StageCondition[];
  is_overdue?: boolean;
};

export type RevisionDecision = {
  id?: string;
  created_at?: string;
  stage?: Stage;
  round?: number;
  decision: Decision;
  actor?: PersonRef;
  comment?: string;
  conditions?: (string | StageCondition)[];
  from_status?: RevisionStatus;
  to_status?: RevisionStatus;
  version_label?: string;
};

export type Revision = OpenRevisionSummary & {
  current_stage?: Stage;
  computed_risk?: Risk;
  effective_risk?: Risk;
  declared_risk?: Risk;
  risk_flags?: RiskFlag[];
  risk_reasons?: string[];
  touches_assessment?: boolean;
  required_stages?: Stage[];
  proposed_version_label?: string;
  change_summary?: string;
  reason?: string;
  submitted_at?: string;
  published_at?: string;
  published_version_id?: string;
  contributors?: PersonRef[];
  stages?: RevisionStage[];
  decisions?: RevisionDecision[];
  open_conditions?: StageCondition[];
  available_actions?: RevisionAction[];
  blocked_reason?: string | null;
};

export type DiffOp = "ADDED" | "REMOVED" | "MODIFIED" | "MOVED";

export type DiffChange = {
  entity: string;
  key?: string;
  op: DiffOp;
  label: string;
  fields?: string[];
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  item_type?: ItemType;
  risk?: Risk;
};

export type RevisionDiff = {
  revision_id?: string;
  computed_risk?: Risk;
  touches_assessment?: boolean;
  reasons?: string[];
  is_live_computation?: boolean;
  changes?: DiffChange[];
};

export type AnchorType = "course" | "section" | "item" | "question";

export type RevisionComment = {
  id: string;
  created_at?: string;
  revision_id?: string;
  stage_id?: string;
  parent_id?: string | null;
  author?: PersonRef;
  body: string;
  anchor_type?: AnchorType | null;
  anchor_id?: string | null;
  resolved_at?: string | null;
};

export type RevisionEvidence = {
  id: string;
  title?: string;
  file_name?: string;
  url?: string;
  download_url?: string;
  mime_type?: string;
  file_size_bytes?: number;
  created_at?: string;
  uploaded_by?: PersonRef;
  is_uploaded?: boolean;
};

export type SubmitPayload = {
  change_summary: string;
  reason?: string;
  declared_risk?: Risk;
  flags?: RiskFlag[];
};

export type DecisionPayload = {
  decision: Exclude<Decision, "FORCE_APPROVED">;
  comment?: string;
  conditions?: string[];
  escalate_to?: Risk | null;
  flags?: RiskFlag[];
};

export type CourseVersion = {
  id: string;
  course_id?: string;
  label: string;
  major?: number;
  minor?: number;
  revision_id?: string;
  author?: PersonRef;
  reviewers?: PersonRef[];
  approved_at?: string;
  published_at?: string;
  published_by?: PersonRef;
  reason?: string;
  risk_level?: Risk;
  is_current?: boolean;
  has_snapshot?: boolean;
};

export type ApprovalRow = {
  kind: "COURSE_REVISION" | "ESSAY_MARK";
  id: string;
  item_title?: string;
  item_type?: string;
  course_id?: string;
  course_title?: string;
  submitted_by?: PersonRef;
  current_stage?: Stage;
  status?: string;
  reviewer?: PersonRef;
  due_at?: string;
  is_overdue?: boolean;
  risk?: Risk;
  version_label?: string;
  decision?: string;
  available_actions?: string[];
};

export type ApprovalCounts = {
  awaiting_me?: number;
  returned_to_me?: number;
  overdue?: number;
  ready_to_publish?: number;
};

export type CoursePermissions = {
  course_id?: string;
  governance_enabled?: boolean;
  roles?: { role: string; course_id?: string; implicit?: boolean; assignment_id?: string }[];
  permissions?: string[];
};

/* ───────────────────────── Essay marking ───────────────────────── */

export type EssaySubmission = {
  user_id: string;
  user_full_name?: string;
  user_email?: string;
  content_text?: string | null;
  document_file_name?: string | null;
  document_download_url?: string | null;
  submitted_at?: string;
  score?: number | null;
  is_published?: boolean;
  feedback?: string | null;
  result_status?: string | null;
  current_mark_id?: string | null;
  working_score?: number | null;
};

export type EssayMark = {
  id: string;
  item_id?: string;
  item_title?: string;
  course_id?: string;
  course_title?: string;
  user_id?: string;
  student?: PersonRef;
  marker?: PersonRef;
  moderator?: PersonRef;
  approver?: PersonRef;
  status: string;
  score?: number | null;
  feedback?: string | null;
  recommendation?: "PASS" | "FAIL" | null;
  moderated_score?: number | null;
  moderated_feedback?: string | null;
  final_score?: number | null;
  final_feedback?: string | null;
  moderation_note?: string | null;
  dispute_note?: string | null;
  available_actions?: string[];
  history?: Record<string, unknown>[];
  created_at?: string;
  updated_at?: string;
};
