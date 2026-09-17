import { fetchApi } from "@/lib/fetchApi";
import { redirect } from "next/navigation";
import AssessmentsList, {
  type AssessmentDateRange,
  type AssessmentStats,
  type AssessmentTab,
  type UserAssessment,
} from "./AssessmentsList";

type SearchParams = { [key: string]: string | string[] | undefined };

type AssessmentResponse = {
  data?: UserAssessment[];
  meta?: {
    page?: number;
    page_size?: number;
    total_items?: number;
    total_pages?: number;
    has_next?: boolean;
    has_previous?: boolean;
  };
  message?: string;
};

const DEFAULT_STATS: AssessmentStats = {
  upcoming_count: 0,
  completed_count: 0,
  average_score_percentage: null,
  retakes_available_count: 0,
};

const VALID_TABS = new Set<AssessmentTab>([
  "upcoming",
  "submitted",
  "results",
  "completed",
  "retakes",
]);

export default async function AssessmentsContainer({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const page = getPositiveInt(resolvedParams.page, 1);
  const pageSize = getPositiveInt(resolvedParams.rows, 10);
  const requestedTab = getString(resolvedParams.tab)?.toLowerCase();
  const currentTab: AssessmentTab =
    requestedTab && VALID_TABS.has(requestedTab as AssessmentTab)
      ? (requestedTab as AssessmentTab)
      : "completed";
  const assessmentType = normalizeAssessmentType(
    getString(resolvedParams.assessment_type),
  );
  const dateRange = normalizeDateRange(
    getString(resolvedParams.start_date),
    getString(resolvedParams.end_date),
  );

  const listEndpoint = buildAssessmentsEndpoint({
    page,
    pageSize,
    tab: currentTab,
    assessmentType,
    dateRange,
  });

  const [listResult, statsResult, upcomingResult, completedResult] =
    await Promise.allSettled([
      readAssessments(listEndpoint),
      readStats(buildStatsEndpoint(dateRange)),
      readAssessments(
        buildAssessmentsEndpoint({ page: 1, pageSize: 8, tab: "upcoming" }),
      ),
      readAssessments(
        buildAssessmentsEndpoint({ page: 1, pageSize: 8, tab: "completed" }),
      ),
    ]);

  if (
    listResult.status === "fulfilled" &&
    listResult.value.status === 401
  ) {
    redirect("/logout?callbackUrl=/dashboard/assessments");
  }

  const list =
    listResult.status === "fulfilled"
      ? listResult.value
      : {
          data: [],
          totalItems: 0,
          totalPages: 1,
          error: listResult.reason?.message ?? "Failed to load assessments.",
        };

  const stats =
    statsResult.status === "fulfilled" ? statsResult.value : DEFAULT_STATS;
  const upcomingAssessments =
    upcomingResult.status === "fulfilled" ? upcomingResult.value.data : [];
  const completedAssessments =
    completedResult.status === "fulfilled" ? completedResult.value.data : [];

  return (
    <AssessmentsList
      assessments={list.data}
      stats={stats}
      upcomingAssessments={upcomingAssessments}
      completedAssessments={completedAssessments}
      totalItems={list.totalItems}
      totalPages={list.totalPages}
      currentPage={page}
      currentTab={currentTab}
      pageSize={pageSize}
      assessmentType={assessmentType}
      dateRange={dateRange}
      error={list.error}
    />
  );
}

function buildAssessmentsEndpoint({
  page,
  pageSize,
  tab,
  assessmentType,
  dateRange,
}: {
  page: number;
  pageSize: number;
  tab: AssessmentTab;
  assessmentType?: "QUIZ" | "ESSAY" | "QUIZ_GROUP" | null;
  dateRange?: AssessmentDateRange | null;
}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (assessmentType) {
    params.set("assessment_type", assessmentType);
  }

  if (dateRange) {
    params.set("start_date", dateRange.startDate);
    params.set("end_date", dateRange.endDate);
  }

  if (tab === "upcoming") {
    params.set("upcoming", "true");
  }

  if (tab === "submitted") {
    params.set("status", "SUBMITTED");
  }

  if (tab === "results" || tab === "completed") {
    params.set("completed", "true");
  }

  if (tab === "retakes") {
    params.set("retakes", "true");
  }

  return `/learning/assessments/me?${params.toString()}`;
}

function buildStatsEndpoint(dateRange: AssessmentDateRange | null) {
  if (!dateRange) return "/learning/assessments/stats";

  const params = new URLSearchParams({
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
  });

  return `/learning/assessments/stats?${params.toString()}`;
}

async function readAssessments(endpoint: string) {
  const res = await fetchApi(endpoint, { next: { revalidate: 0 } });

  if (res.status === 401) {
    return {
      status: 401,
      data: [],
      totalItems: 0,
      totalPages: 1,
      error: "Unauthorized",
    };
  }

  const json = (await res.json().catch(() => ({}))) as AssessmentResponse;

  if (!res.ok) {
    throw new Error(json?.message || "Failed to fetch assessments.");
  }

  return {
    status: res.status,
    data: json.data || [],
    totalItems: json.meta?.total_items || 0,
    totalPages: json.meta?.total_pages || 1,
    error: null,
  };
}

async function readStats(endpoint: string) {
  const res = await fetchApi(endpoint, { next: { revalidate: 0 } });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return DEFAULT_STATS;
  }

  return {
    upcoming_count: json?.data?.upcoming_count ?? 0,
    completed_count: json?.data?.completed_count ?? 0,
    average_score_percentage: json?.data?.average_score_percentage ?? null,
    retakes_available_count: json?.data?.retakes_available_count ?? 0,
  };
}

function getString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

function getPositiveInt(value: string | string[] | undefined, fallback: number) {
  const parsed = Number.parseInt(getString(value) || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeAssessmentType(value?: string) {
  const upper = value?.toUpperCase();
  return upper === "QUIZ" || upper === "ESSAY" || upper === "QUIZ_GROUP" ? upper : null;
}

function normalizeDateRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return {
    startDate,
    endDate,
    label: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(start),
  };
}
