export type ApiMeta = {
  page?: number;
  page_size?: number;
  total_items?: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: ApiMeta;
};

export type StaffPermissions = {
  governance_enabled?: boolean;
  roles?: {
    role?: string;
    course_id?: string | null;
    implicit?: boolean;
    assignment_id?: string;
  }[];
  permissions?: string[];
};

export type AccessCapabilities = {
  can_create_courses?: boolean;
  can_edit_content?: boolean;
  can_submit_for_review?: boolean;
  can_review_content?: boolean;
  can_publish?: boolean;
  can_archive?: boolean;
  can_mark_essays?: boolean;
  can_moderate_marks?: boolean;
  can_approve_results?: boolean;
  can_force_approve?: boolean;
  can_manage_staff_roles?: boolean;
  can_view_audit_log?: boolean;
  can_access_approval_centre?: boolean;
};

export type UserAccess = StaffPermissions & {
  owned_course_count?: number;
  owned_course_permissions?: string[];
  course_access?: {
    course_id?: string;
    course_title?: string;
    roles?: string[];
    permissions?: string[];
  }[];
  capabilities?: AccessCapabilities;
};

export type DashboardUserProfile = {
  profile_picture_url?: string | null;
  user_type?: string;
  access?: UserAccess | null;
};

export type ApprovalCounts = {
  awaiting_me?: number;
  returned_to_me?: number;
  overdue?: number;
  ready_to_publish?: number;
};

export type ApprovalRow = {
  id: string;
  kind?: "COURSE_REVISION" | "ESSAY_MARK" | string;
  item_title?: string;
  item_type?: string;
  course_id?: string;
  course_title?: string;
  submitted_by?: { id?: string; name?: string };
  current_stage?: string;
  status?: string;
  reviewer?: { id?: string; name?: string };
  due_at?: string;
  is_overdue?: boolean;
  risk?: string;
  version_label?: string;
  available_actions?: string[];
  decision?: string;
};

export type AdminOverview = {
  users?: {
    total_users?: number;
    students?: number;
    instructors?: number;
    admins?: number;
    suspended?: number;
    new_last_7_days?: number;
    new_last_30_days?: number;
  };
  revenue?: {
    total_all_time?: number;
    last_30_days?: number;
    last_7_days?: number;
    active_subscriptions?: number;
  };
  courses?: { total?: number; published?: number; draft?: number };
  top_enrolled_courses?: {
    course_id?: string;
    title?: string;
    slug?: string;
    thumbnail_url?: string;
    enrollment_count?: number;
  }[];
  support?: {
    open?: number;
    in_progress?: number;
    resolved?: number;
    closed?: number;
    unassigned_open?: number;
  };
  reviews?: {
    platform_average_rating?: number;
    total_reviews?: number;
    pending_reply?: number;
  };
  contact_messages?: { total?: number; recent_7_days?: number };
  active_coupons?: number;
  certificates_issued_total?: number;
  certificates_issued_last_30_days?: number;
  recent_signups?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    user_type?: string;
    created_at?: string;
  }[];
  recent_transactions?: {
    id?: string;
    reference?: string;
    amount?: number;
    status?: string;
    transaction_type?: string;
    user_id?: string;
    user_name?: string;
    created_at?: string;
  }[];
};

export type ManageCourse = {
  id: string;
  title?: string;
  slug?: string;
  thumbnail_url?: string;
  is_published?: boolean;
  governance_status?: string;
  current_version_label?: string;
  sections?: CourseSection[];
  governance?: {
    governance_enabled?: boolean;
    lifecycle?: string;
    layer?: string;
    current_version_label?: string;
    open_revision?: {
      id?: string;
      kind?: string;
      status?: string;
      round?: number;
      is_editable?: boolean;
    };
  };
};

export type CourseSection = {
  id: string;
  title?: string;
  order_index?: number;
  items?: CourseItem[];
};

export type CourseItem = {
  id: string;
  title?: string;
  item_type?: string;
  order_index?: number;
  is_preview?: boolean;
  assessment?: {
    id?: string;
    assessment_type?: "QUIZ" | "ESSAY" | "QUIZ_GROUP" | string;
    due_date?: string | null;
    is_final_assessment?: boolean;
    quiz?: {
      max_attempts?: number | null;
      pass_mark_percentage?: number;
      show_result_to_student?: boolean;
      questions?: unknown[];
    };
    essay?: {
      question?: string;
      description?: string;
      submission_mode?: string;
      pass_mark_percentage?: number;
      max_attempts?: number | null;
      requires_moderation?: boolean;
    };
    quiz_group?: {
      max_attempts?: number | null;
      pass_mark_percentage?: number;
      show_result_to_student?: boolean;
      time_limit_seconds?: number | null;
      sections?: { id?: string; title?: string; questions?: unknown[]; questions_to_ask?: number | null }[];
    };
  };
};
